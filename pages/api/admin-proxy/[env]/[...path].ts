import type { NextApiRequest, NextApiResponse } from "next";
import {
  ADMIN_API_CONFIG,
  ADMIN_PROXY_ENV_TO_MODE,
  AdminProxyEnv,
} from "@/helpers/adminApiConfig";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

function queryFromUrl(req: NextApiRequest): string {
  const raw = req.url ?? "";
  const idx = raw.indexOf("?");
  return idx >= 0 ? raw.slice(idx) : "";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (process.env.NODE_ENV === "production") {
    res.status(404).end();
    return;
  }

  const env = req.query.env as AdminProxyEnv;
  if (env !== "prod" && env !== "test") {
    res.status(400).json({ error: "Invalid proxy env" });
    return;
  }

  const pathParam = req.query.path;
  const segments = Array.isArray(pathParam)
    ? pathParam
    : pathParam
      ? [pathParam]
      : [];
  const pathSegment = segments.join("/");

  const mode = ADMIN_PROXY_ENV_TO_MODE[env];
  const upstreamBase = `${ADMIN_API_CONFIG[mode].origin}${ADMIN_API_CONFIG[mode].apiVersion}`;
  const url = `${upstreamBase}/${pathSegment}${queryFromUrl(req)}`;

  const headers: Record<string, string> = {};
  for (const h of [
    "authorization",
    "content-type",
    "accept",
    "accept-language",
  ]) {
    const v = req.headers[h];
    if (v) headers[h] = Array.isArray(v) ? v[0] : v;
  }

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method && !["GET", "HEAD"].includes(req.method)) {
    if (req.body !== undefined && req.body !== null) {
      init.body =
        typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      if (!headers["content-type"]) {
        headers["content-type"] = "application/json";
      }
    }
  }

  const upstreamRes = await fetch(url, init);

  res.status(upstreamRes.status);
  const ct = upstreamRes.headers.get("content-type");
  if (ct) {
    res.setHeader("content-type", ct);
  }

  if (req.method === "HEAD") {
    res.end();
    return;
  }

  const buf = await upstreamRes.arrayBuffer();
  res.send(Buffer.from(buf));
}
