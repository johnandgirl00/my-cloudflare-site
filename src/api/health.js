// System health check and monitoring
export async function handleSystemHealth(request, env) {
  try {
    const health = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {}
    };
    
    // Test database connection
    try {
      const dbTest = await env.MY_COINGECKO_DB.prepare('SELECT 1 as test').first();
      health.checks.database = dbTest ? 'connected' : 'disconnected';
    } catch (error) {
      health.checks.database = 'error: ' + error.message;
      health.status = 'degraded';
    }
    
    // Test OpenAI API key
    health.checks.openai_key = env.OPENAI_API_KEY ? 'configured' : 'missing';
    if (!env.OPENAI_API_KEY) health.status = 'degraded';
    
    // Test Discord webhook
    health.checks.discord_webhook = env.DISCORD_WEBHOOK_URL ? 'configured' : 'missing';
    if (!env.DISCORD_WEBHOOK_URL) health.status = 'degraded';
    
    // Test external API (CoinGecko)
    try {
      const cryptoResponse = await fetch('https://api.coingecko.com/api/v3/ping');
      health.checks.coingecko_api = cryptoResponse.ok ? 'available' : 'unavailable';
    } catch (error) {
      health.checks.coingecko_api = 'error: ' + error.message;
      health.status = 'degraded';
    }
    
    // Check recent activity
    try {
      const recentPosts = await env.MY_COINGECKO_DB.prepare(`
        SELECT COUNT(*) as count 
        FROM discord_posts 
        WHERE posted_at > datetime('now', '-24 hours')
      `).first();
      health.checks.recent_posts = recentPosts?.count || 0;
    } catch (error) {
      health.checks.recent_posts = 'error: ' + error.message;
    }
    
    // Calculate next cron execution times
    const now = new Date();
    const nextHour = new Date(Math.ceil(now.getTime() / (60 * 60 * 1000)) * 60 * 60 * 1000);
    const next15Min = new Date(nextHour);
    next15Min.setMinutes(15);
    
    health.next_executions = {
      price_collection: nextHour.toISOString(),
      persona_posting: next15Min.toISOString()
    };
    
    return new Response(JSON.stringify(health, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error.message
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
