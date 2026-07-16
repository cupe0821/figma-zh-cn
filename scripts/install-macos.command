#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="${FIGMA_APP:-/Applications/Figma.app}"
RESOURCES="$APP/Contents/Resources"
NODE="${FIGMA_ZH_NODE:-$ROOT/runtime/node}"
SIGNING_REQUIREMENT='designated => identifier "com.figma.Desktop"'

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
# The outer app uses a stable local designated requirement. Without this second
# signing pass, ad-hoc signing falls back to a content-specific cdhash and macOS
# treats every translation update as a different app for Keychain access.
codesign --force --sign - -r="$SIGNING_REQUIREMENT" "$APP"
codesign --verify --deep --strict "$APP"
echo "提示：首次从官方签名或旧中文包迁移时，macOS 可能要求重建一次 Figma Key。"
echo "选择“还原为默认”后可能需要重新登录 Figma；后续 cn.5 及更高版本将保持同一指定要求。"
echo "安装完成，正在启动 Figma。"
open "$APP"
