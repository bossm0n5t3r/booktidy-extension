#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

./scripts/build-addon.sh
./scripts/create-source-archive.sh

echo "Release artifacts created:"
echo "- web-ext-artifacts/*.zip"
echo "- booktidy-extension-source-*.zip"
