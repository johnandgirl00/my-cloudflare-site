// 미디어 파일 목록 조회 핸들러
import { initializeDatabase } from '../../utils/database.js';

export async function handleMediaList(request, env, ctx) {
  try {
    const url = new URL(request.url);
    const db = env.COINGECKO_DB;
    
    // 데이터베이스 초기화
    await initializeDatabase(db);
    
    // 쿼리 파라미터 처리
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    const mediaType = url.searchParams.get('media_type'); // 'image', 'video', 'audio', 'document'
    const postId = url.searchParams.get('post_id');
    const commentId = url.searchParams.get('comment_id');
    
    let query = `
      SELECT m.*, u.name as uploader_name, u.profile_picture as uploader_avatar
      FROM media_files m
      LEFT JOIN users u ON m.uploaded_by = u.user_id
    `;
    let queryParams = [];
    let conditions = [];
    
    // 조건 추가
    if (mediaType) {
      conditions.push('m.media_type = ?');
      queryParams.push(mediaType);
    }
    
    if (postId) {
      conditions.push('m.linked_post_id = ?');
      queryParams.push(parseInt(postId));
    }
    
    if (commentId) {
      conditions.push('m.linked_comment_id = ?');
      queryParams.push(parseInt(commentId));
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY m.uploaded_at DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);
    
    const { results: mediaFiles } = await db.prepare(query).bind(...queryParams).all();
    
    console.log(`Retrieved ${mediaFiles.length} media files from database`);
    
    return new Response(JSON.stringify({
      success: true,
      data: mediaFiles,
      count: mediaFiles.length,
      limit: limit,
      offset: offset,
      filters: {
        media_type: mediaType,
        post_id: postId,
        comment_id: commentId
      },
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Get media files error:', error);
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
