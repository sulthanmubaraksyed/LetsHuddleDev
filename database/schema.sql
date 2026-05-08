-- LetsHuddle Neon PostgreSQL Schema
-- Used for structured reporting and analytics alongside Firestore

-- ─── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Tasks ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  description         TEXT,
  assigned_user_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
  assigned_user_name  TEXT,
  due_date            TIMESTAMPTZ,
  status              TEXT NOT NULL DEFAULT 'not_started'
                        CHECK (status IN ('not_started', 'in_progress', 'completed', 'blocked')),
  created_by          TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_user ON tasks (assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks (due_date);

-- ─── Huddles ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS huddles (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  day         TEXT NOT NULL,
  date        TIMESTAMPTZ NOT NULL,
  location    TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'planned'
                CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  created_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_huddles_status ON huddles (status);
CREATE INDEX IF NOT EXISTS idx_huddles_date ON huddles (date);

-- ─── HuddleTasks (junction) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS huddle_tasks (
  id          TEXT PRIMARY KEY,
  huddle_id   TEXT NOT NULL REFERENCES huddles(id) ON DELETE CASCADE,
  task_id     TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  "order"     INTEGER NOT NULL DEFAULT 0,
  added_by    TEXT REFERENCES users(id) ON DELETE SET NULL,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (huddle_id, task_id)
);

CREATE INDEX IF NOT EXISTS idx_huddle_tasks_huddle ON huddle_tasks (huddle_id);
CREATE INDEX IF NOT EXISTS idx_huddle_tasks_task ON huddle_tasks (task_id);

-- ─── Documents ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id           TEXT PRIMARY KEY,
  task_id      TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  url          TEXT NOT NULL,
  size         BIGINT,
  mime_type    TEXT,
  storage_path TEXT,
  uploaded_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_task ON documents (task_id);

-- ─── Audit Logs ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id             BIGSERIAL PRIMARY KEY,
  entity_type    TEXT NOT NULL CHECK (entity_type IN ('task', 'huddle', 'document', 'user')),
  entity_id      TEXT NOT NULL,
  action         TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'status_changed')),
  previous_value JSONB,
  new_value      JSONB,
  performed_by   TEXT REFERENCES users(id) ON DELETE SET NULL,
  performed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_at ON audit_logs (performed_at);

-- ─── Reporting Views ─────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW task_summary AS
  SELECT
    status,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'completed') AS overdue,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400)::NUMERIC(10,2) AS avg_days_open
  FROM tasks
  GROUP BY status;

CREATE OR REPLACE VIEW huddle_task_stats AS
  SELECT
    h.id AS huddle_id,
    h.name AS huddle_name,
    h.status AS huddle_status,
    h.date,
    COUNT(ht.task_id) AS total_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) AS completed_tasks,
    ROUND(
      100.0 * COUNT(CASE WHEN t.status = 'completed' THEN 1 END) / NULLIF(COUNT(ht.task_id), 0),
      1
    ) AS completion_pct
  FROM huddles h
  LEFT JOIN huddle_tasks ht ON h.id = ht.huddle_id
  LEFT JOIN tasks t ON ht.task_id = t.id
  GROUP BY h.id, h.name, h.status, h.date
  ORDER BY h.date DESC;
