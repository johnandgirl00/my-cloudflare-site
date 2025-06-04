export async function handlePostsCreate(request, env) {
  try {
    console.log('📝 Handling post creation request');
    
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const body = await request.json();
    console.log('📝 Post creation data:', body);
    
    const { content, user } = body;
    
    if (!content || !content.trim()) {
      return new Response(JSON.stringify({ 
        error: 'Content is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!user || !user.name) {
      return new Response(JSON.stringify({ 
        error: 'User information is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 임시로 성공 응답 (실제로는 데이터베이스에 저장)
    const newPost = {
      post_id: Date.now(),
      author_id: user.id || Date.now(),
      content: content.trim(),
      created_at: new Date().toISOString(),
      comments: []
    };

    console.log('📝 Created post:', newPost);
    
    return new Response(JSON.stringify({ 
      success: true, 
      post: newPost 
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('❌ Error in handlePostsCreate:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create post',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 
