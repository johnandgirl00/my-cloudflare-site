// 테이블 초기화 함수
async function initializeTables(env) {
  try {
    await env.COINGECKO_DB.prepare(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        user_name TEXT,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await env.COINGECKO_DB.prepare(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER,
        user_id INTEGER,
        user_name TEXT,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    console.log('✅ Community tables initialized');
  } catch (err) {
    console.error('❌ Table initialization error:', err);
  }
}

export async function handleGetPosts(request, env) {
  try {
    await initializeTables(env);
    
    // 포스트 조회
    const { results: posts } = await env.COINGECKO_DB.prepare(`
      SELECT * FROM posts ORDER BY created_at DESC LIMIT 20
    `).all();
    
    // 각 포스트에 대한 댓글 조회
    const postsWithComments = await Promise.all(posts.map(async (post) => {
      const { results: comments } = await env.COINGECKO_DB.prepare(`
        SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC
      `).bind(post.id).all();
      
      return {
        ...post,
        comments: comments || []
      };
    }));
    
    return new Response(JSON.stringify(postsWithComments), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Get posts error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function handleCreatePost(request, env) {
  try {
    await initializeTables(env);
    
    const { content, user } = await request.json();
    
    if (!content || !user) {
      return new Response(JSON.stringify({ error: 'Missing content or user' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await env.COINGECKO_DB.prepare(`
      INSERT INTO posts (user_id, user_name, content)
      VALUES (?, ?, ?)
    `).bind(user.id, user.name, content).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Create post error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function handleCreateComment(request, env) {
  try {
    await initializeTables(env);
    
    const url = new URL(request.url);
    const postId = url.pathname.split('/')[3];
    const { content, user } = await request.json();
    
    if (!content || !user || !postId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await env.COINGECKO_DB.prepare(`
      INSERT INTO comments (post_id, user_id, user_name, content)
      VALUES (?, ?, ?, ?)
    `).bind(parseInt(postId), user.id, user.name, content).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Create comment error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
