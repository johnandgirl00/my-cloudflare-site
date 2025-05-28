// src/cronPrices.js
import { errorResponse, jsonResponse } from './utils.js';

export async function handleCronPrices(request, env) {
  try {
    // ─── 테이블이 없다면 생성 ───────────────────────────────
    await env.COINGECKO_DB.prepare(`
      CREATE TABLE IF NOT EXISTS coin_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        coin_id TEXT,
        symbol TEXT,
        price_usd REAL,
        fetched_at TEXT
      );
    `).run();
    // ───────────────────────────────────────────────────────

    // 1) CoinGecko API 호출
    const apiUrl =
      'https://api.coingecko.com/api/v3/simple/price' +
      '?ids=bitcoin,ethereum&vs_currencies=usd';
    const res = await fetch(apiUrl);
    if (!res.ok) {
      return errorResponse(`CoinGecko API error: ${res.status}`, 502);
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

    // 3) 성공 응답
    return jsonResponse({ result: '✅ Inserted prices into D1' });
  } catch (err) {
    return errorResponse(err.stack || err.toString(), 500);
  }
}
