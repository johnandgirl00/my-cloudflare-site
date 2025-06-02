// 데이터베이스에서 코인 목록을 조회하는 핸들러
export async function handleCoinsList(request, env, ctx) {
  try {
    const url = new URL(request.url);
    const db = env.COINGECKO_DB;
    
    // 쿼리 파라미터 처리
    const limit = parseInt(url.searchParams.get('limit')) || 100;
    const type = url.searchParams.get('type') || 'all';
    const direction = url.searchParams.get('direction') || 'gainers';
    
    let query;
    let queryParams = [];
    
    switch (type) {
      case 'market':
        // 시가총액 순위별 정렬
        query = `
          SELECT * FROM coin_market_data 
          ORDER BY market_cap_rank ASC 
          LIMIT ?
        `;
        queryParams = [limit];
        break;
        
      case 'movers':
        // 가격 변동률 기준 정렬
        const order = direction === 'gainers' ? 'DESC' : 'ASC';
        query = `
          SELECT * FROM coin_market_data 
          WHERE price_change_percentage_24h IS NOT NULL 
          ORDER BY price_change_percentage_24h ${order} 
          LIMIT ?
        `;
        queryParams = [limit];
        break;
        
      case 'volume':
        // 거래량 기준 정렬
        query = `
          SELECT * FROM coin_market_data 
          WHERE total_volume IS NOT NULL 
          ORDER BY total_volume DESC 
          LIMIT ?
        `;
        queryParams = [limit];
        break;
        
      default:
        // 기본: 시가총액 순위별
        query = `
          SELECT * FROM coin_market_data 
          ORDER BY market_cap_rank ASC 
          LIMIT ?
        `;
        queryParams = [limit];
    }
    
    const { results } = await db.prepare(query).bind(...queryParams).all();
    
    console.log(`Retrieved ${results.length} coins from database (type: ${type})`);
    
    return new Response(JSON.stringify({
      success: true,
      data: results,
      count: results.length,
      type: type,
      limit: limit,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error fetching coins list:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
