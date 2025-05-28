// src/embedChart.js - 커뮤니티 임베드용 고정 URL 처리
import { errorResponse } from './utils.js';

export async function handleEmbedChart(request, env, ctx) {
  try {
    // 최신 차트 파일을 가져옴
    let object = await env.CHARTS.get('latest-chart.svg');
    
    // 만약 최신 파일이 없다면 새로 생성
    if (!object) {
      // generateWebM 함수를 직접 호출하여 새 차트 생성
      const { handleGenerateWebM } = await import('./generateWebM.js');
      await handleGenerateWebM(null, env, ctx);
      
      // 다시 시도
      object = await env.CHARTS.get('latest-chart.svg');
      
      if (!object) {
        return errorResponse('차트를 생성할 수 없습니다', 500);
      }
    }
    
    const headers = new Headers();
    
    // 커뮤니티 임베드를 위한 최적화된 헤더
    headers.set('Content-Type', 'image/svg+xml');
    headers.set('Cache-Control', 'public, max-age=60'); // 1분 캐시 (자주 업데이트)
    headers.set('Access-Control-Allow-Origin', '*'); // 모든 도메인에서 임베드 허용
    headers.set('X-Content-Type-Options', 'nosniff');
    
    // WebM 요청이지만 SVG를 반환 (호환성)
    // 실제 WebM이 필요하다면 여기서 변환 로직 추가
    
    return new Response(object.body, { headers });
    
  } catch (err) {
    console.error('임베드 차트 오류:', err);
    return errorResponse(`임베드 차트 처리 실패: ${err.message}`, 500);
  }
}
