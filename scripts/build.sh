#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "Installing dependencies..."
pnpm install --prefer-frozen-lockfile --prefer-offline --loglevel debug --reporter=append-only

echo "Building the Next.js project..."
pnpm exec next build

if [[ "${VERCEL:-}" == "1" ]]; then
    echo "Vercel environment detected, skipping custom server bundle."
else
    echo "Bundling server with tsup..."
    pnpm exec tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --no-minify
fi

echo "Build completed successfully!"
