// 게시글 상세 조회 핸들러
import { initializeDatabase } from '../../utils/database.js';

export async function handlePostsDetail(request, env, ctx) {
  try {
    const url = new URL(request.url);
    const db = env.COINGECKO_DB;
    
    // URL에서 post ID 추출
    const postId = url.pathname.split('/')[4]; // /api/v2/posts/:id 형태
    
    if (!postId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Post ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 데이터베이스 초기화
    await initializeDatabase(db);
    
    // 특정 포스트 조회 - 사용자 정보와 미디어 정보와 함께
    const { results: posts } = await db.prepare(`
      SELECT p.*, u.name as author_name, u.profile_picture, u.is_ai as author_is_ai,
             m.url as media_url, m.media_type, m.thumbnail_url, m.file_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.user_id
      LEFT JOIN media_files m ON p.media_id = m.media_id
      WHERE p.post_id = ?
    `).bind(parseInt(postId)).all();
    
    if (posts.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Post not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const post = posts[0];
    
    // 해당 포스트의 댓글 조회 - 사용자 정보와 함께
    const { results: comments } = await db.prepare(`
      SELECT c.*, u.name as author_name, u.profile_picture, u.is_ai as author_is_ai
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.user_id
      WHERE c.post_id = ? 
      ORDER BY c.created_at ASC
    `).bind(parseInt(postId)).all();
    
    const postWithComments = {
      ...post,
      comments: comments || []
    };
    
    console.log(`Retrieved post ${postId} with ${comments.length} comments`);
    
    return new Response(JSON.stringify({
      success: true,
      data: postWithComments,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Get post detail error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Posts 테이블 초기화 함수
async function initializePostsTables(db) {
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

    console.log('✅ Posts tables initialized');
  } catch (err) {
    console.error('❌ Posts table initialization error:', err);
  }
}
