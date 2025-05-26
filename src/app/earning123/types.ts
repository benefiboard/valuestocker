// src/app/earning/types.ts

export type InvestmentMode = 'monthly' | 'lumpsum';

export interface InvestmentParams {
  mode: InvestmentMode;
  years: number;
  returnRate: number; // 연 수익률 (%)
  yearlyInvestment?: number; // 매년 투자금액 (적금형)
  initialInvestment?: number; // 초기 투자금액 (예금형)
  inflationRate: number; // 연간 인플레이션율 (%)
  yearlyExpense: number; // 연간 생활비
}

export interface InvestmentResult {
  finalAmount: number; // 최종 금액
  totalInvested: number; // 총 투자 금액
  totalReturn: number; // 총 수익
  totalExpenses: number; // 총 생활비 (인플레이션 적용)
  yearlyBreakdown: YearlyData[]; // 연도별 상세 내역
}

export interface YearlyData {
  year: number;
  startAmount: number; // 연초 금액
  investment: number; // 해당 연도 투자금
  returns: number; // 해당 연도 수익
  expense: number; // 해당 연도 생활비 (인플레이션 적용)
  endAmount: number; // 연말 금액
}
