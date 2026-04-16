#!/usr/bin/env bash
set -euo pipefail

# ── Variables ─────────────────────────────────────────────────────
LLM_VERSION="v0.2.8"               # dernière version stable (au moment de la rédaction)
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

# URL du binaire :
case "$OS" in
  linux)
    BIN_URL="https://github.com/lmstudio-ai/lm-studio/releases/download/${LLM_VERSION}/lm-studio-linux-${ARCH}.tar.gz"
    ;;
  darwin)
    BIN_URL="https://github.com/lmstudio-ai/lm-studio/releases/download/${LLM_VERSION}/lm-studio-macos-${ARCH}.tar.gz"
    ;;
  msys|cygwin|mingw*)
    BIN_URL="https://github.com/lmstudio-ai/lm-studio/releases/download/${LLM_VERSION}/lm-studio-windows-${ARCH}.zip"
    ;;
  *)
    echo "OS non supporté : $OS"
    exit 1
    ;;
esac

# ── Dossier où seront stockés les binaires ───────────────────────
ROOT_DIR="$(cd "$(dirname "$0")/../" && pwd)"
BIN_DIR="${ROOT_DIR}/external/llm-studio"
mkdir -p "$BIN_DIR"

# ── Téléchargement & extraction ─────────────────────────────────
echo "⇩ Téléchargement de LLM Studio $LLM_VERSION → $BIN_URL"
curl -L "$BIN_URL" -o "${BIN_DIR}/download.tmp"

echo "🗜️ Extraction"
if [[ "$BIN_URL" == *.zip ]]; then
  unzip -qo "${BIN_DIR}/download.tmp" -d "$BIN_DIR"
else
  tar -xzf "${BIN_DIR}/download.tmp" -C "$BIN_DIR"
fi
rm "${BIN_DIR}/download.tmp"

# ── Rendre exécutable (Linux/macOS) ─────────────────────────────
chmod +x "${BIN_DIR}/lm-studio"

# ── Créer la config par défaut (userData) ───────────────────────
CONFIG_PATH="${ROOT_DIR}/electron/userData/lmstudio_config.yaml"
if [ ! -f "$CONFIG_PATH" ]; then
  mkdir -p "$(dirname "$CONFIG_PATH")"
  cat > "$CONFIG_PATH" <<EOF
model_dir: "${ROOT_DIR}/external/models"
backend: "vulkan"      # cpu | vulkan | cuda | metal
max_ctx: 8192
cache_dir: "${ROOT_DIR}/external/cache"
log_level: "info"
EOF
  echo "⚙️ Config par défaut créé → $CONFIG_PATH"
fi

echo "✅ LLM Studio installé dans $BIN_DIR"
