// src/uploadChart.js
import { errorResponse, jsonResponse } from './utils.js';

export async function handleUploadChart(request, env) {
  try {
    const contentType = request.headers.get('Content-Type') || 'image/png';
    const key = `chart-${Date.now()}.png`;
    const buf = await request.arrayBuffer();

    await env.CHARTS.put(key, buf, {
      httpMetadata: { contentType }
    });

    return jsonResponse({ url: `/charts/${key}` });
  } catch (err) {
    return errorResponse(err.stack || err.toString(), 500);
  }
}
