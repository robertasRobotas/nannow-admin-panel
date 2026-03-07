import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Button from "@/components/Button/Button";
import styles from "./superAccess.module.css";
import defaultUserImg from "../../assets/images/default-avatar.png";
import {
  AdminRole,
  createAdminUser,
  SuperAccessEntity,
  getCurrentAdminRolesFromJwt,
  getSuperAccessItem,
  getSuperAccessList,
  updateSuperAccessItem,
} from "@/pages/api/fetch";
import { options as orderStatusOptions } from "@/data/orderStatusOptions";
import { useRouter } from "next/router";

type SuperMenuItem = {
  title: string;
  key: SuperAccessEntity;
};

const MENU_ITEMS: SuperMenuItem[] = [
  { title: "Admins", key: "admins" },
  { title: "Users", key: "users" },
  { title: "Clients", key: "clients" },
  { title: "Children", key: "children" },
  { title: "Providers", key: "providers" },
  { title: "Addresses", key: "addresses" },
  { title: "Orders", key: "orders" },
];

const ORDER_STATUSES = orderStatusOptions
  .map((item) => item.value)
  .filter((value) => value);

const extractArray = (value: unknown): Record<string, unknown>[] => {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is Record<string, unknown> =>
        !!item && typeof item === "object",
    );
  }
  return [];
};

const parseListResponse = (data: unknown) => {
  const fallback = { items: [] as Record<string, unknown>[], total: 0, pageSize: 20 };
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

const parseItemResponse = (data: unknown): Record<string, unknown> | null => {
  if (!data || typeof data !== "object") return null;
  const payload = data as Record<string, unknown>;
  const result = (payload.result as Record<string, unknown> | undefined) ?? payload;
  const candidates = [
    result.user,
    result.client,
    result.provider,
    result.order,
    result.address,
    result.item,
    result.data,
    result,
  ];
  for (const candidate of candidates) {
    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      return candidate as Record<string, unknown>;
    }
  }
  return null;
};

const pickId = (item: Record<string, unknown>): string =>
  String(
    item.id ??
      item._id ??
      item.userId ??
      item.clientId ??
      item.providerId ??
      item.orderId ??
      "",
  );

const pickLinkedUserId = (item: Record<string, unknown>): string =>
  String(item.userId ?? item.id ?? item._id ?? "");

const isIsoDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);

const toDateTimeLocal = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toIsoFromLocal = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString();
};

const prettyTitle = (raw: string) =>
  raw
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (char) => char.toUpperCase());

const formatAddressLabel = (address: Record<string, unknown>, fallbackId: string) => {
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

const getUserDisplayName = (user: Record<string, unknown> | null) => {
  if (!user) return "";
  const firstName = String(user.firstName ?? "").trim();
  const lastName = String(user.lastName ?? "").trim();
  return `${firstName} ${lastName}`.trim();
};

const getUserTargetEntity = (
  user: Record<string, unknown> | null,
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

const formatChildLabel = (child: Record<string, unknown>, fallbackId: string) => {
  const name = String(child.name ?? "").trim() || `Child ${fallbackId}`;
  const genderRaw = String(child.gender ?? "").trim();
  const gender = genderRaw
    ? genderRaw.charAt(0).toUpperCase() + genderRaw.slice(1).toLowerCase()
    : "—";
  const age = calculateAgeYears(child.birthDate);
  return `${name}, ${gender}, ${age == null ? "—" : `${age} y`}`;
};

const formatChildSummary = (child: Record<string, unknown>, fallbackId: string) => {
  const name = String(child.name ?? "").trim() || `Child ${fallbackId}`;
  const genderRaw = String(child.gender ?? "").trim();
  const gender = genderRaw
    ? genderRaw.charAt(0).toUpperCase() + genderRaw.slice(1).toLowerCase()
    : "—";
  const age = calculateAgeYears(child.birthDate);
  return `${name}, ${gender}, ${age == null ? "—" : `${age} y`}`;
};

const SuperAccess = () => {
  const router = useRouter();
  const [entity, setEntity] = useState<SuperAccessEntity>("users");
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedItem, setSelectedItem] = useState<Record<string, unknown> | null>(
    null,
  );
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [loadingItem, setLoadingItem] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [adminPassword, setAdminPassword] = useState("");
  const [removeAdminPassword, setRemoveAdminPassword] = useState(false);
  const [newAdminFirstName, setNewAdminFirstName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminRoles, setNewAdminRoles] = useState<AdminRole[]>(["ADMIN"]);
  const [linkedUsersById, setLinkedUsersById] = useState<
    Record<string, Record<string, unknown>>
  >({});
  const [addressesById, setAddressesById] = useState<
    Record<string, Record<string, unknown>>
  >({});
  const [childrenById, setChildrenById] = useState<
    Record<string, Record<string, unknown>>
  >({});
  const [clientsById, setClientsById] = useState<
    Record<string, Record<string, unknown>>
  >({});

  useEffect(() => {
    const roles = getCurrentAdminRolesFromJwt();
    const hasSuperAdmin = roles.includes("SUPER_ADMIN");
    setIsSuperAdmin(hasSuperAdmin);
    if (!hasSuperAdmin) {
      router.replace("/users");
    }
  }, [router]);

  const fetchList = useCallback(async () => {
    try {
      setLoadingList(true);
      setError("");
      const response = await getSuperAccessList(entity, { startIndex, pageSize });
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
  }, [entity, pageSize, router, selectedId, startIndex]);

  const fetchItem = useCallback(async () => {
    if (!selectedId) return;
    if (entity === "admins") {
      const listItem = list.find((item) => pickId(item) === selectedId) ?? null;
      setSelectedItem(listItem);
      setDraft(listItem ?? {});
      setAdminPassword("");
      setRemoveAdminPassword(false);
      return;
    }
    try {
      setLoadingItem(true);
      setError("");
      const response = await getSuperAccessItem(entity, selectedId);
      const parsedItem = parseItemResponse(response.data);
      setSelectedItem(parsedItem);
      setDraft(parsedItem ?? {});
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
        for (const [userId, user] of entries) {
          if (user) {
            next[userId] = user;
          }
        }
        return next;
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
        for (const [userId, user] of entries) {
          if (user) next[userId] = user;
        }
        return next;
      });
    };

    fetchAddressUsers();

    return () => {
      isMounted = false;
    };
  }, [entity, linkedUsersById, list]);

  useEffect(() => {
    if (entity !== "clients" && entity !== "providers") return;
    if (!selectedItem) return;

    const rawAddressIds =
      selectedItem.addressesIds ??
      selectedItem.addressIds ??
      selectedItem.addresses ??
      [];
    const defaultAddressId =
      typeof selectedItem.defaultAddressId === "string"
        ? selectedItem.defaultAddressId
        : "";
    if (!Array.isArray(rawAddressIds)) return;

    const missingIds = rawAddressIds
      .filter((id): id is string => typeof id === "string" && id.length > 0)
      .concat(defaultAddressId ? [defaultAddressId] : [])
      .filter((id, index, arr) => arr.indexOf(id) === index)
      .filter((id) => !addressesById[id]);
    if (missingIds.length === 0) return;

    let isMounted = true;
    const fetchAddresses = async () => {
      const entries = await Promise.all(
        missingIds.map(async (addressId) => {
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
        for (const [addressId, address] of entries) {
          if (address) next[addressId] = address;
        }
        return next;
      });
    };

    fetchAddresses();

    return () => {
      isMounted = false;
    };
  }, [addressesById, entity, selectedItem]);

  useEffect(() => {
    if (entity !== "clients") return;
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
        for (const [childId, child] of entries) {
          if (child) next[childId] = child;
        }
        return next;
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
        for (const [clientId, client] of entries) {
          if (client) next[clientId] = client;
        }
        return next;
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
        for (const [userId, user] of entries) {
          if (user) next[userId] = user;
        }
        return next;
      });
    };
    fetchUsers();
    return () => {
      isMounted = false;
    };
  }, [clientsById, entity, linkedUsersById]);

  useEffect(() => {
    if (!selectedId) return;
    fetchItem();
  }, [fetchItem, selectedId]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.floor(startIndex / pageSize) + 1;

  const fields = useMemo(
    () =>
      Object.entries(draft).filter(([key]) => !["id", "_id"].includes(key)),
    [draft],
  );

  const handleFieldChange = (key: string, value: unknown) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const saveChanges = async () => {
    if (!selectedId || isSaving) return;
    try {
      setIsSaving(true);
      setError("");
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
                  role === "ADMIN" || role === "SUPER_ADMIN",
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
        await updateSuperAccessItem(entity, selectedId, draft);
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
                setLinkedUsersById({});
                setChildrenById({});
                setClientsById({});
                setStartIndex(0);
              }}
            >
              {menuItem.title}
            </button>
          ))}
        </aside>

        <section className={styles.listPane}>
          <div className={styles.listHeader}>
            <h2>{prettyTitle(entity)}</h2>
            <span>
              {total} total, page {currentPage}/{totalPages}
            </span>
          </div>
          <div className={styles.itemsGrid}>
            {list.map((item) => {
              const id = pickId(item);
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
                  :
                fullName ||
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
              return (
                <button
                  key={id || title}
                  type="button"
                  className={`${styles.itemCard} ${
                    selectedId === id ? styles.itemCardActive : ""
                  }`}
                  onClick={() => setSelectedId(id)}
                >
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
                </button>
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
              onClick={() => setStartIndex((prev) => Math.max(0, prev - pageSize))}
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
        </section>

        <section className={styles.detailPane}>
          <div className={styles.detailHeader}>
            <h2>Detail</h2>
            <Button
              title={isSaving ? "Saving..." : "Save"}
              type="BLACK"
              onClick={saveChanges}
              isDisabled={!selectedId || loadingItem || isSaving}
              isLoading={isSaving}
            />
          </div>

          {!selectedId && <div className={styles.empty}>Select an item.</div>}
          {selectedId && loadingItem && <div className={styles.empty}>Loading...</div>}

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
                {["ADMIN", "SUPER_ADMIN"].map((role) => (
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
                  return (
                    <label key={key} htmlFor={fieldId} className={styles.field}>
                      <span>{prettyTitle(key)}</span>
                      <select
                        id={fieldId}
                        value={String(value)}
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                      >
                        {ORDER_STATUSES.map((statusValue) => (
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
                        {["ADMIN", "SUPER_ADMIN"].map((role) => (
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
                  return (
                    <label key={key} htmlFor={fieldId} className={styles.field}>
                      <span>{prettyTitle(key)}</span>
                      <input
                        id={fieldId}
                        type="number"
                        value={String(value)}
                        onChange={(e) => handleFieldChange(key, Number(e.target.value))}
                      />
                    </label>
                  );
                }

                if (typeof value === "string" && isIsoDate(value)) {
                  return (
                    <label key={key} htmlFor={fieldId} className={styles.field}>
                      <span>{prettyTitle(key)}</span>
                      <input
                        id={fieldId}
                        type="datetime-local"
                        value={toDateTimeLocal(value)}
                        onChange={(e) =>
                          handleFieldChange(key, toIsoFromLocal(e.target.value))
                        }
                      />
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
        </section>
      </div>
    </div>
  );
};

export default SuperAccess;
