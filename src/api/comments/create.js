export async function handleCommentsCreate(request, env) {
  try {
    console.log('💬 Handling comment creation request');
    
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const body = await request.json();
    console.log('💬 Comment creation data:', body);
    
    const { content, user, post_id } = body;
    
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

    if (!post_id) {
      return new Response(JSON.stringify({ 
        error: 'Post ID is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 임시로 성공 응답 (실제로는 데이터베이스에 저장)
    const newComment = {
      id: Date.now(),
      post_id: parseInt(post_id),
      author_id: user.id || Date.now(),
      content: content.trim(),
      created_at: new Date().toISOString()
    };

    console.log('💬 Created comment:', newComment);
    
    return new Response(JSON.stringify({ 
      success: true, 
      comment: newComment 
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('❌ Error in handleCommentsCreate:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create comment',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}  
