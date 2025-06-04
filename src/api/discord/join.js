// Discord join tracking and statistics API
export async function handleDiscordJoin(request, env) {  
  try {  
    const { username, channel, referrer } = await request.json();
    
    // Record join in database
    const stmt = env.MY_COINGECKO_DB.prepare(`
      INSERT INTO discord_joins (username, channel, referrer, created_at) 
      VALUES (?, ?, ?, datetime('now'))
    `);
    
    await stmt.bind(username || 'anonymous', channel || 'general', referrer || 'direct').run();
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Join tracked successfully',
      username: username,
      timestamp: new Date().toISOString()
    }), {  
      headers: { 'Content-Type': 'application/json' }  
    });  
  } catch (error) {
    console.error('Discord join tracking error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to track join',
      details: error.message 
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });  
  }  
}  
  
export async function getDiscordJoinStats(env) {
  try {
    // Get total joins
    const totalStmt = env.MY_COINGECKO_DB.prepare('SELECT COUNT(*) as total FROM discord_joins');
    const totalResult = await totalStmt.first();
    
    // Get joins by channel
    const channelStmt = env.MY_COINGECKO_DB.prepare(`
      SELECT channel, COUNT(*) as count 
      FROM discord_joins 
      GROUP BY channel 
      ORDER BY count DESC
    `);
    const channelResults = await channelStmt.all();
    
    // Get recent joins (last 24 hours)
    const recentStmt = env.MY_COINGECKO_DB.prepare(`
      SELECT COUNT(*) as recent 
      FROM discord_joins 
      WHERE created_at > datetime('now', '-24 hours')
    `);
    const recentResult = await recentStmt.first();
    
    // Get total posts count
    const postsStmt = env.MY_COINGECKO_DB.prepare('SELECT COUNT(*) as total FROM discord_posts');
    const postsResult = await postsStmt.first();
    
    // Get recent posts (last 24 hours)
    const recentPostsStmt = env.MY_COINGECKO_DB.prepare(`
      SELECT COUNT(*) as recent 
      FROM discord_posts 
      WHERE posted_at > datetime('now', '-24 hours')
    `);
    const recentPostsResult = await recentPostsStmt.first();
    
    return {
      total_joins: totalResult?.total || 0,
      recent_joins_24h: recentResult?.recent || 0,
      total_posts: postsResult?.total || 0,
      recent_posts_24h: recentPostsResult?.recent || 0,
      by_channel: channelResults?.results || [],
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Discord stats error:', error);
    return {
      total_joins: 0,
      recent_joins_24h: 0,
      total_posts: 0,
      recent_posts_24h: 0,
      by_channel: [],
      error: 'Failed to get stats',
      timestamp: new Date().toISOString()
    };
  }
}
