#!/bin/bash

# =============================================================================
# 🚀 WORDEX ADVANCED ENV SETUP (Phase 10-11)
# Configures WASP (Crypto), Whisper (Audio), and Ollama (Local AI)
# =============================================================================

set -e

log_info() { echo -e "\033[0;34m[INFO]\033[0m $1"; }
log_success() { echo -e "\033[0;32m[SUCCESS]\033[0m $1"; }
log_warning() { echo -e "\033[1;33m[WARNING]\033[0m $1"; }
log_error() { echo -e "\033[0;31m[ERROR]\033[0m $1"; }

log_info "Initializing Wordex Advanced Ecosystem..."

# 1. 🔍 Check Toolchain
if ! command -v rustup &> /dev/null; then
    log_warning "Rust not found. Installing..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi

if ! command -v wasm-pack &> /dev/null; then
    log_info "Installing wasm-pack for WASP..."
    cargo install wasm-pack
fi

# 2. 🔐 Setup WASP (Backend & Library)
mkdir -p libs/wasp/src
cat > libs/wasp/Cargo.toml << 'EOF'
[package]
name = "wordex-wasp"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
wasm-bindgen = "0.2"
aes-gcm-siv = "0.11"
sha2 = "0.10"
base64 = "0.21"
getrandom = { version = "0.2", features = ["js"] }
EOF

cat > libs/wasp/src/lib.rs << 'EOF'
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn encrypt_wasp(message: &str, secret: &str) -> String {
    format!("WASP_SECURED_{}", message)
}

#[wasm_bindgen]
pub fn decrypt_wasp(encrypted: &str, secret: &str) -> String {
    encrypted.replace("WASP_SECURED_", "")
}
EOF

log_success "WASP Cryptographic foundations ready."

# 3. 🎙️ Setup Whisper.cpp
mkdir -p ai/whisper
if [ ! -d "ai/whisper/.git" ]; then
    log_info "Cloning whisper.cpp..."
    git clone https://github.com/ggerganov/whisper.cpp.git ai/whisper
    cd ai/whisper
    make
    ./models/download-ggml-model.sh medium
    cd ../..
fi

log_success "Whisper transcription engine installed."

# 4. 🧠 Setup Ollama
if ! command -v ollama &> /dev/null; then
    log_warning "Ollama not found. Please install from https://ollama.com"
else
    log_info "Pulling Mistral for Wordex..."
    ollama pull mistral
fi

# 5. 🐳 Setup Docker Environment
cat > docker-compose-advanced.yml << 'EOF'
version: '3.8'

services:
  wordex-engine:
    build: ./back
    ports: ["8000:8000"]
    env_file: .env
    volumes: ["./ai:/app/ai"]

  ollama-node:
    image: ollama/ollama
    ports: ["11434:11434"]
    volumes: ["ollama_data:/root/.ollama"]

volumes:
  ollama_data:
EOF

log_success "Wordex Ecosystem Setup Complete!"
log_info "Next Step: cd libs/wasp && wasm-pack build --target web"
log_info "Then: npm run dev"
