// src/serveChart.js

export async function handleServeChart(request, env, ctx) {
  const { key } = ctx.params;
  const obj = await env.CHARTS.get(key);
  if (!obj) return new Response('Not found', { status: 404 });

  return new Response(obj.body, {
    headers: {
      'Content-Type': obj.httpMetadata.contentType,
      'Cache-Control': 'public, max-age=31536000'
    }
  });
}
