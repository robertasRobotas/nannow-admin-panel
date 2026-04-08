import { io, Socket } from "socket.io-client";
import { getAdminWsBaseUrl, getAdminWsTransports } from "@/pages/api/fetch";

let adminSocket: Socket | null = null;

export const getOrCreateAdminSocket = (token: string) => {
  if (!adminSocket) {
    adminSocket = io(getAdminWsBaseUrl(), {
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
