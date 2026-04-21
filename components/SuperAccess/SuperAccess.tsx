import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from "react";
import axios from "axios";
import Button from "@/components/Button/Button";
import DropDownButton from "@/components/DropDownButton/DropDownButton";
import SearchBar from "@/components/SearchBar/SearchBar";
import styles from "./superAccess.module.css";
import defaultUserImg from "../../assets/images/default-avatar.png";
import calendarImg from "../../assets/images/calendar.svg";
import {
  AdminRole,
  createAdminUser,
  deleteFinancialLedgerOrders,
  getChatsNormalizationAnalysis,
  getChatsNormalizationJob,
  getBroadcastNotificationSender,
  getConnectedAdmins,
  postAdminMessage,
  regenerateAddressPublicLocation,
  regenerateAllAddressesPublicLocation,
  rebuildAllFinancialLedgerOrders,
  rebuildFinancialLedgerForOrder,
  runChatsNormalization,
  SuperAccessEntity,
  getCurrentAdminRolesFromJwt,
  getFinancialOrders,
  getSuperAccessItem,
  getSuperAccessList,
  updateBroadcastNotificationSender,
  updateSuperAccessItem,
} from "@/pages/api/fetch";
import { options as orderStatusOptions } from "@/data/orderStatusOptions";
import { useRouter } from "next/router";
import { useAdminSocket } from "@/components/AdminSocket/AdminSocketProvider";
import type { FinancialOrderRow, GetFinancialOrdersResponse } from "@/types/FinancialOrder";
import type { BroadcastNotificationSender } from "@/types/BroadcastNotifications";

type EntityRecord = {
  [key: string]: unknown;
  id?: string;
  _id?: string;
  userId?: string;
  clientId?: string;
  providerId?: string;
  orderId?: string;
  client?: EntityRecord;
  provider?: EntityRecord;
  approvedProvider?: EntityRecord;
  clientUser?: EntityRecord;
  user?: EntityRecord;
};

type ChatNormalizationAnalysis = {
  chatsTotal: number;
  nonNormalizedChats: number;
  duplicateGroups: number;
  duplicateChatsToMerge: number;
};

type ChatNormalizationJobStep = {
  key: string;
  status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  error?: string | null;
};

type ChatNormalizationJob = {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  currentStep?: string | null;
  currentPhase?: string | null;
  error?: string | null;
  warnings?: string[];
  steps?: ChatNormalizationJobStep[];
  progress?: Record<string, unknown> | null;
};

type SuperAccessViewEntity =
  | SuperAccessEntity
  | "alerts"
  | "connected-admins"
  | "financial-ledger"
  | "broadcast-sender";

type SuperMenuItem = {
  title: string;
  key: SuperAccessViewEntity;
};

const MENU_ITEMS: SuperMenuItem[] = [
  { title: "Admins", key: "admins" },
  { title: "Users", key: "users" },
  { title: "Clients", key: "clients" },
  { title: "Providers", key: "providers" },
  { title: "Children", key: "children" },
  { title: "Addresses", key: "addresses" },
  { title: "Orders", key: "orders" },
  { title: "Chats", key: "chats" },
  { title: "Financial ledger", key: "financial-ledger" },
  { title: "Broadcast sender", key: "broadcast-sender" },
  { title: "WS connected Admins", key: "connected-admins" },
];

const PAGE_SIZE_OPTIONS = [
  { title: "20 / page", value: "20" },
  { title: "50 / page", value: "50" },
  { title: "100 / page", value: "100" },
] as const;

const ORDER_STATUSES = orderStatusOptions
  .map((item) => item.value)
  .filter((value) => value);
const ORDER_STATUSES_SUPER = Array.from(
  new Set([
    ...ORDER_STATUSES,
    "CANCELED_BY_CLIENT",
    "CANCELED_BY_PROVIDER",
  ]),
);

const extractArray = (value: unknown): EntityRecord[] => {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is EntityRecord =>
        !!item && typeof item === "object",
    );
  }
  return [];
};

const parseListResponse = (data: unknown) => {
  const fallback = { items: [] as EntityRecord[], total: 0, pageSize: 20 };
  if (!data || typeof data !== "object") return fallback;

  const payload = data as Record<string, unknown>;
  const result = (payload.result as Record<string, unknown> | undefined) ?? payload;
  const nestedAdmins = result.admins as Record<string, unknown> | undefined;
  const nestedUsers = result.users as Record<string, unknown> | undefined;

  const items = extractArray(
    result.items ??
      nestedAdmins?.items ??
      nestedUsers?.items ??
      result.users ??
      result.clients ??
      result.children ??
      result.providers ??
      result.orders ??
      result.chats ??
      result.addresses ??
      payload.items,
  );

  const totalCandidate =
    result.total ??
    nestedAdmins?.total ??
    nestedUsers?.total ??
    payload.total ??
    items.length;
  const pageSizeCandidate =
    result.pageSize ?? nestedAdmins?.pageSize ?? nestedUsers?.pageSize ?? payload.pageSize ?? 20;
  return {
    items,
    total:
      typeof totalCandidate === "number"
        ? totalCandidate
        : Number(totalCandidate) || items.length,
    pageSize:
      typeof pageSizeCandidate === "number"
        ? pageSizeCandidate
        : Number(pageSizeCandidate) || 20,
  };
};

const parseItemResponse = (data: unknown): EntityRecord | null => {
  if (!data || typeof data !== "object") return null;
  const payload = data as Record<string, unknown>;
  const result = (payload.result as Record<string, unknown> | undefined) ?? payload;
  const candidates = [
    result.user,
    result.client,
    result.provider,
    result.order,
    result.chat,
    result.address,
    result.item,
    result.data,
    result,
  ];
  for (const candidate of candidates) {
    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      return candidate as EntityRecord;
    }
  }
  return null;
};

const parseFinancialOrdersResponse = (data: unknown) => {
  const fallback = {
    items: [] as FinancialOrderRow[],
    total: 0,
    pageSize: 20,
  };
  if (!data || typeof data !== "object") return fallback;

  const result =
    (data as { result?: GetFinancialOrdersResponse }).result ??
    (data as GetFinancialOrdersResponse);
  return {
    items: Array.isArray(result.items) ? result.items : [],
    total: Number(result.total ?? 0) || 0,
    pageSize: Number(result.pageSize ?? 20) || 20,
  };
};

const pickId = (item: EntityRecord): string =>
  String(
    item.id ??
      item._id ??
      item.userId ??
      item.clientId ??
      item.providerId ??
      item.orderId ??
      "",
  );

const pickLinkedUserId = (item: EntityRecord): string =>
  String(item.userId ?? item.id ?? item._id ?? "");

const isSuperAccessEntity = (
  value: SuperAccessViewEntity,
): value is SuperAccessEntity =>
  [
    "admins",
    "users",
    "clients",
    "children",
    "providers",
    "addresses",
    "orders",
    "chats",
  ].includes(value);

const isIsoDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);

const parseDateString = (value: string): Date | null => {
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;

  // Supports "DD/MM/YYYY, HH:mm" and "DD/MM/YYYY"
  const localMatch = value.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:,\s*(\d{2}):(\d{2}))?$/,
  );
  if (localMatch) {
    const [, dd, mm, yyyy, hh = "00", min = "00"] = localMatch;
    const parsed = new Date(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd),
      Number(hh),
      Number(min),
    );
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
};

const isLikelyDateField = (key: string) =>
  /(date|time|at)$/i.test(key) ||
  /createdAt|updatedAt|birthDate|startsAt|endsAt|verifiedAt|changedAt/i.test(
    key,
  );

const toDateTimeLocal = (value: string) => {
  const date = parseDateString(value);
  if (!date) return "";
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toDateLocal = (value: string) => {
  const date = parseDateString(value);
  if (!date) return "";
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const formatLocalOffset = (date: Date) => {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absMinutes = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absMinutes / 60)).padStart(2, "0");
  const minutes = String(absMinutes % 60).padStart(2, "0");
  return `${sign}${hours}:${minutes}`;
};

const toIsoFromLocal = (value: string) => {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/,
  );
  if (!match) return value;
  const [, year, month, day, hour, minute] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  );
  if (Number.isNaN(date.getTime())) return value;
  return `${year}-${month}-${day}T${hour}:${minute}:00${formatLocalOffset(date)}`;
};

const toIsoFromDateOnly = (value: string) => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0);
  if (Number.isNaN(date.getTime())) return value;
  return `${year}-${month}-${day}T00:00:00${formatLocalOffset(date)}`;
};

const openNativePicker = (inputId: string) => {
  const element = document.getElementById(inputId);
  if (!element) return;
  const input = element as HTMLInputElement & { showPicker?: () => void };
  if (typeof input.showPicker === "function") {
    input.showPicker();
    return;
  }
  input.focus();
  input.click();
};

const prettyTitle = (raw: string) =>
  raw
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (char) => char.toUpperCase());

const PROVIDER_PRIORITY_FIELDS = [
  "baseProviderRate",
  "finalPrice",
  "providerPriceCalculationMethod",
  "isShownManageYourRate",
] as const;

const USER_PRIORITY_FIELDS = ["pushToken", "appVersion"] as const;

const orderDetailFields = (
  entity: SuperAccessViewEntity,
  entries: [string, unknown][],
) => {
  const priorityFields =
    entity === "providers"
      ? PROVIDER_PRIORITY_FIELDS
      : entity === "users"
        ? USER_PRIORITY_FIELDS
        : null;

  if (!priorityFields) {
    return entries;
  }

  const indexedEntries = entries.map((entry, index) => ({ entry, index }));
  const prioritized = priorityFields.map((fieldKey) =>
    indexedEntries.find(({ entry }) => entry[0] === fieldKey),
  ).filter(
    (item): item is { entry: [string, unknown]; index: number } =>
      item !== undefined,
  );

  if (prioritized.length === 0) {
    return entries;
  }

  const prioritizedKeys = new Set(prioritized.map(({ entry }) => entry[0]));
  const insertionIndex = Math.min(...prioritized.map(({ index }) => index));
  const remaining = indexedEntries.filter(
    ({ entry }) => !prioritizedKeys.has(entry[0]),
  );

  return [
    ...remaining
      .filter(({ index }) => index < insertionIndex)
      .map(({ entry }) => entry),
    ...prioritized.map(({ entry }) => entry),
    ...remaining
      .filter(({ index }) => index >= insertionIndex)
      .map(({ entry }) => entry),
  ];
};

const formatDateTimeShort = (value: unknown) => {
  if (typeof value !== "string" || !value) return "—";
  const date = parseDateString(value) ?? new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const formatAddressLabel = (address: EntityRecord, fallbackId: string) => {
  const country = String(address.country ?? "").trim();
  const city = String(address.city ?? "").trim();
  const street = String(address.street ?? "").trim();
  const house = String(address.houseNumber ?? address.house ?? "").trim();
  const apartment = String(address.apartment ?? address.flat ?? "").trim();
  const zip = String(address.zipCode ?? address.postCode ?? "").trim();

  const line = [country, city, street, house, apartment, zip]
    .filter((item) => item.length > 0)
    .join(", ");
  return line || `Address ${fallbackId}`;
};

const getUserDisplayName = (user: EntityRecord | null) => {
  if (!user) return "";
  const firstName = String(user.firstName ?? "").trim();
  const lastName = String(user.lastName ?? "").trim();
  return `${firstName} ${lastName}`.trim();
};

const getUserTargetEntity = (
  user: EntityRecord | null,
): "clients" | "providers" | null => {
  if (!user) return null;
  const roles = Array.isArray(user.roles)
    ? user.roles
        .filter((role): role is string => typeof role === "string")
        .map((role) => role.toUpperCase())
    : [];
  if (roles.includes("PROVIDER")) return "providers";
  if (roles.includes("CLIENT")) return "clients";

  const rawMode = String(user.userMode ?? user.type ?? user.mode ?? "").toUpperCase();
  if (rawMode.includes("PROVIDER")) return "providers";
  if (rawMode.includes("CLIENT")) return "clients";

  return null;
};

const calculateAgeYears = (birthDateValue: unknown): number | null => {
  if (typeof birthDateValue !== "string" || !birthDateValue) return null;
  const birthDate = new Date(birthDateValue);
  if (Number.isNaN(birthDate.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const hasBirthdayPassed =
    now.getMonth() > birthDate.getMonth() ||
    (now.getMonth() === birthDate.getMonth() &&
      now.getDate() >= birthDate.getDate());
  if (!hasBirthdayPassed) age -= 1;
  return age < 0 ? null : age;
};

const formatChildLabel = (child: EntityRecord, fallbackId: string) => {
  const name = String(child.name ?? "").trim() || `Child ${fallbackId}`;
  const genderRaw = String(child.gender ?? "").trim();
  const gender = genderRaw
    ? genderRaw.charAt(0).toUpperCase() + genderRaw.slice(1).toLowerCase()
    : "—";
  const age = calculateAgeYears(child.birthDate);
  return `${name}, ${gender}, ${age == null ? "—" : `${age} y`}`;
};

const formatChildSummary = (child: EntityRecord, fallbackId: string) => {
  const name = String(child.name ?? "").trim() || `Child ${fallbackId}`;
  const genderRaw = String(child.gender ?? "").trim();
  const gender = genderRaw
    ? genderRaw.charAt(0).toUpperCase() + genderRaw.slice(1).toLowerCase()
    : "—";
  const age = calculateAgeYears(child.birthDate);
  return `${name}, ${gender}, ${age == null ? "—" : `${age} y`}`;
};

const pickFirstString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return "";
};

const getUserName = (firstName?: unknown, lastName?: unknown) =>
  `${String(firstName ?? "Deleted")} ${String(lastName ?? "User")}`.trim();

const withOrderFinancialFields = (item: EntityRecord): EntityRecord => ({
  ...item,
  isOrderCanceledLessThan12hBeforeStart:
    item.isOrderCanceledLessThan12hBeforeStart ?? false,
  isOrderCanceledLessThan2hBeforeStart:
    item.isOrderCanceledLessThan2hBeforeStart ?? false,
  refundedAt: item.refundedAt ?? null,
  refundedAmount: item.refundedAmount ?? null,
  refundedAmountCents: item.refundedAmountCents ?? null,
  isCancelFeePaidToProvider: item.isCancelFeePaidToProvider ?? false,
  cancelFeePaidToProviderAt: item.cancelFeePaidToProviderAt ?? null,
  cancelFeeAmount: item.cancelFeeAmount ?? null,
  cancelFeeAmountCents: item.cancelFeeAmountCents ?? null,
});

const SuperAccess = () => {
  const router = useRouter();
  const { lastEvent } = useAdminSocket();
  const [entity, setEntity] = useState<SuperAccessViewEntity>("users");
  const [isCompactListView, setIsCompactListView] = useState(false);
  const [list, setList] = useState<EntityRecord[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedItem, setSelectedItem] = useState<EntityRecord | null>(
    null,
  );
  const [draft, setDraft] = useState<EntityRecord>({});
  const [error, setError] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [loadingItem, setLoadingItem] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegeneratingAddress, setIsRegeneratingAddress] = useState(false);
  const [isRegeneratingAllAddresses, setIsRegeneratingAllAddresses] =
    useState(false);
  const [isRegenerateAddressModalOpen, setIsRegenerateAddressModalOpen] =
    useState(false);
  const [isFinancialLedgerDeleteModalOpen, setIsFinancialLedgerDeleteModalOpen] =
    useState(false);
  const [isFinancialLedgerRebuildAllModalOpen, setIsFinancialLedgerRebuildAllModalOpen] =
    useState(false);
  const [isOrderFinancialRebuildModalOpen, setIsOrderFinancialRebuildModalOpen] =
    useState(false);
  const [isChatNormalizationConfirmModalOpen, setIsChatNormalizationConfirmModalOpen] =
    useState(false);
  const [isChatNormalizationProgressModalOpen, setIsChatNormalizationProgressModalOpen] =
    useState(false);
  const [isStartingChatNormalization, setIsStartingChatNormalization] =
    useState(false);
  const [chatNormalizationAnalysis, setChatNormalizationAnalysis] =
    useState<ChatNormalizationAnalysis | null>(null);
  const [isLoadingChatNormalizationAnalysis, setIsLoadingChatNormalizationAnalysis] =
    useState(false);
  const [chatNormalizationJobId, setChatNormalizationJobId] = useState("");
  const [chatNormalizationJob, setChatNormalizationJob] =
    useState<ChatNormalizationJob | null>(null);
  const [regenerateTarget, setRegenerateTarget] = useState<"ONE" | "ALL">(
    "ONE",
  );
  const [minDistanceMeters, setMinDistanceMeters] = useState("60");
  const [maxDistanceMeters, setMaxDistanceMeters] = useState("200");
  const [regenerateDistanceError, setRegenerateDistanceError] = useState("");
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [removeAdminPassword, setRemoveAdminPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [newAdminFirstName, setNewAdminFirstName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminRoles, setNewAdminRoles] = useState<AdminRole[]>(["ADMIN"]);
  const [adminAlertText, setAdminAlertText] = useState("");
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [linkedUsersById, setLinkedUsersById] = useState<Record<string, EntityRecord>>({});
  const [addressesById, setAddressesById] = useState<Record<string, EntityRecord>>({});
  const [childrenById, setChildrenById] = useState<Record<string, EntityRecord>>({});
  const [clientsById, setClientsById] = useState<Record<string, EntityRecord>>({});
  const [providersById, setProvidersById] = useState<Record<string, EntityRecord>>({});
  const [ordersById, setOrdersById] = useState<Record<string, EntityRecord>>({});
  const [selectedFinancialLedgerOrderIds, setSelectedFinancialLedgerOrderIds] =
    useState<string[]>([]);

  const handleItemCardKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    id: string,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelectedId(id);
    }
  };

  useEffect(() => {
    const roles = getCurrentAdminRolesFromJwt();
    const hasSuperAdmin = roles.includes("SUPER_ADMIN");
    setIsSuperAdmin(hasSuperAdmin);
    if (!hasSuperAdmin) {
      router.replace("/users");
    }
  }, [router]);

  const fetchList = useCallback(async () => {
    if (entity === "alerts") {
      setList([]);
      setTotal(0);
      return;
    }
    if (entity === "broadcast-sender") {
      try {
        setLoadingList(true);
        setError("");
        const response = await getBroadcastNotificationSender();
        const sender =
          ((response.data as { result?: BroadcastNotificationSender }).result ??
            response.data) as BroadcastNotificationSender | null;
        const nextList = sender ? [sender as unknown as EntityRecord] : [];
        setList(nextList);
        setTotal(nextList.length);
        if (nextList.length > 0) {
          setSelectedId(String(nextList[0].id ?? "SYSTEM_NANNOW"));
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          router.push("/");
          return;
        }
        setError("Failed to load broadcast sender.");
      } finally {
        setLoadingList(false);
      }
      return;
    }
    if (entity === "financial-ledger") {
      try {
        setLoadingList(true);
        setError("");
        const currentYear = new Date().getFullYear();
        const response = await getFinancialOrders({
          startIndex,
          pageSize,
          search: appliedSearch.trim() || undefined,
          startDate: new Date(2020, 0, 1).toISOString(),
          endDate: new Date(currentYear + 1, 0, 1).toISOString(),
          sort: "paidAt_desc",
        });
        const parsed = parseFinancialOrdersResponse(response.data);
        setList(parsed.items as unknown as EntityRecord[]);
        setTotal(parsed.total);
        setPageSize(parsed.pageSize);
        setSelectedFinancialLedgerOrderIds((prev) =>
          prev.filter((id) =>
            parsed.items.some((item: FinancialOrderRow) => item.id === id),
          ),
        );
        if (parsed.items.length > 0 && !selectedId) {
          setSelectedId(parsed.items[0].id);
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          router.push("/");
          return;
        }
        setError("Failed to load financial ledger.");
      } finally {
        setLoadingList(false);
      }
      return;
    }
    if (entity === "connected-admins") {
      try {
        setLoadingList(true);
        setError("");
        const response = await getConnectedAdmins();
        const items = Array.isArray(response.data?.items)
          ? (response.data.items as EntityRecord[])
          : [];
        setList(items);
        setTotal(items.length);
        if (items.length > 0) {
          setSelectedId((prev) =>
            prev || String(items[0].adminId ?? items[0].id ?? ""),
          );
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          router.push("/");
          return;
        }
        setError("Failed to load connected admins.");
      } finally {
        setLoadingList(false);
      }
      return;
    }
    if (!isSuperAccessEntity(entity)) return;
    try {
      setLoadingList(true);
      setError("");
      const response = await getSuperAccessList(entity, {
        startIndex,
        pageSize,
        search: appliedSearch.trim() || undefined,
      });
      const parsed = parseListResponse(response.data);
      setList(parsed.items);
      setTotal(parsed.total);
      setPageSize(parsed.pageSize);
      if (parsed.items.length > 0 && !selectedId) {
        setSelectedId(pickId(parsed.items[0]));
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.push("/");
        return;
      }
      setError("Failed to load list.");
    } finally {
      setLoadingList(false);
    }
  }, [appliedSearch, entity, pageSize, router, startIndex]);

  const fetchItem = useCallback(async () => {
    if (entity === "alerts") {
      setSelectedItem(null);
      setDraft({});
      return;
    }
    if (entity === "broadcast-sender") {
      const listItem = list.find((item) => pickId(item) === selectedId) ?? null;
      setSelectedItem(listItem);
      setDraft(listItem ?? {});
      return;
    }
    if (entity === "financial-ledger") {
      const listItem = list.find((item) => pickId(item) === selectedId) ?? null;
      setSelectedItem(listItem);
      setDraft(listItem ?? {});
      return;
    }
    if (entity === "connected-admins") {
      const listItem =
        list.find(
          (item) =>
            String(item.adminId ?? item.id ?? item._id ?? "") === selectedId,
        ) ?? null;
      setSelectedItem(listItem);
      setDraft(listItem ?? {});
      return;
    }
    if (!selectedId) return;
    if (entity === "admins") {
      const listItem = list.find((item) => pickId(item) === selectedId) ?? null;
      setSelectedItem(listItem);
      setDraft(listItem ?? {});
      setAdminPassword("");
      setRemoveAdminPassword(false);
      return;
    }
    if (!isSuperAccessEntity(entity)) return;
    try {
      setLoadingItem(true);
      setError("");
      const response = await getSuperAccessItem(entity, selectedId);
      const parsedItem = parseItemResponse(response.data);
      const normalizedItem =
        entity === "orders" && parsedItem
          ? withOrderFinancialFields(parsedItem)
          : parsedItem;
      setSelectedItem(normalizedItem);
      setDraft(normalizedItem ?? {});
    } catch (err) {
      setSelectedItem(null);
      setDraft({});
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setError("Item not found.");
        return;
      }
      setError("Failed to load item details.");
    } finally {
      setLoadingItem(false);
    }
  }, [entity, list, selectedId]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchList();
  }, [fetchList, isSuperAdmin]);

  useEffect(() => {
    if (entity !== "clients" && entity !== "providers") return;

    const userIds = Array.from(
      new Set(
        list
          .map((item) => pickLinkedUserId(item))
          .filter((userId) => userId && !linkedUsersById[userId]),
      ),
    );

    if (userIds.length === 0) return;

    let isMounted = true;
    const fetchLinkedUsers = async () => {
      const entries = await Promise.all(
        userIds.map(async (userId) => {
          try {
            const response = await getSuperAccessItem("users", userId);
            const parsedUser = parseItemResponse(response.data);
            return [userId, parsedUser] as const;
          } catch {
            return [userId, null] as const;
          }
        }),
      );

      if (!isMounted) return;
      setLinkedUsersById((prev) => {
        const next = { ...prev };
        let hasChanges = false;
        for (const [userId, user] of entries) {
          if (user) {
            if (next[userId] !== user) hasChanges = true;
            next[userId] = user;
          } else if (!next[userId]) {
            // Cache failed lookups to prevent infinite retry loops on 404s.
            next[userId] = { id: userId, __missing: true };
            hasChanges = true;
          }
        }
        return hasChanges ? next : prev;
      });
    };

    fetchLinkedUsers();

    return () => {
      isMounted = false;
    };
  }, [entity, linkedUsersById, list]);

  useEffect(() => {
    if (entity !== "addresses") return;

    const userIds = Array.from(
      new Set(
        list
          .map((item) => String(item.userId ?? ""))
          .filter((userId) => userId && !linkedUsersById[userId]),
      ),
    );
    if (userIds.length === 0) return;

    let isMounted = true;
    const fetchAddressUsers = async () => {
      const entries = await Promise.all(
        userIds.map(async (userId) => {
          try {
            const response = await getSuperAccessItem("users", userId);
            const parsedUser = parseItemResponse(response.data);
            return [userId, parsedUser] as const;
          } catch {
            return [userId, null] as const;
          }
        }),
      );
      if (!isMounted) return;
      setLinkedUsersById((prev) => {
        const next = { ...prev };
        let hasChanges = false;
        for (const [userId, user] of entries) {
          if (user) {
            if (next[userId] !== user) hasChanges = true;
            next[userId] = user;
          } else if (!next[userId]) {
            next[userId] = { id: userId, __missing: true };
            hasChanges = true;
          }
        }
        return hasChanges ? next : prev;
      });
    };

    fetchAddressUsers();

    return () => {
      isMounted = false;
    };
  }, [entity, linkedUsersById, list]);

  useEffect(() => {
    if (entity !== "chats") return;

    const userIds = Array.from(
      new Set(
        list
          .flatMap((item) => [
            String(item.user1Id ?? ""),
            String(item.user2Id ?? ""),
          ])
          .filter((userId) => userId && !linkedUsersById[userId]),
      ),
    );
    if (userIds.length === 0) return;

    let isMounted = true;
    const fetchChatUsers = async () => {
      const entries = await Promise.all(
        userIds.map(async (userId) => {
          try {
            const response = await getSuperAccessItem("users", userId);
            const parsedUser = parseItemResponse(response.data);
            return [userId, parsedUser] as const;
          } catch {
            return [userId, null] as const;
          }
        }),
      );
      if (!isMounted) return;
      setLinkedUsersById((prev) => {
        const next = { ...prev };
        let hasChanges = false;
        for (const [userId, user] of entries) {
          if (user) {
            if (next[userId] !== user) hasChanges = true;
            next[userId] = user;
          } else if (!next[userId]) {
            next[userId] = { id: userId, __missing: true };
            hasChanges = true;
          }
        }
        return hasChanges ? next : prev;
      });
    };

    fetchChatUsers();
    return () => {
      isMounted = false;
    };
  }, [entity, linkedUsersById, list]);

  useEffect(() => {
    if (entity !== "clients" && entity !== "providers" && entity !== "orders")
      return;
    if (!selectedItem) return;

    const rawBaseAddressIds: unknown =
      selectedItem.addressesIds ?? selectedItem.addressIds ?? selectedItem.addresses;
    const baseAddressIds = Array.isArray(rawBaseAddressIds)
      ? (rawBaseAddressIds as unknown[]).filter(
          (id: unknown): id is string => typeof id === "string" && id.length > 0,
        )
      : [];
    const defaultAddressId =
      typeof selectedItem.defaultAddressId === "string"
        ? selectedItem.defaultAddressId
        : "";
    const orderAddressIds =
      entity === "orders"
        ? Object.entries(selectedItem)
            .filter(
              ([key, value]) =>
                /addressId$/i.test(key) &&
                typeof value === "string" &&
                value.length > 0,
            )
            .map(([, value]) => value as string)
        : [];

    const missingIds = baseAddressIds
      .concat(defaultAddressId ? [defaultAddressId] : [])
      .concat(orderAddressIds)
      .filter((id: string, index: number, arr: string[]) => arr.indexOf(id) === index)
      .filter((id: string) => !addressesById[id]);
    if (missingIds.length === 0) return;

    let isMounted = true;
    const fetchAddresses = async () => {
      const entries = await Promise.all(
        missingIds.map(async (addressId: string) => {
          try {
            const response = await getSuperAccessItem("addresses", addressId);
            const parsedAddress = parseItemResponse(response.data);
            return [addressId, parsedAddress] as const;
          } catch {
            return [addressId, null] as const;
          }
        }),
      );
      if (!isMounted) return;
      setAddressesById((prev) => {
        const next = { ...prev };
        let hasChanges = false;
        for (const [addressId, address] of entries) {
          if (address) {
            if (next[addressId] !== address) hasChanges = true;
            next[addressId] = address;
          }
        }
        return hasChanges ? next : prev;
      });
    };

    fetchAddresses();

    return () => {
      isMounted = false;
    };
  }, [addressesById, entity, selectedItem]);

  useEffect(() => {
    if (entity !== "clients" && entity !== "orders") return;
    if (!selectedItem) return;

    const rawChildIds = selectedItem.childIds ?? selectedItem.childrenIds ?? [];
    if (!Array.isArray(rawChildIds)) return;

    const missingIds = rawChildIds
      .filter((id): id is string => typeof id === "string" && id.length > 0)
      .filter((id) => !childrenById[id]);
    if (missingIds.length === 0) return;

    let isMounted = true;
    const fetchChildren = async () => {
      const entries = await Promise.all(
        missingIds.map(async (childId) => {
          try {
            const response = await getSuperAccessItem("children", childId);
            const parsedChild = parseItemResponse(response.data);
            return [childId, parsedChild] as const;
          } catch {
            return [childId, null] as const;
          }
        }),
      );
      if (!isMounted) return;
      setChildrenById((prev) => {
        const next = { ...prev };
        let hasChanges = false;
        for (const [childId, child] of entries) {
          if (child) {
            if (next[childId] !== child) hasChanges = true;
            next[childId] = child;
          }
        }
        return hasChanges ? next : prev;
      });
    };

    fetchChildren();

    return () => {
      isMounted = false;
    };
  }, [childrenById, entity, selectedItem]);

  useEffect(() => {
    if (entity !== "children") return;
    const clientIds = Array.from(
      new Set(
        list
          .map((item) => String(item.clientId ?? ""))
          .filter((clientId) => clientId.length > 0 && !clientsById[clientId]),
      ),
    );
    if (clientIds.length === 0) return;

    let isMounted = true;
    const fetchClients = async () => {
      const entries = await Promise.all(
        clientIds.map(async (clientId) => {
          try {
            const response = await getSuperAccessItem("clients", clientId);
            const parsedClient = parseItemResponse(response.data);
            return [clientId, parsedClient] as const;
          } catch {
            return [clientId, null] as const;
          }
        }),
      );
      if (!isMounted) return;
      setClientsById((prev) => {
        const next = { ...prev };
        let hasChanges = false;
        for (const [clientId, client] of entries) {
          if (client) {
            if (next[clientId] !== client) hasChanges = true;
            next[clientId] = client;
          }
        }
        return hasChanges ? next : prev;
      });
    };
    fetchClients();
    return () => {
      isMounted = false;
    };
  }, [clientsById, entity, list]);

  useEffect(() => {
    if (entity !== "children") return;
    const userIds = Array.from(
      new Set(
        Object.values(clientsById)
          .map((client) => String(client.userId ?? ""))
          .filter((userId) => userId.length > 0 && !linkedUsersById[userId]),
      ),
    );
    if (userIds.length === 0) return;

    let isMounted = true;
    const fetchUsers = async () => {
      const entries = await Promise.all(
        userIds.map(async (userId) => {
          try {
            const response = await getSuperAccessItem("users", userId);
            const parsedUser = parseItemResponse(response.data);
            return [userId, parsedUser] as const;
          } catch {
            return [userId, null] as const;
          }
        }),
      );
      if (!isMounted) return;
      setLinkedUsersById((prev) => {
        const next = { ...prev };
        let hasChanges = false;
        for (const [userId, user] of entries) {
          if (user) {
            if (next[userId] !== user) hasChanges = true;
            next[userId] = user;
          } else if (!next[userId]) {
            next[userId] = { id: userId, __missing: true };
            hasChanges = true;
          }
        }
        return hasChanges ? next : prev;
      });
    };
    fetchUsers();
    return () => {
      isMounted = false;
    };
  }, [clientsById, entity, linkedUsersById]);

  useEffect(() => {
    if (entity !== "orders") return;
    const clientIds = Array.from(
      new Set(
        list
          .map((item) => String(item.clientId ?? item.client?.id ?? ""))
          .filter((clientId) => clientId.length > 0 && !clientsById[clientId]),
      ),
    );
    if (clientIds.length === 0) return;

    let isMounted = true;
    const fetchOrderClients = async () => {
      const entries = await Promise.all(
        clientIds.map(async (clientId) => {
          try {
            const response = await getSuperAccessItem("clients", clientId);
            const parsedClient = parseItemResponse(response.data);
            return [clientId, parsedClient] as const;
          } catch {
            return [clientId, null] as const;
          }
        }),
      );
      if (!isMounted) return;
      setClientsById((prev) => {
        const next = { ...prev };
        let hasChanges = false;
        for (const [clientId, client] of entries) {
          if (client) {
            if (next[clientId] !== client) hasChanges = true;
            next[clientId] = client;
          }
        }
        return hasChanges ? next : prev;
      });
    };

    fetchOrderClients();
    return () => {
      isMounted = false;
    };
  }, [clientsById, entity, list]);

  useEffect(() => {
    if (entity !== "orders") return;
    const providerIds = Array.from(
      new Set(
        list
          .map((item) =>
            String(
              item.approvedProviderId ??
                item.approvedProvider?.id ??
                item.providerId ??
                "",
            ),
          )
          .filter(
            (providerId) => providerId.length > 0 && !providersById[providerId],
          ),
      ),
    );
    if (providerIds.length === 0) return;

    let isMounted = true;
    const fetchOrderProviders = async () => {
      const entries = await Promise.all(
        providerIds.map(async (providerId) => {
          try {
            const response = await getSuperAccessItem("providers", providerId);
            const parsedProvider = parseItemResponse(response.data);
            return [providerId, parsedProvider] as const;
          } catch {
            return [providerId, null] as const;
          }
        }),
      );
      if (!isMounted) return;
      setProvidersById((prev) => {
        const next = { ...prev };
        let hasChanges = false;
        for (const [providerId, provider] of entries) {
          if (provider) {
            if (next[providerId] !== provider) hasChanges = true;
            next[providerId] = provider;
          }
        }
        return hasChanges ? next : prev;
      });
    };

    fetchOrderProviders();
    return () => {
      isMounted = false;
    };
  }, [entity, list, providersById]);

  useEffect(() => {
    if (entity !== "orders") return;

    const userIds = Array.from(
      new Set(
        list
          .flatMap((item) => [
            String(
              item.clientUserId ??
                item.clientUser?.id ??
                item.client?.userId ??
                item.client?.user?.id ??
                clientsById[String(item.clientId ?? item.client?.id ?? "")]?.userId ??
                "",
            ),
            String(
              item.approvedProviderUserId ??
                item.approvedProvider?.userId ??
                item.approvedProvider?.user?.id ??
                providersById[
                  String(item.approvedProviderId ?? item.approvedProvider?.id ?? "")
                ]?.userId ??
                item.requiredProviderId ??
                "",
            ),
          ])
          .filter((userId) => userId.length > 0 && !linkedUsersById[userId]),
      ),
    );
    if (userIds.length === 0) return;

    let isMounted = true;
    const fetchOrderUsers = async () => {
      const entries = await Promise.all(
        userIds.map(async (userId) => {
          try {
            const response = await getSuperAccessItem("users", userId);
            const parsedUser = parseItemResponse(response.data);
            return [userId, parsedUser] as const;
          } catch {
            return [userId, null] as const;
          }
        }),
      );
      if (!isMounted) return;
      setLinkedUsersById((prev) => {
        const next = { ...prev };
        let hasChanges = false;
        for (const [userId, user] of entries) {
          if (user) {
            if (next[userId] !== user) hasChanges = true;
            next[userId] = user;
          } else if (!next[userId]) {
            next[userId] = { id: userId, __missing: true };
            hasChanges = true;
          }
        }
        return hasChanges ? next : prev;
      });
    };

    fetchOrderUsers();
    return () => {
      isMounted = false;
    };
  }, [clientsById, entity, linkedUsersById, list, providersById]);

  useEffect(() => {
    if (entity !== "orders") return;
    const orderIds = list
      .map((item) => pickId(item))
      .filter((orderId) => orderId.length > 0 && !ordersById[orderId]);
    if (orderIds.length === 0) return;

    let isMounted = true;
    const fetchOrderDetails = async () => {
      const entries = await Promise.all(
        orderIds.map(async (orderId) => {
          try {
            const response = await getSuperAccessItem("orders", orderId);
            const parsedOrder = parseItemResponse(response.data);
            return [orderId, parsedOrder] as const;
          } catch {
            return [orderId, null] as const;
          }
        }),
      );
      if (!isMounted) return;
      setOrdersById((prev) => {
        const next = { ...prev };
        let hasChanges = false;
        for (const [orderId, order] of entries) {
          if (order) {
            if (next[orderId] !== order) hasChanges = true;
            next[orderId] = order;
          }
        }
        return hasChanges ? next : prev;
      });
    };
    fetchOrderDetails();
    return () => {
      isMounted = false;
    };
  }, [entity, list, ordersById]);

  useEffect(() => {
    if (!selectedId) return;
    fetchItem();
  }, [fetchItem, selectedId]);

  useEffect(() => {
    if (entity !== "connected-admins") return;
    setTotal(list.length);
  }, [entity, list.length]);

  useEffect(() => {
    if (entity !== "connected-admins" || !lastEvent) return;

    if (lastEvent.type === "ADMIN_CONNECTED") {
      setList((prev) => {
        const next = [...prev];
        const existingIndex = next.findIndex(
          (item) =>
            String(item.adminId ?? item.id ?? item._id ?? "") ===
            lastEvent.adminId,
        );
        const nextItem: EntityRecord = {
          adminId: lastEvent.adminId,
          fullName: lastEvent.fullName,
          email: lastEvent.email,
        };
        if (existingIndex >= 0) {
          next[existingIndex] = { ...next[existingIndex], ...nextItem };
          return next;
        }
        return [nextItem, ...next];
      });
      if (!selectedId) {
        setSelectedId(lastEvent.adminId);
      }
      return;
    }

    if (lastEvent.type === "ADMIN_DISCONNECTED") {
      setList((prev) =>
        prev.filter(
          (item) =>
            String(item.adminId ?? item.id ?? item._id ?? "") !==
            lastEvent.adminId,
        ),
      );
      if (selectedId === lastEvent.adminId) {
        setSelectedId("");
        setSelectedItem(null);
        setDraft({});
      }
    }
  }, [entity, lastEvent, selectedId]);

  const fetchChatNormalizationAnalysis = useCallback(async () => {
    if (entity !== "chats") return;
    try {
      setIsLoadingChatNormalizationAnalysis(true);
      const response = await getChatsNormalizationAnalysis();
      const payload =
        (response.data?.result?.analysis as ChatNormalizationAnalysis | undefined) ??
        (response.data?.analysis as ChatNormalizationAnalysis | undefined) ??
        (response.data?.result as ChatNormalizationAnalysis | undefined) ??
        (response.data as ChatNormalizationAnalysis);
      setChatNormalizationAnalysis({
        chatsTotal: Number(payload?.chatsTotal ?? 0),
        nonNormalizedChats: Number(payload?.nonNormalizedChats ?? 0),
        duplicateGroups: Number(payload?.duplicateGroups ?? 0),
        duplicateChatsToMerge: Number(payload?.duplicateChatsToMerge ?? 0),
      });
    } catch {
      setChatNormalizationAnalysis(null);
    } finally {
      setIsLoadingChatNormalizationAnalysis(false);
    }
  }, [entity]);

  useEffect(() => {
    if (entity !== "chats" || !isSuperAdmin) return;
    fetchChatNormalizationAnalysis();
  }, [entity, fetchChatNormalizationAnalysis, isSuperAdmin]);

  useEffect(() => {
    if (!chatNormalizationJobId) return;
    if (
      chatNormalizationJob?.status === "COMPLETED" ||
      chatNormalizationJob?.status === "FAILED"
    ) {
      fetchChatNormalizationAnalysis();
      return;
    }

    let isCancelled = false;
    const pollJob = async () => {
      try {
        const response = await getChatsNormalizationJob(chatNormalizationJobId);
        const job =
          (response.data?.job as ChatNormalizationJob | undefined) ??
          (response.data?.result?.job as ChatNormalizationJob | undefined) ??
          (response.data?.result as ChatNormalizationJob | undefined) ??
          (response.data as ChatNormalizationJob | undefined);
        if (!isCancelled && job) {
          setChatNormalizationJob(job);
        }
      } catch {
        // Ignore transient errors while polling.
      }
    };

    pollJob();
    const intervalId = window.setInterval(pollJob, 2500);
    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [chatNormalizationJob?.status, chatNormalizationJobId, fetchChatNormalizationAnalysis]);

  const startChatsNormalization = async () => {
    if (isStartingChatNormalization) return;
    try {
      setIsStartingChatNormalization(true);
      setError("");
      const response = await runChatsNormalization();
      const job =
        (response.data?.job as ChatNormalizationJob | undefined) ??
        (response.data?.result?.job as ChatNormalizationJob | undefined) ??
        (response.data?.result as ChatNormalizationJob | undefined) ??
        (response.data as ChatNormalizationJob | undefined);

      if (!job?.id) {
        setError("Failed to start chat normalization.");
        return;
      }
      setChatNormalizationJobId(job.id);
      setChatNormalizationJob(job);
      setIsChatNormalizationConfirmModalOpen(false);
      setIsChatNormalizationProgressModalOpen(true);
      await fetchChatNormalizationAnalysis();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { error?: string })?.error ??
            "Failed to start chat normalization.",
        );
        return;
      }
      setError("Failed to start chat normalization.");
    } finally {
      setIsStartingChatNormalization(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.floor(startIndex / pageSize) + 1;

  const fields = useMemo(
    () =>
      orderDetailFields(
        entity,
        Object.entries(draft).filter(([key]) => !["id", "_id"].includes(key)),
      ),
    [draft, entity],
  );

  const handleFieldChange = (key: string, value: unknown) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const toggleFinancialLedgerOrderSelection = (orderId: string) => {
    setSelectedFinancialLedgerOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId],
    );
  };

  const invalidateEntityCaches = (targetEntity: SuperAccessEntity) => {
    if (targetEntity === "orders") {
      setOrdersById({});
      return;
    }
    if (targetEntity === "users") {
      setLinkedUsersById({});
      return;
    }
    if (targetEntity === "clients") {
      setClientsById({});
      setLinkedUsersById({});
      setChildrenById({});
      setAddressesById({});
      return;
    }
    if (targetEntity === "providers") {
      setProvidersById({});
      setLinkedUsersById({});
      setAddressesById({});
      return;
    }
    if (targetEntity === "children") {
      setChildrenById({});
      setClientsById({});
      setLinkedUsersById({});
      return;
    }
    if (targetEntity === "addresses") {
      setAddressesById({});
      setLinkedUsersById({});
    }
  };

  const saveChanges = async () => {
    if (
      entity === "alerts" ||
      entity === "connected-admins"
    )
      return;
    if (!selectedId || isSaving) return;
    try {
      setIsSaving(true);
      setError("");
      if (entity === "broadcast-sender") {
        await updateBroadcastNotificationSender({
          firstName:
            typeof draft.firstName === "string" && draft.firstName.trim()
              ? draft.firstName.trim()
              : undefined,
          imgUrl:
            typeof draft.imgUrl === "string"
              ? draft.imgUrl.trim() || null
              : draft.imgUrl === null
                ? null
                : undefined,
        });
        await fetchList();
        return;
      }
      if (entity === "admins") {
        const payload: Record<string, unknown> = {
          firstName:
            typeof draft.firstName === "string" && draft.firstName.trim()
              ? draft.firstName.trim()
              : undefined,
          email:
            typeof draft.email === "string" && draft.email.trim()
              ? draft.email.trim()
              : undefined,
          roles: Array.isArray(draft.roles)
            ? draft.roles.filter(
                (role): role is AdminRole =>
                  role === "ADMIN" ||
                  role === "SUPER_ADMIN" ||
                  role === "CHAT_MODERATOR",
              )
            : undefined,
        };
        if (removeAdminPassword) {
          payload.password = "";
        } else if (adminPassword.trim()) {
          payload.password = adminPassword.trim();
        }
        await updateSuperAccessItem(entity, selectedId, payload);
      } else {
        if (!isSuperAccessEntity(entity)) return;
        await updateSuperAccessItem(entity, selectedId, draft);
      }
      if (isSuperAccessEntity(entity)) {
        invalidateEntityCaches(entity);
      }
      await fetchItem();
      await fetchList();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message =
          (err.response?.data as { error?: string })?.error ??
          "Failed to update item.";
        setError(message);
        return;
      }
      setError("Failed to update item.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRebuildAllFinancialLedger = async () => {
    try {
      setIsSaving(true);
      setError("");
      setNotice("");
      const response = await rebuildAllFinancialLedgerOrders();
      const result = response.data?.result ?? response.data ?? {};
      setNotice(
        `Rebuilt ${Number(result.rebuiltCount ?? 0)} orders. Failed: ${Number(
          result.failedCount ?? 0,
        )}. Missing: ${Number(result.missingOrderCount ?? 0)}.`,
      );
      await fetchList();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { error?: string })?.error ??
            "Failed to rebuild financial ledger.",
        );
        return;
      }
      setError("Failed to rebuild financial ledger.");
    } finally {
      setIsSaving(false);
      setIsFinancialLedgerRebuildAllModalOpen(false);
    }
  };

  const handleDeleteSelectedFinancialLedgerOrders = async () => {
    if (selectedFinancialLedgerOrderIds.length === 0) return;
    try {
      setIsSaving(true);
      setError("");
      setNotice("");
      await deleteFinancialLedgerOrders(selectedFinancialLedgerOrderIds);
      setNotice(
        `Deleted financial ledger data for ${selectedFinancialLedgerOrderIds.length} orders.`,
      );
      setSelectedFinancialLedgerOrderIds([]);
      if (selectedFinancialLedgerOrderIds.includes(selectedId)) {
        setSelectedId("");
        setSelectedItem(null);
        setDraft({});
      }
      await fetchList();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { error?: string })?.error ??
            "Failed to delete financial ledger rows.",
        );
        return;
      }
      setError("Failed to delete financial ledger rows.");
    } finally {
      setIsSaving(false);
      setIsFinancialLedgerDeleteModalOpen(false);
    }
  };

  const handleRebuildSingleOrderFinancialLedger = async (orderId: string) => {
    try {
      setIsSaving(true);
      setError("");
      setNotice("");
      const response = await rebuildFinancialLedgerForOrder(orderId);
      const result = response.data?.result ?? response.data ?? {};
      setNotice(
        result.rebuilt
          ? "Financial ledger rebuilt for this order."
          : "Financial ledger already existed for this order.",
      );
      if (entity === "orders") {
        invalidateEntityCaches("orders");
        await fetchItem();
        return;
      }
      await fetchList();
      await fetchItem();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { error?: string })?.error ??
            "Failed to rebuild financial ledger for this order.",
        );
        return;
      }
      setError("Failed to rebuild financial ledger for this order.");
    } finally {
      setIsSaving(false);
      setIsOrderFinancialRebuildModalOpen(false);
    }
  };

  const formatPointValue = (value: unknown) => {
    if (!value || typeof value !== "object") return "—";
    const point = value as { coordinates?: unknown };
    if (!Array.isArray(point.coordinates) || point.coordinates.length < 2) {
      return "—";
    }
    const [longitude, latitude] = point.coordinates;
    if (typeof longitude !== "number" || typeof latitude !== "number") {
      return "—";
    }
    return `${latitude}, ${longitude}`;
  };

  const handleRegenerateSelectedAddressPublicLocation = async () => {
    if (entity !== "addresses" || !selectedId || isRegeneratingAddress) return;
    const parsed = parseRegenerateDistances();
    if (!parsed.ok) {
      setRegenerateDistanceError(parsed.error);
      return;
    }
    try {
      setIsRegeneratingAddress(true);
      setError("");
      const response = await regenerateAddressPublicLocation(selectedId, {
        minDistanceMeters: parsed.minDistanceMeters,
        maxDistanceMeters: parsed.maxDistanceMeters,
      });
      const result = response.data?.result as
        | {
            id?: string;
            publicLocation?: {
              type: string;
              coordinates: [number, number];
            };
          }
        | undefined;

      if (result?.publicLocation) {
        const nextId = String(result.id ?? selectedId);
        setSelectedItem((prev) =>
          prev ? { ...prev, publicLocation: result.publicLocation } : prev,
        );
        setDraft((prev) => ({ ...prev, publicLocation: result.publicLocation }));
        setList((prev) =>
          prev.map((item) =>
            pickId(item) === nextId
              ? { ...item, publicLocation: result.publicLocation }
              : item,
          ),
        );
        setAddressesById((prev) => ({
          ...prev,
          [nextId]: {
            ...(prev[nextId] ?? {}),
            publicLocation: result.publicLocation,
          },
        }));
      } else {
        invalidateEntityCaches("addresses");
        await fetchItem();
        await fetchList();
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message =
          (err.response?.data as { error?: string })?.error ??
          "Failed to regenerate public location.";
        setError(message);
        return;
      }
      setError("Failed to regenerate public location.");
    } finally {
      setIsRegeneratingAddress(false);
      setIsRegenerateAddressModalOpen(false);
    }
  };

  const handleRegenerateAllAddressesPublicLocation = async () => {
    if (entity !== "addresses" || isRegeneratingAllAddresses) return;
    const parsed = parseRegenerateDistances();
    if (!parsed.ok) {
      setRegenerateDistanceError(parsed.error);
      return;
    }
    try {
      setIsRegeneratingAllAddresses(true);
      setError("");
      await regenerateAllAddressesPublicLocation({
        minDistanceMeters: parsed.minDistanceMeters,
        maxDistanceMeters: parsed.maxDistanceMeters,
      });
      invalidateEntityCaches("addresses");
      await fetchList();
      if (selectedId) {
        await fetchItem();
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message =
          (err.response?.data as { error?: string })?.error ??
          "Failed to regenerate public locations.";
        setError(message);
        return;
      }
      setError("Failed to regenerate public locations.");
    } finally {
      setIsRegeneratingAllAddresses(false);
      setIsRegenerateAddressModalOpen(false);
    }
  };

  const openRegenerateModal = (target: "ONE" | "ALL") => {
    setRegenerateTarget(target);
    setMinDistanceMeters("60");
    setMaxDistanceMeters("200");
    setRegenerateDistanceError("");
    setIsRegenerateAddressModalOpen(true);
  };

  const closeRegenerateModal = () => {
    if (isRegeneratingAddress || isRegeneratingAllAddresses) return;
    setIsRegenerateAddressModalOpen(false);
    setRegenerateDistanceError("");
  };

  const parseRegenerateDistances = () => {
    const min = Number(minDistanceMeters);
    const max = Number(maxDistanceMeters);

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return { ok: false as const, error: "Distances must be numeric." };
    }
    if (min < 0 || max < 0) {
      return {
        ok: false as const,
        error: "Distances must be non-negative.",
      };
    }
    if (min > max) {
      return {
        ok: false as const,
        error: "Min distance cannot be greater than max distance.",
      };
    }

    return {
      ok: true as const,
      minDistanceMeters: min,
      maxDistanceMeters: max,
    };
  };

  const submitAdminAlert = async () => {
    const text = adminAlertText.trim();
    if (!text || isSendingAlert) return;
    try {
      setIsSendingAlert(true);
      setError("");
      await postAdminMessage(text);
      setAdminAlertText("");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { error?: string })?.error ??
            "Failed to send alert.",
        );
        return;
      }
      setError("Failed to send alert.");
    } finally {
      setIsSendingAlert(false);
    }
  };

  if (!isSuperAdmin) return null;

  const createAdmin = async () => {
    if (isCreatingAdmin) return;
    if (!newAdminFirstName.trim() || !newAdminEmail.trim() || newAdminRoles.length === 0) {
      setError("Fill new admin first name, email and roles.");
      return;
    }
    try {
      setIsCreatingAdmin(true);
      setError("");
      await createAdminUser({
        firstName: newAdminFirstName.trim(),
        email: newAdminEmail.trim(),
        password: newAdminPassword.trim() ? newAdminPassword.trim() : undefined,
        roles: newAdminRoles,
      });
      setNewAdminFirstName("");
      setNewAdminEmail("");
      setNewAdminPassword("");
      setNewAdminRoles(["ADMIN"]);
      await fetchList();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { error?: string })?.error ??
            "Failed to create admin.",
        );
        return;
      }
      setError("Failed to create admin.");
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const openUserObject = async (
    targetEntity: "clients" | "providers",
    userId: string,
  ) => {
    setError("");
    setEntity(targetEntity);
    setSelectedItem(null);
    setDraft({});
    setStartIndex(0);

    try {
      const directResponse = await getSuperAccessItem(targetEntity, userId);
      const directItem = parseItemResponse(directResponse.data);
      if (directItem) {
        const directId = pickId(directItem);
        setSelectedId(directId || userId);
        return;
      }
    } catch {
      // fallback to paginated lookup by userId
    }

    let nextStart = 0;
    const scanPageSize = 100;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const response = await getSuperAccessList(targetEntity, {
        startIndex: nextStart,
        pageSize: scanPageSize,
      });
      const parsed = parseListResponse(response.data);
      const found = parsed.items.find(
        (item) => String(item.userId ?? "") === userId,
      );
      if (found) {
        const foundId = pickId(found);
        setSelectedId(foundId);
        setList(parsed.items);
        setTotal(parsed.total);
        setPageSize(parsed.pageSize);
        setStartIndex(nextStart);
        return;
      }
      nextStart += scanPageSize;
      if (nextStart >= parsed.total) break;
    }

    setError("Client/Provider object for this user was not found.");
  };

  return (
    <div className={styles.main}>
      {error && <p className={styles.error}>{error}</p>}
      {notice && <p className={styles.notice}>{notice}</p>}
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          {MENU_ITEMS.map((menuItem) => (
            <button
              key={menuItem.key}
              type="button"
              className={`${styles.sideBtn} ${
                entity === menuItem.key ? styles.sideBtnActive : ""
              }`}
              onClick={() => {
                setEntity(menuItem.key);
                setSelectedId("");
                setSelectedItem(null);
                setDraft({});
                setNotice("");
                setLinkedUsersById({});
                setChildrenById({});
                setClientsById({});
                setProvidersById({});
                setOrdersById({});
                setSelectedFinancialLedgerOrderIds([]);
                setChatNormalizationAnalysis(null);
                setChatNormalizationJobId("");
                setChatNormalizationJob(null);
                setIsChatNormalizationConfirmModalOpen(false);
                setIsChatNormalizationProgressModalOpen(false);
                setIsCompactListView(menuItem.key === "financial-ledger");
                setStartIndex(0);
                setSearchText("");
                setAppliedSearch("");
              }}
            >
              {menuItem.title}
            </button>
          ))}
        </aside>

        <section className={styles.listPane}>
          <div className={styles.listHeader}>
            <div>
              <h2>
                {entity === "alerts"
                  ? "Admin messages"
                  : entity === "financial-ledger"
                    ? "Financial ledger"
                  : entity === "broadcast-sender"
                    ? "Broadcast sender"
                  : entity === "connected-admins"
                    ? "WS connected Admins"
                    : prettyTitle(entity)}
              </h2>
              <span className={styles.listHeaderMeta}>
                {entity === "alerts"
                  ? "Send a message to all admins."
                  : entity === "financial-ledger"
                    ? `${total} ledger orders, page ${currentPage}/${totalPages}`
                  : entity === "broadcast-sender"
                    ? "Manage the SYSTEM_NANNOW sender profile."
                  : entity === "connected-admins"
                    ? `${total} admins connected right now.`
                  : entity === "chats"
                    ? `${total} chats total, page ${currentPage}/${totalPages}`
                  : `${total} total, page ${currentPage}/${totalPages}`}
              </span>
            </div>
            {entity !== "alerts" &&
              entity !== "connected-admins" &&
              entity !== "broadcast-sender" && (
              <div className={styles.listHeaderActions}>
                {entity !== "financial-ledger" && (
                  <button
                    type="button"
                    className={styles.listViewSwitchButton}
                    onClick={() => setIsCompactListView((prev) => !prev)}
                  >
                    <span className={styles.listViewSwitchLabel}>Show compact</span>
                    <span
                      className={`${styles.listViewSwitchUi} ${
                        isCompactListView ? styles.listViewSwitchUiActive : ""
                      }`}
                    />
                  </button>
                )}
                {(isCompactListView || entity === "financial-ledger") && (
                  <DropDownButton
                    options={PAGE_SIZE_OPTIONS.map((option) => ({
                      title: option.title,
                      value: option.value,
                    }))}
                    selectedOption={Math.max(
                      0,
                      PAGE_SIZE_OPTIONS.findIndex(
                        (option) => Number(option.value) === pageSize,
                      ),
                    )}
                    setSelectedOption={(selectedOption) => {
                      const option =
                        PAGE_SIZE_OPTIONS[selectedOption as number];
                      if (!option) return;
                      setStartIndex(0);
                      setPageSize(Number(option.value));
                    }}
                  />
                )}
                {entity === "financial-ledger" && (
                  <>
                    <Button
                      title={isSaving ? "Rebuilding..." : "Rebuild all"}
                      type="OUTLINED"
                      onClick={() => setIsFinancialLedgerRebuildAllModalOpen(true)}
                      isDisabled={isSaving}
                    />
                    <Button
                      title={`Delete selected (${selectedFinancialLedgerOrderIds.length})`}
                      type="DELETE"
                      onClick={() => setIsFinancialLedgerDeleteModalOpen(true)}
                      isDisabled={
                        selectedFinancialLedgerOrderIds.length === 0 || isSaving
                      }
                    />
                  </>
                )}
                {entity === "addresses" && (
                  <Button
                    title={
                      isRegeneratingAllAddresses
                        ? "Regenerating..."
                        : "Regenerate public"
                    }
                    type="OUTLINED"
                    onClick={() => openRegenerateModal("ALL")}
                    isDisabled={isRegeneratingAllAddresses}
                    isLoading={isRegeneratingAllAddresses}
                  />
                )}
                {entity === "chats" && (
                  <>
                    <Button
                      title={
                        isLoadingChatNormalizationAnalysis
                          ? "Refreshing..."
                          : "Refresh analysis"
                      }
                      type="OUTLINED"
                      onClick={fetchChatNormalizationAnalysis}
                      isDisabled={isLoadingChatNormalizationAnalysis}
                      isLoading={isLoadingChatNormalizationAnalysis}
                    />
                    <Button
                      title="Normalize chats"
                      type="BLACK"
                      onClick={() => setIsChatNormalizationConfirmModalOpen(true)}
                      isDisabled={isStartingChatNormalization}
                    />
                  </>
                )}
                <SearchBar
                  placeholder="Type to search"
                  searchText={searchText}
                  setSearchText={setSearchText}
                  onButtonClick={() => {
                    setStartIndex(0);
                    setAppliedSearch(searchText);
                  }}
                />
              </div>
            )}
          </div>
              {entity === "alerts" ? (
            <div className={styles.alertInfoCard}>
              <div className={styles.alertInfoTitle}>Broadcast admin message</div>
              <div className={styles.alertInfoText}>
                Connected admins will receive the message through
                <code className={styles.alertInlineCode}> ADMIN_EVENT </code>
                with type
                <code className={styles.alertInlineCode}> ADMIN_MESSAGE </code>.
              </div>
            </div>
          ) : entity === "connected-admins" ? (
            <div className={styles.itemsGrid}>
              {list.map((item) => {
                const id = String(item.adminId ?? item.id ?? item._id ?? "");
                const imageUrl = defaultUserImg.src;
                const title = String(item.fullName ?? item.firstName ?? "Admin");
                const email = String(item.email ?? "");

                return (
                  <div
                    key={id || title}
                    role="button"
                    tabIndex={0}
                    className={`${styles.itemCard} ${
                      selectedId === id ? styles.itemCardActive : ""
                    }`}
                    onClick={() => setSelectedId(id)}
                    onKeyDown={(event) => handleItemCardKeyDown(event, id)}
                  >
                    <img src={imageUrl} alt="avatar" className={styles.avatar} />
                    <div className={styles.itemTitle}>{title}</div>
                    {email && <div className={styles.itemSub}>{email}</div>}
                    <div className={styles.itemSub}>ID: {id || "—"}</div>
                  </div>
                );
              })}
              {!loadingList && list.length === 0 && (
                <div className={styles.empty}>No admins connected.</div>
              )}
            </div>
          ) : entity === "chats" ? (
            <>
              <div className={styles.chatNormalizationCard}>
                <div className={styles.chatNormalizationTitle}>Normalization analysis</div>
                <div className={styles.chatNormalizationStats}>
                  <div>Chats total: {chatNormalizationAnalysis?.chatsTotal ?? "—"}</div>
                  <div>
                    Non-normalized chats:{" "}
                    {chatNormalizationAnalysis?.nonNormalizedChats ?? "—"}
                  </div>
                  <div>
                    Duplicate groups: {chatNormalizationAnalysis?.duplicateGroups ?? "—"}
                  </div>
                  <div>
                    Duplicate chats to merge:{" "}
                    {chatNormalizationAnalysis?.duplicateChatsToMerge ?? "—"}
                  </div>
                </div>
              </div>
              <div
                className={`${styles.itemsGrid} ${
                  isCompactListView ? styles.itemsGridCompact : ""
                }`}
              >
                {list.map((item) => {
                  const id = pickId(item);
                  const user1Id = String(item.user1Id ?? "");
                  const user2Id = String(item.user2Id ?? "");
                  const user1Name = getUserDisplayName(
                    user1Id ? linkedUsersById[user1Id] : null,
                  );
                  const user2Name = getUserDisplayName(
                    user2Id ? linkedUsersById[user2Id] : null,
                  );
                  const title = String(
                    (user1Name || user1Id || "User 1") +
                      " / " +
                      (user2Name || user2Id || "User 2"),
                  );
                  return (
                    <div
                      key={id || title}
                      role="button"
                      tabIndex={0}
                      className={`${styles.itemCard} ${
                        selectedId === id ? styles.itemCardActive : ""
                      } ${isCompactListView ? styles.itemCardCompact : ""}`}
                      onClick={() => setSelectedId(id)}
                      onKeyDown={(event) => handleItemCardKeyDown(event, id)}
                    >
                      <div className={styles.itemTitle}>{title}</div>
                      <div className={styles.itemSub}>ID: {id || "—"}</div>
                    </div>
                  );
                })}
                {!loadingList && list.length === 0 && (
                  <div className={styles.empty}>No items found.</div>
                )}
              </div>

              <div className={styles.pagination}>
                <Button
                  title="Prev"
                  type="OUTLINED"
                  onClick={() =>
                    setStartIndex((prev) => Math.max(0, prev - pageSize))
                  }
                  isDisabled={startIndex === 0 || loadingList}
                />
                <Button
                  title="Next"
                  type="OUTLINED"
                  onClick={() =>
                    setStartIndex((prev) =>
                      prev + pageSize >= total ? prev : prev + pageSize,
                    )
                  }
                  isDisabled={startIndex + pageSize >= total || loadingList}
                />
              </div>
            </>
          ) : (
            <>
              <div
                className={`${styles.itemsGrid} ${
                  entity === "orders" ? styles.itemsGridOrders : ""
                } ${entity === "financial-ledger" ? styles.itemsGridFinancialLedger : ""} ${
                  entity === "financial-ledger" ? styles.itemsGridCompact : ""
                } ${isCompactListView ? styles.itemsGridCompact : ""} ${
                  isCompactListView && entity === "orders"
                    ? styles.itemsGridOrdersCompact
                    : ""
                }`}
              >
                {list.map((item) => {
                  const id = pickId(item);
                  const orderItem =
                    entity === "orders" ? ordersById[id] ?? item : item;
                  const linkedUser =
                    entity === "clients" || entity === "providers"
                      ? linkedUsersById[pickLinkedUserId(item)]
                      : null;
                  const childClientId =
                    entity === "children" ? String(item.clientId ?? "") : "";
                  const childClient = childClientId ? clientsById[childClientId] : null;
                  const childParentUserId = childClient
                    ? String(childClient.userId ?? "")
                    : "";
                  const childParentUser = childParentUserId
                    ? linkedUsersById[childParentUserId]
                    : null;
                  const childParentName = childParentUser
                    ? `${String(childParentUser.firstName ?? "")} ${String(
                        childParentUser.lastName ?? "",
                      )}`.trim()
                    : "";
                  const fullName = `${
                    linkedUser?.firstName ?? item.firstName ?? ""
                  } ${linkedUser?.lastName ?? item.lastName ?? ""}`.trim();
                  const title =
                    entity === "children"
                      ? String(item.name ?? `Child ${id || "—"}`)
                      : fullName ||
                        String(
                          linkedUser?.title ??
                            item.title ??
                            linkedUser?.email ??
                            item.email ??
                            item.orderNo ??
                            item.id ??
                            "Item",
                        );
                  const email = String(linkedUser?.email ?? item.email ?? "");
                  const addressUserId =
                    entity === "addresses" ? String(item.userId ?? "") : "";
                  const addressUser = addressUserId
                    ? linkedUsersById[addressUserId]
                    : null;
                  const addressUserName = getUserDisplayName(addressUser);
                  const addressText =
                    entity === "addresses" ? formatAddressLabel(item, id || "—") : "";
                  const imageUrl = String(
                    linkedUser?.imgUrl ??
                      linkedUser?.imageUrl ??
                      addressUser?.imgUrl ??
                      addressUser?.imageUrl ??
                      item.imgUrl ??
                      item.imageUrl ??
                      defaultUserImg.src,
                  );
                  const childSummary =
                    entity === "children" ? formatChildSummary(item, id || "—") : "";
                  const orderClientUserId = String(
                    orderItem.clientUserId ??
                      orderItem.clientUser?.id ??
                      orderItem.client?.userId ??
                      orderItem.client?.user?.id ??
                      clientsById[
                        String(orderItem.clientId ?? orderItem.client?.id ?? "")
                      ]?.userId ??
                      "",
                  );
                  const orderProviderUserId = String(
                    orderItem.approvedProviderUserId ??
                      orderItem.approvedProvider?.userId ??
                      orderItem.approvedProvider?.user?.id ??
                      providersById[
                        String(
                          orderItem.approvedProviderId ??
                            orderItem.approvedProvider?.id ??
                            "",
                        )
                      ]?.userId ??
                      orderItem.requiredProviderId ??
                      "",
                  );
                  const orderClientUser = orderClientUserId
                    ? linkedUsersById[orderClientUserId]
                    : null;
                  const orderProviderUser = orderProviderUserId
                    ? linkedUsersById[orderProviderUserId]
                    : null;
                  const orderClientName =
                    getUserDisplayName(orderClientUser) || "Client";
                  const orderClientNameFromItem = pickFirstString(
                    orderItem.clientName,
                    orderItem.clientUserName,
                    orderItem.clientUser?.firstName
                      ? `${String(orderItem.clientUser?.firstName ?? "")} ${String(
                          orderItem.clientUser?.lastName ?? "",
                        )}`.trim()
                      : "",
                    orderItem.client?.user?.firstName
                      ? `${String(orderItem.client?.user?.firstName ?? "")} ${String(
                          orderItem.client?.user?.lastName ?? "",
                        )}`.trim()
                      : "",
                  );
                  const orderProviderName = String(
                    orderItem.approvedProvider?.user?.firstName
                      ? `${String(
                          orderItem.approvedProvider?.user?.firstName ?? "",
                        )} ${String(
                          orderItem.approvedProvider?.user?.lastName ?? "",
                        )}`.trim()
                      : getUserDisplayName(orderProviderUser) || "Provider",
                  );
                  const orderClientImg = pickFirstString(
                    orderItem.clientImgUrl,
                    orderItem.clientImgURI,
                    orderItem.clientImgUri,
                    orderItem.clientImageUrl,
                    orderItem.clientImageURI,
                    orderItem.clientImageUri,
                    orderItem.clientUser?.imgUrl,
                    orderItem.clientUser?.imageUrl,
                    orderItem.client?.user?.imgUrl,
                    orderItem.client?.user?.imageUrl,
                    orderClientUser?.imgUrl,
                    orderClientUser?.imageUrl,
                    defaultUserImg.src,
                  );
                  const orderProviderImg = pickFirstString(
                    orderItem.approvedProvider?.user?.imgUrl,
                    orderItem.approvedProvider?.user?.imageUrl,
                    orderItem.approvedProviderImgUrl,
                    orderItem.approvedProviderImageUrl,
                    orderItem.providerImgUrl,
                    orderItem.providerImageUrl,
                    orderProviderUser?.imgUrl,
                    orderProviderUser?.imageUrl,
                    defaultUserImg.src,
                  );
                  const isFinancialLedgerItem = entity === "financial-ledger";
                  const financialLedgerOrder = item as FinancialOrderRow;
                  const financialProviderName = isFinancialLedgerItem
                    ? getUserName(
                        financialLedgerOrder.providerUser?.firstName,
                        financialLedgerOrder.providerUser?.lastName,
                      )
                    : "";
                  const financialClientName = isFinancialLedgerItem
                    ? getUserName(
                        financialLedgerOrder.clientUser?.firstName,
                        financialLedgerOrder.clientUser?.lastName,
                      )
                    : "";
                  return (
                    <div
                      key={id || title}
                      role="button"
                      tabIndex={0}
                    className={`${styles.itemCard} ${
                      selectedId === id ? styles.itemCardActive : ""
                    } ${
                      isCompactListView || entity === "financial-ledger"
                        ? styles.itemCardCompact
                        : ""
                    }`}
                      onClick={() => setSelectedId(id)}
                      onKeyDown={(event) => handleItemCardKeyDown(event, id)}
                    >
                      {isFinancialLedgerItem ? (
                        <div className={styles.financialLedgerRow}>
                          <label
                            className={styles.financialLedgerCheckbox}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={selectedFinancialLedgerOrderIds.includes(id)}
                              onChange={() =>
                                toggleFinancialLedgerOrderSelection(id)
                              }
                            />
                          </label>
                          <div className={styles.financialLedgerUsers}>
                            <div className={styles.orderUsersCompactAvatars}>
                              <img
                                src={
                                  financialLedgerOrder.providerUser?.imgUrl ||
                                  defaultUserImg.src
                                }
                                alt={financialProviderName}
                                className={styles.orderProviderImg}
                              />
                              <img
                                src={
                                  financialLedgerOrder.clientUser?.imgUrl ||
                                  defaultUserImg.src
                                }
                                alt={financialClientName}
                                className={styles.orderClientImg}
                              />
                            </div>
                            <div className={styles.financialLedgerMain}>
                              <div className={styles.financialLedgerPrimary}>
                                {financialLedgerOrder.orderPrettyId}
                              </div>
                              <div className={styles.financialLedgerSecondary}>
                                {financialProviderName} | {financialClientName}
                              </div>
                              <div className={styles.financialLedgerSecondary}>
                                Paid: {formatDateTimeShort(financialLedgerOrder.paidAt)}
                              </div>
                            </div>
                          </div>
                          <div className={styles.financialLedgerAmount}>
                            {typeof financialLedgerOrder.actualClientPaidCents === "number"
                              ? `€${(
                                  financialLedgerOrder.actualClientPaidCents / 100
                                ).toFixed(2)}`
                              : "—"}
                          </div>
                          <div className={styles.financialLedgerMeta}>
                            <span
                              className={`${styles.financialLedgerMode} ${
                                financialLedgerOrder.financialMode === "REAL"
                                  ? styles.financialLedgerModeReal
                                  : financialLedgerOrder.financialMode ===
                                      "PARTIAL_REAL"
                                    ? styles.financialLedgerModePartial
                                    : styles.financialLedgerModeForecast
                              }`}
                            >
                              {financialLedgerOrder.financialMode}
                            </span>
                            <div className={styles.financialLedgerSecondary}>
                              {String(financialLedgerOrder.status ?? "—")}
                            </div>
                          </div>
                        </div>
                      ) : entity === "orders" ? (
                        <div className={styles.orderRow}>
                          <div className={styles.orderRowTop}>
                            <div className={styles.orderRowUsers}>
                              <img
                                src={orderProviderImg}
                                alt="provider"
                                className={styles.orderProviderImg}
                              />
                              <img
                                src={orderClientImg}
                                alt="client"
                                className={styles.orderClientImg}
                              />
                              <div className={styles.orderRowNames}>
                                {orderProviderName} |{" "}
                                {orderClientNameFromItem || orderClientName}
                              </div>
                            </div>
                          </div>
                          <div className={styles.orderRowTime}>
                            Starts: {formatDateTimeShort(orderItem.startsAt)}
                          </div>
                          <div className={styles.orderRowTime}>
                            Ends: {formatDateTimeShort(orderItem.endsAt)}
                          </div>
                          <div className={styles.orderRowStatus}>
                            {String(orderItem.status ?? "—")}
                          </div>
                          <div className={styles.orderRowPrettyId}>
                            {String(orderItem.orderPrettyId ?? id)}
                          </div>
                        </div>
                      ) : (
                        <>
                          <img src={imageUrl} alt="avatar" className={styles.avatar} />
                          <div className={styles.itemTitle}>
                            {entity === "addresses" ? addressText : title}
                          </div>
                          {entity === "children" ? (
                            <>
                              <div className={styles.itemSub}>{childSummary}</div>
                              <div className={styles.itemSub}>
                                Parent: {childParentName || "—"}
                              </div>
                            </>
                          ) : entity === "addresses" ? (
                            <div className={styles.itemSub}>
                              User: {addressUserName || "—"}
                            </div>
                          ) : (
                            email && <div className={styles.itemSub}>{email}</div>
                          )}
                          <div className={styles.itemSub}>ID: {id || "—"}</div>
                        </>
                      )}
                    </div>
                  );
                })}
                {!loadingList && list.length === 0 && (
                  <div className={styles.empty}>No items found.</div>
                )}
              </div>

              {entity !== "broadcast-sender" && (
                <div className={styles.pagination}>
                  <Button
                    title="Prev"
                    type="OUTLINED"
                    onClick={() =>
                      setStartIndex((prev) => Math.max(0, prev - pageSize))
                    }
                    isDisabled={startIndex === 0 || loadingList}
                  />
                  <Button
                    title="Next"
                    type="OUTLINED"
                    onClick={() =>
                      setStartIndex((prev) =>
                        prev + pageSize >= total ? prev : prev + pageSize,
                      )
                    }
                    isDisabled={startIndex + pageSize >= total || loadingList}
                  />
                </div>
              )}
            </>
          )}
        </section>

        <section className={styles.detailPane}>
          <div className={styles.detailHeader}>
            <h2>
              {entity === "alerts"
                ? "Send message"
                : entity === "broadcast-sender"
                  ? "Broadcast sender"
                : entity === "connected-admins"
                  ? "Connected admin"
                  : "Detail"}
            </h2>
            <div className={styles.detailHeaderActions}>
              {entity === "addresses" && selectedId && (
                <Button
                  title={
                    isRegeneratingAddress
                      ? "Regenerating..."
                      : "Regenerate public"
                  }
                  type="OUTLINED"
                  onClick={() => openRegenerateModal("ONE")}
                  isDisabled={loadingItem || isRegeneratingAddress}
                  isLoading={isRegeneratingAddress}
                />
              )}
              {(entity === "financial-ledger" || entity === "orders") &&
                selectedId && (
                  <Button
                    title={isSaving ? "Rebuilding..." : "Rebuild financial"}
                    type="OUTLINED"
                    onClick={() => setIsOrderFinancialRebuildModalOpen(true)}
                    isDisabled={loadingItem || isSaving}
                  />
                )}
              <Button
                title={
                  entity === "alerts"
                    ? isSendingAlert
                      ? "Sending..."
                      : "Send alert"
                    : entity === "broadcast-sender"
                      ? isSaving
                        ? "Saving..."
                        : "Save sender"
                    : entity === "financial-ledger" || entity === "chats"
                      ? "Read only"
                    : entity === "connected-admins"
                      ? "Read only"
                    : isSaving
                      ? "Saving..."
                      : "Save"
                }
                type="BLACK"
                onClick={entity === "alerts" ? submitAdminAlert : saveChanges}
                isDisabled={
                  entity === "alerts"
                    ? !adminAlertText.trim() || isSendingAlert
                    : entity === "broadcast-sender"
                      ? loadingItem || isSaving
                    : entity === "financial-ledger" || entity === "chats"
                      ? true
                    : entity === "connected-admins"
                      ? true
                    : !selectedId || loadingItem || isSaving
                }
                isLoading={
                  entity === "alerts"
                    ? isSendingAlert
                    : isSaving &&
                      entity !== "connected-admins" &&
                      entity !== "financial-ledger" &&
                      entity !== "chats"
                }
              />
            </div>
          </div>

          {entity === "alerts" ? (
            <div className={styles.alertFormCard}>
              <div className={styles.alertFormTitle}>Message text</div>
              <div className={styles.alertFormText}>
                This sends a new admin message to all connected admins.
              </div>
              <label className={styles.field}>
                <span>Message</span>
                <textarea
                  value={adminAlertText}
                  onChange={(e) => setAdminAlertText(e.target.value)}
                  placeholder="Type alert text"
                  className={styles.alertTextarea}
                />
              </label>
            </div>
          ) : entity === "connected-admins" ? (
            <>
              {!selectedId && (
                <div className={styles.empty}>Select a connected admin.</div>
              )}
              {selectedId && selectedItem && (
                <div className={styles.form}>
                  <label className={styles.field}>
                    <span>Admin ID</span>
                    <input
                      type="text"
                      value={String(
                        selectedItem.adminId ??
                          selectedItem.id ??
                          selectedItem._id ??
                          "",
                      )}
                      disabled
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Full name</span>
                    <input
                      type="text"
                      value={String(selectedItem.fullName ?? "")}
                      disabled
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Email</span>
                    <input
                      type="text"
                      value={String(selectedItem.email ?? "")}
                      disabled
                    />
                  </label>
                </div>
              )}
            </>
          ) : entity === "broadcast-sender" ? (
            <>
              {!selectedId && (
                <div className={styles.empty}>No broadcast sender found.</div>
              )}
              {selectedId && !loadingItem && selectedItem && (
                <div className={styles.form}>
                  <label className={styles.field}>
                    <span>Sender ID</span>
                    <input
                      type="text"
                      value={String(selectedItem.id ?? "")}
                      disabled
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Email</span>
                    <input
                      type="text"
                      value={String(selectedItem.email ?? "")}
                      disabled
                    />
                  </label>
                  <label className={styles.field}>
                    <span>First name</span>
                    <input
                      type="text"
                      value={String(draft.firstName ?? "")}
                      onChange={(e) =>
                        handleFieldChange("firstName", e.target.value)
                      }
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Image URL</span>
                    <input
                      type="text"
                      value={String(draft.imgUrl ?? "")}
                      onChange={(e) =>
                        handleFieldChange("imgUrl", e.target.value)
                      }
                      placeholder="Leave empty to remove image"
                    />
                  </label>
                </div>
              )}
            </>
          ) : (
            <>
              {!selectedId && <div className={styles.empty}>Select an item.</div>}
              {selectedId && loadingItem && (
                <div className={styles.empty}>Loading...</div>
              )}

              {(entity === "financial-ledger" || entity === "chats") &&
                selectedId &&
                !loadingItem &&
                selectedItem && (
                  <div className={styles.form}>
                    {Object.entries(selectedItem)
                      .filter(([key]) => !["id", "_id"].includes(key))
                      .map(([key, value]) => {
                        const fieldId = `financial-ledger-${key}`;

                        if (typeof value === "boolean") {
                          return (
                            <label
                              key={key}
                              htmlFor={fieldId}
                              className={styles.fieldCheckbox}
                            >
                              <input
                                id={fieldId}
                                type="checkbox"
                                checked={value}
                                disabled
                              />
                              <span>{prettyTitle(key)}</span>
                            </label>
                          );
                        }

                        if (Array.isArray(value) || (value && typeof value === "object")) {
                          return (
                            <label
                              key={key}
                              htmlFor={fieldId}
                              className={styles.field}
                            >
                              <span>{prettyTitle(key)} (JSON)</span>
                              <textarea
                                id={fieldId}
                                value={JSON.stringify(value, null, 2)}
                                disabled
                              />
                            </label>
                          );
                        }

                        return (
                          <label
                            key={key}
                            htmlFor={fieldId}
                            className={styles.field}
                          >
                            <span>{prettyTitle(key)}</span>
                            <input
                              id={fieldId}
                              type="text"
                              value={value == null ? "" : String(value)}
                              disabled
                            />
                          </label>
                        );
                      })}
                  </div>
                )}

              {entity !== "financial-ledger" && entity !== "chats" && (
                <>

              {entity === "admins" && (
                <div className={styles.adminCreateCard}>
                  <h3>Create admin</h3>
                  <div className={styles.inlineFields}>
                    <input
                      type="text"
                      placeholder="First name"
                      value={newAdminFirstName}
                      onChange={(e) => setNewAdminFirstName(e.target.value)}
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                    />
                    <input
                      type="password"
                      placeholder="Password (optional)"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                    />
                  </div>
                  <div className={styles.rolesMultiSelect}>
                    {["ADMIN", "SUPER_ADMIN", "CHAT_MODERATOR"].map((role) => (
                      <label key={role} className={styles.roleToggle}>
                        <input
                          type="checkbox"
                          checked={newAdminRoles.includes(role as AdminRole)}
                          onChange={(e) => {
                            const typedRole = role as AdminRole;
                            const nextRoles = e.target.checked
                              ? [...newAdminRoles, typedRole]
                              : newAdminRoles.filter((item) => item !== typedRole);
                            if (nextRoles.length > 0) {
                              setNewAdminRoles(nextRoles);
                            }
                          }}
                        />
                        {role}
                      </label>
                    ))}
                  </div>
                  <Button
                    title={isCreatingAdmin ? "Creating..." : "Add admin"}
                    type="OUTLINED"
                    onClick={createAdmin}
                    isDisabled={isCreatingAdmin}
                    isLoading={isCreatingAdmin}
                  />
                </div>
              )}

              {selectedId && !loadingItem && selectedItem && (
                <div className={styles.form}>
                  {entity === "admins" && (
                    <>
                      <label className={styles.field}>
                        <span>New password</span>
                        <input
                          type="password"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="Leave empty to keep current"
                          disabled={removeAdminPassword}
                        />
                      </label>
                      <label className={styles.fieldCheckbox}>
                        <input
                          type="checkbox"
                          checked={removeAdminPassword}
                          onChange={(e) => setRemoveAdminPassword(e.target.checked)}
                        />
                        <span>Remove password login</span>
                      </label>
                    </>
                  )}
                  {fields.map(([key, value]) => {
                const fieldId = `field-${key}`;

                const hasOrderStatusDropdown =
                  entity === "orders" && key === "status" && typeof value === "string";
                if (hasOrderStatusDropdown) {
                  const currentStatus = String(value);
                  const statusOptions = ORDER_STATUSES_SUPER.includes(currentStatus)
                    ? ORDER_STATUSES_SUPER
                    : [currentStatus, ...ORDER_STATUSES_SUPER];
                  return (
                    <label key={key} htmlFor={fieldId} className={styles.field}>
                      <span>{prettyTitle(key)}</span>
                      <select
                        id={fieldId}
                        value={String(value)}
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                      >
                        {statusOptions.map((statusValue) => (
                          <option key={statusValue} value={statusValue}>
                            {statusValue}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                }

                const hasRolesDropdown =
                  entity === "admins" && key === "roles" && Array.isArray(value);
                if (hasRolesDropdown) {
                  const currentRoles = value.filter(
                    (role): role is string => typeof role === "string",
                  );
                  return (
                    <div key={key} className={styles.field}>
                      <span>{prettyTitle(key)}</span>
                      <div className={styles.rolesMultiSelect}>
                        {["ADMIN", "SUPER_ADMIN", "CHAT_MODERATOR"].map((role) => (
                          <label key={role} className={styles.roleToggle}>
                            <input
                              type="checkbox"
                              checked={currentRoles.includes(role)}
                              onChange={(e) => {
                                const nextRoles = e.target.checked
                                  ? [...currentRoles, role]
                                  : currentRoles.filter((item) => item !== role);
                                handleFieldChange(key, nextRoles);
                              }}
                            />
                            {role}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                }

                const hasProviderPriceCalculationMethodDropdown =
                  entity === "providers" &&
                  key === "providerPriceCalculationMethod" &&
                  typeof value === "string";
                if (hasProviderPriceCalculationMethodDropdown) {
                  const allowedValues = ["DYNAMIC", "CUSTOM"];
                  const optionValues = allowedValues.includes(value)
                    ? allowedValues
                    : [value, ...allowedValues];
                  return (
                    <label key={key} htmlFor={fieldId} className={styles.field}>
                      <span>{prettyTitle(key)}</span>
                      <select
                        id={fieldId}
                        value={value}
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                      >
                        {optionValues.map((optionValue) => (
                          <option key={optionValue} value={optionValue}>
                            {optionValue}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                }

                const isAddressIdsField =
                  (entity === "clients" || entity === "providers") &&
                  (key === "addressesIds" || key === "addressIds") &&
                  Array.isArray(value);
                if (isAddressIdsField) {
                  const ids = value.filter(
                    (item): item is string =>
                      typeof item === "string" && item.length > 0,
                  );
                  return (
                    <div key={key} className={styles.field}>
                      <span>Addresses</span>
                      <div className={styles.addressList}>
                        {ids.length === 0 && (
                          <div className={styles.addressEmpty}>No addresses</div>
                        )}
                        {ids.map((addressId) => {
                          const address = addressesById[addressId];
                          return (
                            <button
                              key={addressId}
                              type="button"
                              className={styles.addressLink}
                              onClick={() => {
                                setEntity("addresses");
                                setSelectedId(addressId);
                                setSelectedItem(null);
                                setDraft({});
                              }}
                            >
                              {formatAddressLabel(address ?? {}, addressId)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                const isDefaultAddressField =
                  (entity === "clients" || entity === "providers") &&
                  key === "defaultAddressId" &&
                  typeof value === "string";
                if (isDefaultAddressField) {
                  const addressId = value.trim();
                  const address = addressId ? addressesById[addressId] : null;
                  return (
                    <div key={key} className={styles.field}>
                      <span>Default address</span>
                      {addressId ? (
                        <button
                          type="button"
                          className={styles.addressLink}
                          onClick={() => {
                            setEntity("addresses");
                            setSelectedId(addressId);
                            setSelectedItem(null);
                            setDraft({});
                          }}
                        >
                          {formatAddressLabel(address ?? {}, addressId)}
                        </button>
                      ) : (
                        <div className={styles.addressEmpty}>No default address</div>
                      )}
                    </div>
                  );
                }

                const isClientProviderUserIdField =
                  (entity === "clients" || entity === "providers") &&
                  key === "userId" &&
                  typeof value === "string";
                if (isClientProviderUserIdField) {
                  const userId = value.trim();
                  const linkedUser = userId ? linkedUsersById[userId] : null;
                  const userName = getUserDisplayName(linkedUser);
                  return (
                    <div key={key} className={styles.field}>
                      <span>User</span>
                      {userId ? (
                        <button
                          type="button"
                          className={styles.addressLink}
                          onClick={() => {
                            setEntity("users");
                            setSelectedId(userId);
                            setSelectedItem(null);
                            setDraft({});
                          }}
                        >
                          {userName || `User ${userId}`}
                        </button>
                      ) : (
                        <div className={styles.addressEmpty}>No linked user</div>
                      )}
                    </div>
                  );
                }

                const isChildIdsField =
                  entity === "clients" &&
                  (key === "childIds" || key === "childrenIds") &&
                  Array.isArray(value);
                if (isChildIdsField) {
                  const ids = value.filter(
                    (item): item is string =>
                      typeof item === "string" && item.length > 0,
                  );
                  return (
                    <div key={key} className={styles.field}>
                      <span>Children</span>
                      <div className={styles.addressList}>
                        {ids.length === 0 && (
                          <div className={styles.addressEmpty}>No children</div>
                        )}
                        {ids.map((childId) => {
                          const child = childrenById[childId];
                          return (
                            <button
                              key={childId}
                              type="button"
                              className={styles.addressLink}
                              onClick={() => {
                                setEntity("children");
                                setSelectedId(childId);
                                setSelectedItem(null);
                                setDraft({});
                              }}
                            >
                              {formatChildLabel(child ?? {}, childId)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                const isClientIdField =
                  entity === "children" && key === "clientId" && typeof value === "string";
                if (isClientIdField) {
                  const clientId = value.trim();
                  const client = clientId ? clientsById[clientId] : null;
                  const parentUserId = client ? String(client.userId ?? "") : "";
                  const parentUser = parentUserId
                    ? linkedUsersById[parentUserId]
                    : null;
                  const parentName = parentUser
                    ? `${String(parentUser.firstName ?? "")} ${String(
                        parentUser.lastName ?? "",
                      )}`.trim()
                    : "";
                  return (
                    <div key={key} className={styles.field}>
                      <span>Parent client</span>
                      {clientId ? (
                        <button
                          type="button"
                          className={styles.addressLink}
                          onClick={() => {
                            setEntity("clients");
                            setSelectedId(clientId);
                            setSelectedItem(null);
                            setDraft({});
                          }}
                        >
                          {parentName || `Client ${clientId}`}
                        </button>
                      ) : (
                        <div className={styles.addressEmpty}>No parent client</div>
                      )}
                    </div>
                  );
                }

                const isAddressUserIdField =
                  entity === "addresses" && key === "userId" && typeof value === "string";
                if (isAddressUserIdField) {
                  const userId = value.trim();
                  const linkedUser = userId ? linkedUsersById[userId] : null;
                  const userName = getUserDisplayName(linkedUser);
                  const targetEntity = getUserTargetEntity(linkedUser);
                  return (
                    <div key={key} className={styles.field}>
                      <span>User</span>
                      {userId ? (
                        <button
                          type="button"
                          className={styles.addressLink}
                          onClick={() => {
                            if (!targetEntity) return;
                            openUserObject(targetEntity, userId);
                          }}
                          disabled={!targetEntity}
                        >
                          {userName || `User ${userId}`}
                        </button>
                      ) : (
                        <div className={styles.addressEmpty}>No linked user</div>
                      )}
                    </div>
                  );
                }

                const isAddressLocationField =
                  entity === "addresses" && key === "location";
                if (isAddressLocationField) {
                  return (
                    <div key={key} className={styles.fieldGroup}>
                      <label htmlFor={fieldId} className={styles.field}>
                        <span>{prettyTitle(key)}</span>
                        <input
                          id={fieldId}
                          type="text"
                          value={formatPointValue(value)}
                          disabled
                        />
                      </label>
                      <label
                        htmlFor={`${fieldId}-public`}
                        className={styles.field}
                      >
                        <span>Public location</span>
                        <input
                          id={`${fieldId}-public`}
                          type="text"
                          value={formatPointValue(draft.publicLocation)}
                          disabled
                        />
                      </label>
                    </div>
                  );
                }

                if (entity === "addresses" && key === "publicLocation") {
                  return null;
                }

                const isOrderClientUserIdField =
                  entity === "orders" &&
                  key === "clientUserId" &&
                  typeof value === "string";
                if (isOrderClientUserIdField) {
                  const userId = value.trim();
                  const linkedUser = userId ? linkedUsersById[userId] : null;
                  const userName = getUserDisplayName(linkedUser);
                  return (
                    <div key={key} className={styles.field}>
                      <span>Client user</span>
                      {userId ? (
                        <button
                          type="button"
                          className={styles.addressLink}
                          onClick={() => {
                            setEntity("users");
                            setSelectedId(userId);
                            setSelectedItem(null);
                            setDraft({});
                          }}
                        >
                          {userName || `User ${userId}`}
                        </button>
                      ) : (
                        <div className={styles.addressEmpty}>No linked user</div>
                      )}
                    </div>
                  );
                }

                const isOrderApprovedProviderIdField =
                  entity === "orders" &&
                  key === "approvedProviderId" &&
                  typeof value === "string";
                if (isOrderApprovedProviderIdField) {
                  const providerId = value.trim();
                  const providerUserId = String(draft.approvedProviderUserId ?? "");
                  const providerUser = providerUserId
                    ? linkedUsersById[providerUserId]
                    : null;
                  const providerName =
                    (draft.approvedProvider &&
                    typeof draft.approvedProvider === "object"
                      ? getUserDisplayName(
                          (draft.approvedProvider as Record<string, unknown>)
                            .user as Record<string, unknown>,
                        )
                      : "") || getUserDisplayName(providerUser);
                  return (
                    <div key={key} className={styles.field}>
                      <span>Approved provider</span>
                      {providerId ? (
                        <button
                          type="button"
                          className={styles.addressLink}
                          onClick={() => {
                            setEntity("providers");
                            setSelectedId(providerId);
                            setSelectedItem(null);
                            setDraft({});
                          }}
                        >
                          {providerName || `Provider ${providerId}`}
                        </button>
                      ) : (
                        <div className={styles.addressEmpty}>No approved provider</div>
                      )}
                    </div>
                  );
                }

                const isOrderAddressIdField =
                  entity === "orders" &&
                  /addressId$/i.test(key) &&
                  typeof value === "string";
                if (isOrderAddressIdField) {
                  const addressId = value.trim();
                  const address = addressId ? addressesById[addressId] : null;
                  return (
                    <div key={key} className={styles.field}>
                      <span>{prettyTitle(key)}</span>
                      {addressId ? (
                        <button
                          type="button"
                          className={styles.addressLink}
                          onClick={() => {
                            setEntity("addresses");
                            setSelectedId(addressId);
                            setSelectedItem(null);
                            setDraft({});
                          }}
                        >
                          {formatAddressLabel(address ?? {}, addressId)}
                        </button>
                      ) : (
                        <div className={styles.addressEmpty}>No address</div>
                      )}
                    </div>
                  );
                }

                const isOrderApprovedProviderUserIdField =
                  entity === "orders" &&
                  key === "approvedProviderUserId" &&
                  typeof value === "string";
                if (isOrderApprovedProviderUserIdField) {
                  const providerUserId = value.trim();
                  const providerUser = providerUserId
                    ? linkedUsersById[providerUserId]
                    : null;
                  const providerName = getUserDisplayName(providerUser);
                  return (
                    <div key={key} className={styles.field}>
                      <span>Approved provider user</span>
                      {providerUserId ? (
                        <button
                          type="button"
                          className={styles.addressLink}
                          onClick={() => openUserObject("providers", providerUserId)}
                        >
                          {providerName || `User ${providerUserId}`}
                        </button>
                      ) : (
                        <div className={styles.addressEmpty}>No approved provider user</div>
                      )}
                    </div>
                  );
                }

                const isOrderChildrenField =
                  entity === "orders" &&
                  (key === "childrenIds" || key === "childIds") &&
                  Array.isArray(value);
                if (isOrderChildrenField) {
                  const ids = value.filter(
                    (item): item is string =>
                      typeof item === "string" && item.length > 0,
                  );
                  return (
                    <div key={key} className={styles.field}>
                      <span>Children</span>
                      <div className={styles.addressList}>
                        {ids.length === 0 && (
                          <div className={styles.addressEmpty}>No children</div>
                        )}
                        {ids.map((childId) => {
                          const child = childrenById[childId];
                          return (
                            <button
                              key={childId}
                              type="button"
                              className={styles.addressLink}
                              onClick={() => {
                                setEntity("children");
                                setSelectedId(childId);
                                setSelectedItem(null);
                                setDraft({});
                              }}
                            >
                              {formatChildLabel(child ?? {}, childId)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                if (typeof value === "boolean") {
                  return (
                    <label key={key} htmlFor={fieldId} className={styles.fieldCheckbox}>
                      <input
                        id={fieldId}
                        type="checkbox"
                        checked={value}
                        onChange={(e) => handleFieldChange(key, e.target.checked)}
                      />
                      <span>{prettyTitle(key)}</span>
                    </label>
                  );
                }

                if (typeof value === "number") {
                  const isReadOnlyProviderFinalPrice =
                    entity === "providers" && key === "finalPrice";
                  return (
                    <label key={key} htmlFor={fieldId} className={styles.field}>
                      <span>{prettyTitle(key)}</span>
                      <input
                        id={fieldId}
                        type="number"
                        value={String(value)}
                        onChange={(e) =>
                          handleFieldChange(key, Number(e.target.value))
                        }
                        disabled={isReadOnlyProviderFinalPrice}
                      />
                    </label>
                  );
                }

                const isDateField =
                  isLikelyDateField(key) &&
                  (typeof value === "string" ||
                    value === null ||
                    value === undefined);
                if (isDateField) {
                  const isDateOnly = /birthDate/i.test(key);
                  const normalizedStringValue =
                    typeof value === "string" ? value : "";
                  return (
                    <label key={key} htmlFor={fieldId} className={styles.field}>
                      <span>{prettyTitle(key)}</span>
                      <div className={styles.dateInputWrap}>
                        <input
                          id={fieldId}
                          type={isDateOnly ? "date" : "datetime-local"}
                          value={
                            isDateOnly
                              ? toDateLocal(normalizedStringValue)
                              : toDateTimeLocal(normalizedStringValue)
                          }
                          onChange={(e) =>
                            handleFieldChange(
                              key,
                              isDateOnly
                                ? toIsoFromDateOnly(e.target.value)
                                : toIsoFromLocal(e.target.value),
                            )
                          }
                        />
                        <button
                          type="button"
                          className={styles.datePickerBtn}
                          onClick={() => openNativePicker(fieldId)}
                          aria-label={`Open ${prettyTitle(key)} picker`}
                        >
                          <img src={calendarImg.src} alt="" />
                        </button>
                      </div>
                    </label>
                  );
                }

                if (Array.isArray(value) || (value && typeof value === "object")) {
                  return (
                    <label key={key} htmlFor={fieldId} className={styles.field}>
                      <span>{prettyTitle(key)} (JSON)</span>
                      <textarea
                        id={fieldId}
                        value={JSON.stringify(value, null, 2)}
                        onChange={(e) => {
                          try {
                            handleFieldChange(key, JSON.parse(e.target.value));
                          } catch {
                            handleFieldChange(key, e.target.value);
                          }
                        }}
                      />
                    </label>
                  );
                }

                return (
                  <label key={key} htmlFor={fieldId} className={styles.field}>
                    <span>{prettyTitle(key)}</span>
                    <input
                      id={fieldId}
                      type="text"
                      value={value == null ? "" : String(value)}
                      onChange={(e) => handleFieldChange(key, e.target.value)}
                    />
                  </label>
                );
                  })}
                </div>
              )}
            </>
              )}
            </>
          )}
        </section>
      </div>
      {isChatNormalizationConfirmModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>Normalize chats?</h3>
            <p className={styles.modalText}>
              This will normalize user pairs and merge duplicate chat documents.
              Messages will be reassigned to a keeper chat.
            </p>
            <div className={styles.modalActions}>
              <Button
                title="Cancel"
                type="OUTLINED"
                onClick={() => setIsChatNormalizationConfirmModalOpen(false)}
                isDisabled={isStartingChatNormalization}
              />
              <Button
                title={isStartingChatNormalization ? "Starting..." : "Confirm"}
                type="BLACK"
                onClick={startChatsNormalization}
                isDisabled={isStartingChatNormalization}
                isLoading={isStartingChatNormalization}
              />
            </div>
          </div>
        </div>
      )}
      {isChatNormalizationProgressModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>Chats normalization progress</h3>
            <p className={styles.modalText}>
              {`Job: ${chatNormalizationJobId || "—"} • Status: ${
                chatNormalizationJob?.status ?? "PENDING"
              }`}
            </p>
            {chatNormalizationJob?.currentPhase && (
              <p className={styles.modalText}>
                {`Current phase: ${chatNormalizationJob.currentPhase}`}
              </p>
            )}
            {chatNormalizationJob?.currentStep && (
              <p className={styles.modalText}>
                {`Current step: ${chatNormalizationJob.currentStep}`}
              </p>
            )}
            {chatNormalizationJob?.error && (
              <div className={styles.modalError}>{chatNormalizationJob.error}</div>
            )}
            {chatNormalizationJob?.progress &&
              typeof chatNormalizationJob.progress === "object" && (
                <div className={styles.chatProgressList}>
                  {Object.entries(chatNormalizationJob.progress).map(
                    ([key, value]) => (
                      <div key={key} className={styles.chatProgressRow}>
                        <span>{prettyTitle(key)}</span>
                        <strong>
                          {typeof value === "number" ||
                          typeof value === "string" ||
                          typeof value === "boolean"
                            ? String(value)
                            : JSON.stringify(value)}
                        </strong>
                      </div>
                    ),
                  )}
                </div>
              )}
            {Array.isArray(chatNormalizationJob?.steps) &&
              chatNormalizationJob.steps.length > 0 && (
                <div className={styles.chatStepsList}>
                  {chatNormalizationJob.steps.map((step) => (
                    <div key={step.key} className={styles.chatStepRow}>
                      <div>{step.key}</div>
                      <div>{step.status ?? "PENDING"}</div>
                      {step.error && (
                        <div className={styles.modalError}>{step.error}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            <div className={styles.modalActions}>
              <Button
                title={
                  chatNormalizationJob?.status === "COMPLETED" ||
                  chatNormalizationJob?.status === "FAILED"
                    ? "Close"
                    : "Hide"
                }
                type="OUTLINED"
                onClick={() => setIsChatNormalizationProgressModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
      {isFinancialLedgerRebuildAllModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>Rebuild all financial ledger rows?</h3>
            <p className={styles.modalText}>
              This scans historical orders and creates missing financial ledger
              rows for orders that existed before the ledger API was added.
            </p>
            <div className={styles.modalActions}>
              <Button
                title="Cancel"
                type="OUTLINED"
                onClick={() => setIsFinancialLedgerRebuildAllModalOpen(false)}
                isDisabled={isSaving}
              />
              <Button
                title={isSaving ? "Rebuilding..." : "Rebuild all"}
                type="BLACK"
                onClick={handleRebuildAllFinancialLedger}
                isDisabled={isSaving}
                isLoading={isSaving}
              />
            </div>
          </div>
        </div>
      )}
      {isFinancialLedgerDeleteModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>Delete selected financial rows?</h3>
            <p className={styles.modalText}>
              This removes financial ledger rows for the selected orders. Use it
              only for test or wrong data.
            </p>
            <div className={styles.modalTextStrong}>
              Selected orders: {selectedFinancialLedgerOrderIds.length}
            </div>
            <div className={styles.modalActions}>
              <Button
                title="Cancel"
                type="OUTLINED"
                onClick={() => setIsFinancialLedgerDeleteModalOpen(false)}
                isDisabled={isSaving}
              />
              <Button
                title={isSaving ? "Deleting..." : "Delete"}
                type="DELETE"
                onClick={handleDeleteSelectedFinancialLedgerOrders}
                isDisabled={isSaving}
                isLoading={isSaving}
              />
            </div>
          </div>
        </div>
      )}
      {isOrderFinancialRebuildModalOpen && selectedId && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>Rebuild financial data for this order?</h3>
            <p className={styles.modalText}>
              This recreates ledger entries for the selected order if they are
              missing.
            </p>
            <div className={styles.modalActions}>
              <Button
                title="Cancel"
                type="OUTLINED"
                onClick={() => setIsOrderFinancialRebuildModalOpen(false)}
                isDisabled={isSaving}
              />
              <Button
                title={isSaving ? "Rebuilding..." : "Rebuild"}
                type="BLACK"
                onClick={() => handleRebuildSingleOrderFinancialLedger(selectedId)}
                isDisabled={isSaving}
                isLoading={isSaving}
              />
            </div>
          </div>
        </div>
      )}
      {isRegenerateAddressModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>
              {regenerateTarget === "ALL"
                ? "Regenerate all public locations?"
                : "Regenerate public location?"}
            </h3>
            <p className={styles.modalText}>
              This operation cannot be reverted. Public coordinates will be
              recalculated with a random distance range.
            </p>
            <div className={styles.modalInlineFields}>
              <label className={styles.field}>
                <span>Min distance meters</span>
                <input
                  type="number"
                  value={minDistanceMeters}
                  onChange={(e) => {
                    setMinDistanceMeters(e.target.value);
                    setRegenerateDistanceError("");
                  }}
                />
              </label>
              <label className={styles.field}>
                <span>Max distance meters</span>
                <input
                  type="number"
                  value={maxDistanceMeters}
                  onChange={(e) => {
                    setMaxDistanceMeters(e.target.value);
                    setRegenerateDistanceError("");
                  }}
                />
              </label>
            </div>
            {regenerateDistanceError && (
              <div className={styles.modalError}>{regenerateDistanceError}</div>
            )}
            <div className={styles.modalActions}>
              <Button
                title="Cancel"
                type="OUTLINED"
                onClick={closeRegenerateModal}
                isDisabled={isRegeneratingAddress || isRegeneratingAllAddresses}
              />
              <Button
                title={
                  regenerateTarget === "ALL"
                    ? isRegeneratingAllAddresses
                      ? "Regenerating..."
                      : "Regenerate all"
                    : isRegeneratingAddress
                      ? "Regenerating..."
                      : "Regenerate"
                }
                type="BLACK"
                onClick={
                  regenerateTarget === "ALL"
                    ? handleRegenerateAllAddressesPublicLocation
                    : handleRegenerateSelectedAddressPublicLocation
                }
                isDisabled={isRegeneratingAddress || isRegeneratingAllAddresses}
                isLoading={isRegeneratingAddress || isRegeneratingAllAddresses}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAccess;
