-- Schema for FlowHost database
-- This script creates the necessary table for the application

CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  html_content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  views INTEGER DEFAULT 0
);

-- Index for faster ID lookups
CREATE INDEX IF NOT EXISTS idx_pages_id ON pages(id);
