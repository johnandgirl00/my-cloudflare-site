export async function handleCronPrices(request, env, ctx) {
  console.log('🔄 Running cron job for crypto prices...');
  try {
    // Fetch comprehensive crypto data
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,cardano,polygon,chainlink,solana,dogecoin,avalanche-2,polkadot&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true');
    const data = await response.json();
    
    console.log('✅ Fetched crypto data for', Object.keys(data).length, 'coins');
    
    // Save to database (create a simple price_history table entry)
    try {
      const stmt = env.MY_COINGECKO_DB.prepare(`
        INSERT OR REPLACE INTO price_history (coin_id, price_usd, change_24h, market_cap, volume_24h, timestamp) 
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `);
      
      // Save data for each coin
      for (const [coinId, coinData] of Object.entries(data)) {
        await stmt.bind(
          coinId,
          coinData.usd,
          coinData.usd_24h_change || 0,
          coinData.usd_market_cap || 0,
          coinData.usd_24h_vol || 0
        ).run();
      }
      
      console.log('💾 Saved price data to database');
    } catch (dbError) {
      console.log('⚠️ Database save skipped (table may not exist):', dbError.message);
    }
    
    // Log successful execution
    console.log('📊 Price data summary:');
    console.log(`- Bitcoin: $${data.bitcoin?.usd.toLocaleString()} (${data.bitcoin?.usd_24h_change > 0 ? '+' : ''}${data.bitcoin?.usd_24h_change?.toFixed(2)}%)`);
    console.log(`- Ethereum: $${data.ethereum?.usd.toLocaleString()} (${data.ethereum?.usd_24h_change > 0 ? '+' : ''}${data.ethereum?.usd_24h_change?.toFixed(2)}%)`);
    
    return { 
      success: true, 
      coins_updated: Object.keys(data).length,
      timestamp: new Date().toISOString(),
      sample_data: {
        bitcoin: data.bitcoin,
        ethereum: data.ethereum
      }
    };
  } catch (error) {
    console.error('❌ Cron job error:', error);
    return { 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}
