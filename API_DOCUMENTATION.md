# 🚀 CryptoGram API 문서

## 📋 개요
CoinGecko API 연동을 통한 실시간 암호화폐 데이터 제공 시스템

### 🔗 기본 URL
```
https://my-cloudflare-site.johnandgirl.workers.dev
```

## 📊 API 엔드포인트

### 1. 마켓 데이터 조회
상위 코인들의 전체 마켓 데이터를 가져옵니다.

```bash
GET /api/data?type=market&limit={개수}
```

**예시:**
```bash
curl "https://my-cloudflare-site.johnandgirl.workers.dev/api/data?type=market&limit=10"
```

**응답:**
```json
[
  {
    "id": "bitcoin",
    "symbol": "btc",
    "name": "Bitcoin",
    "image": "https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png",
    "current_price": 104842,
    "market_cap": 2082814794444,
    "market_cap_rank": 1,
    "total_volume": 18612344085,
    "high_24h": 105804,
    "low_24h": 103939,
    "price_change_percentage_24h": 0.24115,
    "circulating_supply": 19873246,
    "max_supply": 21000000,
    "ath": 111814,
    "atl": 67.81,
    "last_updated": "2025-06-02 06:14:09"
  }
]
```

### 2. 상위/하위 변동률 조회
24시간 가격 변동률 기준으로 정렬된 코인 목록을 가져옵니다.

```bash
GET /api/data?type=movers&direction={gainers|losers}&limit={개수}
```

**예시:**
```bash
# 상위 변동률 (상승)
curl "https://my-cloudflare-site.johnandgirl.workers.dev/api/data?type=movers&direction=gainers&limit=5"

# 하위 변동률 (하락)
curl "https://my-cloudflare-site.johnandgirl.workers.dev/api/data?type=movers&direction=losers&limit=5"
```

**응답:**
```json
[
  {
    "id": "flare-networks",
    "symbol": "flr",
    "name": "Flare",
    "current_price": 0.0191741,
    "price_change_percentage_24h": 9.0394,
    "image": "https://coin-images.coingecko.com/coins/images/28624/large/FLR-icon200x200.png"
  }
]
```

### 3. 시장 통계 조회
전체 암호화폐 시장의 통계 정보를 가져옵니다.

```bash
GET /api/data?type=stats
```

**예시:**
```bash
curl "https://my-cloudflare-site.johnandgirl.workers.dev/api/data?type=stats"
```

**응답:**
```json
{
  "total_coins": 100,
  "total_market_cap": 3307690361130,
  "total_volume_24h": 86762236668,
  "avg_price_change_24h": -0.5241857
}
```

### 4. 특정 코인 정보 조회
특정 코인의 상세 정보를 가져옵니다. (ID 또는 심볼로 검색 가능)

```bash
GET /api/data?coin={코인ID|심볼}
```

**예시:**
```bash
# ID로 검색
curl "https://my-cloudflare-site.johnandgirl.workers.dev/api/data?coin=bitcoin"

# 심볼로 검색
curl "https://my-cloudflare-site.johnandgirl.workers.dev/api/data?coin=btc"
```

**응답:**
```json
{
  "id": "bitcoin",
  "symbol": "btc",
  "name": "Bitcoin",
  "image": "https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png",
  "current_price": 104842,
  "market_cap": 2082814794444,
  "market_cap_rank": 1,
  "total_volume": 18612344085,
  "high_24h": 105804,
  "low_24h": 103939,
  "price_change_percentage_24h": 0.24115,
  "circulating_supply": 19873246,
  "max_supply": 21000000,
  "ath": 111814,
  "atl": 67.81,
  "last_updated": "2025-06-02 06:14:09"
}
```

### 5. 기존 가격 데이터 (호환성)
기존 시스템과의 호환성을 위한 엔드포인트입니다.

```bash
GET /api/data
```

**응답:**
```json
[
  {
    "symbol": "BTC",
    "price": 45000.23,
    "timestamp": "2025-06-02T06:14:09.000Z"
  }
]
```

## 🔄 데이터 업데이트

### 크론 작업 (자동 업데이트)
- **주기**: 5분마다 자동 실행
- **대상**: 상위 100개 코인
- **소스**: CoinGecko API

### 수동 업데이트
관리자가 수동으로 데이터를 업데이트할 수 있습니다.

```bash
GET /cron/prices
```

## 📊 데이터 필드 설명

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `id` | string | CoinGecko 코인 ID |
| `symbol` | string | 코인 심볼 (예: btc, eth) |
| `name` | string | 코인 이름 |
| `image` | string | 코인 이미지 URL |
| `current_price` | number | 현재 가격 (USD) |
| `market_cap` | number | 시가총액 |
| `market_cap_rank` | number | 시가총액 순위 |
| `total_volume` | number | 24시간 거래량 |
| `high_24h` | number | 24시간 최고가 |
| `low_24h` | number | 24시간 최저가 |
| `price_change_percentage_24h` | number | 24시간 가격 변동률 (%) |
| `circulating_supply` | number | 유통량 |
| `max_supply` | number | 최대 공급량 |
| `ath` | number | 역대 최고가 |
| `atl` | number | 역대 최저가 |
| `last_updated` | string | 최종 업데이트 시간 |

## 🎯 사용 사례

### JavaScript 예시
```javascript
// 마켓 데이터 가져오기
const marketData = await fetch('/api/data?type=market&limit=10')
  .then(res => res.json());

// 상위 변동률 코인 가져오기
const gainers = await fetch('/api/data?type=movers&direction=gainers&limit=5')
  .then(res => res.json());

// 비트코인 정보 가져오기
const bitcoin = await fetch('/api/data?coin=bitcoin')
  .then(res => res.json());
```

### Python 예시
```python
import requests

# 마켓 데이터
response = requests.get('https://my-cloudflare-site.johnandgirl.workers.dev/api/data?type=market&limit=10')
market_data = response.json()

# 시장 통계
response = requests.get('https://my-cloudflare-site.johnandgirl.workers.dev/api/data?type=stats')
stats = response.json()
```

## ⚙️ 시스템 구조

### 기술 스택
- **플랫폼**: Cloudflare Workers
- **데이터베이스**: Cloudflare D1 (SQLite)
- **API 소스**: CoinGecko API
- **언어**: JavaScript (ES6+)

### 테이블 구조
```sql
CREATE TABLE coin_market_data (
  id TEXT PRIMARY KEY,
  symbol TEXT,
  name TEXT,
  image TEXT,
  current_price REAL,
  market_cap REAL,
  market_cap_rank INTEGER,
  total_volume REAL,
  high_24h REAL,
  low_24h REAL,
  price_change_percentage_24h REAL,
  circulating_supply REAL,
  max_supply REAL,
  ath REAL,
  atl REAL,
  last_updated TEXT
);
```

## 📈 성능 및 제한사항

### API 제한사항
- **응답 시간**: 평균 100-300ms
- **데이터 소스**: CoinGecko Free API
- **업데이트 주기**: 5분
- **지원 코인**: 상위 100개 코인

### 오류 처리
- `404`: 코인을 찾을 수 없음
- `500`: 서버 내부 오류
- 모든 오류는 JSON 형태로 반환

## 🔧 관리자 도구

### 관리자 페이지
```
https://my-cloudflare-site.johnandgirl.workers.dev/admin
```

관리자 페이지에서 다음 작업을 수행할 수 있습니다:
- 데이터 상태 확인
- 수동 데이터 업데이트
- WebM 차트 생성

---
**마지막 업데이트**: 2025-06-02  
**버전**: v2.0.0
