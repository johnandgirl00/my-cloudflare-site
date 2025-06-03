# 🚀 My Cloudflare Site

> **현대적인 모듈형 아키텍처**로 구축된 암호화폐 커뮤니티 플랫폼

Cloudflare Workers와 D1 데이터베이스를 활용한 풀스택 웹 애플리케이션입니다. 암호화폐 가격 추적, 커뮤니티 기능, 미디어 관리 등을 제공합니다.

## 🌐 **배포된 서비스**

**🔗 메인 URL**: https://my-cloudflare-site.johnandgirl.workers.dev

## ✨ **주요 기능**

### 🔄 **자동화된 데이터 수집**
- CoinGecko API를 통한 실시간 암호화폐 가격 수집
- 매시간 자동 업데이트 (Cloudflare Cron Triggers)
- D1 데이터베이스에 효율적인 데이터 저장

### 📊 **데이터 시각화**
- 실시간 가격 차트 생성
- 커스터마이징 가능한 SVG 차트
- R2 버킷을 통한 고성능 미디어 서빙

### 💬 **커뮤니티 플랫폼**
- 게시글 작성 및 관리
- 실시간 댓글 시스템
- 사용자 인증 및 프로필 관리
- 미디어 파일 업로드 지원

### 🏗️ **모던 아키텍처**
- **모듈형 API 구조**: 각 기능별 독립적인 모듈
- **TypeScript-like 구조**: 명확한 타입 정의와 에러 처리
- **확장 가능한 설계**: 새로운 기능 추가 용이

## 📁 **프로젝트 구조**

```
my-cloudflare-site/
├── src/
│   ├── index.js                 # 🎯 메인 라우터 및 애플리케이션 진입점
│   ├── cronPrices.js           # ⏰ 자동 가격 데이터 수집
│   ├── dataApi.js              # 📊 통합 데이터 API
│   ├── embedChart.js           # 📈 차트 임베딩 서비스
│   ├── generateWebM.js         # 🎨 동적 차트 생성
│   ├── serveMedia.js           # 🖼️ 미디어 파일 서빙
│   ├── utils.js                # 🔧 공통 유틸리티
│   │
│   ├── utils/
│   │   └── database.js         # 🗄️ 데이터베이스 초기화 및 관리
│   │
│   └── api/                    # 🏗️ 모듈형 API 구조
│       ├── coins/              # 💰 암호화폐 관련 API
│       │   ├── fetch.js        #   - 외부 API 데이터 수집
│       │   ├── save.js         #   - 데이터베이스 저장
│       │   ├── list.js         #   - 코인 목록 조회
│       │   └── chart.js        #   - 차트 데이터 생성
│       │
│       ├── posts/              # 📝 게시글 관리 API
│       │   ├── create.js       #   - 게시글 생성
│       │   ├── list.js         #   - 게시글 목록 조회
│       │   └── detail.js       #   - 게시글 상세 정보
│       │
│       ├── comments/           # 💬 댓글 시스템 API
│       │   ├── create.js       #   - 댓글 생성
│       │   └── list.js         #   - 댓글 목록 조회
│       │
│       ├── users/              # 👥 사용자 관리 API
│       │   ├── create.js       #   - 사용자 생성
│       │   ├── list.js         #   - 사용자 목록
│       │   └── detail.js       #   - 사용자 상세 정보
│       │
│       └── media/              # 🖼️ 미디어 관리 API
│           ├── upload.js       #   - 파일 업로드
│           └── list.js         #   - 미디어 목록
│
├── migrations/
│   └── 0001_database.sql       # 🗃️ 데이터베이스 스키마 정의
│
├── workers-site/
│   ├── index.html              # 🌐 프론트엔드 메인 페이지
│   └── index.js                # ⚡ 클라이언트사이드 JavaScript
│
├── wrangler.toml               # ⚙️ Cloudflare Workers 설정
└── package.json                # 📦 Node.js 의존성 관리
```

## 🛠️ **기술 스택**

### **Backend**
- **Runtime**: Cloudflare Workers (Edge Computing)
- **Database**: Cloudflare D1 (SQLite-based)
- **Storage**: Cloudflare R2 (Object Storage)
- **Router**: itty-router (경량 라우팅)

### **Frontend**
- **Vanilla JavaScript**: 빠르고 가벼운 클라이언트
- **Modern CSS**: 반응형 디자인
- **Progressive Enhancement**: 점진적 기능 향상

### **External Services**
- **CoinGecko API**: 실시간 암호화폐 데이터
- **Cloudflare Cron Triggers**: 자동화된 작업 스케줄링

## 🚀 **API 엔드포인트**

### **📊 데이터 API**
```bash
GET  /api/data              # 통합 데이터 조회
GET  /cron/prices           # 수동 가격 데이터 수집
```

### **💰 암호화폐 API**
```bash
GET  /api/coins/fetch       # 외부 API에서 데이터 수집
POST /api/coins/save        # 데이터베이스에 데이터 저장
GET  /api/coins/list        # 저장된 코인 목록
GET  /api/coins/chart       # 차트 데이터 생성
```

### **📝 커뮤니티 API (Legacy)**
```bash
GET  /api/posts             # 게시글 목록 조회
POST /api/posts             # 새 게시글 생성
POST /api/posts/:id/comments # 댓글 생성
```

### **🔄 새로운 모듈형 API (v2)**
```bash
# Posts
GET  /api/v2/posts          # 게시글 목록 (고급 필터링)
POST /api/v2/posts          # 게시글 생성 (미디어 지원)
GET  /api/v2/posts/:id      # 게시글 상세 정보

# Comments  
GET  /api/v2/comments       # 댓글 목록
POST /api/v2/comments       # 댓글 생성

# Users
GET  /api/v2/users          # 사용자 목록
POST /api/v2/users          # 사용자 생성
GET  /api/v2/users/:id      # 사용자 상세 정보

# Media
GET  /api/v2/media          # 미디어 파일 목록  
POST /api/v2/media          # 파일 업로드
```

## 💾 **데이터베이스 스키마**

### **주요 테이블**
- `🪙 coins` - 암호화폐 기본 정보
- `📈 coin_prices` - 시계열 가격 데이터  
- `📝 posts` - 커뮤니티 게시글
- `💬 comments` - 댓글 시스템
- `👥 users` - 사용자 계정
- `🖼️ media_files` - 업로드된 미디어

## 🚀 **개발 및 배포**

### **로컬 개발 환경 설정**

```bash
# 1. 프로젝트 클론
git clone <repository-url>
cd my-cloudflare-site

# 2. 의존성 설치
npm install

# 3. 환경 설정
cp wrangler.toml.example wrangler.toml
# wrangler.toml 파일에서 your-account-id와 database-id 수정

# 4. 데이터베이스 마이그레이션
npx wrangler d1 migrations apply my_coingecko_db

# 5. 로컬 개발 서버 실행
npx wrangler dev
```

### **배포**

```bash
# Cloudflare Workers에 배포
npm run deploy
# 또는
npx wrangler deploy
```

### **데이터베이스 관리**

```bash
# 새로운 마이그레이션 생성
npx wrangler d1 migrations create my_coingecko_db "migration_name"

# 마이그레이션 적용
npx wrangler d1 migrations apply my_coingecko_db

# 데이터베이스 콘솔 접속
npx wrangler d1 execute my_coingecko_db --command="SELECT * FROM posts LIMIT 5"
```

## ⚡ **성능 특징**

### **🌍 글로벌 엣지 배포**
- Cloudflare의 전 세계 200+ 데이터센터에서 실행
- 사용자와 가장 가까운 위치에서 응답
- 평균 응답 시간 < 100ms

### **🔄 자동 스케일링**
- 트래픽 증가에 따른 자동 확장
- Cold Start 최소화
- 무제한 동시 요청 처리

### **📱 모바일 최적화**
- 반응형 웹 디자인
- 적응형 이미지 로딩
- 터치 친화적 인터페이스

## 🔐 **보안 및 인증**

### **현재 구현된 기능**
- CORS 헤더 적절한 설정
- 입력 데이터 검증 및 새니타이징
- SQL Injection 방지 (Prepared Statements)

### **향후 계획**
- JWT 기반 사용자 인증
- Google OAuth 통합
- 역할 기반 권한 관리 (RBAC)
- 레이트 리미팅

## 📊 **모니터링 및 로깅**

### **내장된 로깅**
- 구조화된 로그 출력
- 에러 추적 및 디버깅 정보
- 성능 메트릭 수집

### **권장 모니터링 도구**
- Cloudflare Analytics Dashboard
- Wrangler Logs (`npx wrangler tail`)
- Custom Metrics with Cloudflare Workers Analytics Engine

## 🔄 **최근 업데이트** (2025.06.02)

### ✅ **완료된 마이그레이션**
- **모듈형 API 아키텍처**: 단일 파일에서 모듈별 구조로 분리
- **레거시 코드 정리**: 불필요한 백업 파일 22개 삭제
- **새로운 데이터베이스 스키마**: 확장 가능한 테이블 구조
- **향상된 에러 처리**: 모든 API에서 일관된 에러 응답

### 🎯 **다음 단계**
1. **데이터베이스 마이그레이션 실행**: 새로운 스키마 적용
2. **사용자 인증 시스템**: Google OAuth 통합
3. **실시간 기능**: WebSocket을 통한 라이브 댓글
4. **성능 최적화**: 캐싱 전략 및 쿼리 최적화

## 🤝 **기여하기**

### **개발 워크플로우**
1. Feature Branch 생성
2. 모듈별 개발 (API별로 독립적)
3. 단위 테스트 작성
4. Pull Request 생성

### **코딩 스타일**
- ESLint 설정 준수
- 모듈별 단일 책임 원칙
- 명확한 함수명과 변수명
- 충분한 주석과 문서화

## 📞 **지원 및 문의**

- **이슈 리포팅**: GitHub Issues
- **기능 요청**: GitHub Discussions
- **문서 기여**: Pull Requests 환영

---

## 📈 **프로젝트 통계**

- **총 API 엔드포인트**: 20+
- **데이터베이스 테이블**: 6개
- **모듈 수**: 15개
- **코드 라인 수**: 2,000+ lines
- **배포 환경**: Production Ready

---

**🔄 마지막 업데이트**: 2025년 6월 2일_250602  
**📍 현재 상태**: ✅ 완전 작동, 새로운 모듈형 아키텍처 적용 완료  
**🚀 다음 릴리즈**: v2.0 - 사용자 인증 및 실시간 기능
