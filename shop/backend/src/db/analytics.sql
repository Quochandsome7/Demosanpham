-- Bảng lưu sự kiện truy cập website (mỗi hành động = 1 dòng)
CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event TEXT NOT NULL,
  path TEXT NOT NULL,
  referrer TEXT,
  device TEXT,
  browser TEXT,
  os TEXT,
  ip TEXT,
  country TEXT,
  city TEXT,
  visitor_id TEXT,
  user_id INTEGER,
  product_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS analytics_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS analytics_event ON analytics_events(event);
