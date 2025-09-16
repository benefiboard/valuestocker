// src/app/dcf-calculator/types.ts

export interface FCFData {
  year: number;
  fcf: number;
  isPositive: boolean;
}

export interface DCFCalculationParams {
  projectionYears: number; // 예측 기간 (기본 10년)
  discountRate: number; // 할인율 (기본 10%)
  terminalGrowthRate: number; // 터미널 성장률 (기본 2%)
  safetyMargin: number; // 안전마진 (기본 30%)
}

export interface DCFResult {
  intrinsicValue: number; // 총 내재가치 (억원)
  intrinsicValuePerShare: number; // 주당 내재가치 (원)
  currentMarketCap: number; // 현재 시가총액 (억원)
  currentPrice: number; // 현재 주가 (원)
  expectedReturn: number; // 예상 수익률 (%)

  // FCF 관련
  currentFCF: number; // 최근 FCF (억원)
  finalGrowthRate: number; // 최종 적용된 성장률 (%)
  baseGrowthRate: number; // 기본 계산된 성장률 (%)
  negativeYears: number; // 음수 FCF 년도 수
  penaltyFactor: number; // 적용된 패널티 팩터

  // 계산 결과
  projectedFCF: number[]; // 10년간 예측 FCF
  discountedFCF: number[]; // 할인된 FCF 현재가치
  terminalValue: number; // 터미널 가치 (억원)
  discountedTerminalValue: number; // 할인된 터미널 가치 (억원)

  // 메타 정보
  fcfData: FCFData[]; // 5년간 FCF 데이터
  reason: string; // 계산 결과 설명
  recommendation?: string; // 권장사항 (계산불가시)
  companyName: string; // 회사명
  stockCode: string; // 종목코드
  sharesOutstanding: number; // 발행주식수
}

export interface StockNaverData {
  stock_code: string;
  company_name: string;
  shares_outstanding: number;
  market_cap: number;

  // FCF 데이터 (2020-2024)
  '2020_free_cash_flow': number;
  '2021_free_cash_flow': number;
  '2022_free_cash_flow': number;
  '2023_free_cash_flow': number;
  '2024_free_cash_flow': number;
}

export interface StockPriceData {
  stock_code: string;
  current_price: number;
}

// FCF 성장률 계산 결과
export interface FCFGrowthResult {
  finalGrowthRate: number;
  baseGrowthRate: number;
  negativeYears: number;
  penaltyFactor: number;
  reason: string;
  recommendation?: string;
  isCalculable: boolean;
}
