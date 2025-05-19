// src/app/checklist/types.ts

export interface StockCurrent {
  code: string;
  currentPer: number;
}

// 체크리스트 기본 항목 타입
export interface ChecklistItem {
  category: string;
  title: string;
  description: string;
  targetValue: string;
  actualValue: number | string | null;
  isPassed: boolean | null;
  formula: string;
  importance: 1 | 2 | 3 | 4 | 5;
}

// 점수가 추가된 체크리스트 항목 타입
export interface ScoredChecklistItem extends ChecklistItem {
  score: number; // 0-10 점수
  maxScore: number; // 최대 점수
  isFailCriteria: boolean; // 미달 여부
}

// 투자 등급 정보 타입
export interface InvestmentRating {
  score: number;
  maxScore: number;
  percentage: number;
  grade: string;
  coreItemsScore: number;
  detailedItemsScore: number;
  hasCriticalFailure: boolean;
  coreItemsCount: number;
  coreItemsPassCount: number;
  isFinancialCompany: boolean;
  // 추가: 위험 플래그 페널티 정보
  riskPenalty: number;
  baseScore: number;
  riskFlags: {
    has_consecutive_operating_losses: boolean;
    operating_to_net_income_discrepancy: boolean;
    operating_margin_critical: boolean;
    insufficient_profitable_years: boolean;
  };
}

// 재무 데이터 체크리스트 타입
export interface FinancialDataCheckList {
  years: string[];
  epsByYear: Record<string, number>;
  revenueByYear: Record<string, number>;
  operatingIncomes: Record<string, number>;
  netIncomeByYear: Record<string, number>;
  equityByYear: Record<string, number>;
  retainedEarningsByYear: Record<string, number>;
  revenue: number;
  operatingIncome: number;
  grossProfit: number;
  assets: number;
  equity: number;
  currentAssets: number;
  currentLiabilities: number;
  nonCurrentLiabilities: number;
  inventories: number;
  costOfSales: number;
  interestExpense: number;
  tradeReceivables: number;
  tradePayables: number;
  freeCashFlow: number;
  // 아래는 옵셔널 필드
  quickAssets?: number;
  quickAssetsPrevYear?: number;
}

// 주식 가격 정보 타입
export interface StockPrice {
  code: string;
  name: string;
  price: number;
  sharesOutstanding: number;
  formattedDate?: string;
}

// JSON 체크리스트 데이터 타입
export interface JsonChecklistData {
  stock_code: string;
  dart_code: string;
  company_name: string;
  shares_outstanding: string;
  last_updated: string;
  industry: string;
  subIndustry: string;

  // 성장률 지표들
  revenueGrowthRate: number;
  opIncomeGrowthRate: number;
  epsGrowthRate: number;
  netIncomeGrowthRate: number;
  bpsGrowthRate: number;

  // 수익성 및 효율성 지표들
  avgOpMargin: number;
  avgRoe: number;
  avgRoa: number; // 추가: ROA(%)
  assetTurnover: number; // 추가: 자산회전율
  equityTurnover: number; // 추가: 자기자본회전율

  // 재무 건전성 지표들
  debtRatio: number;
  interestBearingDebtRatio: number; // 추가: 이자발생부채비율
  equityRatio: number; // 추가: 자기자본비율

  // 현금흐름 및 경쟁력 지표들
  fcfRatio: number;
  opCashFlowToRevenueRatio: number; // 추가: 영업현금흐름 대 매출액 비율
  fcfMargin: number; // 추가: FCF 마진
  dividendYield: number; // 추가: 배당수익률

  // PER 관련 지표들
  avgPer: number;
  maxPer: number;
  maxPerTimes04: number;

  // 연도별 값
  currentBps: number;
  previousBps: number;
  twoYearsAgoBps: number;
  currentYearPer: number;
  previousYearPer: number;
  twoYearsAgoPer: number;
  currentYearEps: number;

  // 위험 플래그 필드들
  has_consecutive_operating_losses: boolean;
  operating_to_net_income_discrepancy: boolean;
  operating_margin_critical: boolean;
  insufficient_profitable_years: boolean;

  // 이전 버전과의 호환성을 위해 남겨둔 필드들
  retainedEarningsGrowthRate?: number;
  currentRatio?: number;
  interestCoverageRatio?: number;
  nonCurrentLiabilitiesToNetIncome?: number;
  cashCycleDays?: number;
  grossProfitMargin?: number;

  // 연도별 데이터
  [key: string]: any;
}
