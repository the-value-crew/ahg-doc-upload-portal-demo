-- 0001_init.sql: D1 Schema Initialization
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS app_config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS industries (
  key   TEXT PRIMARY KEY,
  label TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS merchants (
  id         TEXT PRIMARY KEY,                       -- GHL opportunity id, 20 alnum chars
  name       TEXT NOT NULL,
  industry   TEXT NOT NULL REFERENCES industries(key),
  status     INTEGER NOT NULL DEFAULT 1 CHECK (status BETWEEN 1 AND 5),
  processor  TEXT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
  merchant_id         TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  document_type       INTEGER NOT NULL,
  status              INTEGER NOT NULL DEFAULT 1 CHECK (status IN (1, 2, 3)),
  note                TEXT NULL,                            -- rejection reason / reviewer note
  uploaded_at         TEXT NOT NULL,
  status_updated_at   TEXT NOT NULL,
  filename            TEXT,
  sharepoint_item_id  TEXT,
  PRIMARY KEY (merchant_id, document_type)
);

CREATE INDEX IF NOT EXISTS idx_documents_uploaded ON documents(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_merchants_status ON merchants(status);
