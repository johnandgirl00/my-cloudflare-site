// src/generateWebM.js - 암호화폐 차트 WebM 생성
import { jsonResponse, errorResponse } from './utils.js';

export async function handleGenerateWebM(request, env, ctx) {
  try {
    // 1) 데이터 가져오기 (최근 24시간)
    const { results } = await env.COINGECKO_DB.prepare(`
      SELECT fetched_at as timestamp, price_usd as price, symbol
      FROM coin_prices 
      WHERE coin_id = 'bitcoin'
      ORDER BY fetched_at DESC 
      LIMIT 48
    `).all();

    if (!results || results.length < 5) {
      return errorResponse('충분한 데이터가 없습니다. 최소 5개 이상 필요합니다.', 400);
    }

    // 2) 데이터 정규화
    const prices = results.reverse().map(r => parseFloat(r.price)); // 시간순 정렬
    const timestamps = results.map(r => new Date(r.timestamp));
    const symbol = results[0]?.symbol || 'BTC';
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    
    // 3) WebM용 SVG 애니메이션 생성 (커뮤니티 최적화)
    const width = 400;
    const height = 200;
    const padding = 40;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);
    
    // 현재 가격과 24시간 변화율 계산
    const currentPrice = prices[prices.length - 1];
    const prevPrice = prices[0];
    const changePercent = ((currentPrice - prevPrice) / prevPrice * 100).toFixed(2);
    const isPositive = changePercent >= 0;
    
    // 가격 포인트들을 좌표로 변환
    let pathData = '';
    const points = [];
    
    for (let i = 0; i < prices.length; i++) {
      const x = padding + (i / (prices.length - 1)) * chartWidth;
      const y = padding + (1 - (prices[i] - minPrice) / priceRange) * chartHeight;
      points.push({ x, y, price: prices[i] });
      pathData += `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }
    
    // 그라데이션 영역을 위한 패스
    const areaPath = pathData + ` L ${padding + chartWidth} ${padding + chartHeight} L ${padding} ${padding + chartHeight} Z`;
    
    // 애니메이션 SVG 생성
    const animatedSVG = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- 그라데이션 정의 -->
    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${isPositive ? '#10b981' : '#ef4444'};stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:${isPositive ? '#10b981' : '#ef4444'};stop-opacity:0.05" />
    </linearGradient>
    
    <!-- 애니메이션용 마스크 -->
    <mask id="revealMask">
      <rect width="0" height="${height}" fill="white">
        <animate attributeName="width" values="0;${width}" dur="3s" repeatCount="indefinite" />
      </rect>
    </mask>
  </defs>
  
  <!-- 배경 -->
  <rect width="100%" height="100%" fill="#0f172a" />
  
  <!-- 그리드 라인 -->
  <g stroke="#334155" stroke-width="0.5" opacity="0.3">
    ${Array.from({length: 5}, (_, i) => {
      const y = padding + (i / 4) * chartHeight;
      return `<line x1="${padding}" y1="${y}" x2="${padding + chartWidth}" y2="${y}" />`;
    }).join('')}
  </g>
  
  <!-- 차트 영역 -->
  <path d="${areaPath}" fill="url(#chartGradient)" mask="url(#revealMask)" />
  
  <!-- 차트 라인 -->
  <path d="${pathData}" 
        stroke="${isPositive ? '#10b981' : '#ef4444'}" 
        stroke-width="2" 
        fill="none" 
        mask="url(#revealMask)" />
  
  <!-- 현재 가격 포인트 -->
  <circle cx="${points[points.length-1].x}" cy="${points[points.length-1].y}" r="4" 
          fill="${isPositive ? '#10b981' : '#ef4444'}" 
          mask="url(#revealMask)">
    <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
  </circle>
  
  <!-- 텍스트 정보 -->
  <g font-family="Arial, sans-serif" fill="white">
    <!-- 심볼 -->
    <text x="20" y="30" font-size="18" font-weight="bold">${symbol}/USD</text>
    
    <!-- 현재 가격 -->
    <text x="20" y="50" font-size="16" fill="${isPositive ? '#10b981' : '#ef4444'}">
      $${currentPrice.toLocaleString()}
    </text>
    
    <!-- 변화율 -->
    <text x="20" y="70" font-size="14" fill="${isPositive ? '#10b981' : '#ef4444'}">
      ${isPositive ? '+' : ''}${changePercent}% (24h)
    </text>
    
    <!-- 시간 스탬프 -->
    <text x="20" y="${height - 10}" font-size="10" fill="#64748b">
      Last update: ${new Date().toLocaleTimeString()}
    </text>
  </g>
  
  <!-- 깜박이는 라이브 인디케이터 -->
  <circle cx="${width - 30}" cy="25" r="3" fill="#10b981">
    <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
  </circle>
  <text x="${width - 50}" y="30" font-size="10" fill="#10b981" font-family="Arial">LIVE</text>
</svg>`;

    // 4) SVG를 R2에 저장 (WebM 대신 먼저 애니메이션 SVG로 테스트)
    const timestamp = Date.now();
    const key = `chart-${timestamp}.svg`;
    
    console.log(`💾 Saving chart to R2 with key: ${key}`);
    
    try {
      await env.CHARTS.put(key, animatedSVG, {
        httpMetadata: { 
          contentType: 'image/svg+xml',
          cacheControl: 'public, max-age=300' // 5분 캐시
        }
      });
      console.log(`✅ Chart saved to R2: ${key}`);
    } catch (putError) {
      console.error(`❌ Failed to save to R2: ${putError.message}`);
      throw putError;
    }
    
    // 5) 고정 URL용으로도 저장
    console.log('💾 Saving latest chart...');
    try {
      await env.CHARTS.put('latest-chart.svg', animatedSVG, {
        httpMetadata: { 
          contentType: 'image/svg+xml',
          cacheControl: 'public, max-age=60' // 1분 캐시
        }
      });
      console.log('✅ Latest chart saved to R2');
    } catch (latestError) {
      console.error(`❌ Failed to save latest chart: ${latestError.message}`);
    }
    
    return jsonResponse({
      success: true,
      url: `/media/${key}`,
      embedUrl: '/embed/chart.webm', // 실제로는 SVG이지만 호환성을 위해
      dataPoints: prices.length,
      currentPrice,
      changePercent: parseFloat(changePercent),
      timestamp
    });
    
  } catch (err) {
    console.error('WebM 생성 오류:', err);
    return errorResponse(`WebM 생성 실패: ${err.message}`, 500);
  }
}
