"""
Migration: Add document_links table for Obsidian-style networked notes.
"""
import asyncio
import os
import asyncpg

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://collab:collab@localhost:5432/collabdb")

SQL = """
CREATE TABLE IF NOT EXISTS document_links (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id  UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    target_id  UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast forward-link (source_id) and back-link (target_id) lookups
CREATE INDEX IF NOT EXISTS idx_doc_links_source ON document_links(source_id);
CREATE INDEX IF NOT EXISTS idx_doc_links_target ON document_links(target_id);

-- Ensure we don't store duplicate links
CREATE UNIQUE INDEX IF NOT EXISTS idx_doc_links_unique ON document_links(source_id, target_id);
"""

async def main():
    print(f"Connecting to {DATABASE_URL}...")
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        await conn.execute(SQL)
        print("✅ Migration: document_links table created.")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
