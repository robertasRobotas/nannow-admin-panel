import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import ModalPageTemplate from "@/components/ModalPageTemplate/ModalPageTemplate";
import Button from "@/components/Button/Button";
import OsmMap from "@/components/Tracking/OsmMap";
import {
  getProviderById,
  heartbeatProviderTracking,
  ProviderTrackingSession,
  startProviderTracking,
  stopProviderTracking,
} from "@/pages/api/fetch";
import { useAdminSocket } from "@/components/AdminSocket/AdminSocketProvider";
import { TrackingPin, TrackingPoint } from "@/types/Tracking";

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const FOREGROUND_STALE_REASON = "FOREGROUND_APP_CLOSED_OR_NO_SIGNAL";

const isForegroundStaleReason = (reason?: string) =>
  String(reason ?? "").toUpperCase() === FOREGROUND_STALE_REASON;

const getForegroundOnlyWarning = (isStale: boolean) =>
  isStale
    ? "Provider app is closed or has no signal. Live location is temporarily unavailable"
    : "Provider location updates are available only while provider app is open";

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (
      error as {
        response?: { data?: { error?: unknown } };
      }
    ).response?.data?.error === "string"
  ) {
    return (
      error as {
        response?: { data?: { error?: string } };
      }
    ).response?.data?.error as string;
  }

  return fallback;
};

const extractProviderNameFromUnknown = (payload: unknown) => {
  const root = payload as {
    providerDetails?: unknown;
    result?: { providerDetails?: unknown };
    firstName?: unknown;
    lastName?: unknown;
    first_name?: unknown;
    last_name?: unknown;
    user?: {
      firstName?: unknown;
      lastName?: unknown;
      first_name?: unknown;
      last_name?: unknown;
    };
    provider?: {
      firstName?: unknown;
      lastName?: unknown;
      first_name?: unknown;
      last_name?: unknown;
      user?: {
        firstName?: unknown;
        lastName?: unknown;
        first_name?: unknown;
        last_name?: unknown;
      };
    };
  };
  const details = (root.providerDetails ??
    root.result?.providerDetails ??
    payload) as {
    firstName?: unknown;
    lastName?: unknown;
    first_name?: unknown;
    last_name?: unknown;
    user?: {
      firstName?: unknown;
      lastName?: unknown;
      first_name?: unknown;
      last_name?: unknown;
    };
    provider?: {
      firstName?: unknown;
      lastName?: unknown;
      first_name?: unknown;
      last_name?: unknown;
      user?: {
        firstName?: unknown;
        lastName?: unknown;
        first_name?: unknown;
        last_name?: unknown;
      };
    };
  };
  const firstNameCandidates = [
    details?.user?.firstName,
    details?.user?.first_name,
    details?.provider?.user?.firstName,
    details?.provider?.user?.first_name,
    details?.provider?.firstName,
    details?.provider?.first_name,
    details?.firstName,
    details?.first_name,
    root?.user?.firstName,
    root?.user?.first_name,
    root?.provider?.user?.firstName,
    root?.provider?.user?.first_name,
    root?.provider?.firstName,
    root?.provider?.first_name,
    root?.firstName,
    root?.first_name,
  ];
  const lastNameCandidates = [
    details?.user?.lastName,
    details?.user?.last_name,
    details?.provider?.user?.lastName,
    details?.provider?.user?.last_name,
    details?.provider?.lastName,
    details?.provider?.last_name,
    details?.lastName,
    details?.last_name,
    root?.user?.lastName,
    root?.user?.last_name,
    root?.provider?.user?.lastName,
    root?.provider?.user?.last_name,
    root?.provider?.lastName,
    root?.provider?.last_name,
    root?.lastName,
    root?.last_name,
  ];
  const firstName = String(
    firstNameCandidates.find((value) => !!value) ?? "",
  ).trim();
  const lastName = String(
    lastNameCandidates.find((value) => !!value) ?? "",
  ).trim();
  return `${String(firstName).trim()} ${String(lastName).trim()}`.trim();
};

const extractProviderLastLocationFromUnknown = (payload: unknown) => {
  const root = payload as {
    providerDetails?: unknown;
    result?: { providerDetails?: unknown };
    provider?: { lastTrackingLocation?: unknown };
    user?: { lastTrackingLocation?: unknown };
    lastTrackingLocation?: unknown;
  };
  const details = (root.providerDetails ??
    root.result?.providerDetails ??
    payload) as {
    provider?: { lastTrackingLocation?: unknown };
    user?: { lastTrackingLocation?: unknown };
    lastTrackingLocation?: unknown;
  };
  return (details?.provider?.lastTrackingLocation ??
    details?.lastTrackingLocation ??
    details?.user?.lastTrackingLocation ??
    null) as {
    latitude?: unknown;
    longitude?: unknown;
    accuracy?: unknown;
    timestamp?: unknown;
    updatedAt?: unknown;
  } | null;
};

const ProviderTrackingPage = () => {
  const router = useRouter();
  const providerId = typeof router.query.id === "string" ? router.query.id : "";
  const providerUserIdFromQuery =
    typeof router.query.providerUserId === "string"
      ? router.query.providerUserId
      : "";
  const { lastEvent } = useAdminSocket();

  const [session, setSession] = useState<ProviderTrackingSession | null>(null);
  const [livePoint, setLivePoint] = useState<TrackingPoint | null>(null);
  const [lastKnownPoint, setLastKnownPoint] = useState<TrackingPoint | null>(
    null,
  );
  const [providerDisplayName, setProviderDisplayName] = useState("");
  const [statusText, setStatusText] = useState("");
  const [warningText, setWarningText] = useState("");
  const [lastWsCoordsText, setLastWsCoordsText] = useState("");
  const [hasLiveLocationUpdates, setHasLiveLocationUpdates] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const heartbeatTimerRef = useRef<number | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [mapHeight, setMapHeight] = useState(680);

  const applyProviderMeta = useCallback(
    (payload: unknown, fallbackId: string) => {
      const fullName = extractProviderNameFromUnknown(payload);
      setProviderDisplayName(fullName || fallbackId);

      const location = extractProviderLastLocationFromUnknown(payload);
      const latitude = Number(location?.latitude);
      const longitude = Number(location?.longitude);
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        setLastKnownPoint({
          latitude,
          longitude,
          accuracy: Number.isFinite(Number(location?.accuracy))
            ? Number(location?.accuracy)
            : undefined,
          timestamp:
            typeof location?.timestamp === "string"
              ? location.timestamp
              : typeof location?.updatedAt === "string"
                ? location.updatedAt
                : undefined,
        });
      }
    },
    [],
  );

  const fetchProviderMetaById = useCallback(
    async (id: string, fallbackId: string) => {
      const response = await getProviderById(id);
      applyProviderMeta(response.data, fallbackId);
    },
    [applyProviderMeta],
  );

  useEffect(() => {
    if (!providerId && !providerUserIdFromQuery) return;
    let isCancelled = false;

    const loadProviderLastKnownLocation = async () => {
      try {
        const lookupId = providerUserIdFromQuery || providerId;
        await fetchProviderMetaById(lookupId, providerId || lookupId);
      } catch (error) {
        console.error("Failed to fetch provider last tracking location", error);
        if (!isCancelled) {
          setProviderDisplayName(providerId);
        }
      }
    };

    void loadProviderLastKnownLocation();

    return () => {
      isCancelled = true;
    };
  }, [fetchProviderMetaById, providerId, providerUserIdFromQuery]);

  useEffect(() => {
    return () => {
      if (heartbeatTimerRef.current) {
        window.clearInterval(heartbeatTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const updateMapHeight = () => {
      if (!mapContainerRef.current) return;
      const rect = mapContainerRef.current.getBoundingClientRect();
      const availableHeight = Math.floor(window.innerHeight - rect.top - 16);
      setMapHeight(Math.max(320, availableHeight));
    };

    updateMapHeight();
    window.addEventListener("resize", updateMapHeight);

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            updateMapHeight();
          })
        : null;
    if (resizeObserver) {
      resizeObserver.observe(document.body);
    }

    return () => {
      window.removeEventListener("resize", updateMapHeight);
      resizeObserver?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!session?.sessionId || !providerId) return;

    const heartbeatEveryMs = Math.max(5, session.intervalSeconds || 20) * 1000;
    if (heartbeatTimerRef.current) {
      window.clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }

    heartbeatTimerRef.current = window.setInterval(async () => {
      try {
        const response = await heartbeatProviderTracking(
          providerId,
          session.sessionId,
        );
        const nextSession = response.data as ProviderTrackingSession;
        setSession(nextSession);
        if (
          nextSession.providerUserId &&
          (!providerDisplayName || providerDisplayName === providerId)
        ) {
          try {
            await fetchProviderMetaById(nextSession.providerUserId, providerId);
          } catch (error) {
            console.error(
              "Failed to fetch provider meta by providerUserId",
              error,
            );
          }
        }
        if (nextSession.lastLocation) {
          setLastKnownPoint(nextSession.lastLocation);
          if (hasLiveLocationUpdates) {
            setLivePoint(nextSession.lastLocation);
          }
        } else if (typeof nextSession.lastLocationTimestamp === "string") {
          setLastKnownPoint((prev) =>
            prev
              ? {
                  ...prev,
                  timestamp:
                    nextSession.lastLocationTimestamp ?? prev.timestamp,
                }
              : prev,
          );
        }
        if (nextSession.locationStale) {
          setHasLiveLocationUpdates(false);
          setLivePoint(null);
        }
        const isForegroundOnlyMode =
          String(nextSession.trackingMode).toUpperCase() === "FOREGROUND_ONLY";
        const isForegroundStale =
          isForegroundStaleReason(nextSession.trackingReason) ||
          !!nextSession.locationStale;
        const nextWarning =
          nextSession.warning ||
          (isForegroundOnlyMode
            ? getForegroundOnlyWarning(isForegroundStale)
            : "");
        if (!hasLiveLocationUpdates) {
          setWarningText(nextWarning);
        }
      } catch (error) {
        console.error("Failed to heartbeat tracking session", error);
      }
    }, heartbeatEveryMs);

    return () => {
      if (heartbeatTimerRef.current) {
        window.clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
    };
  }, [
    fetchProviderMetaById,
    hasLiveLocationUpdates,
    providerDisplayName,
    providerId,
    session?.sessionId,
    session?.intervalSeconds,
  ]);

  useEffect(() => {
    if (!lastEvent || !session?.sessionId) return;
    if (!("sessionId" in lastEvent)) return;
    if (lastEvent.sessionId !== session.sessionId) return;

    if (lastEvent.type === "ORDER_TRACKING_LOCATION_UPDATED") {
      const coordsText = `${lastEvent.latitude.toFixed(6)}, ${lastEvent.longitude.toFixed(6)}`;
      setLastWsCoordsText(coordsText);
      toast(`Tracking WS: ${coordsText}`);
      setLivePoint({
        latitude: lastEvent.latitude,
        longitude: lastEvent.longitude,
        accuracy: lastEvent.accuracy,
        timestamp: lastEvent.timestamp,
      });
      setHasLiveLocationUpdates(true);
      setWarningText("");
      setStatusText("Live provider location updates are active");
      return;
    }

    if (lastEvent.type === "ORDER_TRACKING_PROVIDER_STATUS_UPDATED") {
      setStatusText(`${lastEvent.status} (${lastEvent.reason})`);
      const isForegroundOnlyMode =
        String(lastEvent.trackingMode).toUpperCase() === "FOREGROUND_ONLY";
      const isForegroundStale = isForegroundStaleReason(lastEvent.reason);
      setSession((prev) =>
        prev
          ? {
              ...prev,
              trackingStatus: lastEvent.status,
              trackingReason: lastEvent.reason,
              trackingMode: lastEvent.trackingMode,
              locationStale: isForegroundStale,
              lastLocationTimestamp:
                prev.lastLocation?.timestamp ??
                prev.lastLocationTimestamp ??
                null,
              expiresAt: lastEvent.expiresAt ?? prev.expiresAt,
            }
          : prev,
      );
      if (isForegroundStale) {
        setHasLiveLocationUpdates(false);
        setLivePoint(null);
      }
      if (
        isForegroundOnlyMode ||
        String(lastEvent.reason).toUpperCase().includes("BACKGROUND")
      ) {
        if (!hasLiveLocationUpdates) {
          setWarningText(
            isForegroundOnlyMode
              ? getForegroundOnlyWarning(isForegroundStale)
              : "Provider location updates are available only while provider app is open",
          );
        }
      } else {
        setWarningText("");
      }
      return;
    }

    if (lastEvent.type === "ORDER_TRACKING_POLICY_UPDATED") {
      setSession((prev) =>
        prev
          ? {
              ...prev,
              intervalSeconds: lastEvent.intervalSeconds,
              expiresAt: lastEvent.expiresAt,
            }
          : prev,
      );
      if (lastEvent.requestImmediateLocation) {
        setStatusText(
          "Provider connected. Waiting immediate location update...",
        );
      }
      return;
    }

    if (lastEvent.type === "ORDER_TRACKING_STOPPED") {
      setStatusText(`${lastEvent.status} (${lastEvent.reason})`);
      setHasLiveLocationUpdates(false);
      setLivePoint(null);
      setWarningText("Tracking stopped. Showing last known provider position.");
      setSession((prev) =>
        prev
          ? {
              ...prev,
              trackingStatus: lastEvent.status,
              trackingReason: lastEvent.reason,
              trackingMode: lastEvent.trackingMode,
            }
          : prev,
      );
    }
  }, [hasLiveLocationUpdates, lastEvent, session?.sessionId]);

  const startTracking = async () => {
    if (!providerId || isStarting) return;
    try {
      setIsStarting(true);
      setStatusText("");
      const response = await startProviderTracking(providerId);
      const nextSession = response.data as ProviderTrackingSession;
      setSession(nextSession);
      if (nextSession.providerUserId) {
        try {
          await fetchProviderMetaById(nextSession.providerUserId, providerId);
        } catch (error) {
          console.error(
            "Failed to fetch provider meta by providerUserId",
            error,
          );
        }
      }
      if (nextSession.lastLocation) {
        setLastKnownPoint(nextSession.lastLocation);
      }
      setLivePoint(null);
      setHasLiveLocationUpdates(false);
      const nextWarning =
        nextSession.warning ||
        (String(nextSession.trackingMode).toUpperCase() === "FOREGROUND_ONLY"
          ? getForegroundOnlyWarning(
              isForegroundStaleReason(nextSession.trackingReason) ||
                !!nextSession.locationStale,
            )
          : "");
      setWarningText(nextWarning);
      if (nextSession.warning) {
        setStatusText(nextSession.warning);
      }
    } catch (error: unknown) {
      setStatusText(
        getApiErrorMessage(error, "Failed to start provider tracking session"),
      );
    } finally {
      setIsStarting(false);
    }
  };

  const stopTracking = async () => {
    if (!providerId || !session?.sessionId || isStopping) return;
    try {
      setIsStopping(true);
      await stopProviderTracking(providerId, session.sessionId);
      setStatusText("Tracking stopped");
      setWarningText("Tracking stopped. Showing last known provider position.");
      setHasLiveLocationUpdates(false);
      setLivePoint(null);
      setSession(null);
    } catch (error: unknown) {
      setStatusText(getApiErrorMessage(error, "Failed to stop tracking"));
    } finally {
      setIsStopping(false);
    }
  };

  const headerStatus = useMemo(() => {
    if (!session) return "Not tracking";
    if (hasLiveLocationUpdates)
      return `${session.trackingStatus} (LIVE_LOCATION_UPDATES)`;
    return `${session.trackingStatus} (${session.trackingReason})`;
  }, [session, hasLiveLocationUpdates]);

  const isTrackingExpiredWithoutFreshLocation = useMemo(() => {
    if (!session?.expiresAt || hasLiveLocationUpdates) return false;
    const expiresAtMs = new Date(session.expiresAt).getTime();
    if (!Number.isFinite(expiresAtMs)) return false;
    return Date.now() > expiresAtMs;
  }, [session?.expiresAt, hasLiveLocationUpdates]);

  const showLastKnownNotice =
    (!livePoint && !!lastKnownPoint) || (!session && !!lastKnownPoint);
  const hasLimitedTrackingWarning =
    warningText.length > 0 && !hasLiveLocationUpdates;
  const lastKnownAtText = lastKnownPoint?.timestamp
    ? formatDateTime(lastKnownPoint.timestamp)
    : "unknown time";
  const lastKnownReasonText = !session
    ? `Tracking stopped. Last known position: ${lastKnownAtText}.`
    : isForegroundStaleReason(session.trackingReason) || !!session.locationStale
      ? `Provider app is closed or has no signal. Showing last known provider position (${lastKnownAtText}).`
      : isTrackingExpiredWithoutFreshLocation
        ? `Live tracking session expired and no new coordinates were received. Showing last known provider position (${lastKnownAtText}).`
        : warningText
          ? `${warningText}. Last known position: ${lastKnownAtText}`
          : `Live tracking is not available right now. Showing last known provider position (${lastKnownAtText}).`;
  const attentionPoint = livePoint ?? lastKnownPoint;
  const mapPins: TrackingPin[] = showLastKnownNotice
    ? [
        {
          id: "last-known-provider-location",
          kind: "LAST_KNOWN_PROVIDER",
          label: "Provider last known position",
          latitude: lastKnownPoint!.latitude,
          longitude: lastKnownPoint!.longitude,
          subtitle: !session
            ? `Tracking stopped • Updated ${lastKnownAtText}`
            : isTrackingExpiredWithoutFreshLocation
              ? `Tracking expired • Updated ${lastKnownAtText}`
              : lastKnownPoint?.timestamp
                ? `Updated ${formatDateTime(lastKnownPoint.timestamp)}`
                : "No live tracking yet",
        },
      ]
    : hasLimitedTrackingWarning && attentionPoint
      ? [
          {
            id: "limited-tracking-provider-location",
            kind: "LAST_KNOWN_PROVIDER",
            label: "Provider last known location",
            latitude: attentionPoint.latitude,
            longitude: attentionPoint.longitude,
            subtitle: attentionPoint.timestamp
              ? `Updated ${formatDateTime(attentionPoint.timestamp)}`
              : "Limited location updates",
          },
        ]
      : [];
  const activeMapPoint =
    showLastKnownNotice || hasLimitedTrackingWarning
      ? null
      : (livePoint ?? lastKnownPoint);

  return (
    <ModalPageTemplate>
      <div
        style={{ display: "grid", gap: 16, minHeight: "calc(100dvh - 120px)" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>
              Provider tracking
            </h1>
            <p style={{ margin: "8px 0 0", color: "#4b5563" }}>
              Provider: {providerDisplayName || providerId || "-"}
            </p>
            <p style={{ margin: "4px 0 0", color: "#4b5563" }}>
              Status: {headerStatus}
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            {!session ? (
              <Button
                title={isStarting ? "Starting..." : "Start tracking"}
                type="BLACK"
                onClick={startTracking}
                isDisabled={isStarting || !providerId}
              />
            ) : (
              <Button
                title={isStopping ? "Stopping..." : "Stop tracking"}
                type="OUTLINED"
                onClick={stopTracking}
                isDisabled={isStopping}
              />
            )}
            <Button
              title="Back"
              type="OUTLINED"
              onClick={() => router.back()}
            />
          </div>
        </div>

        {statusText && statusText !== warningText ? (
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: "10px 12px",
              backgroundColor: "#f9fafb",
              color: "#374151",
            }}
          >
            {statusText}
          </div>
        ) : null}

        {showLastKnownNotice || hasLimitedTrackingWarning ? (
          <div
            style={{
              border: "1px solid #fecaca",
              borderRadius: 10,
              padding: "10px 12px",
              backgroundColor: "#fef2f2",
              color: "#991b1b",
              fontWeight: 700,
            }}
          >
            {lastKnownReasonText}
          </div>
        ) : null}

        {session ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 8,
              color: "#374151",
              fontSize: 14,
            }}
          >
            <div>Order ID: {session.orderId}</div>
            <div>Session ID: {session.sessionId}</div>
            <div>Interval: {session.intervalSeconds}s</div>
            <div>Tracking mode: {session.trackingMode}</div>
            <div>Started: {formatDateTime(session.startedAt)}</div>
            <div>Updated: {formatDateTime(session.updatedAt)}</div>
            <div>Expires: {formatDateTime(session.expiresAt)}</div>
            <div>Location stale: {session.locationStale ? "YES" : "NO"}</div>
            <div>
              Last location timestamp:{" "}
              {formatDateTime(session.lastLocationTimestamp ?? undefined)}
            </div>
          </div>
        ) : null}
        {lastWsCoordsText ? (
          <div style={{ color: "#1f2937", fontSize: 14 }}>
            WS coords: <strong>{lastWsCoordsText}</strong>
          </div>
        ) : null}

        <div ref={mapContainerRef}>
          <OsmMap
            focusPoint={activeMapPoint}
            focusLabel={
              livePoint
                ? "Provider live location"
                : "Provider last known location"
            }
            pins={mapPins}
            height={mapHeight}
            zoom={14}
          />
        </div>
      </div>
    </ModalPageTemplate>
  );
};

export default ProviderTrackingPage;
