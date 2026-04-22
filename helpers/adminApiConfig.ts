export type AdminApiMode = "production" | "test";

export const ADMIN_API_CONFIG = {
  production: {
    origin: "https://nannow-api.com",
    apiVersion: "/v1",
    wsTransports: ["websocket"] as const,
  },
  test: {
    origin: "https://nannow-api-test.com",
    // origin: "http://localhost:8080",
    apiVersion: "/v1",
    wsTransports: ["websocket"] as const,
  },
} as const;

export const ADMIN_PROXY_ENV_TO_MODE = {
  prod: "production",
  test: "test",
} as const;

export type AdminProxyEnv = keyof typeof ADMIN_PROXY_ENV_TO_MODE;
