// Discord Bot Dashboard - Monitor posting activity
import { PersonaScheduler } from '../utils/personaScheduler.js';
import { getFeedbackAnalytics } from './discord/feedback.js';

export async function handleBotDashboard(request, env) {
  try {
    // Get recent persona posts
    const postsStmt = env.MY_COINGECKO_DB.prepare(`
      SELECT dp.*, p.name as persona_name, p.country, p.style 
      FROM discord_posts dp 
      LEFT JOIN personas p ON dp.persona_id = p.id 
      ORDER BY dp.posted_at DESC 
      LIMIT 10
    `);
    const recentPosts = await postsStmt.all();
    
    // Get posting stats
    const statsStmt = env.MY_COINGECKO_DB.prepare(`
      SELECT 
        COUNT(*) as total_posts,
        COUNT(CASE WHEN posted_at > datetime('now', '-24 hours') THEN 1 END) as posts_24h,
        COUNT(CASE WHEN posted_at > datetime('now', '-7 days') THEN 1 END) as posts_7d,
        COALESCE(AVG(engagement_score), 0) as avg_engagement
      FROM discord_posts
    `);
    const stats = await statsStmt.first();
    
    // Get enhanced persona activity using PersonaScheduler
    const personaScheduler = new PersonaScheduler(env);
    const personaStats = await personaScheduler.getPersonaStats();
    
    // Get feedback analytics
    const feedbackAnalytics = await getFeedbackAnalytics(env, 7);
    
    // Get recent errors
    const errorStmt = env.MY_COINGECKO_DB.prepare(`
      SELECT type, error_message, timestamp 
      FROM error_logs 
      WHERE timestamp > datetime('now', '-24 hours')
      ORDER BY timestamp DESC 
      LIMIT 5
    `);
    const recentErrors = await errorStmt.all();

    const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🤖 Discord Bot Dashboard</title>
    <meta http-equiv="refresh" content="30"> <!-- Auto refresh every 30 seconds -->
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1400px; margin: 0 auto; }
        .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .stat-item { background: #e3f2fd; padding: 15px; border-radius: 5px; text-align: center; }
        .stat-number { font-size: 24px; font-weight: bold; color: #1976d2; }
        .post-item { border-bottom: 1px solid #eee; padding: 10px 0; }
        .persona-name { font-weight: bold; color: #2e7d32; }
        .post-content { margin: 5px 0; font-style: italic; }
        .timestamp { color: #666; font-size: 12px; }
        .error-item { background: #ffebee; padding: 10px; margin: 5px 0; border-radius: 4px; border-left: 4px solid #f44336; }
        .success { color: #2e7d32; }
        .warning { color: #ff9800; }
        .error { color: #f44336; }
        .analytics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .engagement-bar { height: 20px; background: #e0e0e0; border-radius: 10px; overflow: hidden; }
        .engagement-fill { height: 100%; background: linear-gradient(90deg, #4caf50, #2196f3); }
        .refresh-info { color: #666; font-size: 12px; text-align: center; margin-top: 10px; }
        .test-buttons { margin: 20px 0; }
        .test-btn { background: #4caf50; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin: 5px; cursor: pointer; text-decoration: none; display: inline-block; }
        .test-btn:hover { background: #45a049; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 Discord 마케팅 봇 대시보드</h1>
          <div class="card">
            <h2>📊 포스팅 통계</h2>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-number">${stats?.total_posts || 0}</div>
                    <div>총 포스트</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${stats?.posts_24h || 0}</div>
                    <div>24시간 포스트</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${stats?.posts_7d || 0}</div>
                    <div>7일 포스트</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${Math.round(stats?.avg_engagement || 0)}</div>
                    <div>평균 참여도</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${personaStats?.length || 0}</div>
                    <div>활성 페르소나</div>
                </div>
            </div>
        </div>

        <div class="analytics-grid">
            <div class="card">
                <h2>🎭 페르소나 활동</h2>
                ${personaStats?.map(persona => `
                    <div class="post-item">
                        <div class="persona-name">${persona.name} (${persona.gender}, ${persona.age})</div>
                        <div>총 포스트: ${persona.total_posts} | 24시간: ${persona.posts_last_24h} | 평균 참여도: ${Math.round(persona.avg_engagement)}</div>
                        <div class="engagement-bar">
                            <div class="engagement-fill" style="width: ${Math.min(persona.avg_engagement * 10, 100)}%"></div>
                        </div>
                    </div>
                `).join('') || '<p>페르소나 데이터가 없습니다.</p>'}
            </div>

            <div class="card">
                <h2>📈 참여도 분석</h2>
                ${feedbackAnalytics?.feedback_stats?.length > 0 ? `
                    ${feedbackAnalytics.feedback_stats.map(stat => `
                        <div class="post-item">
                            <strong>${stat.interaction_type}:</strong> ${stat.count}회 (${stat.unique_users}명)
                        </div>
                    `).join('')}
                ` : '<p>참여도 데이터가 없습니다.</p>'}
                
                <h3>🏆 최고 성과 토픽</h3>
                ${feedbackAnalytics?.top_topics?.length > 0 ? `
                    ${feedbackAnalytics.top_topics.slice(0, 3).map(topic => `
                        <div class="post-item">
                            <strong>${topic.topic}:</strong> ${topic.post_count}개 포스트, 평균 참여도 ${Math.round(topic.avg_engagement)}
                        </div>
                    `).join('')}
                ` : '<p>토픽 데이터가 없습니다.</p>'}
            </div>
        </div>

        ${recentErrors?.results?.length > 0 ? `
            <div class="card">
                <h2>⚠️ 최근 오류 (24시간)</h2>
                ${recentErrors.results.map(error => `
                    <div class="error-item">
                        <strong>${error.type}:</strong> ${error.error_message}
                        <div class="timestamp">${new Date(error.timestamp).toLocaleString('ko-KR')}</div>
                    </div>
                `).join('')}
            </div>
        ` : ''}
        
        <div class="card">
            <h2>🎭 페르소나 활동</h2>
            ${personaActivity?.results?.map(persona => `
                <div class="post-item">
                    <span class="persona-name">${persona.name}</span> (${persona.country}) - ${persona.post_count}개 포스트
                </div>
            `).join('') || '<p>페르소나 데이터를 불러오는 중...</p>'}
        </div>
        
        <div class="card">
            <h2>📝 최근 포스트</h2>
            ${recentPosts?.results?.map(post => `
                <div class="post-item">
                    <div class="persona-name">${post.persona_name || 'Unknown'} (${post.style || 'N/A'})</div>
                    <div class="post-content">"${post.content?.substring(0, 200)}${post.content?.length > 200 ? '...' : ''}"</div>
                    <div class="timestamp">${post.posted_at} - ${post.channel}</div>
                </div>
            `).join('') || '<p>아직 포스트가 없습니다.</p>'}
        </div>
          <div class="card">
            <h2>🧪 테스트 도구</h2>
            <div class="test-buttons">
                <a href="/test/discord-webhook" class="test-btn">🔔 Discord 웹훅 테스트</a>
                <a href="/test/persona-post" class="test-btn">🤖 페르소나 포스트 테스트</a>
                <a href="/test/cron-prices" class="test-btn">💰 가격 데이터 수집 테스트</a>
                <a href="/api/discord/stats" class="test-btn">📊 Discord 통계 조회</a>
                <a href="/api/coins/chart?coin=bitcoin" class="test-btn">📈 비트코인 차트</a>
                <a href="/api/coins/chart?coin=ethereum" class="test-btn">📈 이더리움 차트</a>
            </div>
        </div>
        
        <div class="card">
            <h2>🔄 자동화 상태</h2>
            <p><strong>크론 작업 스케줄:</strong></p>
            <ul>
                <li>매시간 정각 (0분): 암호화폐 가격 데이터 수집</li>
                <li>매시간 15분: AI 페르소나 Discord 포스팅</li>
            </ul>
            <p><strong>다음 실행 예정:</strong> ${new Date(Math.ceil(Date.now() / (60 * 60 * 1000)) * 60 * 60 * 1000).toLocaleString('ko-KR')}</p>
        </div>
    </div>
</body>
</html>`;
    
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    });
    
  } catch (error) {
    console.error('Dashboard error:', error);
    return new Response(`Dashboard Error: ${error.message}`, { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
