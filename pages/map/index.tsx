import { useCallback, useEffect, useMemo, useState } from "react";
import Template from "@/components/Template/Template";
import OsmMap from "@/components/Tracking/OsmMap";
import {
  getAllUsers,
  getClientById,
  getOrderById,
  getOrders,
  getProviderById,
} from "@/pages/api/fetch";
import { TrackingPin } from "@/types/Tracking";
import { User, UserDetails } from "@/types/Client";
import { OrderType } from "@/types/Order";
import { useAdminSocket } from "@/components/AdminSocket/AdminSocketProvider";

const PAGE_SIZE = 100;
const DETAIL_CONCURRENCY = 8;
const ORDER_PAGE_SIZE = 50;
const ORDER_DETAIL_CONCURRENCY = 6;

const readItems = (payload: unknown): User[] => {
  const root = payload as {
    users?: { items?: unknown[] };
    result?: { users?: { items?: unknown[] }; items?: unknown[] };
    items?: unknown[];
  };
  const items =
    root?.users?.items ?? root?.result?.users?.items ?? root?.result?.items ?? root?.items;
  return Array.isArray(items) ? (items as User[]) : [];
};

const readTotal = (payload: unknown): number => {
  const root = payload as {
    users?: { total?: unknown };
    result?: { users?: { total?: unknown }; total?: unknown };
    total?: unknown;
  };
  const total = root?.users?.total ?? root?.result?.users?.total ?? root?.result?.total ?? root?.total;
  const parsed = Number(total ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const readDetail = (payload: unknown, type: "client" | "provider"): UserDetails | null => {
  const root = payload as {
    clientDetails?: unknown;
    providerDetails?: unknown;
    result?: { clientDetails?: unknown; providerDetails?: unknown };
  };
  const detail =
    type === "client"
      ? (root.clientDetails ?? root.result?.clientDetails)
      : (root.providerDetails ?? root.result?.providerDetails);
  if (!detail || typeof detail !== "object") return null;
  return detail as UserDetails;
};

type UserListItemWithMap = User & {
  firstName?: string;
  lastName?: string;
  imgUrl?: string;
  defaultAddress?: {
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
  };
};

const toPinFromUserList = (
  kind: "CLIENT" | "PROVIDER",
  user: UserListItemWithMap,
): TrackingPin | null => {
  const address = user.defaultAddress;
  if (!address) return null;
  const latitude = Number(address.latitude);
  const longitude = Number(address.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const userId = user.userId || user.id;
  const label =
    `${String(user.firstName ?? "").trim()} ${String(user.lastName ?? "").trim()}`.trim() ||
    userId ||
    "Unknown";
  const subtitle = [address.city, address.country].filter(Boolean).join(", ");

  return {
    id: `${kind}:${userId}`,
    kind,
    label,
    subtitle,
    latitude,
    longitude,
    avatarUrl: user.imgUrl || undefined,
    profileUrl: userId ? `/${kind === "CLIENT" ? "client" : "provider"}/${userId}` : undefined,
  };
};

const toPin = (kind: "CLIENT" | "PROVIDER", detail: UserDetails): TrackingPin | null => {
  const address =
    detail.defaultAddress ??
    detail.addresses?.find((item) => item?.isDefault) ??
    detail.addresses?.[0];
  if (!address) return null;
  const latitude = Number(address.latitude);
  const longitude = Number(address.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const userId = detail.user?.id ?? "";
  const firstName = detail.user?.firstName ?? "";
  const lastName = detail.user?.lastName ?? "";
  const label = `${firstName} ${lastName}`.trim() || userId || "Unknown";
  const subtitle = `${address.city}, ${address.country}`;

  return {
    id: `${kind}:${userId}`,
    kind,
    label,
    subtitle,
    latitude,
    longitude,
    avatarUrl: detail.user?.imgUrl || undefined,
    profileUrl: userId ? `/${kind === "CLIENT" ? "client" : "provider"}/${userId}` : undefined,
  };
};

const ACTIVE_ORDER_EXCLUDED_STATUSES = new Set([
  "PROVIDER_MARKED_AS_SERVICE_ENDED",
  "CANCELED_BY_CLIENT",
  "CLIENT_CANCELED",
  "CANCELED_BY_PROVIDER",
  "PROVIDER_CANCELED",
  "CANCELED_BY_ADMIN",
  "CANCELED_NOT_PAID_BY_CLIENT",
  "CLIENT_CANCELED_ORDER_CREATION_PROCESS",
  "CANCELED_NO_OFFERS",
  "CANCELED_NOT_STARTED_IN_TIME",
  "CANCELED_NOT_CONFIRMED_BY_PROVIDER",
  "CANCELED_ANOTHER_PROVIDER_SELECTED",
  "PROVIDER_REJECTED_DIRECT_OFFER",
  "SPLIT_INTO_DAILY",
  "SPLIT_INTO_REPETITIVE",
]);

const isActiveOrder = (order: OrderType) => {
  const status = String(order.status ?? "").toUpperCase();
  if (!status) return false;
  if (status === "ORDER_CREATED" && !order.isDirectOrderToProvider) return false;
  if (ACTIVE_ORDER_EXCLUDED_STATUSES.has(status)) return false;
  if ((order as { isClosedByAdmin?: boolean }).isClosedByAdmin) return false;
  return true;
};

type OrderWithMapData = OrderType & {
  address?: {
    latitude?: unknown;
    longitude?: unknown;
    city?: string;
    country?: string;
  };
  location?: { coordinates?: unknown };
  clientLatitude?: unknown;
  clientLongitude?: unknown;
  orderPrettyId?: string;
};

const extractOrderCoordinates = (
  order: OrderWithMapData,
): { latitude: number; longitude: number } | null => {
  const addressLatitude = Number(order.address?.latitude);
  const addressLongitude = Number(order.address?.longitude);
  if (Number.isFinite(addressLatitude) && Number.isFinite(addressLongitude)) {
    return { latitude: addressLatitude, longitude: addressLongitude };
  }

  const locationCoordinates = order.location?.coordinates;
  if (
    Array.isArray(locationCoordinates) &&
    locationCoordinates.length >= 2 &&
    Number.isFinite(Number(locationCoordinates[0])) &&
    Number.isFinite(Number(locationCoordinates[1]))
  ) {
    return {
      latitude: Number(locationCoordinates[1]),
      longitude: Number(locationCoordinates[0]),
    };
  }

  const clientLatitude = Number(order.clientLatitude);
  const clientLongitude = Number(order.clientLongitude);
  if (Number.isFinite(clientLatitude) && Number.isFinite(clientLongitude)) {
    return { latitude: clientLatitude, longitude: clientLongitude };
  }

  return null;
};

const readOrderDetails = (payload: unknown): OrderType | null => {
  const root = payload as {
    result?: unknown;
    order?: unknown;
  };
  const candidate = root.result ?? root.order ?? payload;
  if (!candidate || typeof candidate !== "object") return null;
  return candidate as OrderType;
};

const toOrderPin = (
  order: OrderWithMapData,
): TrackingPin | null => {
  const coordinates = extractOrderCoordinates(order);
  if (!coordinates) return null;

  const clientName = [order.clientUser?.firstName, order.clientUser?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const label = clientName || `Client ${order.client?.id ?? "Unknown"}`;
  const subtitle = order.address
    ? `${order.address.city ?? ""}${order.address.city && order.address.country ? ", " : ""}${order.address.country ?? ""}`
    : undefined;

  return {
    id: `ORDER:${order.id}`,
    kind: "ORDER",
    label,
    subtitle,
    avatarUrl: order.clientUser?.imgUrl,
    profileUrl: `/orders/${order.id}`,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    orderStatus: String(order.status ?? ""),
    orderStartsAt: order.startsAt,
    orderEndsAt: order.endsAt,
    orderTotalPrice: order.totalPrice,
  };
};


const TrackingPage = () => {
  const [userPins, setUserPins] = useState<TrackingPin[]>([]);
  const [orderPins, setOrderPins] = useState<TrackingPin[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [showClients, setShowClients] = useState(true);
  const [showProviders, setShowProviders] = useState(true);
  const [showOrders, setShowOrders] = useState(true);
  const { lastEvent } = useAdminSocket();

  const upsertPins = useCallback((nextPins: TrackingPin[]) => {
    if (nextPins.length === 0) return;
    setUserPins((prev) => {
      const byId = new Map(prev.map((pin) => [pin.id, pin]));
      nextPins.forEach((pin) => byId.set(pin.id, pin));
      return Array.from(byId.values());
    });
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadByType = async (type: "client" | "provider") => {
      const collected: User[] = [];
      let startIndex = 0;
      let total = PAGE_SIZE;

      while (startIndex < total && !isCancelled) {
        const response = await getAllUsers(
          `admin/users?type=${type}&startIndex=${startIndex}&pageSize=${PAGE_SIZE}`,
        );
        const items = readItems(response.data);
        total = readTotal(response.data);
        collected.push(...items);
        if (!isCancelled) {
          upsertPins(
            items
              .map((item) =>
                toPinFromUserList(type === "client" ? "CLIENT" : "PROVIDER", item as UserListItemWithMap),
              )
              .filter((item): item is TrackingPin => !!item),
          );
        }
        startIndex += PAGE_SIZE;
        if (items.length === 0) break;
      }

      return collected;
    };

    const load = async () => {
      try {
        setIsUsersLoading(true);
        setUserPins([]);
        const [clients, providers] = await Promise.all([
          loadByType("client"),
          loadByType("provider"),
        ]);

        const listedPinIds = new Set([
          ...clients
            .map((user) => toPinFromUserList("CLIENT", user as UserListItemWithMap)?.id)
            .filter((id): id is string => !!id),
          ...providers
            .map((user) => toPinFromUserList("PROVIDER", user as UserListItemWithMap)?.id)
            .filter((id): id is string => !!id),
        ]);

        const hasPinForUser = (kind: "CLIENT" | "PROVIDER", id?: string) =>
          !!id && listedPinIds.has(`${kind}:${id}`);

        const clientsMissing = clients.filter(
          (user) => !hasPinForUser("CLIENT", user.userId || user.id),
        );
        const providersMissing = providers.filter(
          (user) => !hasPinForUser("PROVIDER", user.userId || user.id),
        );

        const fetchDetails = async (
          users: User[],
          type: "client" | "provider",
        ): Promise<UserDetails[]> => {
          const detailList: UserDetails[] = [];
          for (let index = 0; index < users.length; index += DETAIL_CONCURRENCY) {
            const chunk = users.slice(index, index + DETAIL_CONCURRENCY);
            const results = await Promise.all(
              chunk.map(async (user) => {
                try {
                  const id = user.userId || user.id;
                  if (!id) return null;
                  const response =
                    type === "client"
                      ? await getClientById(id)
                      : await getProviderById(id);
                  return readDetail(response.data, type);
                } catch {
                  return null;
                }
              }),
            );
            detailList.push(
              ...results.filter((item): item is UserDetails => item !== null),
            );
          }
          return detailList;
        };

        const [clientDetails, providerDetails] = await Promise.all([
          fetchDetails(clientsMissing, "client"),
          fetchDetails(providersMissing, "provider"),
        ]);

        if (isCancelled) return;

        upsertPins(
          [
            ...clientDetails
              .map((detail) => toPin("CLIENT", detail))
              .filter((item): item is TrackingPin => !!item),
            ...providerDetails
              .map((detail) => toPin("PROVIDER", detail))
              .filter((item): item is TrackingPin => !!item),
          ],
        );
      } catch (error) {
        console.error("Failed to load tracking pins", error);
        if (!isCancelled) {
          setUserPins([]);
        }
      } finally {
        if (!isCancelled) {
          setIsUsersLoading(false);
        }
      }
    };

    void load();

    return () => {
      isCancelled = true;
    };
  }, [upsertPins]);

  const loadActiveOrderPins = useCallback(async () => {
    setIsOrdersLoading(true);
    try {
      const collected: OrderType[] = [];
      let startIndex = 0;
      let total = ORDER_PAGE_SIZE;
      while (startIndex < total) {
        const response = await getOrders("", startIndex);
        const result = response.data?.result ?? {};
        const items = Array.isArray(result.items) ? (result.items as OrderType[]) : [];
        total = Number(result.total ?? 0);
        collected.push(...items);
        startIndex += Number(result.pageSize ?? ORDER_PAGE_SIZE);
        if (items.length === 0) break;
      }

      const activeOrders = collected.filter(isActiveOrder);

      setOrderPins(
        activeOrders
          .map((order) => toOrderPin(order as OrderWithMapData))
          .filter((item): item is TrackingPin => !!item),
      );

      const enrichedOrders: OrderType[] = [];

      for (
        let index = 0;
        index < activeOrders.length;
        index += ORDER_DETAIL_CONCURRENCY
      ) {
        const chunk = activeOrders.slice(index, index + ORDER_DETAIL_CONCURRENCY);
        const results = await Promise.all(
          chunk.map(async (order) => {
            const existingCoordinates = extractOrderCoordinates(order);
            if (existingCoordinates) return order;

            try {
              const response = await getOrderById(order.id);
              const detailedOrder = readOrderDetails(response.data);
              return detailedOrder ?? order;
            } catch {
              return order;
            }
          }),
        );
        enrichedOrders.push(...results);

        setOrderPins(
          enrichedOrders
            .map((order) => toOrderPin(order as OrderWithMapData))
            .filter((item): item is TrackingPin => !!item),
        );
      }
    } finally {
      setIsOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadActiveOrderPins();
  }, [loadActiveOrderPins]);

  useEffect(() => {
    if (!lastEvent) return;
    if (
      lastEvent.type !== "ORDER_CREATED" &&
      lastEvent.type !== "ORDER_CONFIRMED" &&
      lastEvent.type !== "ORDER_CANCELED"
    ) {
      return;
    }
    void loadActiveOrderPins();
  }, [lastEvent, loadActiveOrderPins]);

  const providerCount = useMemo(
    () => userPins.filter((pin) => pin.kind === "PROVIDER").length,
    [userPins],
  );
  const clientCount = useMemo(
    () => userPins.filter((pin) => pin.kind === "CLIENT").length,
    [userPins],
  );
  const orderCount = useMemo(
    () => orderPins.length,
    [orderPins],
  );
  const pins = useMemo(
    () => [
      ...(showClients
        ? userPins.filter((pin) => pin.kind === "CLIENT")
        : []),
      ...(showProviders
        ? userPins.filter((pin) => pin.kind === "PROVIDER")
        : []),
      ...(showOrders ? orderPins : []),
    ],
    [orderPins, showClients, showOrders, showProviders, userPins],
  );
  const isLoading = isUsersLoading || isOrdersLoading;
  const hasVisiblePins = pins.length > 0;

  return (
    <Template>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          height: "100%",
          minHeight: 0,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Map</h1>
          <p style={{ margin: "8px 0 0", color: "#4b5563" }}>
            Clients: {clientCount}, providers: {providerCount}, active orders: {orderCount}
          </p>
          <div
            style={{
              marginTop: 8,
              display: "flex",
              gap: 14,
              alignItems: "center",
              flexWrap: "wrap",
              color: "#374151",
              fontSize: 13,
            }}
          >
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                opacity: showClients ? 1 : 0.55,
              }}
            >
              <input
                type="checkbox"
                checked={showClients}
                onChange={(event) => setShowClients(event.target.checked)}
              />
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 999,
                  border: "2px solid #14532d",
                  background: "#22c55e",
                  display: "inline-block",
                }}
              />
              Client pin
            </label>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                opacity: showProviders ? 1 : 0.55,
              }}
            >
              <input
                type="checkbox"
                checked={showProviders}
                onChange={(event) => setShowProviders(event.target.checked)}
              />
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 999,
                  border: "2px solid #1e3a8a",
                  background: "#2563eb",
                  display: "inline-block",
                }}
              />
              Provider pin
            </label>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                opacity: showOrders ? 1 : 0.55,
              }}
            >
              <input
                type="checkbox"
                checked={showOrders}
                onChange={(event) => setShowOrders(event.target.checked)}
              />
              <span
                style={{
                  width: 13,
                  height: 13,
                  borderRadius: 3,
                  border: "2px solid #9a3412",
                  background: "#f97316",
                  display: "inline-block",
                }}
              />
              Active order pin
            </label>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 300 }}>
          {hasVisiblePins || !isLoading ? (
            <OsmMap pins={pins} height="100%" />
          ) : (
            <div style={{ color: "#4b5563" }}>Loading map data...</div>
          )}
          {isLoading && hasVisiblePins && (
            <div style={{ color: "#4b5563", marginTop: hasVisiblePins ? 8 : 0 }}>
              Loading map data...
            </div>
          )}
        </div>
      </div>
    </Template>
  );
};

export default TrackingPage;
