// Simple cryptocurrency chart API
export async function handleCoinsChart(request, env) {
  const url = new URL(request.url);
  const coin = url.searchParams.get('coin') || 'bitcoin';
  
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`);
    const data = await response.json();
    
    if (!data[coin]) {
      return new Response(JSON.stringify({ error: 'Coin not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const coinData = data[coin];
    const price = coinData.usd;
    const change = coinData.usd_24h_change || 0;
    const marketCap = coinData.usd_market_cap || 0;
    const isPositive = change >= 0;
    
    const svg = `<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="200" fill="#1a1a2e"/>
  <text x="20" y="30" font-family="Arial, sans-serif" font-size="18" fill="white" font-weight="bold">${coin.toUpperCase()} Chart</text>
  <text x="20" y="60" font-family="Arial, sans-serif" font-size="24" fill="white">$${price.toLocaleString()}</text>
  <text x="20" y="85" font-family="Arial, sans-serif" font-size="16" fill="${isPositive ? '#4caf50' : '#f44336'}">${isPositive ? '▲' : '▼'} ${change.toFixed(2)}% (24h)</text>
  <text x="20" y="110" font-family="Arial, sans-serif" font-size="14" fill="white" opacity="0.9">Market Cap: $${(marketCap / 1e9).toFixed(2)}B</text>
  <line x1="20" y1="150" x2="380" y2="150" stroke="#333" stroke-width="1"/>
  <line x1="20" y1="130" x2="380" y2="${isPositive ? '170' : '130'}" stroke="${isPositive ? '#4caf50' : '#f44336'}" stroke-width="3"/>
</svg>`;
    
    return new Response(svg, {
      headers: { 'Content-Type': 'image/svg+xml' }
    });
    
  } catch (error) {
    console.error('Chart generation error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate chart' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

