#!/usr/bin/env bash
# Restarts `next dev` when it exits (OOM, crash, accidental stop in some IDEs).
# Run: npm run dev:forever   — Ctrl+C twice quickly or close the terminal to stop.
set -euo pipefail
cd "$(dirname "$0")/.."
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=8192}"
while true; do
  echo "[dev-forever] starting next dev --turbo ($(date -u +%H:%M:%SZ))"
  npx next dev --turbo || true
  echo "[dev-forever] next exited ($?). Restarting in 3s — press Ctrl+C to stop."
  sleep 3
done
