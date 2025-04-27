// src/app/jsoncheck/types.ts

// 체크리스트 기본 항목 타입
export interface ChecklistItem {
  category: string;
  title: string;
  description: string;
  targetValue: string;
  actualValue: number | string | null;
  isPassed: boolean | null;
  formula: string;
  importance: 1 | 2 | 3 | 4 | 5; // 변경: number에서 union type으로 수정
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
  description: string;
  coreItemsScore: number;
  detailedItemsScore: number;
  hasCriticalFailure: boolean;
  coreItemsCount: number;
  coreItemsPassCount: number;
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
  formattedDate?: string; // 추가: 날짜 포맷 필드
}

// JSON 체크리스트 데이터 타입 (선택적)
export interface JsonChecklistData {
  stock_code: string;
  dart_code: string;
  company_name: string;
  shares_outstanding: string;
  last_updated: string;
  industry: string;
  subIndustry: string;
  revenueGrowthRate: number;
  opIncomeGrowthRate: number;
  epsGrowthRate: number;
  netIncomeGrowthRate: number;
  bpsGrowthRate: number;
  retainedEarningsGrowthRate: number;
  avgOpMargin: number;
  avgRoe: number;
  debtRatio: number;
  currentRatio: number;
  interestCoverageRatio: number;
  nonCurrentLiabilitiesToNetIncome: number;
  cashCycleDays: number;
  fcfRatio: number;
  grossProfitMargin: number;
  avgPer: number;
  maxPer: number;
  maxPerTimes04: number;
  currentBps: number;
  previousBps: number;
  twoYearsAgoBps: number;
  currentYearPer: number;
  previousYearPer: number;
  twoYearsAgoPer: number;
  // 연도별 데이터
  [key: string]: any;
}
