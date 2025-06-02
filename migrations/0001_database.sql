-- Migration: Complete database setup
-- Date: 2025-06-02
-- Description: Complete database structure for CryptoGram application

-- ====================================
-- DROP OLD TABLES (clean slate)
-- ====================================

-- Drop old tables that we don't need anymore
DROP TABLE IF EXISTS coin_prices;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS prices;

-- Drop any old triggers
DROP TRIGGER IF EXISTS update_comments_count_insert;
DROP TRIGGER IF EXISTS update_comments_count_delete;

-- ====================================
-- CREATE NEW TABLES
-- ====================================

-- 0. Coin market data table - for cryptocurrency data
CREATE TABLE IF NOT EXISTS coin_market_data (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  image TEXT,
  current_price REAL,
  market_cap REAL,
  market_cap_rank INTEGER,
  total_volume REAL,
  high_24h REAL,
  low_24h REAL,
  price_change_percentage_24h REAL,
  circulating_supply REAL,
  max_supply REAL,
  ath REAL,  -- All Time High
  atl REAL,  -- All Time Low
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 1. Users table - for Google OAuth and user management
CREATE TABLE IF NOT EXISTS users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  google_id TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  name TEXT,
  given_name TEXT,
  family_name TEXT,
  profile_picture TEXT,
  locale TEXT DEFAULT 'en',
  is_ai BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);

-- 2. Media files table - for file management
CREATE TABLE IF NOT EXISTS media_files (
  media_id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_kb INTEGER,
  media_type TEXT NOT NULL, -- 'image', 'video', 'audio', 'document'
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  uploaded_by INTEGER,
  is_ai BOOLEAN DEFAULT FALSE,
  linked_post_id INTEGER,
  linked_comment_id INTEGER,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(user_id),
  FOREIGN KEY (linked_post_id) REFERENCES posts(post_id),
  FOREIGN KEY (linked_comment_id) REFERENCES comments(comment_id)
);

-- 3. Posts table - clean and simple
CREATE TABLE IF NOT EXISTS posts (
  post_id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id INTEGER NOT NULL,
  is_ai BOOLEAN DEFAULT FALSE,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  media_id INTEGER,
  FOREIGN KEY (author_id) REFERENCES users(user_id),
  FOREIGN KEY (media_id) REFERENCES media_files(media_id)
);

-- 4. Comments table - clean and simple
CREATE TABLE IF NOT EXISTS comments (
  comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  author_id INTEGER NOT NULL,
  is_ai BOOLEAN DEFAULT FALSE,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(user_id)
);

-- ====================================
-- CREATE INDEXES FOR PERFORMANCE
-- ====================================

-- Coin market data indexes
CREATE INDEX IF NOT EXISTS idx_coin_market_data_symbol ON coin_market_data(symbol);
CREATE INDEX IF NOT EXISTS idx_coin_market_data_rank ON coin_market_data(market_cap_rank);
CREATE INDEX IF NOT EXISTS idx_coin_market_data_updated ON coin_market_data(last_updated);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_ai ON users(is_ai);

-- Media files indexes
CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_linked_post ON media_files(linked_post_id);
CREATE INDEX IF NOT EXISTS idx_media_linked_comment ON media_files(linked_comment_id);
CREATE INDEX IF NOT EXISTS idx_media_type ON media_files(media_type);

-- Posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_is_ai ON posts(is_ai);
CREATE INDEX IF NOT EXISTS idx_posts_likes_count ON posts(likes_count);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- ====================================
-- CREATE TRIGGERS FOR AUTO UPDATES
-- ====================================

-- Trigger to update comments_count when comment is added
CREATE TRIGGER IF NOT EXISTS update_comments_count_insert
AFTER INSERT ON comments
BEGIN
  UPDATE posts 
  SET comments_count = (
    SELECT COUNT(*) FROM comments WHERE post_id = NEW.post_id
  )
  WHERE post_id = NEW.post_id;
END;

-- Trigger to update comments_count when comment is deleted
CREATE TRIGGER IF NOT EXISTS update_comments_count_delete
AFTER DELETE ON comments
BEGIN
  UPDATE posts 
  SET comments_count = (
    SELECT COUNT(*) FROM comments WHERE post_id = OLD.post_id
  )
  WHERE post_id = OLD.post_id;
END;

-- Trigger to update last_login when user activity is detected
-- (This would be called manually from the application logic)

-- ====================================
-- INSERT DEFAULT DATA
-- ====================================

-- Create AI user for system-generated content
INSERT OR IGNORE INTO users (user_id, google_id, email, name, is_ai, created_at)
VALUES (1, 'system-ai', 'ai@cryptogram.local', 'CryptoGram AI', TRUE, CURRENT_TIMESTAMP);

-- Create anonymous user for guest posts
INSERT OR IGNORE INTO users (user_id, google_id, email, name, is_ai, created_at)
VALUES (2, 'anonymous', 'anonymous@cryptogram.local', 'Anonymous', FALSE, CURRENT_TIMESTAMP);
