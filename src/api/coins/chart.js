// 차트용 데이터를 제공하는 핸들러
export async function handleCoinsChart(request, env, ctx) {
  try {
    const url = new URL(request.url);
    const db = env.COINGECKO_DB;
    
    // 쿼리 파라미터 처리
    const coinId = url.searchParams.get('coin') || 'bitcoin';
    const period = url.searchParams.get('period') || '24h';
    const format = url.searchParams.get('format') || 'json';
    
    // 특정 코인 데이터 조회
    const { results } = await db.prepare(`
      SELECT * FROM coin_market_data 
      WHERE id = ? OR symbol = ?
      LIMIT 1
    `).bind(coinId, coinId.toUpperCase()).all();
    
    if (results.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Coin not found',
        coinId: coinId
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const coin = results[0];
    
    // 차트용 데이터 포맷팅
    const chartData = {
      coin: {
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        image: coin.image
      },
      price: {
        current: coin.current_price,
        high_24h: coin.high_24h,
        low_24h: coin.low_24h,
        change_24h: coin.price_change_percentage_24h,
        ath: coin.ath,
        atl: coin.atl
      },
      market: {
        cap: coin.market_cap,
        rank: coin.market_cap_rank,
        volume_24h: coin.total_volume
      },
      supply: {
        circulating: coin.circulating_supply,
        max: coin.max_supply
      },
      timestamp: coin.last_updated
    };
    
    // WebM 형식으로 요청된 경우 (차트 임베드용)
    if (format === 'webm' || url.pathname.includes('chart.webm')) {
      const svgChart = generateSVGChart(chartData);
      return new Response(svgChart, {
        headers: { 
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=300' // 5분 캐시
        }
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      data: chartData,
      period: period,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error generating chart data:', error);
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

// SVG 차트 생성 함수
function generateSVGChart(data) {
  const price = data.price.current || 0;
  const change = data.price.change_24h || 0;
  const isPositive = change >= 0;
  const color = isPositive ? '#10b981' : '#ef4444';
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:${color};stop-opacity:0.3" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="400" height="200" fill="url(#gradient)" rx="10"/>
  
  <!-- Title -->
  <text x="20" y="30" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white">
    ${data.coin.symbol} Live Price
  </text>
  
  <!-- Price -->
  <text x="20" y="60" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white">
    $${price.toLocaleString()}
  </text>
  
  <!-- Change -->
  <text x="20" y="85" font-family="Arial, sans-serif" font-size="16" fill="white">
    ${isPositive ? '↗' : '↘'} ${change.toFixed(2)}% (24h)
  </text>
  
  <!-- Market Cap -->
  <text x="20" y="110" font-family="Arial, sans-serif" font-size="14" fill="white" opacity="0.9">
    Market Cap: $${(data.market.cap / 1e9).toFixed(2)}B
  </text>
  
  <!-- Rank -->
  <text x="20" y="130" font-family="Arial, sans-serif" font-size="14" fill="white" opacity="0.9">
    Rank: #${data.market.rank}
  </text>
  
  <!-- Simple chart line (mock) -->
  <polyline points="20,160 80,150 140,170 200,140 260,155 320,145 380,${isPositive ? '135' : '165'}" 
            stroke="white" stroke-width="2" fill="none" opacity="0.8"/>
  
  <!-- Time -->
  <text x="320" y="190" font-family="Arial, sans-serif" font-size="10" fill="white" opacity="0.7">
    ${new Date().toLocaleTimeString()}
  </text>
</svg>`;
}
