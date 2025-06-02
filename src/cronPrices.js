export async function handleCronPrices(request, env, ctx) {
  try {
    console.log('Starting CoinGecko API fetch...');
    
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
    
    // CoinGecko API에서 상위 100개 코인 데이터 가져오기
    const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&locale=en', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CryptoGram/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }
    
    const coinsData = await response.json();
    console.log(`Fetched ${coinsData.length} coins from CoinGecko`);
    
    // 배치로 데이터 삽입
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO coin_market_data (
        id, symbol, name, image, current_price, market_cap, market_cap_rank,
        total_volume, high_24h, low_24h, price_change_percentage_24h,
        circulating_supply, max_supply, ath, atl, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    
    let insertedCount = 0;
    const sampleData = [];
    
    for (const coin of coinsData) {
      try {
        await insertStmt.bind(
          coin.id,
          coin.symbol,
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
        
        insertedCount++;
        
        // 상위 5개 코인 데이터를 응답에 포함
        if (insertedCount <= 5) {
          sampleData.push({
            id: coin.id,
            symbol: coin.symbol,
            name: coin.name,
            current_price: coin.current_price,
            market_cap_rank: coin.market_cap_rank,
            price_change_percentage_24h: coin.price_change_percentage_24h
          });
        }
      } catch (insertError) {
        console.error(`Error inserting ${coin.id}:`, insertError);
      }
    }
    
    // 기존 호환성을 위해 prices 테이블도 업데이트 (Bitcoin, Ethereum만)
    const btcData = coinsData.find(coin => coin.id === 'bitcoin');
    const ethData = coinsData.find(coin => coin.id === 'ethereum');
    
    if (btcData || ethData) {
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS prices (
          symbol TEXT PRIMARY KEY,
          price REAL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
      
      if (btcData) {
        await db.prepare(
          'INSERT OR REPLACE INTO prices (symbol, price, timestamp) VALUES (?, ?, datetime("now"))'
        ).bind('bitcoin', btcData.current_price).run();
      }
      
      if (ethData) {
        await db.prepare(
          'INSERT OR REPLACE INTO prices (symbol, price, timestamp) VALUES (?, ?, datetime("now"))'
        ).bind('ethereum', ethData.current_price).run();
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: `Successfully updated ${insertedCount} coins from CoinGecko API`,
      data: {
        inserted_count: insertedCount,
        sample_coins: sampleData,
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Cron error:', error);
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
