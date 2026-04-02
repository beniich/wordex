#!/bin/bash

# =============================================================================
# 🧪 WORDEX UNIT & INTEGRATION TESTS
# Version: 1.0.0 | Codename: AETHER-TEST
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
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 1. WASP/Rust Tests
test_wasm() {
    log_info "🧪 Testing WASP Cryptographic Enclave (Rust)..."
    cd libs/wasp
    
    # Unit tests in node environment
    if cargo test -- --nocapture; then
        log_success "WASP Unit Tests passed."
    else
        log_error "WASP Unit Tests failed."
        exit 1
    fi
    cd ../..
}

# 2. Backend Tests (Python)
test_backend() {
    log_info "🧪 Testing Backend (FastAPI)..."
    cd back
    
    # Run pytest
    if pytest --cov=app --cov-report=term-missing; then
        log_success "Backend Tests passed with coverage."
    else
        log_error "Backend Tests failed."
        exit 1
    fi
    cd ..
}

# 3. Frontend Tests (React/Next.js)
test_frontend() {
    log_info "🧪 Testing Frontend (Next.js/Jest)..."
    cd front/wordex-app
    
    # Run npm test (assuming it's configured)
    if [ -d "test" ] || [ -f "jest.config.js" ]; then
        if npm test; then
            log_success "Frontend Tests passed."
        else
            log_error "Frontend Tests failed."
            exit 1
        fi
    else
        log_info "No frontend tests found. Skipping."
    fi
    cd ../..
}

# 4. Security Audit
test_security() {
    log_info "🔐 Running Security Audit (AETHER-AUDIT)..."
    
    # Simple check for secrets in git
    if grep -r "password =" . --exclude-dir=".git" --exclude-dir="node_modules" | grep -v "example"; then
        log_error "Critical: Hardcoded passwords found in code. Abort."
        exit 1
    else
        log_success "Security scan passed."
    fi
}

main() {
    test_wasm
    test_backend
    test_frontend
    test_security
    log_success "Wordex Test Sequence Complete. All Aether-Node-01 checks passed."
}

main "$@"
