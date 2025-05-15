// src/app/profit-calculator/types.ts

export interface ROEData {
  year: number;
  netIncome: number;
  equity: number;
  roe: number;
}

export interface ProfitCalculationParams {
  settingROE: number; // 기업 수익성 (%)
  discountRate: number; // 목표 수익률 (%)
  sustainableYears: number; // 예상 유지 기간 (년)
}

export interface ProfitResult {
  expectedPBR: number; // 계산된 적정 PBR
  currentPBR: number; // 현재 시장 PBR
  currentPrice: number; // 현재 주가
  expectedPrice: number; // 계산된 적정가
  expectedReturn: number; // 투자 매력도 (%)
  roeData: ROEData[]; // 연도별 수익성 데이터
  averageROE: number; // 3년 평균 수익성
  companyName: string; // 회사명
  stockCode: string; // 종목코드
}

export interface StockRawData {
  stock_code: string;
  company_name: string;
  // 2022년 데이터
  '2022_net_income': number;
  '2022_equity': number;
  // 2023년 데이터
  '2023_net_income': number;
  '2023_equity': number;
  // 2024년 데이터
  '2024_net_income': number;
  '2024_equity': number;
}
