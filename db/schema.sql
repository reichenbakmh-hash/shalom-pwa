PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE,
  display_name  TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS daily_verses (
  id          TEXT PRIMARY KEY,
  date        TEXT NOT NULL UNIQUE,      
  reference   TEXT NOT NULL,
  text        TEXT NOT NULL,
  meditation  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reading_progress (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id),
  book_id       TEXT NOT NULL,
  chapter_number INTEGER NOT NULL,
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS prayers (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id),
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  category      TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'reponse')),
  favorite      INTEGER NOT NULL DEFAULT 0,
  reminder_at   TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_prayers_user ON prayers(user_id);

CREATE TABLE IF NOT EXISTS prayer_responses (
  id          TEXT PRIMARY KEY,
  prayer_id   TEXT NOT NULL REFERENCES prayers(id) ON DELETE CASCADE,
  note        TEXT,
  answered_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id),
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  category    TEXT,
  tags        TEXT,                     
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_journal_user ON journal_entries(user_id);

CREATE TABLE IF NOT EXISTS meditation_sessions (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users(id),
  theme_id          TEXT,
  duration_minutes  INTEGER NOT NULL,
  reflection        TEXT,
  completed_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS favorites (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id),
  reference   TEXT NOT NULL,
  text        TEXT NOT NULL,
  saved_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS spiritual_progress (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users(id) UNIQUE,
  journey_day_count INTEGER NOT NULL DEFAULT 0,
  last_completed_at TEXT,
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id),
  kind        TEXT NOT NULL CHECK (kind IN ('dailyVerse', 'reading', 'prayer', 'meditation', 'journey')),
  enabled     INTEGER NOT NULL DEFAULT 1,
  time        TEXT NOT NULL DEFAULT '07:00'
);
