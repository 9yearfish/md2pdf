-- Error reports from the app (functions/api/log.js). Never document content.
CREATE TABLE IF NOT EXISTS errors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  kind TEXT NOT NULL,          -- error | rejection | pdf | engine | network | diagram
  message TEXT NOT NULL,
  stack TEXT,
  page TEXT,                   -- path only, e.g. /ja/chatgpt-to-pdf/
  locale TEXT,
  build TEXT,                  -- the deployed build (service-worker cache name)
  engine TEXT,                 -- engine state when it happened
  detail TEXT,                 -- small JSON of non-content facts (template, has math, …)
  ua TEXT,
  country TEXT
);
CREATE INDEX IF NOT EXISTS errors_ts ON errors (ts);
CREATE INDEX IF NOT EXISTS errors_kind_message ON errors (kind, message);
