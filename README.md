# 🚀 CryptoGram - Bitcoin Community & Discord Marketing Platform

실시간 Bitcoin 차트와 커뮤니티 기능을 제공하는 Cloudflare Workers 기반 웹 애플리케이션입니다.

## ✨ 주요 기능

### 📈 **Bitcoin 커뮤니티**
- **실시간 Bitcoin 차트** - TradingView 임베드 차트
- **Instagram 스타일 커뮤니티** - 게시글 작성, 댓글, 상호작용
- **간편 로그인** - 빠른 사용자 인증 시스템
- **반응형 디자인** - 모바일 친화적 UI

### 🤖 **Discord 자동화 마케팅**
- **시간당 자동 포스팅** - AI 생성 페르소나 기반 마케팅 메시지
- **실시간 가격 데이터 수집** - CoinGecko API 연동
- **Discord 웹훅 연동** - 자동 채널 포스팅
- **사용자 참여 통계** - Discord 가입 추적

## 🛠️ 기술 스택

- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Router**: itty-router
- **AI**: OpenAI GPT API
- **Charts**: TradingView Widget
- **Storage**: Cloudflare KV (이미지/미디어)
- **Styling**: Tailwind CSS

## 📦 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
Cloudflare Workers에서 다음 시크릿을 설정하세요:
```bash
# Discord 웹훅 URL
wrangler secret put DISCORD_WEBHOOK_URL

# OpenAI API 키
wrangler secret put OPENAI_API_KEY

# GitHub 토큰 (선택적)
wrangler secret put GITHUB_TOKEN
```

### 3. 데이터베이스 마이그레이션
```bash
wrangler d1 execute my-database --file=migrations/0001_database.sql
wrangler d1 execute my-database --file=migrations/0002_personas.sql
wrangler d1 execute my-database --file=migrations/0004_error_logging.sql
```

### 4. 로컬 개발
```bash
npm run dev
# 또는
wrangler dev
```

### 5. 배포
```bash
npm run deploy
# 또는
wrangler deploy
```

## 📁 프로젝트 구조

```
src/
├── index.js                 # 메인 라우터 (커뮤니티 + Discord 시스템)
├── cronPrices.js           # 가격 데이터 수집 크론
├── api/                    # REST API 엔드포인트
│   ├── posts/             # 게시글 CRUD
│   ├── comments/          # 댓글 시스템
│   ├── users/             # 사용자 관리
│   ├── discord/           # Discord 연동
│   └── coins/             # 암호화폐 데이터
├── bots/                   # Discord 자동화
│   └── scheduler/         # 시간별 포스팅 봇
├── charts/                 # 차트 생성/임베드
├── handlers/               # 요청 핸들러
└── utils/                  # 유틸리티 함수
```

## 🔄 자동화 스케줄

- **매시 정각 (xx:00)**: Bitcoin 가격 데이터 수집
- **매시 15분 (xx:15)**: AI 생성 Discord 마케팅 포스트

## 🌐 API 엔드포인트

### 커뮤니티 API
- `GET /api/posts/list` - 게시글 목록
- `POST /api/posts/create` - 게시글 작성
- `POST /api/comments/create` - 댓글 작성
- `GET /api/users/list` - 사용자 목록

### Discord API
- `POST /api/discord/join` - Discord 가입 추적
- `GET /api/discord/stats` - 가입 통계

### 데이터 API
- `GET /api/coins/list` - 코인 가격 데이터
- `GET /api/data` - 시스템 데이터
- `GET /chart/embed` - 차트 임베드

## 🎯 주요 페이지

- `/` - 메인 커뮤니티 페이지 (Bitcoin 차트 + 게시글)
- `/admin` - 관리자 대시보드
- `/api/dashboard` - 시스템 상태 대시보드

## 🔧 설정

### wrangler.toml 주요 설정
```toml
name = "my-cloudflare-site"
compatibility_date = "2024-01-01"

# 크론 스케줄 설정
[triggers]
crons = ["0 * * * *", "15 * * * *"]

# D1 데이터베이스 연결
[[d1_databases]]
binding = "DB"
database_name = "my-database"
database_id = "your-database-id"
```

## 🚀 배포 후 확인사항

1. **웹사이트 접속** - 메인 페이지에서 Bitcoin 차트와 커뮤니티 확인
2. **Discord 웹훅** - 시크릿 설정 및 자동 포스팅 확인
3. **크론 작업** - 매시 정각/15분 자동화 동작 확인
4. **API 테스트** - `/api/posts/list` 등 주요 엔드포인트 확인

## 📊 모니터링

- **시스템 상태**: `/api/health`
- **오류 로그**: D1 데이터베이스 `error_logs` 테이블
- **Discord 통계**: `/api/discord/stats`

## 🤝 기여

이 프로젝트는 Bitcoin 커뮤니티와 Discord 마케팅 자동화를 위한 올인원 솔루션입니다.

---

**Built with ❤️ using Cloudflare Workers**
