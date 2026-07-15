#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="${FIGMA_APP:-/Applications/Figma.app}"
RESOURCES="$APP/Contents/Resources"
NODE="${FIGMA_ZH_NODE:-$ROOT/runtime/node}"
if [[ ! -x "$NODE" ]]; then NODE="$(command -v node || true)"; fi

osascript -e 'tell application "Figma" to quit' 2>/dev/null || true
sleep 1
"$NODE" "$ROOT/scripts/figma-zh-cn.mjs" uninstall --resources "$RESOURCES"
codesign --force --deep --sign - "$APP"
codesign --verify --deep --strict "$APP"
echo "已恢复原版 Figma。"
open "$APP"
