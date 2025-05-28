// src/dataApi.js
import { jsonResponse, errorResponse } from './utils.js';

export async function handleDataApi(request, env) {
  try {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const rows = await env.COINGECKO_DB
      .prepare(
        `SELECT fetched_at AS timestamp, price_usd AS price
         FROM coin_prices
         WHERE fetched_at >= ?
         ORDER BY fetched_at ASC`
      )
      .bind(new Date(oneDayAgo).toISOString())
      .all();

    return jsonResponse(rows.results);
  } catch (err) {
    return errorResponse(err.stack || err.toString(), 500);
  }
}
