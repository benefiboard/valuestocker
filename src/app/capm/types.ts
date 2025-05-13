// src/app/capm/types.ts

export interface ROEData {
  year: number;
  netIncome: number;
  equity: number;
  roe: number;
}

export interface CAPMCalculationParams {
  settingROE: number; // 설정 ROE (%)
  discountRate: number; // 할인율 (%)
  sustainableYears: number; // 지속가능기간 (년)
}

export interface CAPMResult {
  expectedPBR: number; // 예상 적정 PBR
  currentPBR: number; // 현재 PBR
  currentPrice: number; // 현재가
  expectedPrice: number; // 예상 적정가
  expectedReturn: number; // 예상 수익률 (%)
  roeData: ROEData[]; // 연도별 ROE 데이터
  averageROE: number; // 3년 평균 ROE
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
