export default {
  async fetch(request, env) {
    try {
      // 1) CoinGecko API 호출
      const apiUrl = 'https://api.coingecko.com/api/v3/simple/price'
        + '?ids=bitcoin,ethereum&vs_currencies=usd';
      const res = await fetch(apiUrl);
      if (!res.ok) {
        return new Response(`CoinGecko API error: ${res.status}`, { status: 502 });
      }
      const data = await res.json();

      // 2) D1에 INSERT (batch 대신 반복 실행)
      const db = env.COINGECKO_DB;
      const now = new Date().toISOString();
      for (const [coinId, info] of Object.entries(data)) {
        await db
          .prepare(`
            INSERT INTO coin_prices (coin_id, symbol, price_usd, fetched_at)
            VALUES (?, ?, ?, ?)
          `)
          .bind(coinId, coinId.toUpperCase(), info.usd, now)
          .run();
      }

      return new Response('✅ Inserted prices into D1', { status: 200 });
    } catch (err) {
      return new Response(`ERROR: ${err.stack}`, { status: 500 });
    }
  }
};
