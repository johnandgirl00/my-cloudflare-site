// src/index.js - 암호화폐 커뮤니티용 WebM 차트 서비스
import { Router } from 'itty-router';
import { handleCronPrices } from './cronPrices.js';
import { handleDataApi } from './dataApi.js';
import { handleGenerateWebM } from './generateWebM.js';
import { handleServeMedia } from './serveMedia.js';
import { handleEmbedChart } from './embedChart.js';

const router = Router();

// 1) 크론 작업 - 주기적 가격 데이터 수집
router.get('/cron/prices', (request, env, ctx) => handleCronPrices(request, env, ctx));

// 2) 데이터 API
router.get('/api/data', (request, env, ctx) => handleDataApi(request, env, ctx));

// 3) WebM 차트 생성 API
router.post('/api/generate-webm', (request, env, ctx) => handleGenerateWebM(request, env, ctx));

// 4) 미디어 파일 서빙
router.get('/media/:key', (request, env, ctx) => handleServeMedia(request, env, ctx));

// 5) 커뮤니티 임베드용 엔드포인트 - 고정 URL
router.get('/embed/chart.webm', (request, env, ctx) => handleEmbedChart(request, env, ctx));

// 6) 관리자 대시보드
router.get('/', () => {
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>암호화폐 차트 WebM 생성기</title>
  <style>
    body { 
      margin: 0; 
      padding: 2rem; 
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f5f5f5;
    }
    .container { 
      max-width: 800px; 
      margin: 0 auto; 
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .status { 
      padding: 1rem; 
      margin: 1rem 0; 
      border-radius: 8px;
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
    }
    .btn { 
      background: #2196f3; 
      color: white; 
      border: none; 
      padding: 12px 24px; 
      border-radius: 6px; 
      cursor: pointer;
      margin: 0.5rem;
      font-size: 14px;
    }
    .btn:hover { background: #1976d2; }
    .embed-code {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 6px;
      font-family: monospace;
      font-size: 12px;
      margin: 1rem 0;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 암호화폐 차트 WebM 생성기</h1>
    
    <div class="status" id="status">
      시스템 준비됨
    </div>
    
    <h2>📊 현재 상태</h2>
    <button class="btn" onclick="checkData()">데이터 확인</button>
    <button class="btn" onclick="generateWebM()">WebM 생성</button>
    <button class="btn" onclick="testEmbed()">임베드 테스트</button>
    
    <h2>🎬 커뮤니티 임베드 코드</h2>
    <div class="embed-code">
      &lt;video width="400" height="200" autoplay loop muted&gt;<br>
      &nbsp;&nbsp;&lt;source src="${location.origin}/embed/chart.webm" type="video/webm"&gt;<br>
      &lt;/video&gt;
    </div>
    
    <h2>🔗 직접 링크</h2>
    <div class="embed-code">
      ${location.origin}/embed/chart.webm
    </div>
    
    <div id="preview"></div>
  </div>
  
  <script>
    const status = document.getElementById('status');
    const preview = document.getElementById('preview');
    
    async function checkData() {
      status.textContent = '데이터 확인 중...';
      try {
        const res = await fetch('/api/data');
        const data = await res.json();
        status.innerHTML = \`✅ 데이터 \${data.length}개 확인됨 (최근: \${new Date(data[data.length-1]?.timestamp).toLocaleString()})\`;
      } catch (err) {
        status.innerHTML = \`❌ 데이터 확인 실패: \${err.message}\`;
      }
    }
    
    async function generateWebM() {
      status.textContent = 'WebM 생성 중...';
      try {
        const res = await fetch('/api/generate-webm', { method: 'POST' });
        const result = await res.json();
        status.innerHTML = \`✅ WebM 생성 완료: \${result.url}\`;
      } catch (err) {
        status.innerHTML = \`❌ WebM 생성 실패: \${err.message}\`;
      }
    }
    
    function testEmbed() {
      preview.innerHTML = \`
        <h3>📺 미리보기</h3>
        <video width="400" height="200" autoplay loop muted controls style="border: 1px solid #ddd; border-radius: 6px;">
          <source src="/embed/chart.webm" type="video/webm">
          WebM을 지원하지 않는 브라우저입니다.
        </video>
      \`;
    }
    
    // 페이지 로드시 자동 데이터 확인
    checkData();
  </script>
</body>
</html>`;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=UTF-8' }
  });
});

// 404 처리
router.all('*', () => new Response('Not found', { status: 404 }));

export default {
  async fetch(request, env, ctx) {
    return router.handle(request, env, ctx);
  },
  
  async scheduled(event, env, ctx) {
    // 크론 작업 실행
    await handleCronPrices(null, env, ctx);
    
    // WebM도 자동 생성 (선택사항)
    // await handleGenerateWebM(null, env, ctx);
  }
};
