import { io, Socket } from "socket.io-client";
import { BASE_URL, getAdminWsTransports } from "@/pages/api/fetch";

let adminSocket: Socket | null = null;

const normalizeSocketBaseUrl = () => {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SOCKET_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    BASE_URL;

  return configuredUrl.replace(/\/v1\/?$/, "");
};

export const getOrCreateAdminSocket = (token: string) => {
  if (!adminSocket) {
    adminSocket = io(normalizeSocketBaseUrl(), {
      path: "/socket.io",
      transports: getAdminWsTransports(),
      autoConnect: false,
      auth: {
        token,
      },
    });
  }

  adminSocket.auth = { token };
  return adminSocket;
};

export const disconnectAdminSocket = () => {
  adminSocket?.disconnect();
  adminSocket = null;
};
