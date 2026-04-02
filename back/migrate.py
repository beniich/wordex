"""
migrate.py — Ajoute les tables manquantes à la base existante.
Exécuter UNE SEULE FOIS : python migrate.py
"""
import asyncio
import os
import asyncpg

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://collab:collab@localhost:5432/collabdb")

SQL = """
-- ── Dossiers ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS folders (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    parent_id    UUID REFERENCES folders(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    created_by   UUID REFERENCES users(id),
    is_deleted   BOOLEAN DEFAULT false,
    created_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_folders_workspace ON folders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent    ON folders(parent_id);

-- La colonne parent_id des documents référence maintenant les dossiers
-- (elle existait déjà mais pointait sur documents — on garde la compatibilité)
-- On ajoute une colonne folder_id propre si besoin :
ALTER TABLE documents ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;

-- ── Notifications ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id  TEXT NOT NULL,          -- user_id (string pour flexibilité)
    actor_id      TEXT NOT NULL,
    notif_type    TEXT NOT NULL,          -- mention | share | comment | ...
    entity_type   TEXT NOT NULL,          -- document | workspace | file
    entity_id     TEXT NOT NULL,
    entity_title  TEXT,
    message       TEXT,
    is_read       BOOLEAN DEFAULT false,
    created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifs_recipient ON notifications(recipient_id, is_read, created_at DESC);
"""

async def main():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        await conn.execute(SQL)
        print("✅ Migration OK")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
