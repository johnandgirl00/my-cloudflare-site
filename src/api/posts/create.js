// 게시글 생성 핸들러
import { initializeDatabase } from '../../utils/database.js';

export async function handlePostsCreate(request, env, ctx) {
  try {
    const db = env.COINGECKO_DB;
    
    // 데이터베이스 초기화
    await initializeDatabase(db);
    
    const { content, user, media_id } = await request.json();
    
    if (!content || content.trim() === '') {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Content is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 사용자 ID 결정
    let authorId = 2; // 기본값: Anonymous 사용자
    let isAi = false;
    
    if (user) {
      if (user.id) {
        authorId = user.id;
      } else if (user.google_id) {
        // Google ID로 사용자 찾기
        const { results: existingUsers } = await db.prepare(`
          SELECT user_id FROM users WHERE google_id = ?
        `).bind(user.google_id).all();
        
        if (existingUsers.length > 0) {
          authorId = existingUsers[0].user_id;
        }
      }
      
      if (user.is_ai) {
        isAi = true;
        authorId = 1; // AI 사용자
      }
    }

    // 게시글 생성
    const result = await db.prepare(`
      INSERT INTO posts (author_id, is_ai, content, media_id)
      VALUES (?, ?, ?, ?)
    `).bind(authorId, isAi, content.trim(), media_id || null).run();

    if (!result.success) {
      throw new Error('Failed to create post');
    }

    // 생성된 게시글 조회 (작성자 정보 포함)
    const { results: [newPost] } = await db.prepare(`
      SELECT p.*, u.name as author_name, u.profile_picture, u.is_ai as author_is_ai,
             m.url as media_url, m.media_type, m.thumbnail_url
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.user_id
      LEFT JOIN media_files m ON p.media_id = m.media_id
      WHERE p.post_id = ?
    `).bind(result.meta.last_row_id).all();

    console.log(`✅ Post created with ID: ${result.meta.last_row_id}`);

    return new Response(JSON.stringify({
      success: true,
      data: newPost,
      message: 'Post created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('❌ Posts create error:', err);
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
