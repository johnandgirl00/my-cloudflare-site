export async function handlePostsList(request, env) {
  try {
    console.log('📝 Handling posts list request');
    
    // 임시 게시글 데이터 (데모용)
    const samplePosts = [
      {
        post_id: 1,
        author_id: 1,
        content: "Bitcoin이 새로운 고점을 찍었네요! 🚀 암호화폐 시장이 정말 뜨겁습니다. #bitcoin #crypto",
        created_at: new Date(Date.now() - 3600000).toISOString(), // 1시간 전
        comments: [
          {
            id: 1,
            author_id: 2,
            content: "정말 대단해요! 언제까지 갈까요?",
            created_at: new Date(Date.now() - 1800000).toISOString()
          }
        ]
      },
      {
        post_id: 2,
        author_id: 2,
        content: "이더리움도 함께 상승하고 있어서 좋네요. DeFi 생태계가 더욱 활성화될 것 같습니다! 💎",
        created_at: new Date(Date.now() - 7200000).toISOString(), // 2시간 전
        comments: []
      },
      {
        post_id: 3,
        author_id: 3,
        content: "차트 분석해보니 아직 더 오를 여지가 있어 보입니다. 장기적으로 봐야겠어요 📈",
        created_at: new Date(Date.now() - 10800000).toISOString(), // 3시간 전
        comments: [
          {
            id: 2,
            author_id: 1,
            content: "동의합니다! 기술적 분석 결과도 긍정적이네요",
            created_at: new Date(Date.now() - 9000000).toISOString()
          },
          {
            id: 3,
            author_id: 4,
            content: "어떤 지표를 보시는지 궁금해요",
            created_at: new Date(Date.now() - 8100000).toISOString()
          }
        ]
      }
    ];

    // 실제 데이터베이스가 있다면 여기서 쿼리
    // const posts = await env.DB.prepare('SELECT * FROM posts ORDER BY created_at DESC').all();
    
    console.log('📝 Returning sample posts:', samplePosts.length);
    
    return new Response(JSON.stringify(samplePosts), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('❌ Error in handlePostsList:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch posts',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 
