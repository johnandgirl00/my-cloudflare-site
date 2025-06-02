// CoinGecko 데이터를 D1 데이터베이스에 저장하는 핸들러
export async function handleCoinsSave(request, env, ctx) {
  try {
    console.log('Starting coins save to D1...');
    
    const db = env.COINGECKO_DB;
    
    // coin_market_data 테이블이 존재하는지 확인하고 생성
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS coin_market_data (
        id TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        name TEXT NOT NULL,
        image TEXT,
        current_price REAL,
        market_cap REAL,
        market_cap_rank INTEGER,
        total_volume REAL,
        high_24h REAL,
        low_24h REAL,
        price_change_percentage_24h REAL,
        circulating_supply REAL,
        max_supply REAL,
        ath REAL,
        atl REAL,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // CoinGecko API에서 데이터 가져오기
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

    // 데이터베이스에 저장
    let savedCount = 0;
    const errors = [];

    for (const coin of coins) {
      try {
        await db.prepare(`
          INSERT OR REPLACE INTO coin_market_data (
            id, symbol, name, image, current_price, market_cap, market_cap_rank,
            total_volume, high_24h, low_24h, price_change_percentage_24h,
            circulating_supply, max_supply, ath, atl
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          coin.id,
          coin.symbol?.toUpperCase(),
          coin.name,
          coin.image,
          coin.current_price,
          coin.market_cap,
          coin.market_cap_rank,
          coin.total_volume,
          coin.high_24h,
          coin.low_24h,
          coin.price_change_percentage_24h,
          coin.circulating_supply,
          coin.max_supply,
          coin.ath,
          coin.atl
        ).run();
        
        savedCount++;
      } catch (saveError) {
        console.error(`Error saving coin ${coin.id}:`, saveError);
        errors.push({ coin: coin.id, error: saveError.message });
      }
    }

    console.log(`Successfully saved ${savedCount}/${coins.length} coins to database`);

    return new Response(JSON.stringify({
      success: true,
      saved: savedCount,
      total: coins.length,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in coins save:', error);
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
