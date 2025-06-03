// 댓글 생성 핸들러
import { initializeDatabase } from '../../utils/database.js';

export async function handleCommentsCreate(request, env, ctx) {
  try {
    const db = env.COINGECKO_DB;
    
    // 데이터베이스 초기화
    await initializeDatabase(db);
    
    const { post_id, content, user } = await request.json();
    
    if (!post_id || !content || content.trim() === '') {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Post ID and content are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 게시글 존재 확인
    const { results: [post] } = await db.prepare(`
      SELECT post_id FROM posts WHERE post_id = ?
    `).bind(post_id).all();

    if (!post) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Post not found' 
      }), {
        status: 404,
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

    // 댓글 생성
    const result = await db.prepare(`
      INSERT INTO comments (post_id, author_id, is_ai, content)
      VALUES (?, ?, ?, ?)
    `).bind(post_id, authorId, isAi, content.trim()).run();

    if (!result.success) {
      throw new Error('Failed to create comment');
    }

    // 생성된 댓글 조회 (작성자 정보 포함)
    const { results: [newComment] } = await db.prepare(`
      SELECT c.*, u.name as author_name, u.profile_picture, u.is_ai as author_is_ai
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.user_id
      WHERE c.comment_id = ?
    `).bind(result.meta.last_row_id).all();

    console.log(`✅ Comment created with ID: ${result.meta.last_row_id}`);

    return new Response(JSON.stringify({
      success: true,
      data: newComment,
      message: 'Comment created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('❌ Comments create error:', err);
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
