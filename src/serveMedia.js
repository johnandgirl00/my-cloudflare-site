// src/serveMedia.js - R2에서 미디어 파일 서빙
import { errorResponse } from './utils.js';

export async function handleServeMedia(request, env, ctx) {
  try {
    const url = new URL(request.url);
    const key = url.pathname.split('/').pop(); // /media/filename에서 filename 추출
    
    console.log(`🔍 Serving media file: ${key}`);
    
    if (!key) {
      console.error('❌ No file key provided');
      return errorResponse('파일 키가 필요합니다', 400);
    }
    
    console.log('📦 Checking R2 bucket for key:', key);
    const object = await env.CHARTS.get(key);
    
    if (!object) {
      console.error(`❌ File not found in R2: ${key}`);
      // R2 버킷의 모든 객체 나열 (디버깅용)
      try {
        const list = await env.CHARTS.list({ limit: 10 });
        console.log('📋 Available files in R2:', list.objects.map(obj => obj.key));
      } catch (listErr) {
        console.error('❌ Failed to list R2 objects:', listErr);
      }
      return errorResponse('파일을 찾을 수 없습니다', 404);
    }
    
    console.log('✅ File found in R2, serving...');
    
    const headers = new Headers();
    
    // Content-Type 설정
    if (object.httpMetadata?.contentType) {
      headers.set('Content-Type', object.httpMetadata.contentType);
    }
    
    // 캐시 헤더 설정
    headers.set('Cache-Control', 'public, max-age=300'); // 5분 캐시
    headers.set('Access-Control-Allow-Origin', '*'); // CORS 허용
    
    // SVG인 경우 특별 처리
    if (key.endsWith('.svg')) {
      headers.set('Content-Type', 'image/svg+xml');
      headers.set('X-Content-Type-Options', 'nosniff');
    }
    
    return new Response(object.body, { headers });
    
  } catch (err) {
    console.error('미디어 서빙 오류:', err);
    return errorResponse(`미디어 파일 서빙 실패: ${err.message}`, 500);
  }
}
