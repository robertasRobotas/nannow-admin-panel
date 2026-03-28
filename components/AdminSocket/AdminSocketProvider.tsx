import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import {
  disconnectAdminSocket,
  getOrCreateAdminSocket,
} from "@/helpers/adminSocket";
import {
  AdminEvent,
  AdminSocketEvent,
  AdminSocketListener,
} from "@/types/AdminSocket";
import { Socket } from "socket.io-client";

type AdminSocketContextValue = {
  isConnected: boolean;
  lastEvent: AdminSocketEvent | null;
  subscribe: (listener: AdminSocketListener) => () => void;
};

const AdminSocketContext = createContext<AdminSocketContextValue>({
  isConnected: false,
  lastEvent: null,
  subscribe: () => () => undefined,
});

type ToneConfig = {
  frequency: number;
  durationMs: number;
  delayMs?: number;
};

let sharedAudioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (typeof window === "undefined") return null;

  const browserWindow = window as Window &
    typeof globalThis & {
      webkitAudioContext?: typeof AudioContext;
    };
  const AudioContextCtor =
    browserWindow.AudioContext ?? browserWindow.webkitAudioContext;

  if (!AudioContextCtor) return null;

  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContextCtor();
  }

  return sharedAudioContext;
};

const playToneSequence = async (tones: ToneConfig[]) => {
  const context = getAudioContext();
  if (!context) return;

  try {
    if (context.state === "suspended") {
      await context.resume();
    }
  } catch (error) {
    console.error("Failed to resume admin audio context", error);
    return;
  }

  const startAt = context.currentTime + 0.01;

  tones.forEach(({ frequency, durationMs, delayMs = 0 }) => {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const toneStart = startAt + delayMs / 1000;
    const toneEnd = toneStart + durationMs / 1000;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, toneStart);

    gainNode.gain.setValueAtTime(0.0001, toneStart);
    gainNode.gain.exponentialRampToValueAtTime(0.08, toneStart + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, toneEnd);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start(toneStart);
    oscillator.stop(toneEnd);
  });
};

const playOrderCreatedSound = () => {
  void playToneSequence([
    { frequency: 880, durationMs: 170 },
  ]);
};

const playOrderConfirmedSound = () => {
  void playToneSequence([
    { frequency: 660, durationMs: 120 },
    { frequency: 880, durationMs: 160, delayMs: 140 },
  ]);
};

const parseAdminEventPayload = (payload: unknown): AdminEvent | null => {
  let parsedPayload: unknown = payload;

  if (typeof payload === "string") {
    try {
      parsedPayload = JSON.parse(payload);
    } catch (error) {
      console.error("Failed to parse ADMIN_EVENT payload", error);
      return null;
    }
  }

  if (typeof parsedPayload !== "object" || parsedPayload === null) {
    return null;
  }

  const parsed = parsedPayload as Record<string, unknown>;

  if (
    parsed.type === "ADMIN_CONNECTED" &&
    typeof parsed.adminId === "string" &&
    typeof parsed.fullName === "string" &&
    typeof parsed.email === "string"
  ) {
    return {
      type: "ADMIN_CONNECTED",
      adminId: parsed.adminId,
      fullName: parsed.fullName,
      email: parsed.email,
    };
  }

  if (
    parsed.type === "ADMIN_DISCONNECTED" &&
    typeof parsed.adminId === "string" &&
    typeof parsed.fullName === "string" &&
    typeof parsed.email === "string"
  ) {
    return {
      type: "ADMIN_DISCONNECTED",
      adminId: parsed.adminId,
      fullName: parsed.fullName,
      email: parsed.email,
    };
  }

  if (parsed.type === "ORDER_CREATED" && typeof parsed.orderId === "string") {
    return { type: "ORDER_CREATED", orderId: parsed.orderId };
  }

  if (
    parsed.type === "ORDER_CONFIRMED" &&
    typeof parsed.orderId === "string"
  ) {
    return { type: "ORDER_CONFIRMED", orderId: parsed.orderId };
  }

  if (
    parsed.type === "ORDER_CANCELED" &&
    typeof parsed.orderId === "string"
  ) {
    return { type: "ORDER_CANCELED", orderId: parsed.orderId };
  }

  if (
    parsed.type === "CRIMINAL_CHECK_SUBMITTED" &&
    typeof parsed.userId === "string"
  ) {
    return {
      type: "CRIMINAL_CHECK_SUBMITTED",
      userId: parsed.userId,
      applicationId:
        typeof parsed.applicationId === "string"
          ? parsed.applicationId
          : undefined,
    };
  }

  if (
    parsed.type === "CRIMINAL_CHECK_APPROVED" &&
    typeof parsed.userId === "string" &&
    typeof parsed.applicationId === "string" &&
    typeof parsed.userName === "string"
  ) {
    return {
      type: "CRIMINAL_CHECK_APPROVED",
      userId: parsed.userId,
      applicationId: parsed.applicationId,
      userName: parsed.userName,
    };
  }

  if (
    parsed.type === "ADMIN_MESSAGE" &&
    typeof parsed.id === "string" &&
    typeof parsed.text === "string" &&
    typeof parsed.senderAdminId === "string" &&
    typeof parsed.senderName === "string" &&
    typeof parsed.createdAt === "string"
  ) {
    return {
      type: "ADMIN_MESSAGE",
      id: parsed.id,
      text: parsed.text,
      senderAdminId: parsed.senderAdminId,
      senderName: parsed.senderName,
      createdAt: parsed.createdAt,
    };
  }

  if (
    parsed.type === "FEEDBACK_CREATED" &&
    typeof parsed.feedbackId === "string"
  ) {
    return { type: "FEEDBACK_CREATED", feedbackId: parsed.feedbackId };
  }

  if (
    parsed.type === "FEEDBACK_RESOLVED" &&
    typeof parsed.feedbackId === "string" &&
    typeof parsed.userId === "string"
  ) {
    return {
      type: "FEEDBACK_RESOLVED",
      feedbackId: parsed.feedbackId,
      userId: parsed.userId,
    };
  }

  if (
    parsed.type === "USER_REPORTED" &&
    typeof parsed.reportId === "string"
  ) {
    return { type: "USER_REPORTED", reportId: parsed.reportId };
  }

  if (
    parsed.type === "REPORT_RESOLVED" &&
    typeof parsed.reportId === "string" &&
    typeof parsed.userId === "string"
  ) {
    return {
      type: "REPORT_RESOLVED",
      reportId: parsed.reportId,
      userId: parsed.userId,
    };
  }

  return null;
};

const mapAdminEvent = (event: AdminEvent): AdminSocketEvent => {
  switch (event.type) {
    case "ADMIN_CONNECTED":
      return {
        ...event,
        title: "Admin connected",
        description: event.fullName || event.email,
      };
    case "ADMIN_DISCONNECTED":
      return {
        ...event,
        title: "Admin disconnected",
        description: event.fullName || event.email,
      };
    case "ORDER_CREATED":
      return {
        ...event,
        title: "New order created",
        description: event.orderId,
        linkHref: `/orders/${event.orderId}`,
        linkLabel: "Open order",
      };
    case "ORDER_CONFIRMED":
      return {
        ...event,
        title: "Order confirmed",
        description: event.orderId,
        linkHref: `/orders/${event.orderId}`,
        linkLabel: "Open order",
      };
    case "ORDER_CANCELED":
      return {
        ...event,
        title: "Order canceled",
        description: event.orderId,
        linkHref: `/orders/${event.orderId}`,
        linkLabel: "Open order",
      };
    case "CRIMINAL_CHECK_SUBMITTED":
      return {
        ...event,
        title: "New criminal check submitted",
        description: event.applicationId ?? event.userId,
        linkHref: `/criminal-check/${event.userId}`,
        linkLabel: "Open criminal check",
      };
    case "CRIMINAL_CHECK_APPROVED":
      return {
        ...event,
        title: "Criminal check approved",
        description: event.userName,
        linkHref: `/criminal-check/${event.userId}`,
        linkLabel: "Open criminal check",
      };
    case "ADMIN_MESSAGE":
      return {
        ...event,
        title: `Message from ${event.senderName}`,
        description: event.text,
        linkHref: "/messages",
        linkLabel: "Open messages",
      };
    case "FEEDBACK_CREATED":
      return {
        ...event,
        title: "New feedback submitted",
        description: event.feedbackId,
        linkHref: `/feedback/${event.feedbackId}`,
        linkLabel: "Open feedback",
      };
    case "FEEDBACK_RESOLVED":
      return {
        ...event,
        title: "Feedback resolved",
        description: event.feedbackId,
        linkHref: `/feedback/${event.feedbackId}`,
        linkLabel: "Open feedback",
      };
    case "USER_REPORTED":
      return {
        ...event,
        title: "New user report submitted",
        description: event.reportId,
        linkHref: `/reports/${event.reportId}`,
        linkLabel: "Open report",
      };
    case "REPORT_RESOLVED":
      return {
        ...event,
        title: "Report resolved",
        description: event.reportId,
        linkHref: `/reports/${event.reportId}`,
        linkLabel: "Open report",
      };
  }
};

export const AdminSocketProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const router = useRouter();
  const listenersRef = useRef(new Set<AdminSocketListener>());
  const socketRef = useRef<Socket | null>(null);
  const recentEventsRef = useRef(new Map<string, number>());
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<AdminSocketEvent | null>(null);
  const subscribe = (listener: AdminSocketListener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  };

  const getEventKey = (event: AdminEvent) => {
    switch (event.type) {
      case "ADMIN_CONNECTED":
      case "ADMIN_DISCONNECTED":
        return `${event.type}:${event.adminId}`;
      case "ORDER_CREATED":
      case "ORDER_CONFIRMED":
      case "ORDER_CANCELED":
        return `${event.type}:${event.orderId}`;
      case "CRIMINAL_CHECK_SUBMITTED":
        return `${event.type}:${event.userId}:${event.applicationId ?? ""}`;
      case "CRIMINAL_CHECK_APPROVED":
        return `${event.type}:${event.userId}:${event.applicationId}`;
      case "ADMIN_MESSAGE":
        return `${event.type}:${event.id}`;
      case "FEEDBACK_CREATED":
        return `${event.type}:${event.feedbackId}`;
      case "FEEDBACK_RESOLVED":
        return `${event.type}:${event.feedbackId}:${event.userId}`;
      case "USER_REPORTED":
        return `${event.type}:${event.reportId}`;
      case "REPORT_RESOLVED":
        return `${event.type}:${event.reportId}:${event.userId}`;
    }
  };

  useEffect(() => {
    if (!router.isReady) return;

    const token = Cookies.get("@user_jwt");
    if (!token) {
      setIsConnected(false);
      socketRef.current = null;
      disconnectAdminSocket();
      return;
    }

    const socket = getOrCreateAdminSocket(token);
    socketRef.current = socket;

    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleConnectError = () => {
      setIsConnected(false);
    };

    const handleAdminEvent = (payload: unknown) => {
      const parsedEvent = parseAdminEventPayload(payload);
      if (!parsedEvent) return;

      const eventKey = getEventKey(parsedEvent);
      const now = Date.now();
      const lastSeenAt = recentEventsRef.current.get(eventKey) ?? 0;
      if (now - lastSeenAt < 3000) {
        return;
      }
      recentEventsRef.current.set(eventKey, now);

      const normalizedEvent = mapAdminEvent(parsedEvent);
      setLastEvent(normalizedEvent);
      listenersRef.current.forEach((listener) => listener(normalizedEvent));

      if (normalizedEvent.type === "ORDER_CREATED") {
        playOrderCreatedSound();
      }

      if (normalizedEvent.type === "ORDER_CONFIRMED") {
        playOrderConfirmedSound();
      }

      if (
        normalizedEvent.type === "ADMIN_CONNECTED" ||
        normalizedEvent.type === "ADMIN_DISCONNECTED"
      ) {
        return;
      }

      toast.info(
        <div>
          <div style={{ fontWeight: 800 }}>{normalizedEvent.title}</div>
          {normalizedEvent.description && (
            <div style={{ marginTop: 4 }}>{normalizedEvent.description}</div>
          )}
          {normalizedEvent.linkHref && normalizedEvent.linkLabel && (
            <button
              type="button"
              style={{
                marginTop: 8,
                padding: 0,
                border: "none",
                background: "transparent",
                color: "#000",
                fontWeight: 800,
                textDecoration: "underline",
                cursor: "pointer",
              }}
              onClick={() => {
                router.push(normalizedEvent.linkHref!);
              }}
            >
              {normalizedEvent.linkLabel}
            </button>
          )}
        </div>,
        {
          autoClose: 10000,
          toastId: eventKey,
        },
      );
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("ADMIN_EVENT", handleAdminEvent);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("ADMIN_EVENT", handleAdminEvent);
    };
  }, [router.isReady]);

  return (
    <AdminSocketContext.Provider
      value={{
        isConnected,
        lastEvent,
        subscribe,
      }}
    >
      {children}
    </AdminSocketContext.Provider>
  );
};

export const useAdminSocket = () => useContext(AdminSocketContext);
