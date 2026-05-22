import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import ModalPageTemplate from "@/components/ModalPageTemplate/ModalPageTemplate";
import Button from "@/components/Button/Button";
import OsmMap from "@/components/Tracking/OsmMap";
import {
  heartbeatProviderTracking,
  ProviderTrackingSession,
  startProviderTracking,
  stopProviderTracking,
} from "@/pages/api/fetch";
import { useAdminSocket } from "@/components/AdminSocket/AdminSocketProvider";
import { TrackingPoint } from "@/types/Tracking";

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const getApiErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
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

const ProviderTrackingPage = () => {
  const router = useRouter();
  const providerId = typeof router.query.id === "string" ? router.query.id : "";
  const { lastEvent } = useAdminSocket();

  const [session, setSession] = useState<ProviderTrackingSession | null>(null);
  const [livePoint, setLivePoint] = useState<TrackingPoint | null>(null);
  const [statusText, setStatusText] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const heartbeatTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (heartbeatTimerRef.current) {
        window.clearInterval(heartbeatTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!session || !providerId) return;

    const heartbeatEveryMs = Math.max(5, session.intervalSeconds || 20) * 1000;
    if (heartbeatTimerRef.current) {
      window.clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }

    heartbeatTimerRef.current = window.setInterval(async () => {
      try {
        const response = await heartbeatProviderTracking(providerId, session.sessionId);
        const nextSession = response.data as ProviderTrackingSession;
        setSession(nextSession);
        if (nextSession.lastLocation) {
          setLivePoint(nextSession.lastLocation);
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
  }, [providerId, session, session?.sessionId, session?.intervalSeconds]);

  useEffect(() => {
    if (!lastEvent || !session) return;
    if (!("sessionId" in lastEvent) || lastEvent.sessionId !== session.sessionId) return;

    if (lastEvent.type === "ORDER_TRACKING_LOCATION_UPDATED") {
      setLivePoint({
        latitude: lastEvent.latitude,
        longitude: lastEvent.longitude,
        accuracy: lastEvent.accuracy,
        timestamp: lastEvent.timestamp,
      });
      return;
    }

    if (lastEvent.type === "ORDER_TRACKING_PROVIDER_STATUS_UPDATED") {
      setStatusText(`${lastEvent.status} (${lastEvent.reason})`);
      setSession((prev) =>
        prev
          ? {
              ...prev,
              trackingStatus: lastEvent.status,
              trackingReason: lastEvent.reason,
              trackingMode: lastEvent.trackingMode,
              expiresAt: lastEvent.expiresAt ?? prev.expiresAt,
            }
          : prev,
      );
      return;
    }

    if (lastEvent.type === "ORDER_TRACKING_STOPPED") {
      setStatusText(`${lastEvent.status} (${lastEvent.reason})`);
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
  }, [lastEvent, session]);

  const startTracking = async () => {
    if (!providerId || isStarting) return;
    try {
      setIsStarting(true);
      setStatusText("");
      const response = await startProviderTracking(providerId);
      const nextSession = response.data as ProviderTrackingSession;
      setSession(nextSession);
      setLivePoint(nextSession.lastLocation);
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
      setSession(null);
    } catch (error: unknown) {
      setStatusText(getApiErrorMessage(error, "Failed to stop tracking"));
    } finally {
      setIsStopping(false);
    }
  };

  const headerStatus = useMemo(() => {
    if (!session) return "Not tracking";
    return `${session.trackingStatus} (${session.trackingReason})`;
  }, [session]);

  return (
    <ModalPageTemplate>
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>Provider tracking</h1>
            <p style={{ margin: "8px 0 0", color: "#4b5563" }}>
              Provider ID: {providerId || "—"}
            </p>
            <p style={{ margin: "4px 0 0", color: "#4b5563" }}>Status: {headerStatus}</p>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            {!session ? (
              <Button title={isStarting ? "Starting..." : "Start tracking"} type="BLACK" onClick={startTracking} isDisabled={isStarting || !providerId} />
            ) : (
              <Button title={isStopping ? "Stopping..." : "Stop tracking"} type="OUTLINED" onClick={stopTracking} isDisabled={isStopping} />
            )}
            <Button title="Back" type="OUTLINED" onClick={() => router.back()} />
          </div>
        </div>

        {statusText ? (
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
          </div>
        ) : null}

        <OsmMap
          focusPoint={livePoint}
          focusLabel="Provider live location"
          pins={[]}
          height={680}
          zoom={14}
        />
      </div>
    </ModalPageTemplate>
  );
};

export default ProviderTrackingPage;
