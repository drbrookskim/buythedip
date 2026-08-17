---
name: dip-strategy-orchestrator
description: 눌림목(Buy the Dip) 주식 매수 및 매도 전략 설계, 백테스팅 분석, 리스크 관리 설정, 실전 자동매매 엔진 구축 및 재실행/수정 작업을 총괄 관리하는 오케스트레이터 스킬. "눌림목 매매", "Buy the Dip", "매도 전략 연구", "주식 백테스트", "눌림목 매매 자동화" 요청 시 반드시 이 스킬을 활성화할 것.
---

# Dip Strategy Orchestrator

눌림목(Buy the Dip) 매수 및 매도 전략의 연구부터 실제 증권사 API/알림 연동 시스템 구축까지 전체 프로세스를 조율한다.

## 작업 구조

```
[Phase 1: 전략 및 매도 로직 설계] (Strategy Architect)
           │
           ▼
[Phase 2: 시뮬레이션 및 백테스팅] (Quant Backtester)
           │
           ▼
[Phase 3: 리스크 관리 & 포지션 사이징] (Risk Manager)
           │
           ▼
[Phase 4: 실전 실행 엔진 & 알림 구현] (Execution Developer)
```

## 단계별 실행 지침

### Phase 1: 매수/매도 로직 상세 설계
1. 매수 조건(Dip 판단): 추세 필터(SMA/EMA), 과매도 지표(RSI/Stochastic), 거래량 변화.
2. 매도 조건(Exit Strategy):
   - 목표익절(Take Profit) & 손절(Stop Loss)
   - 트레일링 스탑(Trailing Stop)
   - 이평선 이탈 / 저항선 청산
   - 타임컷(Time-based Exit)
3. 산출물: `_workspace/01_strategy_spec.json` 생성.

### Phase 2: 백테스팅 수행
1. historical stock data 준비 (yfinance 또는 pykrx API 활용).
2. 수수료/슬리피지를 반영한 백테스트 엔진 구현.
3. CAGR, MDD, Sharpe Ratio 산출.
4. 산출물: `_workspace/02_backtest_report.md` 생성.

### Phase 3: 리스크 파라미터 확정
1. 계좌 리스크 제한 (예: 1회 트레이드 당 -1.5% 총자산 손실 제한).
2. 동시 보유 종목 수 한도 및 분산 투자 규칙 확정.
3. 산출물: `_workspace/03_risk_guidelines.json` 생성.

### Phase 4: 실전 자동매매/알림 구축
1. 텔레그램/디스코드 신호 알림 모듈 작성.
2. KIS API/키움증권 API 기반 자동 주문 발주 및 상태 모니터링 모듈 구현.
3. 산출물: `_workspace/04_execution_engine.py` 생성.

## 후속 및 반복 작업 지원
- 사용자 피드백(예: "매도 조건을 트레일링 스탑 중심으로 변경해줘") 요청 시 기존 `_workspace/` 내 산출물을 읽고 필요한 단계만 재실행한다.
