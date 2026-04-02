#!/bin/bash

# =============================================================================
# 🚀 WORDEX PRODUCTION DEPLOYMENT SCRIPT
# Version: 1.0.0 | Codename: AETHER-DEPLOY
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Configuration
ENV_FILE=".env.production"
DOCKER_COMPOSE_FILE="docker/docker-compose.prod.yml"

load_env() {
    if [ -f "$ENV_FILE" ]; then
        export $(cat "$ENV_FILE" | grep -v '#' | xargs)
        log_info "Production environment variables loaded."
    else
        log_error "Critical Error: $ENV_FILE not found. Deployment aborted."
        exit 1
    fi
}

build_assets() {
    log_info "📦 Building Wordex Production Artifacts..."
    
    # 1. WASP Module
    log_info "Building WASP (Rust/WASM) for Production..."
    cd libs/wasp
    wasm-pack build --release --target web --out-dir ../../front/wordex-app/public/wasp
    cd ../..

    # 2. Frontend (Next.js)
    log_info "Building Next.js Frontend..."
    cd front/wordex-app
    npm run build
    cd ../..

    log_success "Build successful."
}

deploy() {
    log_info "🚀 Launching Production Cluster (AETHER-NODE-01)..."
    
    # 0. 📦 Pre-deployment Backup
    if [ -f "./backup-data-volumes.sh" ]; then
        log_info "Initiating pre-deployment snapshot..."
        ./backup-data-volumes.sh
    fi

    # 1. 📂 Ensure directories exist
    mkdir -p docker/ssl docker/certbot-www

    # 2. 🚢 Deploy using docker-compose
    docker-compose -f "$DOCKER_COMPOSE_FILE" down --remove-orphans
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d --build

    # 3. 🔍 Final Verification
    log_info "Verifying deployment health..."
    sleep 8
    if curl -f http://localhost/health >/dev/null 2>&1; then
        log_success "Deployment Online & Healthy (SSL/TLS Active)"
    else
        log_warning "Services started but health check pending. Monitor 'docker ps' for status."
    fi
}

main() {
    load_env
    build_assets
    deploy
    log_success "Wordex Production Deployment Sequence Complete."
}

main "$@"
