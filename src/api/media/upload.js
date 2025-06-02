// 미디어 파일 업로드 핸들러
import { initializeDatabase } from '../../utils/database.js';

export async function handleMediaUpload(request, env, ctx) {
  try {
    const db = env.COINGECKO_DB;
    
    // 데이터베이스 초기화
    await initializeDatabase(db);
    
    const { file_name, file_type, file_size_kb, media_type, url, thumbnail_url, uploaded_by, is_ai, linked_post_id, linked_comment_id } = await request.json();
    
    if (!file_name || !file_type || !media_type || !url) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Missing required fields (file_name, file_type, media_type, url)' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 미디어 파일 정보 저장
    const result = await db.prepare(`
      INSERT INTO media_files (file_name, file_type, file_size_kb, media_type, url, thumbnail_url, uploaded_by, is_ai, linked_post_id, linked_comment_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      file_name, 
      file_type, 
      file_size_kb || null, 
      media_type, 
      url, 
      thumbnail_url || null, 
      uploaded_by || 2, // 기본적으로 anonymous 사용자
      is_ai || false, 
      linked_post_id || null, 
      linked_comment_id || null
    ).run();

    console.log('Media file created:', result.meta.last_row_id);

    // 생성된 미디어 파일 정보 조회
    const { results: mediaFile } = await db.prepare(`
      SELECT * FROM media_files WHERE media_id = ?
    `).bind(result.meta.last_row_id).all();

    return new Response(JSON.stringify({ 
      success: true,
      media: mediaFile[0],
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Upload media error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Media 테이블 초기화 함수
async function initializeMediaTables(db) {
  try {
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
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS posts (
        post_id INTEGER PRIMARY KEY AUTOINCREMENT,
        author_id INTEGER NOT NULL,
        is_ai BOOLEAN DEFAULT FALSE,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        likes_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        media_id INTEGER
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS comments (
        comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        author_id INTEGER NOT NULL,
        is_ai BOOLEAN DEFAULT FALSE,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // 기본 사용자들 생성
    await db.prepare(`
      INSERT OR IGNORE INTO users (user_id, google_id, email, name, is_ai, created_at)
      VALUES (1, 'system-ai', 'ai@cryptogram.local', 'CryptoGram AI', TRUE, CURRENT_TIMESTAMP)
    `).run();

    await db.prepare(`
      INSERT OR IGNORE INTO users (user_id, google_id, email, name, is_ai, created_at)
      VALUES (2, 'anonymous', 'anonymous@cryptogram.local', 'Anonymous', FALSE, CURRENT_TIMESTAMP)
    `).run();

    console.log('✅ Media tables initialized');
  } catch (err) {
    console.error('❌ Media table initialization error:', err);
  }
}
