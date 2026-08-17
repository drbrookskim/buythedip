# ⚡ NOSTOS : Buy The Dip Strategy Engine

> **AI 기반 한국 주식(KRX) 눌림목 매수·매도 전략 백테스팅 & 실시간 도약 타점 진단 인텔리전스 시스템**

![NOSTOS Buy The Dip Engine](https://img.shields.io/badge/Engine-Buy%20The%20Dip-00D992?style=for-the-badge&logo=codewars&logoColor=black)
![KRX Universe](https://img.shields.io/badge/Universe-KRX%202800+-38BDF8?style=for-the-badge&logo=databricks&logoColor=white)
![UI Theme](https://img.shields.io/badge/Theme-Voltagent%20Dark-101010?style=for-the-badge)

---

## 📌 개요 (Overview)

**NOSTOS: Buy The Dip**은 KOSPI, KOSDAQ, KONEX 전 종목(2,814개)의 일별 주가 데이터를 기반으로 **눌림목(Dip) 매수 타점 탐색, 5종 청산 전략(익절·손절·트레일링·타임컷·AI 목표) 시뮬레이션, 복리 누적 자산 성장 곡선(Alpha) 검증**을 0ms 실시간으로 수행하는 퀀트 백테스팅 & 트레이딩 인텔리전스 엔진입니다.

---

## ✨ 핵심 기능 (Key Features)

### 1. 🎯 Jump from the Dip Strategy 올인원 진단
- **실시간 도약 타점 예측**: 상승 반등 / 하락 이탈 / 횡보 수렴 다방향 AI 예측 및 목표가·손절선·예상 매수가 자동 산출
- **3단 AI 정밀 전술 보고서**: 추세·이격도·거래량·RSI·백테스트 승률을 종합한 실전 매매 가이드라인 생성
- **4대 프리셋 전략**:
  - `기본 매수` (20일선 지지 + RSI 45 이하 눌림목)
  - `대세 추종 매수` (60일선 상회 + 트레일링 스탑)
  - `타임컷(4일 미상승 청산)` (단기 회전율 극대화)
  - `120일선 스윙` (120일 경기 지지선 기반 스윙 전략)

### 2. 📊 고성능 벡터 캔들스틱 & 4대 이동평균선 차트
- **KRX 표준 양봉(Red) / 음봉(Sky Blue) 캔들 차트** 및 라인 차트 즉시 토글
- **4대 이동평균선 원클릭 토글 인터페이스**:
  - 🟣 **120일선 (SMA120)**: 장기 스윙 지지선
  - 🟢 **60일선 (SMA60)**: 중기 수급선
  - 🟠 **20일선 (SMA20)**: 단기 눌림목 지지선
  - ⚪ **5일선 (SMA5)**: 초단기 모멘텀선
- **키보드 `Ctrl + 마우스 휠` 줌인/줌아웃** 및 부드러운 패닝(Pan)
- **최근 6개월(125 거래일) 기본 뷰** 및 1년 전체 데이터 실시간 탐색

### 3. 🛡️ 5종 매매 타점 분리 시각화 & 범례 필터
- 🔴 **매수 (Buy)**
- 🟢 **익절 (Take Profit)**
- ⭕ **손절 (Stop Loss)**
- ▲ **트레일링 스탑 (Trailing Stop)**
- ○ **타임컷 (Time Cut)**
- 개별 타점 원클릭 격리 하이라이트 및 실시간 타점별 승률/손익 통계

### 4. 📈 누적 자산 성장 곡선 (Strategy vs Buy & Hold) 모달
- 현재 검색된 종목의 **눌림목 전략 누적 잔고 vs 단순 보유(Buy & Hold) 잔고** 실시간 비교 곡선
- **초기 투자 원금 / 전략 최종 자산 / 단순 보유 자산 / 초과 수익(Alpha)** 4열 KPI 요약

### 5. 🔍 KRX 2,800+ 전 종목 스마트 자동완성 검색
- 한글 종목명, 초성, 6자리 종목코드 즉시 자동완성
- 야후 파이낸스(Yahoo Finance) 실시간 시세 연동 및 안전한 로컬 캐싱

---

## 🚀 빠른 시작 (Quick Start)

### 1. 요구 사항
- Python 3.8 이상
- yfinance (`pip install yfinance`)

### 2. 실행 방법

```bash
# 1. 저장소 복제
git clone https://github.com/drbrookskim/buythedip.git
cd buythedip

# 2. 의존성 설치
pip install yfinance

# 3. 로컬 백테스팅 서버 실행
python3 server.py
```

브라우저에서 **`http://localhost:8080`** 접속

---

## 📁 프로젝트 구조 (Directory Structure)

```
buythedip/
├── index.html                  # 메인 SPA 대시보드 뷰
├── style.css                   # Voltagent Dark 테마 & 반응형 디자인 시스템
├── app.js                      # 퀀트 백테스팅 엔진 & Chart.js 캔버스 렌더러
├── server.py                   # Python 경량 HTTP & Yahoo Finance KRX API 서버
├── krx_stocks.json             # KRX 전 종목(2,814개) 마스터 데이터베이스
├── GEMINI.md                   # 하네스 및 개발 규칙 & 변경 이력
├── memory.md                   # 상세 아키텍처 및 작업 메모리
└── README.md                   # 프로젝트 설명 문서
```

---

## 🎨 디자인 시스템 (Design Aesthetics)

- **Palette**: Voltagent Dark (`#101010` Near-Black Canvas, `#00D992` Electric Green Accent, `#3D3A39` Hairline)
- **Typography**: Space Grotesk (Brand & Headers), Noto Sans KR (Korean UI), Inter (English Subtitles), IBM Plex Mono (Financial Data)
- **Component Geometry**: 9999px Capsule Architecture & Level 3 Depth Shadows

---

## 📄 라이선스 (License)

MIT License © 2026 NOSTOS Strategy Engine
