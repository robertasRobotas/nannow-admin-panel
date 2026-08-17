import type { NextConfig } from "next";

const useWebpackDev = process.env.USE_WEBPACK_DEV === "1";
const buildCommitSha =
  process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? "local";
const buildBranch =
  process.env.VERCEL_GIT_COMMIT_REF ?? process.env.GITHUB_REF_NAME ?? "local";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_BUILD_COMMIT_SHA: buildCommitSha.slice(0, 7),
    NEXT_PUBLIC_BUILD_BRANCH: buildBranch,
  },
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
