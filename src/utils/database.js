// 공통 데이터베이스 초기화 유틸리티

export async function initializeDatabase(db) {
  try {
    console.log('🔄 Database initialization started...');
    
    // 마이그레이션 실행
    await runMigration(db);
    
    console.log('✅ Database initialization completed');
    return true;
  } catch (err) {
    console.error('❌ Database initialization error:', err);
    throw err;
  }
}

async function runMigration(db) {
  // 0001_database.sql 마이그레이션 실행
  
  // ====================================
  // DROP OLD TABLES (clean slate)
  // ====================================
  
  // Drop old tables that we don't need anymore
  await db.prepare(`DROP TABLE IF EXISTS coin_prices`).run();
  await db.prepare(`DROP TABLE IF EXISTS prices`).run();
  
  // Drop any old triggers
  await db.prepare(`DROP TRIGGER IF EXISTS update_comments_count_insert`).run();
  await db.prepare(`DROP TRIGGER IF EXISTS update_comments_count_delete`).run();

  // ====================================
  // CREATE NEW TABLES
  // ====================================

  // 0. Coin market data table
  await db.prepare(`
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
      ath REAL,
      atl REAL,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // 1. Users table
  await db.prepare(`
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
    )
  `).run();

  // 2. Media files table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS media_files (
      media_id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size_kb INTEGER,
      media_type TEXT NOT NULL,
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
    )
  `).run();

  // 3. Posts table
  await db.prepare(`
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
    )
  `).run();

  // 4. Comments table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS comments (
      comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      author_id INTEGER NOT NULL,
      is_ai BOOLEAN DEFAULT FALSE,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(user_id)
    )
  `).run();

  // ====================================
  // CREATE INDEXES FOR PERFORMANCE
  // ====================================

  // Coin market data indexes
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_coin_market_data_symbol ON coin_market_data(symbol)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_coin_market_data_rank ON coin_market_data(market_cap_rank)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_coin_market_data_updated ON coin_market_data(last_updated)`).run();

  // Users indexes
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_users_is_ai ON users(is_ai)`).run();

  // Media files indexes
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media_files(uploaded_by)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_media_linked_post ON media_files(linked_post_id)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_media_linked_comment ON media_files(linked_comment_id)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_media_type ON media_files(media_type)`).run();

  // Posts indexes
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_posts_is_ai ON posts(is_ai)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_posts_likes_count ON posts(likes_count)`).run();

  // Comments indexes
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at)`).run();

  // ====================================
  // CREATE TRIGGERS FOR AUTO UPDATES
  // ====================================

  // Trigger to update comments_count when comment is added
  await db.prepare(`
    CREATE TRIGGER IF NOT EXISTS update_comments_count_insert
    AFTER INSERT ON comments
    BEGIN
      UPDATE posts 
      SET comments_count = (
        SELECT COUNT(*) FROM comments WHERE post_id = NEW.post_id
      )
      WHERE post_id = NEW.post_id;
    END
  `).run();

  // Trigger to update comments_count when comment is deleted
  await db.prepare(`
    CREATE TRIGGER IF NOT EXISTS update_comments_count_delete
    AFTER DELETE ON comments
    BEGIN
      UPDATE posts 
      SET comments_count = (
        SELECT COUNT(*) FROM comments WHERE post_id = OLD.post_id
      )
      WHERE post_id = OLD.post_id;
    END
  `).run();

  // ====================================
  // INSERT DEFAULT DATA
  // ====================================

  // Create AI user for system-generated content
  await db.prepare(`
    INSERT OR IGNORE INTO users (user_id, google_id, email, name, is_ai, created_at)
    VALUES (1, 'system-ai', 'ai@cryptogram.local', 'CryptoGram AI', TRUE, CURRENT_TIMESTAMP)
  `).run();

  // Create anonymous user for guest posts
  await db.prepare(`
    INSERT OR IGNORE INTO users (user_id, google_id, email, name, is_ai, created_at)
    VALUES (2, 'anonymous', 'anonymous@cryptogram.local', 'Anonymous', FALSE, CURRENT_TIMESTAMP)
  `).run();

  console.log('✅ Database migration completed successfully');
}
