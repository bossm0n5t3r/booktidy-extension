#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v node >/dev/null 2>&1; then
    echo "Node.js is required to read package.json." >&2
    exit 1
fi

if ! command -v zip >/dev/null 2>&1; then
    echo "zip is required to create the AMO source archive." >&2
    exit 1
fi

PACKAGE_NAME="$(node -p "require('./package.json').name")"
PACKAGE_VERSION="$(node -p "require('./package.json').version")"
SOURCE_ARCHIVE="${PACKAGE_NAME}-source-${PACKAGE_VERSION}.zip"

rm -f "$SOURCE_ARCHIVE"

zip -r -q "$SOURCE_ARCHIVE" . \
    -x "$SOURCE_ARCHIVE" \
    -x "${PACKAGE_NAME}-source-*.zip" \
    -x ".git/*" \
    -x "node_modules/*" \
    -x "dist/*" \
    -x "dist-ssr/*" \
    -x "web-ext-artifacts/*" \
    -x "coverage/*" \
    -x "playwright-report/*" \
    -x "test-results/*" \
    -x ".turbo/*" \
    -x ".cache/*" \
    -x ".DS_Store"

echo "AMO source archive created: ${SOURCE_ARCHIVE}"
