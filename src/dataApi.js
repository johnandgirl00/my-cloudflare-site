export async function handleDataApi(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  console.log('DataAPI called with path:', path); // 디버깅 로그 추가
  
  try {
    const db = env.COINGECKO_DB;
    
    // 기존 엔드포인트 (호환성 유지) - 쿼리 파라미터로 확장
    if (path === '/api/data') {
      const type = url.searchParams.get('type'); // 새로운 쿼리 파라미터
      const limit = url.searchParams.get('limit') || 100;
      
      // 마켓 데이터 요청
      if (type === 'market') {
        console.log('Market data requested via /api/data?type=market');
        const { results } = await db.prepare(`
          SELECT * FROM coin_market_data 
          ORDER BY market_cap_rank ASC 
          LIMIT ?
        `).bind(limit).all();
        
        return new Response(JSON.stringify(results), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 상위/하위 변동률 요청
      if (type === 'movers') {
        const direction = url.searchParams.get('direction') || 'gainers';
        const order = direction === 'gainers' ? 'DESC' : 'ASC';
        
        const { results } = await db.prepare(`
          SELECT id, symbol, name, current_price, price_change_percentage_24h, image
          FROM coin_market_data 
          WHERE price_change_percentage_24h IS NOT NULL
          ORDER BY price_change_percentage_24h ${order}
          LIMIT ?
        `).bind(limit).all();
        
        return new Response(JSON.stringify(results), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 시장 통계 요청
      if (type === 'stats') {
        const { results } = await db.prepare(`
          SELECT 
            COUNT(*) as total_coins,
            SUM(market_cap) as total_market_cap,
            SUM(total_volume) as total_volume_24h,
            AVG(price_change_percentage_24h) as avg_price_change_24h
          FROM coin_market_data
        `).all();
        
        return new Response(JSON.stringify(results[0]), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 특정 코인 정보 요청
      const coinId = url.searchParams.get('coin');
      if (coinId) {
        const { results } = await db.prepare(`
          SELECT * FROM coin_market_data 
          WHERE id = ? OR symbol = ?
        `).bind(coinId, coinId).all();
        
        if (results.length === 0) {
          return new Response(JSON.stringify({ error: 'Coin not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        return new Response(JSON.stringify(results[0]), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 기본: 기존 prices 테이블 데이터
      const { results } = await db.prepare(`
        SELECT symbol, price, timestamp 
        FROM prices 
        ORDER BY timestamp DESC 
        LIMIT ?
      `).bind(limit).all();
      
      return new Response(JSON.stringify(results), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Not found', { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
