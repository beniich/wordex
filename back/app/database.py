import asyncpg
import os
from typing import AsyncGenerator

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/collabdb")

_pool: asyncpg.Pool = None

async def init_db():
    global _pool
    _pool = await asyncpg.create_pool(DATABASE_URL, min_size=5, max_size=20)
    await _create_tables()

async def get_db() -> AsyncGenerator[asyncpg.Connection, None]:
    async with _pool.acquire() as conn:
        yield conn

def get_db_pool() -> asyncpg.Pool:
    return _pool

async def _create_tables():
    async with _pool.acquire() as conn:
        await conn.execute("""
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
            CREATE EXTENSION IF NOT EXISTS "pgcrypto";

            -- Users
            CREATE TABLE IF NOT EXISTS users (
                id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                email       TEXT UNIQUE NOT NULL,
                username    TEXT UNIQUE NOT NULL,
                hashed_pw   TEXT,
                avatar_url  TEXT,
                provider    TEXT DEFAULT 'local',   -- 'local' | 'google' | 'github'
                provider_id TEXT,
                created_at  TIMESTAMPTZ DEFAULT now(),
                updated_at  TIMESTAMPTZ DEFAULT now()
            );

            -- Workspaces
            CREATE TABLE IF NOT EXISTS workspaces (
                id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name        TEXT NOT NULL,
                slug        TEXT UNIQUE NOT NULL,
                description TEXT,
                icon        TEXT DEFAULT 'architecture',
                color       TEXT DEFAULT '#894d0d',
                owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at  TIMESTAMPTZ DEFAULT now()
            );

            -- Workspace members
            CREATE TABLE IF NOT EXISTS workspace_members (
                workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
                user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
                role         TEXT DEFAULT 'viewer',   -- 'owner' | 'editor' | 'viewer'
                joined_at    TIMESTAMPTZ DEFAULT now(),
                PRIMARY KEY (workspace_id, user_id)
            );

            -- Documents
            CREATE TABLE IF NOT EXISTS documents (
                id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
                parent_id    UUID REFERENCES documents(id) ON DELETE SET NULL,
                title        TEXT NOT NULL DEFAULT 'Untitled',
                content      JSONB,
                content_text TEXT,                      -- for full-text search
                doc_type     TEXT DEFAULT 'note',       -- 'note' | 'spreadsheet' | 'presentation'
                created_by   UUID REFERENCES users(id),
                updated_by   UUID REFERENCES users(id),
                is_deleted   BOOLEAN DEFAULT false,
                created_at   TIMESTAMPTZ DEFAULT now(),
                updated_at   TIMESTAMPTZ DEFAULT now(),
                search_vec   TSVECTOR
                    GENERATED ALWAYS AS (
                        to_tsvector('french', coalesce(title, '') || ' ' || coalesce(content_text, ''))
                    ) STORED
            );

            CREATE INDEX IF NOT EXISTS idx_documents_search ON documents USING GIN(search_vec);
            CREATE INDEX IF NOT EXISTS idx_documents_workspace ON documents(workspace_id);

            -- Document versions
            CREATE TABLE IF NOT EXISTS document_versions (
                id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
                content     JSONB,
                saved_by    UUID REFERENCES users(id),
                version     INT NOT NULL,
                created_at  TIMESTAMPTZ DEFAULT now()
            );

            -- Files / attachments
            CREATE TABLE IF NOT EXISTS files (
                id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
                document_id  UUID REFERENCES documents(id) ON DELETE SET NULL,
                filename     TEXT NOT NULL,
                storage_key  TEXT NOT NULL,              -- MinIO object key
                mime_type    TEXT,
                size_bytes   BIGINT,
                uploaded_by  UUID REFERENCES users(id),
                created_at   TIMESTAMPTZ DEFAULT now()
            );

            -- Document permissions (fine-grained)
            CREATE TABLE IF NOT EXISTS document_permissions (
                document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
                user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
                role        TEXT DEFAULT 'viewer',
                PRIMARY KEY (document_id, user_id)
            );

            -- Comments
            CREATE TABLE IF NOT EXISTS comments (
                id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
                author_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                parent_id   UUID REFERENCES comments(id) ON DELETE CASCADE,
                content     TEXT NOT NULL,
                anchor_from INT,                  -- character offset for inline selection
                anchor_to   INT,
                resolved    BOOLEAN DEFAULT false,
                created_at  TIMESTAMPTZ DEFAULT now()
            );

            CREATE INDEX IF NOT EXISTS idx_comments_document ON comments(document_id);

            -- Gantt Tasks
            CREATE TABLE IF NOT EXISTS gantt_tasks (
                id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                document_id  UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
                parent_id    UUID REFERENCES gantt_tasks(id) ON DELETE CASCADE,
                name         TEXT NOT NULL,
                task_type    TEXT DEFAULT 'task',
                start_date   DATE NOT NULL,
                end_date     DATE NOT NULL,
                progress     INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
                priority     TEXT DEFAULT 'medium',
                assignee_ids UUID[] DEFAULT '{}',
                color        TEXT,
                position     INT DEFAULT 0,
                is_collapsed BOOLEAN DEFAULT false,
                created_at   TIMESTAMPTZ DEFAULT now(),
                updated_at   TIMESTAMPTZ DEFAULT now()
            );

            -- Gantt Dependencies
            CREATE TABLE IF NOT EXISTS gantt_dependencies (
                from_task_id UUID REFERENCES gantt_tasks(id) ON DELETE CASCADE,
                to_task_id   UUID REFERENCES gantt_tasks(id) ON DELETE CASCADE,
                dep_type     TEXT DEFAULT 'finish_to_start',
                PRIMARY KEY (from_task_id, to_task_id)
            );

            -- Gantt Resources
            CREATE TABLE IF NOT EXISTS gantt_resources (
                id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                document_id   UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
                name          TEXT NOT NULL,
                resource_type TEXT DEFAULT 'human',
                capacity      INT DEFAULT 100,
                color         TEXT DEFAULT '#A67B5B',
                status        TEXT DEFAULT 'online'
            );

            -- Gantt Task Resources Allocation
            CREATE TABLE IF NOT EXISTS gantt_task_resources (
                task_id      UUID REFERENCES gantt_tasks(id) ON DELETE CASCADE,
                resource_id  UUID REFERENCES gantt_resources(id) ON DELETE CASCADE,
                allocated    INT DEFAULT 100,
                PRIMARY KEY (task_id, resource_id)
            );

            CREATE INDEX IF NOT EXISTS idx_gantt_tasks_document ON gantt_tasks(document_id);
            CREATE INDEX IF NOT EXISTS idx_gantt_tasks_parent   ON gantt_tasks(parent_id);
            CREATE INDEX IF NOT EXISTS idx_gantt_tasks_dates    ON gantt_tasks(start_date, end_date);

            -- Dashboard: Machines
            CREATE TABLE IF NOT EXISTS machines (
                id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
                name        TEXT NOT NULL,
                machine_type TEXT DEFAULT 'press',
                location    TEXT,
                status      TEXT DEFAULT 'online',
                created_at  TIMESTAMPTZ DEFAULT now()
            );

            -- Dashboard: Machine Metrics
            CREATE TABLE IF NOT EXISTS machine_metrics (
                id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                machine_id  UUID REFERENCES machines(id) ON DELETE CASCADE,
                recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                availability INT CHECK (availability BETWEEN 0 AND 100),
                performance  INT CHECK (performance BETWEEN 0 AND 100),
                quality      INT CHECK (quality BETWEEN 0 AND 100),
                oee          INT GENERATED ALWAYS AS (availability * performance * quality / 10000) STORED,
                shift        TEXT DEFAULT 'morning'
            );

            -- Dashboard: Production runs
            CREATE TABLE IF NOT EXISTS production_runs (
                id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
                machine_id  UUID REFERENCES machines(id),
                shift       TEXT NOT NULL,
                target_lots INT DEFAULT 250,
                actual_lots INT DEFAULT 0,
                date        DATE DEFAULT CURRENT_DATE
            );

            -- Dashboard: AMDEC failures
            CREATE TABLE IF NOT EXISTS amdec_failures (
                id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
                machine_id  UUID REFERENCES machines(id),
                mode        TEXT NOT NULL,
                severity    INT CHECK (severity BETWEEN 1 AND 10),
                occurrence  INT CHECK (occurrence BETWEEN 1 AND 10),
                detection   INT CHECK (detection BETWEEN 1 AND 10),
                rpn         INT GENERATED ALWAYS AS (severity * occurrence * detection) STORED,
                status      TEXT DEFAULT 'open',
                created_at  TIMESTAMPTZ DEFAULT now()
            );

            CREATE INDEX IF NOT EXISTS idx_machine_metrics_machine ON machine_metrics(machine_id, recorded_at DESC);
            CREATE INDEX IF NOT EXISTS idx_production_runs_date ON production_runs(workspace_id, date DESC);

            -- AI Chat Sessions
            CREATE TABLE IF NOT EXISTS ai_chat_sessions (
                id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
                document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
                agent       TEXT DEFAULT 'general',
                title       TEXT,
                messages    JSONB NOT NULL DEFAULT '[]',
                tokens_used INT DEFAULT 0,
                created_at  TIMESTAMPTZ DEFAULT now(),
                updated_at  TIMESTAMPTZ DEFAULT now()
            );

            CREATE INDEX IF NOT EXISTS idx_ai_sessions_user ON ai_chat_sessions(user_id, updated_at DESC);
            CREATE INDEX IF NOT EXISTS idx_ai_sessions_doc ON ai_chat_sessions(document_id);

            -- Webhooks
            CREATE TABLE IF NOT EXISTS webhooks (
                id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
                name         TEXT,
                url          TEXT NOT NULL,
                events       TEXT[] NOT NULL,
                secret       TEXT NOT NULL,
                active       BOOLEAN DEFAULT true,
                created_at   TIMESTAMPTZ DEFAULT now()
            );

            -- Analytics: Spreadsheet to KPI Variables
            CREATE TABLE IF NOT EXISTS analytics_variables (
                id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
                kpi_name     TEXT NOT NULL,
                source_doc   UUID REFERENCES documents(id),
                cell_range   TEXT,
                aggregation  TEXT DEFAULT 'sum',
                created_at   TIMESTAMPTZ DEFAULT now()
            );

            -- Webhook deliveries
            CREATE TABLE IF NOT EXISTS webhook_deliveries (
                id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                webhook_id  UUID REFERENCES webhooks(id) ON DELETE CASCADE,
                event_type  TEXT,
                status_code INT,
                success     BOOLEAN,
                response    TEXT,
                delivered_at TIMESTAMPTZ DEFAULT now()
            );
        """)
