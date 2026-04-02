#!/bin/bash

# =============================================================================
# 📦 WORDEX DATA BACKUP SYSTEM (AETHER-ARCHIVE)
# Version: 1.0.0 | Codename: AETHER-BACKUP
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
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE_NAME="wordex_backup_$TIMESTAMP.tar.gz"

# List of Docker volumes to backup
VOLUMES=(
  "wordex_pg_data"
  "wordex_redis_data"
  "wordex_ollama_data"
  "wordex_minio_data"
  "wordex_backend_data"
)

mkdir -p "$BACKUP_DIR"

log_info "🔍 Starting AETHER-BACKUP sequence..."

# 1. 🛑 Optional: Pause services for database consistency
# log_info "Pausing Wordex Engine for data consistency..."
# docker-compose pause db redis

# 2. 🏗️ Create Backups
for VOLUME in "${VOLUMES[@]}"; do
    if docker volume inspect "$VOLUME" >/dev/null 2>&1; then
        log_info "📦 Archiving volume: $VOLUME..."
        docker run --rm -v "$VOLUME":/volume -v "$(pwd)/$BACKUP_DIR":/backup alpine \
            sh -c "tar -czf /backup/${VOLUME}_$TIMESTAMP.tar.gz -C /volume ."
        log_success "Created: ${VOLUME}_$TIMESTAMP.tar.gz"
    else
        log_warning "Volume $VOLUME not found. Skipping."
    fi
done

# 3. 🏁 Resume services
# docker-compose unpause db redis

# 4. 🗜️ Consolidate into single master archive
log_info "Consolidating master archive: $ARCHIVE_NAME..."
cd "$BACKUP_DIR"
tar -czf "$ARCHIVE_NAME" *_$TIMESTAMP.tar.gz
rm *_$TIMESTAMP.tar.gz
cd ..

log_success "Wordex AETHER-BACKUP Complete! Master Archive: $BACKUP_DIR/$ARCHIVE_NAME"

# 💡 Recovery Instruction
log_info "--------------------------------------------------------"
log_info "💡 TO RECOVER A VOLUME:"
log_info "docker run --rm -v <volume-name>:/volume -v \$(pwd)/backups:/backup alpine \\"
log_info "  sh -c \"tar -xzf /backup/<archive-name>.tar.gz -C /volume\""
log_info "--------------------------------------------------------"
