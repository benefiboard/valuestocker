//src/lib/finance/types.ts

export interface UserData {
  treasuryShares: string;
  targetPER: string;
  expectedReturn: string;
  pegRatio: string;
}

export interface StockPrice {
  code: string;
  name: string;
  price: number;
  sharesOutstanding: number;
  date?: string;
  formattedDate?: string;
  company?: string;
  isin?: string;
  market?: string;
  change?: number;
  changePercent?: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  value?: number;
  marketCap?: number;
}

//가격구하기-onestep
export interface FinancialData {
  assets: number;
  equity: number;
  equityAttributableToOwners: number;
  currentAssets: number;
  currentLiabilities: number;
  investmentAssets: number;
  nonCurrentLiabilities: number;
  netIncome: number;
  operatingIncomes: Record<string, number>;
  epsByYear: Record<string, number>;
  netIncomeByYear: Record<string, number>;
  equityByYear: Record<string, number>;
  years: string[];
  inventories?: number;
  quickAssets?: number;
  revenue?: number;
  costOfSales?: number;
  grossProfit?: number;
  operatingIncome?: number;
  interestExpense?: number;
  operatingCashFlow?: number;
  capexBased?: number;
  freeCashFlow?: number;
  tradeReceivables?: number;
  tradePayables?: number;
  retainedEarnings?: number;
  revenueByYear?: Record<string, number>;
  retainedEarningsByYear?: Record<string, number>;
}

export interface ChecklistItem {
  category: string;
  title: string;
  description: string;
  targetValue: string | number;
  actualValue: number | null;
  isPassed: boolean | null;
  formula: string;
  importance: 1 | 2 | 3 | 4 | 5; // 중요도 (별 개수)
}

//체크리스트
export interface FinancialDataCheckList {
  assets: number;
  equity: number;
  equityAttributableToOwners: number;
  currentAssets: number;
  currentLiabilities: number;
  investmentAssets: number;
  nonCurrentLiabilities: number;
  netIncome: number;
  operatingIncomes: Record<string, number>;
  epsByYear: Record<string, number>;
  netIncomeByYear: Record<string, number>;
  equityByYear: Record<string, number>;
  years: string[];
  inventories: number;
  quickAssets: number;
  revenue: number;
  costOfSales: number;
  grossProfit: number;
  operatingIncome: number;
  interestExpense: number;
  operatingCashFlow: number;
  capexBased: number;
  freeCashFlow: number;
  tradeReceivables: number;
  tradePayables: number;
  retainedEarnings: number;
  revenueByYear: Record<string, number>;
  retainedEarningsByYear: Record<string, number>;
}

export interface CalculatedResults {
  epsPer: number;
  controllingShareHolder: number;
  threeIndicatorsBps: number;
  threeIndicatorsEps: number;
  threeIndicatorsRoeEps: number;
  yamaguchi: number;
  sRimBase: number;
  sRimDecline10pct: number;
  sRimDecline20pct: number;
  pegBased: number; // PEG 기반 적정주가
  growthRate: number; // EPS 성장률
  pegBasedPER: number;
  averageEps: number;
  averagePER: number;

  priceRange: {
    lowRange: number;
    midRange: number;
    highRange: number;
  };
  riskProfile: {
    riskLevel: string;
    message: string;
  };
  priceSignal: {
    signal: string;
    message: string;
  };
  dataReliability: {
    score: number;
    message: string;
  };

  categorizedModels?: CategorizedModels;
  outliers?: ModelItem[];
  hasOutliers?: boolean;
  perAnalysis?: {
    status: string;
    message: string;
  };
}

export interface FinancialItem {
  account_id: string;
  sj_div: string;
  thstrm_amount?: string;
  frmtrm_amount?: string;
  bfefrmtrm_amount?: string;
  currency?: string;
  [key: string]: string | undefined;
}

export interface ApiResponse {
  list?: Array<FinancialItem>;
  status?: string;
  message?: string;
}

export interface ModelItem {
  name: string;
  value: number;
  reason?: string;
}

export interface CategorizedModels {
  assetBased: ModelItem[];
  earningsBased: ModelItem[];
  mixedModels: ModelItem[];
  all: ModelItem[];
  srimScenarios?: ModelItem[]; // S-RIM 시나리오 데이터 (선택적)
}
