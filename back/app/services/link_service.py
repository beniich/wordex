import re
import uuid
import asyncpg
from typing import List, Set

class LinkService:
    # Regex designed to match [[Note Title]] and [[Note Title|Display Text]]
    WIKILINK_PATTERN = re.compile(r'\[\[(.*?)\]\]')

    @staticmethod
    async def extract_and_sync_links(db: asyncpg.Connection, doc_id: str, content: str, workspace_id: str):
        """
        Extracts [[WikiLinks]] from doc content and updates document_links table.
        """
        if not content:
            # Clear links for this document if content is empty
            await db.execute("DELETE FROM document_links WHERE source_id = $1", doc_id)
            return

        matches = LinkService.WIKILINK_PATTERN.findall(content)
        unique_titles = set()
        for m in matches:
            # Handle [[Title|Alias]] case
            title = m.split('|')[0].strip()
            if title:
                unique_titles.add(title)

        if not unique_titles:
            await db.execute("DELETE FROM document_links WHERE source_id = $1", doc_id)
            return

        # 1. Resolve titles to document IDs in the same workspace
        # We only link to documents that currently exist. 
        # Ghost notes are handled in the frontend but stored here only when they exist.
        rows = await db.fetch(
            "SELECT id, title FROM documents WHERE workspace_id = $1 AND title = ANY($2) AND is_deleted = false",
            workspace_id, list(unique_titles)
        )
        
        target_ids = {str(row['id']) for row in rows}

        # 2. Update the links table (Sync)
        # Simple strategy: delete old links and insert new ones in one transaction
        async with db.transaction():
            await db.execute("DELETE FROM document_links WHERE source_id = $1", doc_id)
            for target_id in target_ids:
                if target_id != doc_id: # Avoid self-links
                    await db.execute(
                        "INSERT INTO document_links (source_id, target_id) VALUES ($1, $2)",
                        doc_id, target_id
                    )

    @staticmethod
    async def get_backlinks(db: asyncpg.Connection, doc_id: str):
        """
        Returns a list of documents that link to the target doc_id.
        """
        rows = await db.fetch(
            """SELECT d.id, d.title, d.doc_type, d.updated_at
               FROM document_links l
               JOIN documents d ON d.id = l.source_id
               WHERE l.target_id = $1 AND d.is_deleted = false
               ORDER BY d.updated_at DESC""",
            doc_id
        )
        return [dict(r) for r in rows]

link_service = LinkService()
