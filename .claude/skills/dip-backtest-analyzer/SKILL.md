---
name: dip-backtest-analyzer
description: 눌림목 매매 전략의 히스토리컬 백테스트 데이터를 검증하고 지표(CAGR, MDD, Sharpe, Win Rate) 분석 및 매도 조건별 파라미터 감도 분석을 수행하는 스킬. "백테스팅 실행", "백테스트 결과 분석", "눌림목 성과 검증" 시 이 스킬을 활용할 것.
---

# Dip Backtest Analyzer

눌림목 매수 및 다양한 매도 기법(트레일링 스탑, 타임컷, 고정 손익비 등)의 백테스트 결과를 분석하고 평가한다.

## 백테스팅 실행 지침
1. 파이썬 `yfinance` 또는 `pandas`를 이용하여 OHLCV 데이터를 수집한다.
2. 매수 신호(Dip Signal) 및 매도 신호(Exit Signal)를 벡터화하거나 이벤트 기반 루프로 판별한다.
3. 거래 수수료(0.015~0.05%) 및 세금/슬리피지(0.18~0.25%)를 반영한다.
4. 주요 산출 지표:
   - 총 수익률 (Total Return) 및 연평균 복리 수익률 (CAGR)
   - 최대 낙폭 (Maximum Drawdown, MDD)
   - 승률 (Win Rate) 및 손익비 (Profit Factor)
   - 샤프 지수 (Sharpe Ratio)
   - 평균 보유 기간 (Average Holding Days)

## 리포트 양식
- 백테스트 요약표 작성
- 매도 조건별(예: 손절 3% vs 5%, 트레일링 스탑 3% vs 5%) 비교 분석
