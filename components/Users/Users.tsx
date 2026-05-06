/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { useCallback, useMemo } from "react";
import SearchBar from "../SearchBar/SearchBar";
import DropDownButton from "../DropDownButton/DropDownButton";
import Cards from "./Cards/Cards";
import UsersList from "./UsersList/UsersList";
import userListStyles from "./UsersList/usersList.module.css";
import styles from "./users.module.css";
import { cn, isRowNavExcluded } from "@/lib/utils";
import axios from "axios";
import {
  createTestUser,
  deleteTestUser,
  getAllUsers,
  getBannedUsers,
  getClientById,
  getConnectedUsers,
  getNotFinishedOnboardingUsers,
  getOnboardingStats,
  getPendingProviderSpecialSkillsCount,
  getProviderLocationPermissionsStats,
  getProviderById,
  getRequestedCompensationInfoAtCount,
  getTestUsers,
  getUsersAppVersionStats,
  setUserBanStatus,
  syncTestUsersAcrossApis,
  updateTestUser,
} from "@/pages/api/fetch";
import { useRouter } from "next/router";
import paginateStyles from "../../styles/paginate.module.css";
import ReactPaginate from "react-paginate";
import { User, UserDetails } from "@/types/Client";
import {
  GetOnboardingNotFinishedUsersResponse,
  OnboardingNotFinishedUser,
  OnboardingMode,
  OnboardingStep,
} from "@/types/OnboardingUser";
import defaultUserImg from "@/assets/images/default-avatar.png";
import { nunito } from "@/helpers/fonts";
import Button from "../Button/Button";
import UserEmailIdLine from "./UserEmailIdLine/UserEmailIdLine";
import { LayoutGrid, List } from "lucide-react";
import { toast } from "react-toastify";
import { useAdminSocket } from "@/components/AdminSocket/AdminSocketProvider";

const onboardingStepLabels: Record<OnboardingStep, string> = {
  USER_VERIFIED: "User verified",
  PROFILE_PICTURE: "Profile picture",
  ADDRESS: "Address",
  CHILD: "Child",
  ABOUT_ME: "About me",
  CRIMINAL_RECORD: "Criminal record",
  BANK_ONBOARDING: "Bank onboarding",
  KYC: "KYC",
};

const PAGE_SIZE_OPTIONS = [
  { title: "20 / page", value: "20" },
  { title: "50 / page", value: "50" },
  { title: "100 / page", value: "100" },
] as const;

const USERS_COMPACT_STORAGE_KEY = "users:isCompactView";
const USERS_PAGE_SIZE_STORAGE_KEY = "users:itemsPerPage";

const formatRemainingSteps = (steps: OnboardingStep[]) =>
  steps
    .map((step) => onboardingStepLabels[step] ?? step)
    .join(", ");

const roleParenFromEnum = (role: string) =>
  String(role).toUpperCase() === "PROVIDER" ? "(Provider)" : "(Client)";

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

type UsersViewMode =
  | "CLIENTS"
  | "PROVIDERS"
  | "ACTIVE_USERS"
  | "ONBOARDING_CLIENTS"
  | "ONBOARDING_PROVIDERS"
  | "BANNED_USERS"
  | "TEST_USERS";
type ProviderVideoFilter = "ALL" | "WITH_VIDEO" | "WITHOUT_VIDEO";
type ProviderSpecialSkillsFilter = "ALL" | "PENDING_SPECIAL_SKILLS";
type ClientCompensationFilter = "ALL" | "REQUESTED" | "WITHOUT";
type AppVersionPlatform = "IOS" | "ANDROID" | null;
type LoginMode = "GOOGLE" | "EMAIL" | "APPLE" | "UNKNOWN";
type LoginModeTotals = Partial<Record<LoginMode, number>>;
type AppVersionStatGroup = {
  platform: AppVersionPlatform;
  items: { appVersion: string; count: number }[];
  withoutAppVersionCount: number;
  totalUsers: number;
  totalUsersByLoginMode: LoginModeTotals;
};
type AppVersionStatsState = {
  items: AppVersionStatGroup[];
  totalUsers: number;
  totalUsersByLoginMode: LoginModeTotals;
};
type PermissionStatusStats = Record<string, number>;
type LocationPermissionsStatsState = {
  foregroundPermissionStatus: PermissionStatusStats;
  backgroundPermissionStatus: PermissionStatusStats;
};
type RawAppVersionStatItem = {
  platform: unknown;
  items: unknown[];
  withoutAppVersionCount: number;
  totalUsers: number;
  totalUsersByLoginMode?: unknown;
};
type RawNestedAppVersionItem = { appVersion: string; count: number };
const normalizePlatform = (platform: unknown): AppVersionPlatform =>
  platform === "IOS" || platform === "ANDROID" ? platform : null;

const LOGIN_MODE_ORDER: LoginMode[] = [
  "GOOGLE",
  "EMAIL",
  "APPLE",
  "UNKNOWN",
];

const normalizeLoginModeTotals = (value: unknown): LoginModeTotals => {
  if (!value || typeof value !== "object") return {};
  const record = value as Record<string, unknown>;
  return LOGIN_MODE_ORDER.reduce<LoginModeTotals>((acc, mode) => {
    const nextValue = Number(record[mode] ?? 0);
    if (Number.isFinite(nextValue) && nextValue > 0) {
      acc[mode] = nextValue;
    }
    return acc;
  }, {});
};

const normalizeAppVersionItems = (
  items: unknown[],
): AppVersionStatGroup["items"] => {
  const versionCounts = new Map<string, number>();

  items
    .filter(
      (nestedItem: unknown): nestedItem is RawNestedAppVersionItem =>
        typeof nestedItem === "object" &&
        nestedItem !== null &&
        typeof (nestedItem as { appVersion?: unknown }).appVersion === "string",
    )
    .forEach((nestedItem: RawNestedAppVersionItem) => {
      versionCounts.set(
        nestedItem.appVersion,
        (versionCounts.get(nestedItem.appVersion) ?? 0) +
          (Number(nestedItem.count ?? 0) || 0),
      );
    });

  return Array.from(versionCounts.entries()).map(([appVersion, count]) => ({
    appVersion,
    count,
  }));
};

const LOCATION_PERMISSION_STATUS_ORDER = [
  "granted",
  "denied",
  "undetermined",
  "UNKNOWN",
];

const normalizePermissionStatusStats = (
  value: unknown,
): PermissionStatusStats => {
  if (!value || typeof value !== "object") return {};
  return Object.entries(
    value as Record<string, unknown>,
  ).reduce<PermissionStatusStats>((acc, [key, rawCount]) => {
    const count = Number(rawCount ?? 0);
    if (Number.isFinite(count)) {
      acc[key] = count;
    }
    return acc;
  }, {});
};

const getOrderedPermissionStatusEntries = (stats: PermissionStatusStats) => {
  const knownEntries = LOCATION_PERMISSION_STATUS_ORDER.map((status) => [
    status,
    stats[status] ?? 0,
  ] as const);
  const extraEntries = Object.entries(stats)
    .filter(([status]) => !LOCATION_PERMISSION_STATUS_ORDER.includes(status))
    .sort(([a], [b]) => a.localeCompare(b));

  return [...knownEntries, ...extraEntries];
};

const formatPermissionStatusLabel = (status: string) =>
  status === "UNKNOWN"
    ? "Unknown"
    : status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

type UsersViewOption = {
  title: string;
  value: UsersViewMode;
  attentionNumber?: number;
};

const VIEW_QUERY_TO_MODE: Record<string, UsersViewMode> = {
  "active-users": "ACTIVE_USERS",
  "onboarding-clients": "ONBOARDING_CLIENTS",
  "onboarding-providers": "ONBOARDING_PROVIDERS",
  banned: "BANNED_USERS",
  "test-users": "TEST_USERS",
};

const MODE_TO_VIEW_QUERY: Partial<Record<UsersViewMode, string>> = {
  ACTIVE_USERS: "active-users",
  ONBOARDING_CLIENTS: "onboarding-clients",
  ONBOARDING_PROVIDERS: "onboarding-providers",
  BANNED_USERS: "banned",
  TEST_USERS: "test-users",
};
type BannedUser = {
  id: string;
  userId: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
  bannedAt?: string;
  bannedUntil?: string | null;
  reason?: string;
  banReason?: string;
  userBanReason?: string;
  bannedReason?: string;
  userFirstName?: string;
  userLastName?: string;
  userEmail?: string;
  userImgUrl?: string;
  userIsBanned?: boolean;
  currentMode?: "CLIENT" | "PROVIDER";
};

type TestUser = {
  email: string;
  createdAt?: string;
  updatedAt?: string;
};

type ConnectedUser = {
  userId: string;
  fullName: string;
  imgUrl?: string;
  connectedAt: string;
  currentRole: "CLIENT" | "PROVIDER";
};

const hasRoleForMode = (
  detail: UserDetails,
  mode: "CLIENT" | "PROVIDER",
) => {
  const roles = Array.isArray(detail.user?.roles)
    ? detail.user.roles.map((role) => String(role).toUpperCase())
    : [];

  return roles.includes(mode);
};

const Users = () => {
  const [selectedViewOption, setSelectedViewOption] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [onboardingUsers, setOnboardingUsers] = useState<
    OnboardingNotFinishedUser[]
  >([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [testUsers, setTestUsers] = useState<TestUser[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const router = useRouter();
  const { lastEvent } = useAdminSocket();

  const [itemOffset, setItemOffset] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [pageCount, setPageCount] = useState(0);
  const [clientOnboardingCount, setClientOnboardingCount] = useState(0);
  const [providerOnboardingCount, setProviderOnboardingCount] = useState(0);
  const [onboardingStats, setOnboardingStats] = useState({
    totalUsers: 0,
    finishedClientOnboarding: 0,
    finishedProviderOnboarding: 0,
  });
  const [appVersionStats, setAppVersionStats] = useState<AppVersionStatsState>({
    items: [],
    totalUsers: 0,
    totalUsersByLoginMode: {},
  });
  const [locationPermissionsStats, setLocationPermissionsStats] =
    useState<LocationPermissionsStatsState>({
      foregroundPermissionStatus: {},
      backgroundPermissionStatus: {},
    });
  const [pendingProviderSpecialSkillsCount, setPendingProviderSpecialSkillsCount] =
    useState(0);
  const [
    requestedCompensationInfoAtCount,
    setRequestedCompensationInfoAtCount,
  ] = useState(0);
  const [isBanConfirmModalOpen, setIsBanConfirmModalOpen] = useState(false);
  const [banTargetUser, setBanTargetUser] = useState<BannedUser | null>(null);
  const [isUpdatingBan, setIsUpdatingBan] = useState(false);
  const [isDeleteTestUserModalOpen, setIsDeleteTestUserModalOpen] =
    useState(false);
  const [testUserToDelete, setTestUserToDelete] = useState<TestUser | null>(null);
  const [isSavingTestUser, setIsSavingTestUser] = useState(false);
  const [isSyncingTestUsers, setIsSyncingTestUsers] = useState(false);
  const [isLoadingConnectedUsers, setIsLoadingConnectedUsers] = useState(false);
  const [isStatsSidebarLoading, setIsStatsSidebarLoading] = useState(true);
  const [modeReady, setModeReady] = useState(false);
  const [providerVideoFilter, setProviderVideoFilter] =
    useState<ProviderVideoFilter>("ALL");
  const [providerSpecialSkillsFilter, setProviderSpecialSkillsFilter] =
    useState<ProviderSpecialSkillsFilter>("ALL");
  const [clientCompensationFilter, setClientCompensationFilter] =
    useState<ClientCompensationFilter>("ALL");
  const [newTestUserEmail, setNewTestUserEmail] = useState("");
  const [testUserEditValues, setTestUserEditValues] = useState<
    Record<string, string>
  >({});
  const [isCompactView, setIsCompactView] = useState(false);
  const [connectedUsersFilter, setConnectedUsersFilter] = useState<
    "CLIENT" | "PROVIDER"
  >("CLIENT");
  const [connectedUsersCounts, setConnectedUsersCounts] = useState({
    CLIENT: 0,
    PROVIDER: 0,
    total: 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedCompactView = window.localStorage.getItem(
      USERS_COMPACT_STORAGE_KEY,
    );
    if (savedCompactView === "true" || savedCompactView === "false") {
      setIsCompactView(savedCompactView === "true");
    }

    const savedPageSize = Number(
      window.localStorage.getItem(USERS_PAGE_SIZE_STORAGE_KEY),
    );
    if (PAGE_SIZE_OPTIONS.some((option) => Number(option.value) === savedPageSize)) {
      setItemsPerPage(savedPageSize);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      USERS_COMPACT_STORAGE_KEY,
      String(isCompactView),
    );
  }, [isCompactView]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      USERS_PAGE_SIZE_STORAGE_KEY,
      String(itemsPerPage),
    );
  }, [itemsPerPage]);

  const providerVideoFilterOptions: {
    title: string;
    value: ProviderVideoFilter;
  }[] = [
    { title: "All providers", value: "ALL" },
    { title: "With video", value: "WITH_VIDEO" },
    { title: "Without video", value: "WITHOUT_VIDEO" },
  ];

  const viewOptions: UsersViewOption[] = useMemo(
    () => [
      { title: "Clients", value: "CLIENTS" },
      {
        title: "Providers",
        value: "PROVIDERS",
        attentionNumber: pendingProviderSpecialSkillsCount,
      },
      {
        title: "Active users",
        value: "ACTIVE_USERS",
      },
      {
        title: "Clients with not finished onboarding",
        value: "ONBOARDING_CLIENTS",
        attentionNumber: clientOnboardingCount,
      },
      {
        title: "Providers with not finished onboarding",
        value: "ONBOARDING_PROVIDERS",
        attentionNumber: providerOnboardingCount,
      },
      {
        title: "Banned users",
        value: "BANNED_USERS",
      },
      {
        title: "Test users",
        value: "TEST_USERS",
      },
    ],
    [
      pendingProviderSpecialSkillsCount,
      clientOnboardingCount,
      providerOnboardingCount,
    ],
  );
  const currentView = viewOptions[selectedViewOption]?.value as UsersViewMode;
  const isOnboardingSelected =
    currentView === "ONBOARDING_CLIENTS" ||
    currentView === "ONBOARDING_PROVIDERS";
  const isActiveUsersSelected = currentView === "ACTIVE_USERS";
  const isBannedUsersSelected = currentView === "BANNED_USERS";
  const isTestUsersSelected = currentView === "TEST_USERS";
  const isSelectedClients = currentView === "CLIENTS";
  const isProvidersSelected = currentView === "PROVIDERS";

  const updateUsersUrlQuery = useCallback(
    (
      params: {
        viewOptionIndex?: number;
        page?: number;
      },
      method: "push" | "replace" = "push",
    ) => {
      if (!router.isReady) return;

      const nextQuery = { ...router.query };
      const nextPage = params.page;
      if (typeof nextPage === "number" && nextPage > 0) {
        nextQuery.page = String(nextPage);
      }

      if (typeof params.viewOptionIndex === "number") {
        const nextView = viewOptions[params.viewOptionIndex]?.value;
        if (!nextView) return;

        delete nextQuery.mode;
        delete nextQuery.view;

        if (nextView === "CLIENTS") {
          nextQuery.mode = "clients";
          delete nextQuery.hasRequestedCompensationInfoAt;
          delete nextQuery.requestedCompensationInfoAt;
        } else if (nextView === "PROVIDERS") {
          nextQuery.mode = "providers";
          delete nextQuery.hasRequestedCompensationInfoAt;
          delete nextQuery.requestedCompensationInfoAt;
        } else {
          const viewQuery = MODE_TO_VIEW_QUERY[nextView];
          if (viewQuery) {
            nextQuery.view = viewQuery;
          }
          delete nextQuery.hasRequestedCompensationInfoAt;
          delete nextQuery.requestedCompensationInfoAt;
        }
      }

      router[method](
        {
          pathname: router.pathname,
          query: nextQuery,
        },
        undefined,
        { shallow: true, scroll: false },
      );
    },
    [router, viewOptions],
  );

  // Sync selected mode with URL query
  useEffect(() => {
    if (!router.isReady) return;
    const view = typeof router.query.view === "string" ? router.query.view : "";
    const viewMode = VIEW_QUERY_TO_MODE[view];
    if (viewMode) {
      const index = viewOptions.findIndex((option) => option.value === viewMode);
      setSelectedViewOption(index >= 0 ? index : 0);
      setModeReady(true);
      return;
    }

    const mode =
      typeof router.query.mode === "string" ? router.query.mode : undefined;
    if (mode === "providers") {
      setSelectedViewOption(1);
      setClientCompensationFilter("ALL");
    } else {
      // default to clients
      setSelectedViewOption(0);
      const hasRequested =
        router.query.hasRequestedCompensationInfoAt === "true" ||
        router.query.requestedCompensationInfoAt === "true";
      const withoutRequested =
        router.query.requestedCompensationInfoAt === "false";
      setClientCompensationFilter(
        hasRequested ? "REQUESTED" : withoutRequested ? "WITHOUT" : "ALL",
      );
    }
    setModeReady(true);
  }, [
    router.isReady,
    router.query.hasRequestedCompensationInfoAt,
    router.query.mode,
    router.query.requestedCompensationInfoAt,
    router.query.view,
    viewOptions,
  ]);

  useEffect(() => {
    if (!router.isReady) return;
    const pageFromQuery =
      typeof router.query.page === "string" ? Number(router.query.page) : 1;
    const safePage =
      Number.isFinite(pageFromQuery) && pageFromQuery > 0
        ? Math.floor(pageFromQuery)
        : 1;
    const nextOffset = (safePage - 1) * itemsPerPage;
    setItemOffset((prev) => (prev === nextOffset ? prev : nextOffset));
  }, [itemsPerPage, router.isReady, router.query.page]);

  const normalizeTestUsersPayload = (
    payload: unknown,
  ): {
    items: TestUser[];
    total: number;
    pageSize: number;
  } => {
    if (typeof payload !== "object" || payload === null) {
      return { items: [], total: 0, pageSize: 20 };
    }

    const record = payload as Record<string, unknown>;
    const collection =
      typeof record.testUsers === "object" && record.testUsers !== null
        ? (record.testUsers as Record<string, unknown>)
        : record;

    const rawItems = Array.isArray(collection.items) ? collection.items : [];
    const items = rawItems
      .filter(
        (item): item is TestUser =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as TestUser).email === "string",
      )
      .map((item) => ({
        email: item.email,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));

    return {
      items,
      total: Number(collection.total ?? items.length ?? 0),
      pageSize: Number(collection.pageSize ?? 20),
    };
  };

  const fetchOnboardingNotFinishedCount = useCallback(async () => {
    setIsStatsSidebarLoading(true);
    try {
      const [
        clientResponse,
        providerResponse,
        statsResponse,
        appVersionStatsResponse,
        requestedCompensationResponse,
        locationPermissionsStatsResponse,
      ] = await Promise.allSettled([
        getNotFinishedOnboardingUsers({ mode: "CLIENT", pageSize: 1 }),
        getNotFinishedOnboardingUsers({ mode: "PROVIDER", pageSize: 1 }),
        getOnboardingStats(),
        getUsersAppVersionStats(),
        getRequestedCompensationInfoAtCount(),
        getProviderLocationPermissionsStats(),
      ]);

      if (clientResponse.status === "fulfilled") {
        const clientPayload = clientResponse.value.data as
          | GetOnboardingNotFinishedUsersResponse
          | { result?: GetOnboardingNotFinishedUsersResponse };
        const clientResult =
          (
            clientPayload as { result?: GetOnboardingNotFinishedUsersResponse }
          ).result ?? (clientPayload as GetOnboardingNotFinishedUsersResponse);
        setClientOnboardingCount(Number(clientResult.total ?? 0));
      }

      if (providerResponse.status === "fulfilled") {
        const providerPayload = providerResponse.value.data as
          | GetOnboardingNotFinishedUsersResponse
          | { result?: GetOnboardingNotFinishedUsersResponse };
        const providerResult =
          (
            providerPayload as { result?: GetOnboardingNotFinishedUsersResponse }
          ).result ?? (providerPayload as GetOnboardingNotFinishedUsersResponse);
        setProviderOnboardingCount(Number(providerResult.total ?? 0));
      }

      if (statsResponse.status === "fulfilled") {
        const statsResult =
          statsResponse.value.data?.result ?? statsResponse.value.data ?? {};
        setOnboardingStats({
          totalUsers: Number(statsResult.totalUsers ?? 0) || 0,
          finishedClientOnboarding:
            Number(statsResult.finishedClientOnboarding ?? 0) || 0,
          finishedProviderOnboarding:
            Number(statsResult.finishedProviderOnboarding ?? 0) || 0,
        });
      }

      if (appVersionStatsResponse.status === "fulfilled") {
        const appVersionStatsResult =
          appVersionStatsResponse.value.data?.result ??
          appVersionStatsResponse.value.data ??
          {};
        const rawAppVersionItems = Array.isArray(
          (appVersionStatsResult as { items?: unknown[] }).items,
        )
          ? ((appVersionStatsResult as { items: unknown[] }).items as unknown[])
          : [];
        const appVersionItems: AppVersionStatGroup[] = rawAppVersionItems
          .filter(
            (item: unknown): item is RawAppVersionStatItem =>
              typeof item === "object" &&
              item !== null &&
              Array.isArray((item as { items?: unknown[] }).items),
          )
          .map((item: RawAppVersionStatItem) => ({
            platform: normalizePlatform(item.platform),
            items: normalizeAppVersionItems(item.items),
            withoutAppVersionCount: Number(item.withoutAppVersionCount ?? 0) || 0,
            totalUsers: Number(item.totalUsers ?? 0) || 0,
            totalUsersByLoginMode: normalizeLoginModeTotals(
              item.totalUsersByLoginMode,
            ),
          }));
        const appVersionTotalUsers = Number(
          (appVersionStatsResult as { totalUsers?: unknown }).totalUsers ?? 0,
        );
        const totalUsersByLoginMode = normalizeLoginModeTotals(
          (appVersionStatsResult as { totalUsersByLoginMode?: unknown })
            .totalUsersByLoginMode,
        );
        setAppVersionStats({
          items: appVersionItems,
          totalUsers: Number.isFinite(appVersionTotalUsers) ? appVersionTotalUsers : 0,
          totalUsersByLoginMode,
        });
        setOnboardingStats((prev) => ({
          ...prev,
          totalUsers: Number.isFinite(appVersionTotalUsers)
            ? appVersionTotalUsers
            : prev.totalUsers,
        }));
      } else {
        setAppVersionStats({
          items: [],
          totalUsers: 0,
          totalUsersByLoginMode: {},
        });
      }

      if (requestedCompensationResponse.status === "fulfilled") {
        const total =
          requestedCompensationResponse.value.data?.total ??
          requestedCompensationResponse.value.data?.result?.total ??
          0;
        setRequestedCompensationInfoAtCount(Number(total) || 0);
      }

      if (locationPermissionsStatsResponse.status === "fulfilled") {
        const locationPermissionsStatsResult =
          locationPermissionsStatsResponse.value.data?.result ??
          locationPermissionsStatsResponse.value.data ??
          {};
        setLocationPermissionsStats({
          foregroundPermissionStatus: normalizePermissionStatusStats(
            (
              locationPermissionsStatsResult as {
                foregroundPermissionStatus?: unknown;
              }
            )
              .foregroundPermissionStatus,
          ),
          backgroundPermissionStatus: normalizePermissionStatusStats(
            (
              locationPermissionsStatsResult as {
                backgroundPermissionStatus?: unknown;
              }
            )
              .backgroundPermissionStatus,
          ),
        });
      } else {
        setLocationPermissionsStats({
          foregroundPermissionStatus: {},
          backgroundPermissionStatus: {},
        });
      }
    } catch (err) {
      console.log(err);
    } finally {
      setIsStatsSidebarLoading(false);
    }
  }, []);

  const formatAppVersionPlatformLabel = (platform: AppVersionPlatform) => {
    if (platform === "IOS") return "iOS";
    if (platform === "ANDROID") return "Android";
    return "Unknown";
  };

  const fetchPendingProviderSpecialSkills = useCallback(async () => {
    try {
      const response = await getPendingProviderSpecialSkillsCount();
      const total = response.data?.total ?? response.data?.result?.total ?? 0;
      setPendingProviderSpecialSkillsCount(Number(total) || 0);
    } catch (err) {
      console.log(err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setUsers([]);
      const searchParams = new URLSearchParams({
        startIndex: String(itemOffset),
        pageSize: String(itemsPerPage),
        search: searchText,
      });

      if (isSelectedClients) {
        if (clientCompensationFilter === "REQUESTED") {
          searchParams.set("hasRequestedCompensationInfoAt", "true");
        } else if (clientCompensationFilter === "WITHOUT") {
          searchParams.set("requestedCompensationInfoAt", "false");
        }
      } else {
        if (providerVideoFilter === "WITH_VIDEO") {
          searchParams.set("hasVideo", "true");
        } else if (providerVideoFilter === "WITHOUT_VIDEO") {
          searchParams.set("hasVideo", "false");
        }

        if (providerSpecialSkillsFilter === "PENDING_SPECIAL_SKILLS") {
          searchParams.set("hasPendingSpecialSkills", "true");
        }
      }

      const url = isSelectedClients
        ? `admin/users?type=client&${searchParams.toString()}`
        : `admin/users?type=provider&${searchParams.toString()}`;
      const response = await getAllUsers(url);
      const baseUsers = Array.isArray(response.data?.users?.items)
        ? (response.data.users.items as User[])
        : [];
      const nextMode = isSelectedClients ? "CLIENT" : "PROVIDER";
      const filteredUsers = (
        await Promise.all(
          baseUsers.map(async (baseUser) => {
            try {
              const detailResponse = isSelectedClients
                ? await getClientById(baseUser.userId)
                : await getProviderById(baseUser.userId);
              const detail = isSelectedClients
                ? (detailResponse.data?.clientDetails as UserDetails)
                : (detailResponse.data?.providerDetails as UserDetails);

              return hasRoleForMode(detail, nextMode) ? baseUser : null;
            } catch (error) {
              console.log(error);
              return null;
            }
          }),
        )
      ).filter((user): user is User => user !== null);

      setUsers(filteredUsers);
      setPageCount(
        Math.ceil(response.data.users.total / itemsPerPage),
      );
    } catch (err) {
      console.log(err);
      if (axios.isAxiosError(err)) {
        if (err.status === 401) {
          router.push("/");
        }
      }
    }
  }, [
    clientCompensationFilter,
    isSelectedClients,
    itemOffset,
    itemsPerPage,
    providerSpecialSkillsFilter,
    providerVideoFilter,
    router,
    searchText,
  ]);

  const fetchOnboardingUsers = useCallback(async () => {
    try {
      setOnboardingUsers([]);
      const mode: OnboardingMode | undefined =
        currentView === "ONBOARDING_CLIENTS"
          ? "CLIENT"
          : currentView === "ONBOARDING_PROVIDERS"
            ? "PROVIDER"
            : undefined;
      const response = await getNotFinishedOnboardingUsers({
        startIndex: itemOffset,
        pageSize: itemsPerPage,
        search: searchText || undefined,
        mode,
      });
      const payload = response.data as
        | GetOnboardingNotFinishedUsersResponse
        | { result?: GetOnboardingNotFinishedUsersResponse };
      const result =
        (payload as { result?: GetOnboardingNotFinishedUsersResponse }).result ??
        (payload as GetOnboardingNotFinishedUsersResponse);
      const items = Array.isArray(result.items)
        ? result.items.filter(
            (user) =>
              String(user.currentMode ?? "").toUpperCase() === String(mode ?? "").toUpperCase(),
          )
        : [];
      const pageSize = Number(result.pageSize ?? itemsPerPage);
      const total = Number(result.total ?? 0);
      setOnboardingUsers(items);
      setItemsPerPage(pageSize > 0 ? pageSize : 20);
      setPageCount(Math.ceil(total / (pageSize > 0 ? pageSize : 20)));
    } catch (err) {
      console.log(err);
      if (axios.isAxiosError(err)) {
        if (err.status === 401) {
          router.push("/");
        }
      }
    }
  }, [currentView, itemOffset, itemsPerPage, router, searchText]);

  const fetchConnectedUsersList = useCallback(async () => {
    try {
      setIsLoadingConnectedUsers(true);
      const allItems: ConnectedUser[] = [];
      let startIndex = 0;
      let total = Number.MAX_SAFE_INTEGER;
      let nextCounts = {
        CLIENT: 0,
        PROVIDER: 0,
        total: 0,
      };

      while (startIndex < total) {
        const response = await getConnectedUsers({
          sort: "latest",
          startIndex,
          pageSize: 100,
        });

        const payload = response.data ?? {};
        const items = Array.isArray(payload.items)
          ? (payload.items as ConnectedUser[])
          : [];
        const pageSize = Number(payload.pageSize ?? items.length ?? 0);
        total = Number(payload.total ?? items.length);
        nextCounts = {
          CLIENT: Number(payload.counts?.CLIENT ?? 0) || 0,
          PROVIDER: Number(payload.counts?.PROVIDER ?? 0) || 0,
          total: Number(payload.counts?.total ?? total) || 0,
        };

        allItems.push(...items);

        if (items.length === 0 || pageSize <= 0) break;
        startIndex += pageSize;
      }

      setConnectedUsers(allItems);
      setConnectedUsersCounts(nextCounts);
    } catch (err) {
      console.log(err);
      if (axios.isAxiosError(err)) {
        if (err.status === 401) {
          router.push("/");
        }
      }
    } finally {
      setIsLoadingConnectedUsers(false);
    }
  }, [router]);

  const fetchBannedUsers = useCallback(async () => {
    try {
      const response = await getBannedUsers({
        startIndex: itemOffset,
        pageSize: itemsPerPage || 20,
        search: searchText || undefined,
      });
      const result = response.data?.result ?? response.data ?? {};
      const items = Array.isArray(result.items) ? (result.items as BannedUser[]) : [];
      const nextPageSize = Number(result.pageSize ?? itemsPerPage ?? 20);
      const nextTotal = Number(result.total ?? 0);
      setBannedUsers(items);
      setItemsPerPage(nextPageSize > 0 ? nextPageSize : 20);
      setPageCount(Math.ceil(nextTotal / (nextPageSize > 0 ? nextPageSize : 20)));
    } catch (err) {
      console.log(err);
      if (axios.isAxiosError(err)) {
        if (err.status === 401) {
          router.push("/");
        }
      }
    }
  }, [itemOffset, itemsPerPage, router, searchText]);

  const fetchTestUsers = useCallback(async () => {
    try {
      const response = await getTestUsers({
        search: searchText || undefined,
        startIndex: itemOffset,
        pageSize: itemsPerPage || 20,
      });
      const result = normalizeTestUsersPayload(response.data);
      const items = result.items;
      setTestUsers(items);
      setTestUserEditValues(
        items.reduce<Record<string, string>>((acc, item) => {
          acc[item.email] = item.email;
          return acc;
        }, {}),
      );
      setItemsPerPage(result.pageSize > 0 ? result.pageSize : 20);
      setPageCount(
        Math.ceil(result.total / (result.pageSize > 0 ? result.pageSize : 20)),
      );
    } catch (err) {
      console.log(err);
      if (axios.isAxiosError(err)) {
        if (err.status === 401) {
          router.push("/");
        }
      }
    }
  }, [itemOffset, itemsPerPage, router, searchText]);

  const handlePageClick = (event: { selected: number }) => {
    updateUsersUrlQuery({ page: event.selected + 1 }, "push");
  };

  useEffect(() => {
    fetchOnboardingNotFinishedCount();
    fetchPendingProviderSpecialSkills();
  }, [fetchOnboardingNotFinishedCount, fetchPendingProviderSpecialSkills]);

  useEffect(() => {
    const handlePendingProviderSpecialSkillsRefresh = () => {
      fetchPendingProviderSpecialSkills();
    };

    window.addEventListener(
      "pending-provider-special-skills-count-refresh",
      handlePendingProviderSpecialSkillsRefresh,
    );

    return () => {
      window.removeEventListener(
        "pending-provider-special-skills-count-refresh",
        handlePendingProviderSpecialSkillsRefresh,
      );
    };
  }, [fetchPendingProviderSpecialSkills]);

  useEffect(() => {
    const handleRequestedCompensationInfoRefresh = async (event: Event) => {
      const delta = (event as CustomEvent<{ delta?: number }>).detail?.delta;
      if (typeof delta === "number") {
        setRequestedCompensationInfoAtCount((prev) =>
          Math.max(prev + delta, 0),
        );
        if (clientCompensationFilter === "REQUESTED") {
          fetchUsers();
        }
        return;
      }

      try {
        const response = await getRequestedCompensationInfoAtCount();
        const total = response.data?.total ?? response.data?.result?.total ?? 0;
        setRequestedCompensationInfoAtCount(Number(total) || 0);
        if (clientCompensationFilter === "REQUESTED") {
          fetchUsers();
        }
      } catch (err) {
        console.log(err);
      }
    };

    window.addEventListener(
      "requested-compensation-info-count-refresh",
      handleRequestedCompensationInfoRefresh,
    );

    return () => {
      window.removeEventListener(
        "requested-compensation-info-count-refresh",
        handleRequestedCompensationInfoRefresh,
      );
    };
  }, [clientCompensationFilter, fetchUsers]);

  useEffect(() => {
    if (!router.isReady || !modeReady) return;
    if (isActiveUsersSelected) {
      fetchConnectedUsersList();
      return;
    }
    if (isOnboardingSelected) {
      fetchOnboardingUsers();
      return;
    }
    if (isBannedUsersSelected) {
      fetchBannedUsers();
      return;
    }
    if (isTestUsersSelected) {
      fetchTestUsers();
      return;
    }
    fetchUsers();
  }, [
    router.isReady,
    modeReady,
    currentView,
    isActiveUsersSelected,
    isOnboardingSelected,
    isBannedUsersSelected,
    isTestUsersSelected,
    itemOffset,
    itemsPerPage,
    fetchConnectedUsersList,
    fetchBannedUsers,
    fetchOnboardingUsers,
    fetchTestUsers,
    fetchUsers,
  ]);

  useEffect(() => {
    if (!isActiveUsersSelected) return;

    const filteredCount = connectedUsers.filter(
      (user) => user.currentRole === connectedUsersFilter,
    ).length;

    setPageCount(Math.ceil(filteredCount / itemsPerPage) || 0);
  }, [connectedUsers, connectedUsersFilter, isActiveUsersSelected, itemsPerPage]);

  useEffect(() => {
    if (!isActiveUsersSelected) return;
    if (
      connectedUsersFilter === "CLIENT" &&
      connectedUsersCounts.CLIENT === 0 &&
      connectedUsersCounts.PROVIDER > 0
    ) {
      setConnectedUsersFilter("PROVIDER");
      setItemOffset(0);
      return;
    }
    if (
      connectedUsersFilter === "PROVIDER" &&
      connectedUsersCounts.PROVIDER === 0 &&
      connectedUsersCounts.CLIENT > 0
    ) {
      setConnectedUsersFilter("CLIENT");
      setItemOffset(0);
    }
  }, [connectedUsersCounts, connectedUsersFilter, isActiveUsersSelected]);

  useEffect(() => {
    if (lastEvent?.type !== "CLIENT_REQUESTED_COMPENSATION_INFO") return;
    setRequestedCompensationInfoAtCount((prev) => prev + 1);
    if (clientCompensationFilter === "REQUESTED") {
      fetchUsers();
    }
  }, [clientCompensationFilter, fetchUsers, lastEvent]);

  const openOnboardingUserProfile = (user: OnboardingNotFinishedUser) => {
    const selectedText = window.getSelection?.()?.toString().trim() ?? "";
    if (selectedText.length > 0) return;
    const normalizedMode = String(user.currentMode ?? "").toUpperCase();
    router.push(
      normalizedMode === "PROVIDER"
        ? `/provider/${user.userId}`
        : `/client/${user.userId}`,
    );
  };

  const openBanConfirmModal = (user: BannedUser) => {
    setBanTargetUser(user);
    setIsBanConfirmModalOpen(true);
  };

  const closeBanConfirmModal = () => {
    if (isUpdatingBan) return;
    setIsBanConfirmModalOpen(false);
    setBanTargetUser(null);
  };

  const confirmUnban = async () => {
    if (!banTargetUser?.userId || isUpdatingBan) return;
    try {
      setIsUpdatingBan(true);
      await setUserBanStatus(banTargetUser.userId, false);
      setIsBanConfirmModalOpen(false);
      setBanTargetUser(null);
      await Promise.all([fetchBannedUsers(), fetchUsers()]);
      await fetchOnboardingNotFinishedCount();
    } catch (err) {
      console.log(err);
    } finally {
      setIsUpdatingBan(false);
    }
  };

  const openDeleteTestUserModal = (user: TestUser) => {
    setTestUserToDelete(user);
    setIsDeleteTestUserModalOpen(true);
  };

  const closeDeleteTestUserModal = () => {
    if (isSavingTestUser) return;
    setIsDeleteTestUserModalOpen(false);
    setTestUserToDelete(null);
  };

  const handleAddTestUser = async () => {
    const email = newTestUserEmail.trim();
    if (!email || isSavingTestUser) return;

    try {
      setIsSavingTestUser(true);
      const result = await createTestUser(email);
      setNewTestUserEmail("");
      await fetchTestUsers();
      if (result.warnings.length > 0) {
        toast.warning(result.warnings.join(" | "));
      }
    } catch (err) {
      console.log(err);
    } finally {
      setIsSavingTestUser(false);
    }
  };

  const handleUpdateTestUser = async (user: TestUser) => {
    const nextEmail = (testUserEditValues[user.email] ?? "").trim();
    if (!nextEmail || nextEmail === user.email || isSavingTestUser) return;

    try {
      setIsSavingTestUser(true);
      const result = await updateTestUser(nextEmail, user.email);
      await fetchTestUsers();
      if (result.warnings.length > 0) {
        toast.warning(result.warnings.join(" | "));
      }
    } catch (err) {
      console.log(err);
    } finally {
      setIsSavingTestUser(false);
    }
  };

  const confirmDeleteTestUser = async () => {
    if (!testUserToDelete?.email || isSavingTestUser) return;

    try {
      setIsSavingTestUser(true);
      const result = await deleteTestUser(testUserToDelete.email);
      setIsDeleteTestUserModalOpen(false);
      setTestUserToDelete(null);
      await fetchTestUsers();
      if (result.warnings.length > 0) {
        toast.warning(result.warnings.join(" | "));
      }
    } catch (err) {
      console.log(err);
    } finally {
      setIsSavingTestUser(false);
    }
  };

  const handleSyncTestUsers = async () => {
    if (isSyncingTestUsers) return;
    try {
      setIsSyncingTestUsers(true);
      const result = await syncTestUsersAcrossApis();
      await fetchTestUsers();
      if (result.warnings.length > 0) {
        toast.warning(result.warnings.join(" | "));
      } else {
        toast.success("Test users synced");
      }
    } catch (err) {
      console.log(err);
      toast.error("Failed to sync test users");
    } finally {
      setIsSyncingTestUsers(false);
    }
  };

  const filteredConnectedUsers = connectedUsers.filter(
    (user) => user.currentRole === connectedUsersFilter,
  );
  const paginatedConnectedUsers = filteredConnectedUsers.slice(
    itemOffset,
    itemOffset + itemsPerPage,
  );

  return (
    <div className={styles.main}>
      <div className={styles.pageLayout}>
        <div className={styles.mainColumn}>
      <div className={styles.heading}>
        <div className={styles.pageHeroRow}>
          <h1 className={styles.pageHeroTitle}>Users</h1>
          {!isActiveUsersSelected && (
            <div className={styles.pageHeroSearch}>
              <SearchBar
                className={styles.pageHeroSearchBar}
                searchText={searchText}
                setSearchText={setSearchText}
                placeholder="Type username, ID  or email"
                onButtonClick={() => {
                  setItemOffset(0);
                  if (isOnboardingSelected) {
                    fetchOnboardingUsers();
                  } else if (isBannedUsersSelected) {
                    fetchBannedUsers();
                  } else if (isTestUsersSelected) {
                    fetchTestUsers();
                  } else {
                    fetchUsers();
                  }
                }}
              />
            </div>
          )}
        </div>
        <div className={styles.headingTopRow}>
          <div className={styles.headingLeftSide}>
            <DropDownButton
              options={viewOptions.map((option) => ({
                title: option.title,
                value: option.value,
                attentionNumber: option.attentionNumber,
              }))}
              selectedOption={selectedViewOption}
              setSelectedOption={(nextSelectedOption) => {
                const nextIndex = Number(nextSelectedOption);
                if (!Number.isFinite(nextIndex)) return;
                setSelectedViewOption(nextIndex);
                updateUsersUrlQuery(
                  { viewOptionIndex: nextIndex, page: 1 },
                  "push",
                );
              }}
              onClickOption={() => {
                setItemOffset(0);
              }}
            />
            <Button
              title="Filter and export"
              type="OUTLINED"
              onClick={() => router.push("/users/filter-export")}
            />
            {requestedCompensationInfoAtCount > 0 && (
              <Button
                title="Compensation requests"
                type="OUTLINED"
                isSelected={
                  isSelectedClients && clientCompensationFilter === "REQUESTED"
                }
                attentionNumber={requestedCompensationInfoAtCount}
                onClick={() => {
                  setSelectedViewOption(0);
                  setClientCompensationFilter("REQUESTED");
                  setItemOffset(0);
                  router.push(
                    {
                      pathname: router.pathname,
                      query: {
                        mode: "clients",
                        hasRequestedCompensationInfoAt: "true",
                        page: "1",
                      },
                    },
                    undefined,
                    { shallow: true, scroll: false },
                  );
                }}
              />
            )}
            {isProvidersSelected && (
              <>
                <DropDownButton
                  options={providerVideoFilterOptions}
                  selectedOption={providerVideoFilterOptions.findIndex(
                    (option) => option.value === providerVideoFilter,
                  )}
                  setSelectedOption={(nextSelectedOption) => {
                    const option =
                      providerVideoFilterOptions[nextSelectedOption as number];
                    if (!option) return;
                    setProviderVideoFilter(option.value);
                  }}
                  onClickOption={() => {
                    setItemOffset(0);
                  }}
                />
                <Button
                  title="Pending special skills"
                  type="OUTLINED"
                  isSelected={
                    providerSpecialSkillsFilter === "PENDING_SPECIAL_SKILLS"
                  }
                  attentionNumber={pendingProviderSpecialSkillsCount}
                  onClick={() => {
                    setItemOffset(0);
                    setProviderSpecialSkillsFilter((prev) =>
                      prev === "PENDING_SPECIAL_SKILLS"
                        ? "ALL"
                        : "PENDING_SPECIAL_SKILLS",
                    );
                  }}
                />
              </>
            )}
            {isActiveUsersSelected && (
              <>
                <Button
                  title={`Clients (${connectedUsersCounts.CLIENT})`}
                  type="OUTLINED"
                  isSelected={connectedUsersFilter === "CLIENT"}
                  onClick={() => {
                    setItemOffset(0);
                    setConnectedUsersFilter("CLIENT");
                  }}
                />
                <Button
                  title={`Providers (${connectedUsersCounts.PROVIDER})`}
                  type="OUTLINED"
                  isSelected={connectedUsersFilter === "PROVIDER"}
                  onClick={() => {
                    setItemOffset(0);
                    setConnectedUsersFilter("PROVIDER");
                  }}
                />
              </>
            )}
          </div>
          {!isOnboardingSelected &&
            !isActiveUsersSelected &&
            !isBannedUsersSelected &&
            !isTestUsersSelected && (
              <div className={styles.headingRightTools}>
                <div className="flex shrink-0 items-center gap-3">
                  <DropDownButton
                    options={PAGE_SIZE_OPTIONS.map((option) => ({
                      title: option.title,
                      value: option.value,
                    }))}
                    selectedOption={Math.max(
                      0,
                      PAGE_SIZE_OPTIONS.findIndex(
                        (option) => Number(option.value) === itemsPerPage,
                      ),
                    )}
                    setSelectedOption={(selectedOption) => {
                      const option =
                        PAGE_SIZE_OPTIONS[selectedOption as number];
                      if (!option) return;
                      setItemOffset(0);
                      setItemsPerPage(Number(option.value));
                      updateUsersUrlQuery({ page: 1 }, "replace");
                    }}
                  />
                  <div
                    className="relative box-border flex h-10 w-[78px] min-w-[78px] max-w-[78px] shrink-0 items-stretch gap-0.5 rounded-xl border border-input bg-black/5 p-[3px]"
                    role="group"
                    aria-label="Layout"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "pointer-events-none absolute inset-y-[3px] left-[3px] z-0 w-[calc(50%-4px)] rounded-xl border border-border/60 bg-background shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none",
                        !isCompactView &&
                          "translate-x-[calc(100%+2px)]",
                      )}
                    />
                    <button
                      type="button"
                      className={cn(
                        "relative z-10 flex w-[35px] shrink-0 flex-none items-center justify-center self-stretch rounded-xl text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none active:scale-[0.96] motion-reduce:active:scale-100",
                        isCompactView && "text-foreground",
                      )}
                      onClick={() => setIsCompactView(true)}
                      aria-pressed={isCompactView}
                      aria-label="List view"
                    >
                      <List size={18} strokeWidth={2} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className={cn(
                        "relative z-10 flex w-[35px] shrink-0 flex-none items-center justify-center self-stretch rounded-xl text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none active:scale-[0.96] motion-reduce:active:scale-100",
                        !isCompactView && "text-foreground",
                      )}
                      onClick={() => setIsCompactView(false)}
                      aria-pressed={!isCompactView}
                      aria-label="Grid view"
                    >
                      <LayoutGrid size={18} strokeWidth={2} aria-hidden />
                    </button>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>

      {isOnboardingSelected ? (
        onboardingUsers.length > 0 ? (
          <div className={userListStyles.main}>
            {onboardingUsers.map((user) => {
              const displayName =
                `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
                "Unknown user";
              return (
                <div
                  key={user.id}
                  className={cn(
                    userListStyles.row,
                    styles.listRowWithBelowMeta,
                  )}
                  tabIndex={0}
                  onClick={(e) => {
                    if (isRowNavExcluded(e.target)) return;
                    openOnboardingUserProfile(user);
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" && e.key !== " ") return;
                    if (isRowNavExcluded(e.target)) return;
                    if (e.target !== e.currentTarget) return;
                    e.preventDefault();
                    openOnboardingUserProfile(user);
                  }}
                  aria-label={`View ${displayName} profile`}
                >
                  <div className={userListStyles.left}>
                    <img
                      className={userListStyles.avatar}
                      src={user.imgUrl || defaultUserImg.src}
                      alt=""
                    />
                    <div className={styles.listRowDetailColumn}>
                      <div className={userListStyles.info}>
                        <div className={userListStyles.name}>
                          {displayName}{" "}
                          {roleParenFromEnum(user.currentMode)}
                        </div>
                        <UserEmailIdLine
                          email={user.email}
                          userId={user.userId}
                        />
                      </div>
                      <div className={styles.onboardingRight}>
                        <div className={styles.remainingStepsLine}>
                          <span className={styles.remainingLabel}>
                            Remaining:
                          </span>{" "}
                          <span className={styles.remainingList}>
                            {formatRemainingSteps(user.remainingSteps ?? [])}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            No users with unfinished onboarding
          </div>
        )
      ) : isBannedUsersSelected ? (
        bannedUsers.length > 0 ? (
          <div className={userListStyles.main}>
            {bannedUsers.map((user) => (
              <div key={user.id} className={userListStyles.row}>
                <div className={userListStyles.left}>
                  <img
                    className={userListStyles.avatar}
                    src={user.userImgUrl || defaultUserImg.src}
                    alt=""
                  />
                  <div className={userListStyles.info}>
                    <div className={userListStyles.name}>
                      {`${user.userFirstName ?? ""} ${user.userLastName ?? ""}`.trim() ||
                        "Unknown user"}
                    </div>
                    <UserEmailIdLine
                      email={user.userEmail || user.email}
                      userId={user.userId}
                    />
                    <div className={userListStyles.meta}>
                      {`Reason: ${
                        user.banReason ??
                        user.userBanReason ??
                        user.bannedReason ??
                        user.reason ??
                        "—"
                      }`}
                    </div>
                    <div className={userListStyles.meta}>
                      {`Banned at: ${formatDateTime(
                        user.bannedAt ?? user.updatedAt ?? user.createdAt,
                      )}`}
                    </div>
                    {user.bannedUntil && (
                      <div className={userListStyles.meta}>
                        {`Banned until: ${formatDateTime(user.bannedUntil)}`}
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.bannedSwitchWrap}>
                  <button
                    type="button"
                    className={styles.suspendSwitch}
                    onClick={() => openBanConfirmModal(user)}
                  >
                    <span
                      className={`${styles.suspendSwitchUi} ${styles.suspendSwitchUiActive}`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>No banned users</div>
        )
      ) : isActiveUsersSelected ? (
        isLoadingConnectedUsers ? (
          <div className={styles.emptyState}>Loading active users...</div>
        ) : paginatedConnectedUsers.length > 0 ? (
          <div className={userListStyles.main}>
            {paginatedConnectedUsers.map((user) => {
              const displayName = user.fullName || "Unknown user";
              return (
                <div
                  key={`${user.currentRole}-${user.userId}`}
                  className={cn(
                    userListStyles.row,
                    styles.listRowWithBelowMeta,
                  )}
                  tabIndex={0}
                  onClick={(e) => {
                    if (isRowNavExcluded(e.target)) return;
                    const selectedText =
                      window.getSelection?.()?.toString().trim() ?? "";
                    if (selectedText.length > 0) return;
                    router.push(
                      user.currentRole === "PROVIDER"
                        ? `/provider/${user.userId}`
                        : `/client/${user.userId}`,
                    );
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" && e.key !== " ") return;
                    if (isRowNavExcluded(e.target)) return;
                    if (e.target !== e.currentTarget) return;
                    e.preventDefault();
                    const selectedText =
                      window.getSelection?.()?.toString().trim() ?? "";
                    if (selectedText.length > 0) return;
                    router.push(
                      user.currentRole === "PROVIDER"
                        ? `/provider/${user.userId}`
                        : `/client/${user.userId}`,
                    );
                  }}
                  aria-label={`View ${displayName} profile`}
                >
                  <div className={userListStyles.left}>
                    <img
                      className={userListStyles.avatar}
                      src={user.imgUrl || defaultUserImg.src}
                      alt=""
                    />
                    <div className={styles.listRowDetailColumn}>
                      <div className={userListStyles.info}>
                        <div className={userListStyles.name}>
                          {displayName}{" "}
                          {roleParenFromEnum(user.currentRole)}
                        </div>
                        <UserEmailIdLine userId={user.userId} />
                      </div>
                      <div className={styles.onboardingRight}>
                        <div className={styles.stepsTitle}>Connected at</div>
                        <div className={styles.stepsText}>
                          {formatDateTime(user.connectedAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>No active users</div>
        )
      ) : isTestUsersSelected ? (
        <div className={styles.testUsersSection}>
          <div className={styles.testUsersAddRow}>
            <input
              type="email"
              className={styles.testUsersInput}
              placeholder="Add test user email"
              value={newTestUserEmail}
              onChange={(e) => setNewTestUserEmail(e.target.value)}
              disabled={isSavingTestUser}
            />
            <Button
              title={isSavingTestUser ? "Saving..." : "Add"}
              type="BLACK"
              onClick={handleAddTestUser}
              isDisabled={isSavingTestUser || newTestUserEmail.trim().length === 0}
            />
            <Button
              title={isSyncingTestUsers ? "Syncing..." : "Sync"}
              type="OUTLINED"
              onClick={handleSyncTestUsers}
              isDisabled={isSyncingTestUsers || isSavingTestUser}
            />
          </div>
          {testUsers.length > 0 ? (
            <div className={userListStyles.main}>
              {testUsers.map((user) => {
                const editedEmail =
                  testUserEditValues[user.email] ?? user.email;
                return (
                  <div key={user.email} className={styles.testUserRow}>
                    <div className={styles.testUserInfo}>
                      <input
                        type="email"
                        className={styles.testUsersInput}
                        value={editedEmail}
                        onChange={(e) =>
                          setTestUserEditValues((prev) => ({
                            ...prev,
                            [user.email]: e.target.value,
                          }))
                        }
                        disabled={isSavingTestUser}
                      />
                      <div className={styles.testUserMeta}>
                        {`Created: ${formatDateTime(user.createdAt)}`}
                      </div>
                      <div className={styles.testUserMeta}>
                        {`Updated: ${formatDateTime(user.updatedAt)}`}
                      </div>
                    </div>
                    <div className={styles.testUserActions}>
                      <Button
                        title="Save"
                        type="OUTLINED"
                        onClick={() => handleUpdateTestUser(user)}
                        isDisabled={
                          isSavingTestUser ||
                          editedEmail.trim().length === 0 ||
                          editedEmail.trim() === user.email
                        }
                      />
                      <Button
                        title="Delete"
                        type="DELETE"
                        onClick={() => openDeleteTestUserModal(user)}
                        isDisabled={isSavingTestUser}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>No test users</div>
          )}
        </div>
      ) : (
        isCompactView ? (
          <UsersList
            users={users}
            mode={isSelectedClients ? "client" : "provider"}
          />
        ) : (
          <Cards users={users} mode={isSelectedClients ? "client" : "provider"} />
        )
      )}

      <div className={styles.paginationDock}>
      <ReactPaginate
        breakLabel="..."
        nextLabel=""
        onPageChange={handlePageClick}
        pageRangeDisplayed={5}
        pageCount={pageCount}
        forcePage={
          pageCount === 0 || itemsPerPage <= 0
            ? 0
            : Math.min(
                pageCount - 1,
                Math.floor(itemOffset / itemsPerPage),
              )
        }
        previousLabel=""
        renderOnZeroPageCount={null}
        containerClassName={`${paginateStyles.paginateWrapper} ${styles.paginationInDock}`}
        pageClassName={paginateStyles.pageBtn}
        pageLinkClassName={paginateStyles.pageLink}
        activeClassName={paginateStyles.activePage}
        nextClassName={paginateStyles.nextPageBtn}
        nextLinkClassName={paginateStyles.nextLink}
        previousClassName={paginateStyles.prevPageBtn}
        previousLinkClassName={paginateStyles.prevLink}
        breakClassName={paginateStyles.break}
      />
      </div>

        </div>
        <aside
          className={styles.statsAside}
          aria-label="User statistics"
          aria-busy={isStatsSidebarLoading}
        >
          {isStatsSidebarLoading ? (
            <div
              className={styles.statsAsideLoading}
              role="status"
              aria-live="polite"
            >
              <p className={styles.statsAsideShimmerTitle}>
                Information incoming...
              </p>
            </div>
          ) : (
            <div
              className={`${styles.statsBlock} ${styles.statsBlockAside} ${styles.statsAsideContent}`}
            >
              <div className={styles.statsSummaryGrid}>
                <div className={styles.statTile}>
                  <span className={styles.statTileLabel}>Total users</span>
                  <span className={styles.statTileValue}>
                    {appVersionStats.totalUsers || onboardingStats.totalUsers}
                  </span>
                </div>
                <div className={styles.statTile}>
                  <span className={styles.statTileLabel}>Client done</span>
                  <span className={styles.statTileValue}>
                    {onboardingStats.finishedClientOnboarding}
                  </span>
                </div>
                <div className={styles.statTile}>
                  <span className={styles.statTileLabel}>Provider done</span>
                  <span className={styles.statTileValue}>
                    {onboardingStats.finishedProviderOnboarding}
                  </span>
                </div>
              </div>

              <section className={styles.appVersionSection}>
                <h3 className={styles.appVersionHeading}>App version</h3>
                {appVersionStats.items.map((platformGroup, idx) => (
                  <div
                    key={`${String(platformGroup.platform)}-${idx}`}
                    className={styles.platformBlock}
                  >
                    <div className={styles.platformName}>
                      {formatAppVersionPlatformLabel(platformGroup.platform)}
                    </div>
                    {platformGroup.items.map((v) => (
                      <div
                        key={v.appVersion}
                        className={styles.versionRow}
                      >
                        <span className={styles.versionName}>
                          {v.appVersion}
                        </span>
                        <span className={styles.versionCount}>{v.count}</span>
                      </div>
                    ))}
                    {platformGroup.items.length === 0 && (
                      <div className={styles.versionRow}>
                        <span className={styles.versionName}>No versions</span>
                        <span className={styles.versionCount}>—</span>
                      </div>
                    )}
                    <div className={styles.platformMeta}>
                      <div className={styles.platformMetaRow}>
                        <span className={styles.platformMetaLabel}>
                          No app version
                        </span>
                        <span className={styles.platformMetaValue}>
                          {platformGroup.withoutAppVersionCount}
                        </span>
                      </div>
                      <div className={styles.platformMetaRow}>
                        <span className={styles.platformMetaLabel}>Total</span>
                        <span className={styles.platformMetaValue}>
                          {platformGroup.totalUsers}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </section>

              <section
                className={`${styles.appVersionSection} ${styles.loginModeSection}`}
              >
                <h3 className={styles.appVersionHeading}>Login mode</h3>
                <div className={styles.platformBlock}>
                  {LOGIN_MODE_ORDER.map((mode) => (
                    <div key={mode} className={styles.versionRow}>
                      <span className={styles.versionName}>{mode}</span>
                      <span className={styles.versionCount}>
                        {appVersionStats.totalUsersByLoginMode[mode] ?? 0}
                      </span>
                    </div>
                  ))}
                  <div className={styles.platformMeta}>
                    <div className={styles.platformMetaRow}>
                      <span className={styles.platformMetaLabel}>Total</span>
                      <span className={styles.platformMetaValue}>
                        {appVersionStats.totalUsers || onboardingStats.totalUsers}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <section className={`${styles.appVersionSection} ${styles.loginModeSection}`}>
                <h3 className={styles.appVersionHeading}>
                  Provider location permissions
                </h3>
                <div className={styles.platformBlock}>
                  <div className={styles.platformName}>Foreground</div>
                  {getOrderedPermissionStatusEntries(
                    locationPermissionsStats.foregroundPermissionStatus,
                  ).map(([status, count]) => (
                    <div
                      key={`foreground-${status}`}
                      className={styles.versionRow}
                    >
                      <span className={styles.versionName}>
                        {formatPermissionStatusLabel(status)}
                      </span>
                      <span className={styles.versionCount}>{count}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.platformBlock}>
                  <div className={styles.platformName}>Background</div>
                  {getOrderedPermissionStatusEntries(
                    locationPermissionsStats.backgroundPermissionStatus,
                  ).map(([status, count]) => (
                    <div
                      key={`background-${status}`}
                      className={styles.versionRow}
                    >
                      <span className={styles.versionName}>
                        {formatPermissionStatusLabel(status)}
                      </span>
                      <span className={styles.versionCount}>{count}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </aside>
      </div>

      {isBanConfirmModalOpen && (
        <div className={styles.confirmationBackdrop}>
          <div className={`${styles.confirmationModal} ${nunito.className}`}>
            <h2 className={styles.confirmationTitle}>Unban user?</h2>
            <p className={styles.confirmationBody}>
              This user will be removed from the banned users list.
            </p>
            <div className={styles.confirmationActions}>
              <Button
                title="Cancel"
                type="OUTLINED"
                onClick={closeBanConfirmModal}
                isDisabled={isUpdatingBan}
              />
              <Button
                title={isUpdatingBan ? "Saving..." : "Confirm"}
                type="BLACK"
                onClick={confirmUnban}
                isDisabled={isUpdatingBan}
              />
            </div>
          </div>
        </div>
      )}
      {isDeleteTestUserModalOpen && (
        <div className={styles.confirmationBackdrop}>
          <div className={`${styles.confirmationModal} ${nunito.className}`}>
            <h2 className={styles.confirmationTitle}>Delete test user?</h2>
            <p className={styles.confirmationBody}>
              {`This will remove ${
                testUserToDelete?.email ?? "this email"
              } from test users.`}
            </p>
            <div className={styles.confirmationActions}>
              <Button
                title="Cancel"
                type="OUTLINED"
                onClick={closeDeleteTestUserModal}
                isDisabled={isSavingTestUser}
              />
              <Button
                title={isSavingTestUser ? "Deleting..." : "Delete"}
                type="DELETE"
                onClick={confirmDeleteTestUser}
                isDisabled={isSavingTestUser}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
