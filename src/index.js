import { Router } from 'itty-router';
import { handleCronPrices } from './cronPrices.js';
import { handleDataApi } from './dataApi.js';
import { handleGenerateWebM } from './generateWebM.js';
import { handleServeMedia } from './serveMedia.js';
import { handleEmbedChart } from './embedChart.js';
import { handleGetPosts, handleCreatePost, handleCreateComment } from './communityApi.js';

const router = Router();

// 기존 API들
router.get('/cron/prices', (request, env, ctx) => handleCronPrices(request, env, ctx));
router.get('/api/data', (request, env, ctx) => handleDataApi(request, env, ctx));
router.post('/api/generate-webm', (request, env, ctx) => handleGenerateWebM(request, env, ctx));
router.get('/media/:key', (request, env, ctx) => handleServeMedia(request, env, ctx));
router.get('/embed/chart.webm', (request, env, ctx) => handleEmbedChart(request, env, ctx));

// 새로운 커뮤니티 API들
router.get('/api/posts', (request, env, ctx) => handleGetPosts(request, env, ctx));
router.post('/api/posts', (request, env, ctx) => handleCreatePost(request, env, ctx));
router.post('/api/posts/:id/comments', (request, env, ctx) => handleCreateComment(request, env, ctx));

// 메인 페이지 - 차트 + 커뮤니티
router.get('/', () => {
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>암호화폐 커뮤니티</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f0f2f5; }
    .chart-section {
      height: 33vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      text-align: center;
    }
    .chart-title { font-size: 2rem; margin-bottom: 0.5rem; }
    .chart-subtitle { opacity: 0.9; font-size: 1rem; }
    .community-section { height: 67vh; overflow-y: auto; background: #f0f2f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 1rem; }
    .login-box {
      background: white; padding: 2rem; border-radius: 12px; text-align: center; margin: 2rem 0;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .post-creator {
      background: white; padding: 1rem; border-radius: 12px; margin-bottom: 1rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .post-textarea {
      width: 100%; border: none; resize: none; padding: 1rem; font-size: 16px; min-height: 80px;
      border-radius: 8px; background: #f8f9fa; font-family: inherit;
    }
    .post-textarea:focus { outline: none; background: white; }
    .post-card {
      background: white; border-radius: 12px; margin-bottom: 1rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;
    }
    .post-header {
      padding: 1rem; border-bottom: 1px solid #eee; display: flex; align-items: center;
    }
    .user-avatar {
      width: 40px; height: 40px; border-radius: 50%; background: #667eea;
      display: flex; align-items: center; justify-content: center; color: white;
      font-weight: bold; margin-right: 12px;
    }
    .post-content { padding: 1rem; line-height: 1.5; }
    .post-time { color: #666; font-size: 12px; }
    .comments-section { border-top: 1px solid #eee; }
    .comment { padding: 0.75rem 1rem; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
    .comment:last-child { border-bottom: none; }
    .comment-form { padding: 1rem; display: flex; gap: 0.5rem; }
    .comment-input {
      flex: 1; border: 1px solid #ddd; border-radius: 20px; padding: 0.5rem 1rem; font-size: 14px;
    }
    .comment-input:focus { outline: none; border-color: #667eea; }
    .btn {
      background: #667eea; color: white; border: none; padding: 0.75rem 1.5rem;
      border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500;
      transition: background 0.2s;
    }
    .btn:hover { background: #5a67d8; }
    .btn-sm { padding: 0.5rem 1rem; font-size: 12px; }
    .hidden { display: none; }
    .loading { text-align: center; padding: 2rem; color: #666; }
  </style>
</head>
<body>
  <div class="chart-section">
    <h1 class="chart-title">📈 Bitcoin Live Chart</h1>
    <p class="chart-subtitle">실시간 암호화폐 차트와 커뮤니티</p>
  </div>
  
  <div class="community-section">
    <div class="container">
      <div id="login-section" class="login-box">
        <h2>🚀 크립토 커뮤니티 참여</h2>
        <p style="margin: 1rem 0; color: #666;">간편 로그인으로 커뮤니티에 참여하세요</p>
        <button class="btn" onclick="quickLogin()">🔐 빠른 로그인</button>
      </div>
      
      <div id="community-main" class="hidden">
        <div class="post-creator">
          <textarea id="post-content" class="post-textarea" placeholder="암호화폐에 대한 생각을 공유해보세요... 🚀"></textarea>
          <div style="text-align: right; margin-top: 0.5rem;">
            <button class="btn" onclick="createPost()">포스트 작성</button>
          </div>
        </div>
        <div id="posts-container">
          <div class="loading">포스트를 불러오는 중...</div>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    let currentUser = null;
    
    function quickLogin() {
      const username = prompt('사용자명을 입력하세요 (2-10자):');
      if (!username || username.length < 2 || username.length > 10) {
        alert('2-10자 사이의 사용자명을 입력해주세요.');
        return;
      }
      currentUser = { id: Date.now(), name: username, email: username + '@crypto.community' };
      document.getElementById('login-section').classList.add('hidden');
      document.getElementById('community-main').classList.remove('hidden');
      loadPosts();
    }
    
    async function createPost() {
      const content = document.getElementById('post-content').value.trim();
      if (!content) { alert('포스트 내용을 입력해주세요.'); return; }
      if (content.length > 500) { alert('포스트는 500자 이내로 작성해주세요.'); return; }
      
      try {
        const response = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: content, user: currentUser })
        });
        if (response.ok) {
          document.getElementById('post-content').value = '';
          loadPosts();
        } else { throw new Error('포스트 작성 실패'); }
      } catch (err) { alert('포스트 작성에 실패했습니다: ' + err.message); }
    }
    
    async function loadPosts() {
      try {
        const response = await fetch('/api/posts');
        const posts = await response.json();
        const container = document.getElementById('posts-container');
        if (posts.length === 0) {
          container.innerHTML = '<div class="loading">아직 포스트가 없습니다. 첫 번째 포스트를 작성해보세요! 🎉</div>';
          return;
        }
        container.innerHTML = posts.map(post => createPostHTML(post)).join('');
      } catch (err) {
        console.error('포스트 로드 실패:', err);
        document.getElementById('posts-container').innerHTML = 
          '<div class="loading" style="color: red;">포스트를 불러오는데 실패했습니다.</div>';
      }
    }
    
    function createPostHTML(post) {
      const timeAgo = new Date(post.created_at).toLocaleString('ko-KR');
      const comments = Array.isArray(post.comments) ? post.comments : [];
      return \`
        <div class="post-card">
          <div class="post-header">
            <div class="user-avatar">\${post.user_name.charAt(0).toUpperCase()}</div>
            <div>
              <div style="font-weight: 500;">\${escapeHtml(post.user_name)}</div>
              <div class="post-time">\${timeAgo}</div>
            </div>
          </div>
          <div class="post-content">\${escapeHtml(post.content)}</div>
          <div class="comments-section">
            <div id="comments-\${post.id}">
              \${comments.map(comment => \`
                <div class="comment">
                  <strong>\${escapeHtml(comment.user_name)}:</strong> \${escapeHtml(comment.content)}
                </div>
              \`).join('')}
            </div>
            <div class="comment-form">
              <input type="text" class="comment-input" placeholder="댓글을 입력하세요..." maxlength="200"
                onkeypress="if(event.key==='Enter') { addComment(\${post.id}, this.value); this.value=''; }">
              <button class="btn btn-sm" onclick="const input = this.previousElementSibling; addComment(\${post.id}, input.value); input.value='';">댓글</button>
            </div>
          </div>
        </div>
      \`;
    }
    
    async function addComment(postId, content) {
      content = content.trim();
      if (!content) return;
      if (content.length > 200) { alert('댓글은 200자 이내로 작성해주세요.'); return; }
      
      try {
        const response = await fetch(\`/api/posts/\${postId}/comments\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: content, user: currentUser })
        });
        if (response.ok) { loadPosts(); } else { throw new Error('댓글 작성 실패'); }
      } catch (err) { alert('댓글 작성에 실패했습니다: ' + err.message); }
    }
    
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  </script>
</body>
</html>`;
  
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
});

router.all('*', () => new Response('Not found', { status: 404 }));

export default {
  async fetch(request, env, ctx) { return router.handle(request, env, ctx); },
  async scheduled(event, env, ctx) { await handleCronPrices(null, env, ctx); }
};
