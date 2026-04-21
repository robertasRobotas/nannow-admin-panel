import type { NextConfig } from "next";

const useWebpackDev = process.env.USE_WEBPACK_DEV === "1";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  ...(useWebpackDev
    ? {
        webpack: (config, { dev }) => {
          if (dev) config.cache = false;
          return config;
        },
      }
    : {}),
};

export default nextConfig;
