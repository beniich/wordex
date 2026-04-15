import asyncio
import os
import uuid
import asyncpg
import bcrypt
from datetime import datetime

# Connection URL from Environment
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://collab:collab@localhost:5432/collabdb")

async def seed():
    print(f"🚀 [SEEDING] Production Data for Wordex Engine...")
    try:
        conn = await asyncpg.connect(DATABASE_URL)
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return

    try:
        # 1. Create Admin User
        admin_id = uuid.uuid4()
        password = b"aether_2024_secure"
        hashed = bcrypt.hashpw(password, bcrypt.gensalt()).decode('utf-8')
        
        await conn.execute("""
            INSERT INTO users (id, email, username, hashed_pw, provider)
            VALUES ($1, 'admin@wordex.ai', 'AetherAdmin', $2, 'local')
            ON CONFLICT (email) DO UPDATE SET hashed_pw = $2
        """, admin_id, hashed)
        
        # Recover real ID if already exists
        row = await conn.fetchrow("SELECT id FROM users WHERE email = 'admin@wordex.ai'")
        admin_id = row['id']
        print(f"✅ User 'AetherAdmin' Ready.")

        # 2. Create Celestial Atelier Workspace
        ws_id = uuid.uuid4()
        await conn.execute("""
            INSERT INTO workspaces (id, name, slug, description, owner_id, icon, color)
            VALUES ($1, 'Aether Suite', 'aether-suite', 'The primary orchestration node for industrial intelligence.', $2, 'architecture', '#4fd1c5')
            ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description
        """, ws_id, admin_id)
        
        row = await conn.fetchrow("SELECT id FROM workspaces WHERE slug = 'aether-suite'")
        ws_id = row['id']
        print(f"✅ Workspace 'Aether Suite' Ready.")

        # 3. Add owner to workspace members
        await conn.execute("""
            INSERT INTO workspace_members (workspace_id, user_id, role)
            VALUES ($1, $2, 'owner')
            ON CONFLICT DO NOTHING
        """, ws_id, admin_id)

        # 4. Populate with Demo Documents
        docs = [
            (uuid.uuid4(), ws_id, 'Strategic Roadmap.docx', 'note', admin_id, 'Phase 1: Multi-Agent Deployment\nPhase 2: Global Orchestration'),
            (uuid.uuid4(), ws_id, 'Financial Projections.shts', 'spreadsheet', admin_id, None),
            (uuid.uuid4(), ws_id, 'Internal Audit.pdf', 'note', admin_id, 'Audit completed on April 2026.'),
        ]
        
        for d_id, w_id, title, d_type, u_id, content in docs:
            await conn.execute("""
                INSERT INTO documents (id, workspace_id, title, doc_type, created_by, content_text)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT DO NOTHING
            """, d_id, w_id, title, d_type, u_id, content)
        
        print(f"✅ Created {len(docs)} initial documents.")
        
        # 5. Populate Dashboard (Machines)
        machine_id = uuid.uuid4()
        await conn.execute("""
            INSERT INTO machines (id, workspace_id, name, machine_type, status)
            VALUES ($1, $2, 'Press 01 - Alpha', 'hydraulique', 'online')
            ON CONFLICT DO NOTHING
        """, machine_id, ws_id)
        
        print("✅ Demo Machine Data Synchronized.")

    except Exception as e:
        print(f"💥 Error during seeding: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(seed())
