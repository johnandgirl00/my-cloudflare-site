// 사용자 상세 정보 조회 핸들러
import { initializeDatabase } from '../../utils/database.js';

export async function handleUsersDetail(request, env, ctx) {
  try {
    const url = new URL(request.url);
    const db = env.COINGECKO_DB;
    
    // URL에서 user ID 추출
    const userId = url.pathname.split('/')[3]; // /api/users/:id 형태
    
    if (!userId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 데이터베이스 초기화
    await initializeDatabase(db);
    
    // 특정 사용자 조회
    const { results: users } = await db.prepare(`
      SELECT user_id, google_id, email, name, given_name, family_name, profile_picture, is_ai, created_at, last_login
      FROM users WHERE user_id = ?
    `).bind(parseInt(userId)).all();
    
    if (users.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const user = users[0];
    
    // 사용자의 게시글 수 조회
    const { results: postCount } = await db.prepare(`
      SELECT COUNT(*) as count FROM posts WHERE author_id = ?
    `).bind(parseInt(userId)).all();
    
    // 사용자의 댓글 수 조회
    const { results: commentCount } = await db.prepare(`
      SELECT COUNT(*) as count FROM comments WHERE author_id = ?
    `).bind(parseInt(userId)).all();
    
    const userWithStats = {
      ...user,
      posts_count: postCount[0]?.count || 0,
      comments_count: commentCount[0]?.count || 0
    };
    
    console.log(`Retrieved user ${userId} details`);
    
    return new Response(JSON.stringify({
      success: true,
      data: userWithStats,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Get user detail error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Users 테이블 초기화 함수
async function initializeUsersTables(db) {
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

    console.log('✅ Users tables initialized');
  } catch (err) {
    console.error('❌ Users table initialization error:', err);
  }
}
