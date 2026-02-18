-- カウンターの重複排除用テーブル
CREATE TABLE IF NOT EXISTS counter_visits (
  ip_hash TEXT PRIMARY KEY,
  visited_at TEXT NOT NULL
);

-- いいねのIP重複排除用テーブル（1記事につき1IPで1回のみ）
CREATE TABLE IF NOT EXISTS like_actions (
  ip_hash TEXT NOT NULL,
  slug TEXT NOT NULL,
  PRIMARY KEY (ip_hash, slug)
);
