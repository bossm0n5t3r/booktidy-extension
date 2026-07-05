#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PNPM_VERSION="11.10.0"

cd "$ROOT_DIR"

if ! command -v node >/dev/null 2>&1; then
    echo "Node.js is required. Install Node.js 24.11.1 or newer before running this script." >&2
    exit 1
fi

if command -v corepack >/dev/null 2>&1; then
    corepack enable
    corepack prepare "pnpm@${PNPM_VERSION}" --activate
elif ! command -v pnpm >/dev/null 2>&1; then
    echo "pnpm ${PNPM_VERSION} is required. Install it with: npm install --global pnpm@${PNPM_VERSION}" >&2
    exit 1
fi

PNPM_CURRENT_VERSION="$(pnpm --version)"
if [[ "$PNPM_CURRENT_VERSION" != "$PNPM_VERSION" ]]; then
    echo "pnpm ${PNPM_VERSION} is required, but ${PNPM_CURRENT_VERSION} is installed." >&2
    echo "Install the required version with: npm install --global pnpm@${PNPM_VERSION}" >&2
    exit 1
fi

rm -rf dist web-ext-artifacts

pnpm install --frozen-lockfile
pnpm build
pnpm web-ext:build

echo "Firefox add-on package created in web-ext-artifacts/."
