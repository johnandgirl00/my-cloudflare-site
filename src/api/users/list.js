// 사용자 목록 조회 핸들러
import { initializeDatabase } from '../../utils/database.js';

export async function handleUsersList(request, env, ctx) {
  try {
    const url = new URL(request.url);
    const db = env.COINGECKO_DB;
    
    // 데이터베이스 초기화
    await initializeDatabase(db);
    
    // 쿼리 파라미터 처리
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    const includeAI = url.searchParams.get('include_ai') === 'true';
    
    let query;
    let queryParams;
    
    if (includeAI) {
      // AI 사용자 포함
      query = `
        SELECT user_id, google_id, email, name, given_name, family_name, profile_picture, is_ai, created_at, last_login
        FROM users 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      queryParams = [limit, offset];
    } else {
      // 실제 사용자만
      query = `
        SELECT user_id, google_id, email, name, given_name, family_name, profile_picture, is_ai, created_at, last_login
        FROM users 
        WHERE is_ai = FALSE
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      queryParams = [limit, offset];
    }
    
    const { results: users } = await db.prepare(query).bind(...queryParams).all();
    
    console.log(`Retrieved ${users.length} users from database`);
    
    return new Response(JSON.stringify({
      success: true,
      data: users,
      count: users.length,
      limit: limit,
      offset: offset,
      includeAI: includeAI,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Get users error:', error);
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
