import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useAdminSocket } from "@/components/AdminSocket/AdminSocketProvider";
import Button from "@/components/Button/Button";
import Template from "@/components/Template/Template";
import OsmMap from "@/components/Tracking/OsmMap";
import {
  getAdminMap,
  rebuildAdminMapSnapshot,
} from "@/pages/api/fetch";
import { TrackingPin } from "@/types/Tracking";

type AdminMapProfile = {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  imgUrl: string | null;
  defaultAddress: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
  };
};

type AdminMapOrder = {
  id: string;
  status: string;
  clientFirstName: string | null;
  clientImgUrl: string | null;
  startsAt: string;
  endsAt: string;
  mapPoint: {
    latitude: number;
    longitude: number;
  };
  address: {
    city: string | null;
    country: string | null;
  };
};

type AdminMapSnapshot = {
  generatedAt: string;
  clients: AdminMapProfile[];
  providers: AdminMapProfile[];
  activeOrders: AdminMapOrder[];
};

const readMapSnapshot = (payload: unknown): AdminMapSnapshot | null => {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as { result?: unknown };
  const candidate = root.result ?? payload;
  if (!candidate || typeof candidate !== "object") return null;

  const snapshot = candidate as Partial<AdminMapSnapshot>;
  if (
    typeof snapshot.generatedAt !== "string" ||
    !Array.isArray(snapshot.clients) ||
    !Array.isArray(snapshot.providers) ||
    !Array.isArray(snapshot.activeOrders)
  ) {
    return null;
  }

  return snapshot as AdminMapSnapshot;
};

const toProfilePin = (
  kind: "CLIENT" | "PROVIDER",
  profile: AdminMapProfile,
): TrackingPin | null => {
  const latitude = Number(profile.defaultAddress?.latitude);
  const longitude = Number(profile.defaultAddress?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const label =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() ||
    profile.userId;

  return {
    id: `${kind}:${profile.userId}`,
    kind,
    label,
    subtitle: [profile.defaultAddress.city, profile.defaultAddress.country]
      .filter(Boolean)
      .join(", "),
    latitude,
    longitude,
    avatarUrl: profile.imgUrl || undefined,
    profileUrl: `/${kind === "CLIENT" ? "client" : "provider"}/${profile.userId}`,
  };
};

const toOrderPin = (order: AdminMapOrder): TrackingPin | null => {
  const latitude = Number(order.mapPoint?.latitude);
  const longitude = Number(order.mapPoint?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return {
    id: `ORDER:${order.id}`,
    kind: "ORDER",
    label: order.clientFirstName || "Client",
    subtitle: [order.address?.city, order.address?.country]
      .filter(Boolean)
      .join(", "),
    avatarUrl: order.clientImgUrl || undefined,
    profileUrl: `/orders/${order.id}`,
    latitude,
    longitude,
    orderStatus: order.status,
    orderStartsAt: order.startsAt,
    orderEndsAt: order.endsAt,
  };
};

const TrackingPage = () => {
  const [userPins, setUserPins] = useState<TrackingPin[]>([]);
  const [orderPins, setOrderPins] = useState<TrackingPin[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [showClients, setShowClients] = useState(true);
  const [showProviders, setShowProviders] = useState(true);
  const [showOrders, setShowOrders] = useState(true);
  const { lastEvent } = useAdminSocket();

  const applySnapshot = useCallback((snapshot: AdminMapSnapshot) => {
    setGeneratedAt(snapshot.generatedAt);
    setUserPins(
      [
        ...snapshot.clients.map((client) => toProfilePin("CLIENT", client)),
        ...snapshot.providers.map((provider) =>
          toProfilePin("PROVIDER", provider),
        ),
      ].filter((pin): pin is TrackingPin => pin !== null),
    );
    setOrderPins(
      snapshot.activeOrders
        .map(toOrderPin)
        .filter((pin): pin is TrackingPin => pin !== null),
    );
  }, []);

  const loadMap = useCallback(
    async (rebuild = false) => {
      if (rebuild) setIsRebuilding(true);
      else setIsLoading(true);

      try {
        const response = rebuild
          ? await rebuildAdminMapSnapshot()
          : await getAdminMap();
        const snapshot = readMapSnapshot(response.data);
        if (!snapshot) throw new Error("Invalid map snapshot response");
        applySnapshot(snapshot);
        if (rebuild) toast.success("Map snapshot rebuilt");
      } catch (error) {
        console.error("Failed to load map snapshot", error);
        toast.error(
          rebuild
            ? "Failed to rebuild map snapshot"
            : "Failed to load map data",
        );
      } finally {
        setIsLoading(false);
        setIsRebuilding(false);
      }
    },
    [applySnapshot],
  );

  useEffect(() => {
    void loadMap();
  }, [loadMap]);

  useEffect(() => {
    if (!lastEvent) return;
    if (
      lastEvent.type === "ORDER_CREATED" ||
      lastEvent.type === "ORDER_CONFIRMED" ||
      lastEvent.type === "ORDER_CANCELED"
    ) {
      void loadMap();
    }
  }, [lastEvent, loadMap]);

  const providerCount = useMemo(
    () => userPins.filter((pin) => pin.kind === "PROVIDER").length,
    [userPins],
  );
  const clientCount = useMemo(
    () => userPins.filter((pin) => pin.kind === "CLIENT").length,
    [userPins],
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
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Map</h1>
              <p style={{ margin: "8px 0 0", color: "#4b5563" }}>
                Clients: {clientCount}, providers: {providerCount}, active
                orders: {orderPins.length}
              </p>
              {generatedAt && (
                <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 12 }}>
                  Profile snapshot updated:{" "}
                  {new Date(generatedAt).toLocaleString()}
                </p>
              )}
            </div>
            <Button
              title={isRebuilding ? "Rebuilding..." : "Rebuild snapshot"}
              type="OUTLINED"
              onClick={() => void loadMap(true)}
              isLoading={isRebuilding}
              isDisabled={isLoading || isRebuilding}
            />
          </div>

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
          {pins.length > 0 || !isLoading ? (
            <OsmMap pins={pins} height="100%" />
          ) : (
            <div style={{ color: "#4b5563" }}>Loading map data...</div>
          )}
        </div>
      </div>
    </Template>
  );
};

export default TrackingPage;
