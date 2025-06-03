// 게시글 목록 조회 핸들러
import { initializeDatabase } from '../../utils/database.js';

export async function handlePostsList(request, env, ctx) {
  try {
    const url = new URL(request.url);
    const db = env.COINGECKO_DB;
    
    // 데이터베이스 초기화
    await initializeDatabase(db);
    
    // 쿼리 파라미터 처리
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    const withComments = url.searchParams.get('comments') !== 'false';
    
    // 포스트 조회 - 사용자 정보와 미디어 정보와 함께
    const { results: posts } = await db.prepare(`
      SELECT p.*, u.name as author_name, u.profile_picture, u.is_ai as author_is_ai,
             m.url as media_url, m.media_type, m.thumbnail_url, m.file_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.user_id
      LEFT JOIN media_files m ON p.media_id = m.media_id
      ORDER BY p.created_at DESC 
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();
    
    let postsWithComments = posts;
    
    // 댓글 포함 여부 확인
    if (withComments) {
      postsWithComments = await Promise.all(posts.map(async (post) => {
        const { results: comments } = await db.prepare(`
          SELECT c.*, u.name as author_name, u.profile_picture, u.is_ai as author_is_ai
          FROM comments c
          LEFT JOIN users u ON c.author_id = u.user_id
          WHERE c.post_id = ? 
          ORDER BY c.created_at ASC
        `).bind(post.post_id).all();
        
        return {
          ...post,
          comments: comments || []
        };
      }));
    }

    console.log(`Retrieved ${postsWithComments.length} posts from database`);

    return new Response(JSON.stringify({
      success: true,
      data: postsWithComments,
      count: postsWithComments.length,
      limit: limit,
      offset: offset,
      hasMore: postsWithComments.length === limit
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('❌ Posts list error:', err);
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
