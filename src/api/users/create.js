// 사용자 생성/로그인 핸들러 (Google OAuth)
import { initializeDatabase } from '../../utils/database.js';

export async function handleUsersCreate(request, env, ctx) {
  try {
    const db = env.COINGECKO_DB;
    await initializeDatabase(db);
    
    const { google_id, email, email_verified, name, given_name, family_name, profile_picture, locale } = await request.json();
    
    if (!email || !google_id) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Missing required fields (email, google_id)' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 기존 사용자 확인
    const { results: existingUsers } = await db.prepare(`
      SELECT * FROM users WHERE google_id = ? OR email = ?
    `).bind(google_id, email).all();

    if (existingUsers.length > 0) {
      // 기존 사용자가 있으면 로그인 시간 업데이트
      await db.prepare(`
        UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?
      `).bind(existingUsers[0].user_id).run();

      return new Response(JSON.stringify({ 
        success: true,
        data: existingUsers[0],
        message: 'User logged in successfully'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 새 사용자 생성
    const result = await db.prepare(`
      INSERT INTO users (google_id, email, email_verified, name, given_name, family_name, profile_picture, locale, last_login)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(google_id, email, email_verified || false, name, given_name, family_name, profile_picture, locale || 'en').run();

    if (!result.success) {
      throw new Error('Failed to create user');
    }

    // 생성된 사용자 조회
    const { results: [newUser] } = await db.prepare(`
      SELECT * FROM users WHERE user_id = ?
    `).bind(result.meta.last_row_id).all();

    return new Response(JSON.stringify({ 
      success: true,
      data: newUser,
      message: 'User created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('❌ Users create error:', err);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: err.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
