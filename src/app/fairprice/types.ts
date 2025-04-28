// src/app/fairprice/types.ts

export interface ApiResponse {
  // API 응답 타입 정의
  [key: string]: any;
}

export interface FinancialData {
  years: string[];
  epsByYear: Record<string, number>;
  netIncomeByYear: Record<string, number>;
  equityByYear: Record<string, number>;
}

export interface StockPrice {
  code: string;
  name: string;
  price: number;
  sharesOutstanding: number;
  formattedDate?: string;
}

export interface UserData {
  treasuryShares: string;
  targetPER: string;
  expectedReturn: string;
  pegRatio: string;
}

export interface ModelItem {
  name: string;
  value: number;
  isReference?: boolean;
  reason?: string;
}

export interface CategorizedModels {
  assetBased: ModelItem[];
  earningsBased: ModelItem[];
  mixedModels: ModelItem[];
  srimScenarios?: ModelItem[];
  all: ModelItem[];
}

export interface CalculatedResults {
  epsPer: number;
  controllingShareHolder: number;
  threeIndicatorsBps: number;
  threeIndicatorsEps: number;
  threeIndicatorsRoeEps: number;
  yamaguchi: number;
  sRimBase: number;
  pegBased: number;
  sRimDecline10pct: number;
  sRimDecline20pct: number;
  priceRange: { lowRange: number; midRange: number; highRange: number };
  trustScore: number;
  riskScore: number;
  priceRatio: number;
  categorizedModels?: CategorizedModels;
  outliers?: ModelItem[];
  hasOutliers?: boolean;
  perAnalysis?: { status: string; message: string };
  latestPrice?: StockPrice;
}

// JSON 데이터 구조를 위한 타입 추가
export interface StockFairPriceData {
  stock_code: string;
  dart_code: string;
  company_name: string;
  industry: string;
  subIndustry: string;
  last_updated: string;
  shares_outstanding: string;

  // 미리 계산된 적정가 모델 결과
  epsPer: number;
  controllingShareHolder: number;
  threeIndicatorsBps: number;
  threeIndicatorsEps: number;
  threeIndicatorsRoeEps: number;
  yamaguchi: number;
  sRimBase: number;
  pegBased: number;
  sRimDecline10pct: number;
  sRimDecline20pct: number;

  // 미리 계산된 부가 정보
  averageEps: number;
  averagePER: number;
  growthRate: number;
  pegBasedPER: number;
  latestRoe: number; // averageRoe에서 변경됨

  // 적정가 범위
  priceRange_lowRange: number;
  priceRange_midRange: number;
  priceRange_highRange: number;

  // 추가 필드
  trustScore: number;
  riskScore: number;

  // 다른 추가 필드
  [key: string]: any;
}
