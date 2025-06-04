-- 페르소나 정보 테이블
CREATE TABLE personas (
  id TEXT PRIMARY KEY,
  name TEXT,
  age INTEGER,
  gender TEXT,
  style TEXT,
  tone TEXT,
  bias TEXT,
  topics TEXT,                -- JSON 배열 문자열
  language TEXT,
  slang BOOLEAN,
  posting_hours TEXT,         -- JSON 배열 문자열
  posting_frequency TEXT,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 디스코드 포스팅 기록 테이블
CREATE TABLE discord_posts (
  id TEXT PRIMARY KEY,
  persona_id TEXT,
  content TEXT,
  link TEXT,
  status TEXT,
  posted_at DATETIME,
  FOREIGN KEY (persona_id) REFERENCES personas(id)
);

-- 디스코드 유입 기록 테이블
CREATE TABLE discord_joins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  persona_id TEXT,
  post_id TEXT,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
