#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="${FIGMA_APP:-/Applications/Figma.app}"
RESOURCES="$APP/Contents/Resources"
NODE="${FIGMA_ZH_NODE:-$ROOT/runtime/node}"

if [[ ! -x "$NODE" ]]; then NODE="$(command -v node || true)"; fi
if [[ -z "$NODE" ]]; then
  echo "未找到 Node.js。请使用 GitHub Release 中对应芯片的完整安装包。"
  exit 1
fi
if [[ ! -d "$APP" ]]; then
  echo "未找到 $APP，请先从 Figma 官网安装桌面版。"
  exit 1
fi

osascript -e 'tell application "Figma" to quit' 2>/dev/null || true
sleep 1
"$NODE" "$ROOT/scripts/figma-zh-cn.mjs" install --resources "$RESOURCES"
codesign --force --deep --sign - "$APP"
codesign --verify --deep --strict "$APP"
echo "安装完成，正在启动 Figma。"
open "$APP"
