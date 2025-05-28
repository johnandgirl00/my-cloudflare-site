import { Router } from 'itty-router';
import { handleCronPrices }  from './cronPrices.js';
import { handleDataApi }     from './dataApi.js';
import { handleUploadChart } from './uploadChart.js';
import { handleServeChart }  from './serveChart.js';

// 1) HTML을 직접 서빙할 문자열
const INDEX_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Mobile Chart Example</title>
  <style>
    body{margin:0;padding:1rem;font-family:sans-serif;}
    #chart-container{width:100%;max-width:480px;margin:0 auto;}
    canvas{width:100%!important;height:auto!important;}
    #result-img{width:100%;margin-top:1rem;}
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <h2>실시간 가격 차트</h2>
  <div id="chart-container">
    <canvas id="myChart"></canvas>
    <img id="result-img" alt="Uploaded Chart">
  </div>
  <script>
    (async()=>{
      const dataArr=(await fetch('/api/data')).json();
      const labels=(await dataArr).map(d=>new Date(d.timestamp).toLocaleTimeString());
      const prices=(await dataArr).map(d=>d.price);
      const ctx=document.getElementById('myChart').getContext('2d');
      const chart=new Chart(ctx,{type:'line',data:{labels,datasets:[{data:prices,borderColor:'teal',backgroundColor:'rgba(0,128,128,0.2)',pointRadius:0} ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{display:false}}}});
      const dataURL=chart.toBase64Image();
      const blob=await (await fetch(dataURL)).blob();
      const buffer=await blob.arrayBuffer();
      const {url}=await fetch('/api/upload-chart',{method:'POST',headers:{'Content-Type':'image/png'},body:buffer}).then(r=>r.json());
      document.getElementById('result-img').src=url;
    })();
  </script>
</body>
</html>`;

// 라우터 설정
const router = Router();
router.get('/cron/prices',  handleCronPrices);
router.get('/api/data',     handleDataApi);
router.post('/api/upload-chart', handleUploadChart);
router.get('/charts/:key',     handleServeChart);

// **루트 경로에서 직접 HTML 반환**
router.get('/', () =>
  new Response(INDEX_HTML, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' }
  })
);

// 기타 혹은 404
router.all('*', () => new Response('Not found', { status: 404 }));

export default {
  async fetch(request, env, ctx) {
    return router.handle(request, env, ctx);
  }
};
