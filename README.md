# 암호화폐 WebM 차트 서비스

커뮤니티 임베딩을 위한 암호화폐 차트 서비스입니다. Bitcoin 가격 차트를 애니메이션 SVG로 생성하여 암호화폐 커뮤니티 사이트 상단 1/3 영역에 임베드할 수 있습니다.

## 🚀 배포된 서비스

**메인 URL**: https://my-cloudflare-site.johnandgirl.workers.dev

## 📋 프로젝트 개요

이 서비스는 다음과 같은 기능을 제공합니다:

- 🔄 CoinGecko API를 통한 자동 가격 데이터 수집 (매시간)
- 📊 Cloudflare D1 데이터베이스에 가격 데이터 저장
- 🎬 애니메이션 SVG 차트 생성 및 R2 버킷 저장
- 🌐 커뮤니티 사이트 임베딩을 위한 API 제공
- 📈 실시간 가격 트렌드 표시

## ✅ 완료된 기능

### 인프라 및 데이터 수집
- [x] Cloudflare Workers 아키텍처 구축 (D1 + R2)
- [x] CoinGecko API 연동 및 자동 데이터 수집
- [x] 시간별 크론 작업으로 Bitcoin/Ethereum 가격 수집
- [x] D1 데이터베이스에 가격 데이터 저장

### 차트 생성 및 서빙
- [x] 애니메이션 SVG 차트 생성 시스템 (400x200px)
- [x] 그라디언트, 라이브 인디케이터, 가격 트렌드 포함
- [x] R2 버킷에 차트 파일 저장
- [x] 관리자 대시보드 (`/admin`)
- [x] 차트 생성 API (`/api/generate-chart`)

### 임베딩 시스템
- [x] 임베드 엔드포인트 (`/embed/chart.webm`)
- [x] CORS 헤더 및 캐시 제어 설정
- [x] 커뮤니티 사이트 임베딩용 코드 제공

## ❌ 해결 필요한 이슈

### 🚨 우선순위 높음: 브라우저 로딩 문제
- **문제**: 임베드 URL이 로컬에서는 작동하지만 브라우저에서 지속적인 로딩 상태
- **URL**: https://my-cloudflare-site.johnandgirl.workers.dev/embed/chart.webm
- **추정 원인**: HTTP 헤더 또는 MIME 타입 구성 문제
- **영향**: 커뮤니티 사이트에서 차트 임베딩 불가

## 📁 프로젝트 구조

```
/src/
├── index.js          # 메인 라우터 및 관리자 대시보드
├── cronPrices.js     # CoinGecko API 데이터 수집
├── dataApi.js        # D1 데이터베이스 쿼리 API
├── generateWebM.js   # 애니메이션 SVG 차트 생성
├── serveMedia.js     # R2 미디어 파일 서빙 (디버깅 포함)
├── embedChart.js     # 고정 임베드 URL 핸들러
└── utils.js          # 유틸리티 함수

/migrations/
└── 0001_create_prices_table.sql  # D1 데이터베이스 스키마

wrangler.toml         # Cloudflare 설정
package.json          # 종속성 (itty-router)
```

## 🔧 주요 API 엔드포인트

### 관리자 기능
- `GET /` - 메인 페이지
- `GET /admin` - 관리자 대시보드
- `POST /api/generate-chart` - 수동 차트 생성

### 데이터 API
- `GET /api/prices` - 저장된 가격 데이터 조회
- `GET /api/data-status` - 데이터베이스 상태 확인

### 임베딩
- `GET /embed/chart.webm` - 최신 차트 임베드 (🚨 이슈 발생 중)

### 크론 작업
- 매시간 자동 가격 데이터 수집 및 차트 업데이트

## 🛠 개발 및 배포

### 로컬 개발
```bash
# 프로젝트 폴더로 이동
cd /workspaces/my-cloudflare-site

# 종속성 설치
npm install

# 로컬 개발 서버 실행
npx wrangler dev

# D1 데이터베이스 마이그레이션
npx wrangler d1 migrations apply crypto-prices-db
```

### 배포
```bash
# Cloudflare Workers에 배포
npx wrangler deploy
```

## 📊 기술 스택

- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2
- **Router**: itty-router
- **External API**: CoinGecko API
- **Chart Format**: 애니메이션 SVG (WebM 대신 성능상 이유)

## 🔍 디버깅 정보

### 현재 차트 생성 흐름
1. 크론 작업이 매시간 CoinGecko에서 가격 데이터 수집
2. 데이터를 D1 데이터베이스에 저장
3. 차트 생성 시 최근 24시간 데이터 조회
4. SVG 애니메이션 차트 생성 (400x200px)
5. R2 버킷에 저장 및 임베드 URL로 서빙

### 로그 및 모니터링
- R2 저장 및 미디어 서빙에 상세한 로깅 추가됨
- 관리자 대시보드에서 데이터 상태 확인 가능
- 수동 차트 생성으로 테스트 가능

## 🎯 다음 단계

1. **우선**: 브라우저 로딩 이슈 해결
   - HTTP 헤더 검토
   - MIME 타입 확인
   - CORS 설정 점검

2. **개선사항**:
   - 다중 암호화폐 지원 확장
   - 차트 커스터마이징 옵션
   - 성능 최적화
   - 에러 처리 강화

## 📞 문제 해결

브라우저 로딩 이슈가 해결되면 다음과 같이 사용 가능:

```html
<!-- 커뮤니티 사이트 임베딩 -->
<div style="width: 400px; height: 200px;">
  <object data="https://my-cloudflare-site.johnandgirl.workers.dev/embed/chart.webm" 
          type="image/svg+xml" 
          width="400" 
          height="200">
    차트를 로드할 수 없습니다.
  </object>
</div>
```

---
**마지막 업데이트**: 2025년 5월 28일  
**상태**: 개발 완료, 브라우저 호환성 이슈 해결 필요
