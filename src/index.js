import { Router } from 'itty-router';
import { handleCronPrices } from './cronPrices.js';
import { handleDataApi } from './dataApi.js';
import { handleGenerateWebM } from './generateWebM.js';
import { handleServeMedia } from './serveMedia.js';
import { handleEmbedChart } from './embedChart.js';

// 새로운 모듈형 API imports
import { handleCoinsFetch } from './api/coins/fetch.js';
import { handleCoinsSave } from './api/coins/save.js';
import { handleCoinsList } from './api/coins/list.js';
import { handleCoinsChart } from './api/coins/chart.js';
import { handlePostsCreate } from './api/posts/create.js';
import { handlePostsList } from './api/posts/list.js';
import { handlePostsDetail } from './api/posts/detail.js';
import { handleCommentsCreate } from './api/comments/create.js';
import { handleCommentsList } from './api/comments/list.js';
import { handleUsersCreate } from './api/users/create.js';
import { handleUsersList } from './api/users/list.js';
import { handleUsersDetail } from './api/users/detail.js';
import { handleMediaUpload } from './api/media/upload.js';
import { handleMediaList } from './api/media/list.js';

const router = Router();

// 기존 API 라우트들 (레거시 호환성)
router.get('/cron/prices', (request, env, ctx) => handleCronPrices(request, env, ctx));
router.get('/api/data', (request, env, ctx) => handleDataApi(request, env, ctx)); // 통합된 데이터 API

// 커뮤니티 API들 (새로운 모듈형 구조 사용)
router.get('/api/posts', (request, env, ctx) => handlePostsList(request, env, ctx));
router.post('/api/posts', (request, env, ctx) => handlePostsCreate(request, env, ctx));
router.post('/api/posts/:id/comments', (request, env, ctx) => {
  // URL에서 post_id를 추출하여 body에 추가
  const url = new URL(request.url);
  const postId = url.pathname.split('/')[3];
  
  // 원본 request body와 post_id를 합치는 wrapper
  const wrappedRequest = new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: request.body
  });
  
  // post_id를 주입하기 위한 custom json() 메서드
  wrappedRequest.json = async () => {
    const originalBody = await request.json();
    return { ...originalBody, post_id: parseInt(postId) };
  };
  
  return handleCommentsCreate(wrappedRequest, env, ctx);
});

// 새로운 모듈형 API 라우트들
// Coins API
router.get('/api/coins/fetch', (request, env, ctx) => handleCoinsFetch(request, env, ctx));
router.post('/api/coins/save', (request, env, ctx) => handleCoinsSave(request, env, ctx));
router.get('/api/coins/list', (request, env, ctx) => handleCoinsList(request, env, ctx));
router.get('/api/coins/chart', (request, env, ctx) => handleCoinsChart(request, env, ctx));

// Posts API (새 구조)
router.post('/api/v2/posts', (request, env, ctx) => handlePostsCreate(request, env, ctx));
router.get('/api/v2/posts', (request, env, ctx) => handlePostsList(request, env, ctx));
router.get('/api/v2/posts/:id', (request, env, ctx) => handlePostsDetail(request, env, ctx));

// Comments API (새 구조)
router.post('/api/v2/comments', (request, env, ctx) => handleCommentsCreate(request, env, ctx));
router.get('/api/v2/comments', (request, env, ctx) => handleCommentsList(request, env, ctx));

// Users API
router.post('/api/users', (request, env, ctx) => handleUsersCreate(request, env, ctx));
router.get('/api/users', (request, env, ctx) => handleUsersList(request, env, ctx));
router.get('/api/users/:id', (request, env, ctx) => handleUsersDetail(request, env, ctx));

// Media API
router.post('/api/media/upload', (request, env, ctx) => handleMediaUpload(request, env, ctx));
router.get('/api/media', (request, env, ctx) => handleMediaList(request, env, ctx));

// 기타 API들
router.post('/api/generate-webm', (request, env, ctx) => handleGenerateWebM(request, env, ctx));
router.get('/media/:key', (request, env, ctx) => handleServeMedia(request, env, ctx));
router.get('/embed/chart.webm', (request, env, ctx) => handleEmbedChart(request, env, ctx));

// 관리자 페이지
router.get('/admin', () => {
  const html = '<!DOCTYPE html>' +
    '<html lang="ko">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>CryptoGram - 관리자</title>' +
    '<style>' +
    'body { margin: 0; padding: 2rem; font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f5f5f5; }' +
    '.container { max-width: 800px; margin: 0 auto; background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }' +
    '.status { padding: 1rem; margin: 1rem 0; border-radius: 8px; background: #e3f2fd; border-left: 4px solid #2196f3; }' +
    '.btn { background: #2196f3; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; margin: 0.5rem; }' +
    '.btn:hover { background: #1976d2; }' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<div class="container">' +
    '<h1>🚀 CryptoGram 관리자</h1>' +
    '<p><a href="/">← 메인으로 돌아가기</a></p>' +
    '<div class="status" id="status">시스템 준비됨</div>' +
    '<button class="btn" onclick="checkData()">데이터 확인</button>' +
    '<button class="btn" onclick="generateWebM()">WebM 생성</button>' +
    '</div>' +
    '<script>' +
    'const status = document.getElementById("status");' +
    'async function checkData() {' +
    '  status.textContent = "데이터 확인 중...";' +
    '  try {' +
    '    const res = await fetch("/api/data");' +
    '    const data = await res.json();' +
    '    status.innerHTML = "✅ 데이터 " + data.length + "개 확인됨";' +
    '  } catch (err) {' +
    '    status.innerHTML = "❌ 데이터 확인 실패: " + err.message;' +
    '  }' +
    '}' +
    'async function generateWebM() {' +
    '  status.textContent = "WebM 생성 중...";' +
    '  try {' +
    '    const res = await fetch("/api/generate-webm", { method: "POST" });' +
    '    const result = await res.json();' +
    '    status.innerHTML = "✅ WebM 생성 완료: " + result.url;' +
    '  } catch (err) {' +
    '    status.innerHTML = "❌ WebM 생성 실패: " + err.message;' +
    '  }' +
    '}' +
    'checkData();' +
    '</script>' +
    '</body>' +
    '</html>';
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
});

// 메인 페이지 - Instagram 스타일 커뮤니티
router.get('/', () => {
  const html = '<!DOCTYPE html>' +
    '<html lang="ko">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>CryptoGram</title>' +
    '<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">' +
    '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">' +
    '<style>' +
    '* { margin: 0; padding: 0; box-sizing: border-box; }' +
    'body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #fafafa; }' +
    '.content-container { max-width: 470px; margin: 0 auto; }' +
    '@media (min-width: 768px) { .content-container { max-width: 614px; } }' +
    '.story-gradient { background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); padding: 2px; }' +
    '.hover-scale { transition: transform 0.2s; }' +
    '.hover-scale:hover { transform: scale(1.05); }' +
    '.post-input { flex: 1; border: 1px solid #dbdbdb; border-radius: 22px; padding: 0 16px; font-size: 14px; outline: none; }' +
    '.post-input:focus { border-color: #a8a8a8; }' +
    '</style>' +
    '</head>' +
    '<body class="bg-gray-50">' +
    '<nav class="bg-white border-b border-gray-200 fixed top-0 w-full z-50">' +
    '<div class="content-container px-4">' +
    '<div class="flex justify-between items-center h-16">' +
    '<div class="flex items-center space-x-3">' +
    '<i class="fab fa-bitcoin text-2xl text-yellow-500"></i>' +
    '<h1 class="text-xl font-semibold">CryptoGram</h1>' +
    '</div>' +
    '<div class="flex items-center space-x-4">' +
    '<a href="/admin" class="text-xs text-gray-400 hover:text-gray-600">관리자</a>' +
    '<button onclick="quickLogin()" id="login-btn" class="text-sm bg-blue-500 text-white px-4 py-1.5 rounded-md hover:bg-blue-600 transition">로그인</button>' +
    '<div id="user-info" class="hidden flex items-center space-x-3">' +
    '<span id="username-display" class="text-sm font-medium"></span>' +
    '<div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">' +
    '<span id="user-avatar-text"></span>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</nav>' +
    '<main class="pt-16">' +
    '<div class="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 py-4">' +
    '<div class="content-container px-4">' +
    '<div class="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-6 text-white text-center">' +
    '<h2 class="text-2xl font-bold mb-2">📈 Bitcoin Live Chart</h2>' +
    '<p class="text-white text-opacity-90 text-sm">실시간 암호화폐 차트와 커뮤니티</p>' +
    '<div class="mt-4 bg-white bg-opacity-20 rounded-xl overflow-hidden">' +
    '<object data="/embed/chart.webm" type="image/svg+xml" width="100%" height="200" style="border-radius: 8px;">' +
    '<div class="flex items-center justify-center h-48">' +
    '<span class="text-white text-opacity-60 text-sm">차트 로딩 중...</span>' +
    '</div>' +
    '</object>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<div class="content-container px-4 py-6">' +
    '<div id="post-creator" class="bg-white rounded-lg shadow-sm border border-gray-200 mb-3 opacity-60 pointer-events-none">' +
    '<div class="flex items-center p-3 gap-2">' +
    '<input type="text" id="post-content" class="post-input h-10" placeholder="로그인 후 생각을 공유하세요..." onkeypress="if(event.key===\'Enter\' && currentUser) { createPost(); }"/>' +
    '<button onclick="createPost()" class="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-600 transition">게시</button>' +
    '</div>' +
    '</div>' +
    '<div id="posts-container" class="space-y-3">' +
    '<div class="text-center py-8">' +
    '<div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">' +
    '<i class="fas fa-spinner fa-spin text-gray-400"></i>' +
    '</div>' +
    '<p class="text-gray-500">포스트를 불러오는 중...</p>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</main>' +
    '<script>' +
    'let currentUser = null;' +
    'window.addEventListener("load", function() { loadPosts(); });' +
    'function quickLogin() {' +
    'const username = prompt("사용자명을 입력하세요 (2-10자):");' +
    'if (!username || username.length < 2 || username.length > 10) {' +
    'alert("2-10자 사이의 사용자명을 입력해주세요.");' +
    'return;' +
    '}' +
    'currentUser = { id: Date.now(), name: username };' +
    'document.getElementById("login-btn").classList.add("hidden");' +
    'document.getElementById("user-info").classList.remove("hidden");' +
    'document.getElementById("username-display").textContent = username;' +
    'document.getElementById("user-avatar-text").textContent = username.charAt(0).toUpperCase();' +
    'const postCreator = document.getElementById("post-creator");' +
    'postCreator.classList.remove("opacity-60", "pointer-events-none");' +
    'document.getElementById("post-content").placeholder = "무슨 생각을 하고 계신가요?";' +
    'updateCommentForms();' +
    '}' +
    'function updateCommentForms() {' +
    'document.querySelectorAll(".comment-input").forEach(input => {' +
    'input.disabled = !currentUser;' +
    'input.placeholder = currentUser ? "댓글 달기..." : "로그인 후 댓글을 달 수 있습니다";' +
    '});' +
    'document.querySelectorAll("button[onclick*=\\"addComment\\"]").forEach(button => {' +
    'button.disabled = !currentUser;' +
    'if (currentUser) {' +
    'button.classList.remove("opacity-50", "cursor-not-allowed");' +
    '} else {' +
    'button.classList.add("opacity-50", "cursor-not-allowed");' +
    '}' +
    '});' +
    '}' +
    'async function createPost() {' +
    'if (!currentUser) { quickLogin(); return; }' +
    'const content = document.getElementById("post-content").value.trim();' +
    'if (!content) return;' +
    'try {' +
    'const response = await fetch("/api/posts", {' +
    'method: "POST",' +
    'headers: { "Content-Type": "application/json" },' +
    'body: JSON.stringify({ content: content, user: currentUser })' +
    '});' +
    'if (response.ok) {' +
    'document.getElementById("post-content").value = "";' +
    'loadPosts();' +
    '}' +
    '} catch (err) {' +
    'alert("포스트 작성에 실패했습니다.");' +
    '}' +
    '}' +
    'async function loadPosts() {' +
    'try {' +
    'console.log("포스트 로드 시작...");' +
    'const response = await fetch("/api/posts");' +
    'console.log("API 응답 수신:", response.status);' +
    'const posts = await response.json();' +
    'console.log("포스트 데이터:", posts);' +
    'const container = document.getElementById("posts-container");' +
    'if (posts.length === 0) {' +
    'container.innerHTML = "<div class=\\"text-center py-12\\"><i class=\\"far fa-images text-6xl text-gray-300 mb-4\\"></i><p class=\\"text-gray-500 mb-4\\">아직 게시물이 없습니다</p><button onclick=\\"quickLogin()\\" class=\\"text-blue-500 font-medium\\">첫 번째 게시물을 작성해보세요</button></div>";' +
    'return;' +
    '}' +
    'console.log("포스트 HTML 생성 시작...");' +
    'let htmlContent = "";' +
    'for (let i = 0; i < posts.length; i++) {' +
    'const post = posts[i];' +
    'console.log("포스트 처리 중:", post.post_id);' +
    'const postHTML = createPostHTML(post);' +
    'console.log("포스트 HTML 생성됨:", postHTML.length, "characters");' +
    'htmlContent += postHTML;' +
    '}' +
    'container.innerHTML = htmlContent;' +
    'console.log("포스트 HTML 생성 완료, 총 길이:", htmlContent.length);' +
    'updateCommentForms();' +
    '} catch (err) {' +
    'console.error("포스트 로드 실패:", err);' +
    'const container = document.getElementById("posts-container");' +
    'container.innerHTML = "<div class=\\"text-center py-12 text-red-500\\">포스트 로드 중 오류가 발생했습니다: " + err.message + "</div>";' +
    '}' +
    '}' +
    'function createPostHTML(post) {' +
    'console.log("createPostHTML 호출됨, post:", post);' +
    'try {' +
    'const timeAgo = getTimeAgo(new Date(post.created_at));' +
    'const authorName = "User" + post.author_id;' +
    'const comments = post.comments || [];' +
    'const avatarLetter = authorName.charAt(0).toUpperCase();' +
    '' +
    'let commentsHTML = "";' +
    'if (comments.length > 0) {' +
    'commentsHTML = "<div class=\\"px-4 py-2 space-y-1\\">";' +
    'for (let i = 0; i < comments.length; i++) {' +
    'const comment = comments[i];' +
    'const commentAuthor = "User" + comment.author_id;' +
    'commentsHTML += "<div class=\\"text-sm\\"><span class=\\"font-medium\\">" + commentAuthor + "</span><span class=\\"ml-1\\">" + comment.content + "</span></div>";' +
    '}' +
    'commentsHTML += "</div>";' +
    '}' +
    '' +
    'const html = "<article class=\\"bg-white rounded-lg shadow-sm border border-gray-200\\">" +' +
    '"<div class=\\"flex items-center justify-between p-4\\">" +' +
    '"<div class=\\"flex items-center space-x-3\\">" +' +
    '"<div class=\\"story-gradient rounded-full p-0.5\\">" +' +
    '"<div class=\\"bg-white p-0.5 rounded-full\\">" +' +
    '"<div class=\\"w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold\\">" +' +
    'avatarLetter +' +
    '"</div></div></div>" +' +
    '"<div><p class=\\"font-medium text-sm\\">" + authorName + "</p>" +' +
    '"<p class=\\"text-xs text-gray-500\\">" + timeAgo + "</p></div>" +' +
    '"</div>" +' +
    '"<button class=\\"text-gray-400 hover:text-gray-600\\"><i class=\\"fas fa-ellipsis-h\\"></i></button>" +' +
    '"</div>" +' +
    '"<div class=\\"px-4 pb-3\\"><p class=\\"text-sm\\">" + post.content + "</p></div>" +' +
    '"<div class=\\"px-4 pb-2\\"><div class=\\"flex items-center space-x-4\\">" +' +
    '"<button class=\\"hover-scale\\"><i class=\\"far fa-heart text-2xl\\"></i></button>" +' +
    '"<button class=\\"hover-scale\\"><i class=\\"far fa-comment text-2xl\\"></i></button>" +' +
    '"<button class=\\"hover-scale\\"><i class=\\"far fa-paper-plane text-2xl\\"></i></button>" +' +
    '"<button class=\\"ml-auto hover-scale\\"><i class=\\"far fa-bookmark text-2xl\\"></i></button>" +' +
    '"</div></div>" +' +
    '"<div class=\\"border-t border-gray-100\\">" + commentsHTML +' +
    '"<div class=\\"flex items-center p-3 gap-2 border-t border-gray-100\\">" +' +
    '"<input type=\\"text\\" class=\\"comment-input post-input h-9\\" placeholder=\\"댓글 달기...\\" onkeypress=\\"if(event.key===\'Enter\' && currentUser) { addComment(" + post.post_id + ", this.value); this.value=\'\'; }\\" disabled>" +' +
    '"<button onclick=\\"addComment(" + post.post_id + ", this.previousElementSibling.value); this.previousElementSibling.value=\'\';\\" class=\\"text-blue-500 font-medium text-sm px-3 py-1.5 opacity-50 cursor-not-allowed\\" disabled>게시</button>" +' +
    '"</div></div></article>";' +
    '' +
    'console.log("HTML 생성 완료, post_id:", post.post_id);' +
    'return html;' +
    '} catch (err) {' +
    'console.error("createPostHTML 에러:", err);' +
    'return "<div style=\\"color: red; border: 2px solid red; padding: 15px; margin: 10px;\\">오류: " + err.message + "</div>";' +
    '}' +
    '}' +
    'async function addComment(postId, content) {' +
    'if (!currentUser || !content.trim()) return;' +
    'try {' +
    'const response = await fetch("/api/posts/" + postId + "/comments", {' +
    'method: "POST",' +
    'headers: { "Content-Type": "application/json" },' +
    'body: JSON.stringify({ content: content.trim(), user: currentUser })' +
    '});' +
    'if (response.ok) { loadPosts(); }' +
    '} catch (err) {' +
    'alert("댓글 작성에 실패했습니다.");' +
    '}' +
    '}' +
    'function escapeHtml(text) {' +
    'const div = document.createElement("div");' +
    'div.textContent = text;' +
    'return div.innerHTML;' +
    '}' +
    'function getTimeAgo(date) {' +
    'const seconds = Math.floor((new Date() - date) / 1000);' +
    'const intervals = { "년": 31536000, "개월": 2592000, "일": 86400, "시간": 3600, "분": 60 };' +
    'for (const [unit, secondsInUnit] of Object.entries(intervals)) {' +
    'const interval = Math.floor(seconds / secondsInUnit);' +
    'if (interval >= 1) { return interval + unit + " 전"; }' +
    '}' +
    'return "방금 전";' +
    '}' +
    '</script>' +
    '</body>' +
    '</html>';
  
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
});

// 404 처리
router.all('*', () => new Response('Not found', { status: 404 }));

export default {
  async fetch(request, env, ctx) {
    return router.handle(request, env, ctx);
  },
  
  async scheduled(event, env, ctx) {
    await handleCronPrices(null, env, ctx);
  }
};
