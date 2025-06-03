// 댓글 목록 조회 핸들러
import { initializeDatabase } from '../../utils/database.js';

export async function handleCommentsList(request, env, ctx) {
  try {
    const url = new URL(request.url);
    const db = env.COINGECKO_DB;
    
    // 데이터베이스 초기화
    await initializeDatabase(db);
    
    // 쿼리 파라미터 처리
    const post_id = url.searchParams.get('post_id');
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const offset = parseInt(url.searchParams.get('offset')) || 0;

    let query = `
      SELECT c.*, u.name as author_name, u.profile_picture, u.is_ai as author_is_ai
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.user_id
    `;
    let bindings = [];

    if (post_id) {
      query += ` WHERE c.post_id = ?`;
      bindings.push(post_id);
    }

    query += ` ORDER BY c.created_at ASC LIMIT ? OFFSET ?`;
    bindings.push(limit, offset);

    const { results: comments } = await db.prepare(query).bind(...bindings).all();

    console.log(`Retrieved ${comments.length} comments from database`);

    return new Response(JSON.stringify({
      success: true,
      data: comments,
      count: comments.length,
      limit: limit,
      offset: offset,
      post_id: post_id || null
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('❌ Comments list error:', err);
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
