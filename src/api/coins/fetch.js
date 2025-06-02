// CoinGecko API에서 데이터를 가져오는 핸들러
export async function handleCoinsFetch(request, env, ctx) {
  try {
    console.log('Starting CoinGecko API fetch...');
    
    // CoinGecko API에서 상위 100개 코인 데이터 가져오기
    const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&locale=en', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CryptoGram/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const coins = await response.json();
    console.log(`Fetched ${coins.length} coins from CoinGecko`);

    return new Response(JSON.stringify({
      success: true,
      data: coins,
      count: coins.length,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching from CoinGecko:', error);
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
