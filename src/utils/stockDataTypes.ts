// src/utils/stockDataTypes.ts

// 기본 결과 인터페이스
export interface StockDataResult<T> {
  stocks: T[];
  industries: string[];
  subIndustries: string[];
  error: string | null;
}

// 피터 린치(PEG) 주식 인터페이스
export interface LynchStock {
  stock_code: string;
  company_name: string;
  industry: string;
  subindustry: string;
  current_price: number;
  current_per: number;
  peg: number;
  growth_rate: number;
  average_eps: number;
  margin_of_safety: number;
  dividend_yield: number;
  consecutive_dividend: boolean;
}

// 그레이엄 주식 인터페이스 (통합)
export interface GrahamStock {
  stock_code: string;
  company_name: string;
  industry: string;
  subindustry: string;
  current_per: number;
  debtratio: number;
  current_price: number;
  dividend_yield: number;

  // 이전에 옵셔널이었던 필드들을 필수로 변경
  graham_price: number;
  consecutive_dividend: boolean;
  bps: number;
  avg_eps: number;
  ncav: number;
  ncav_price: number;
  modified_graham_price: number; // 페이지에서 필요
  market_cap: number;
  revenue: number;
  eps_growth_rate: number;
  current_pbr: number;
  meets_size_criteria: boolean;
  meets_debt_criteria: boolean;
  meets_dividend_criteria: boolean;
  meets_profit_criteria: boolean;
  meets_growth_criteria: boolean;
  meets_pbr_criteria: boolean;
  meets_per_criteria: boolean;
  criteria_met_count: number; // 페이지에서 필요
  dividend_years_count?: number; // 사용이 적은 필드는 옵셔널로 유지 가능
}

// 고배당 가치주 인터페이스
export interface FlavorStock {
  stock_code: string;
  company_name: string;
  industry: string;
  subindustry: string;
  current_per: number;
  current_pbr: number;
  current_price: number;
  dividend_yield: number;
  assets: number;
  consecutive_dividend: boolean;
}

// 퀄리티 주식 인터페이스
export interface QualityStock {
  stock_code: string;
  company_name: string;
  industry: string;
  subindustry: string;
  current_per: number;
  current_price: number;
  dividend_yield: number;
  avg_roe: number;
  avg_operating_margin: number;
  consecutive_dividend: boolean;
}

// 하워드 마크스 주식 인터페이스
export interface HowardStock {
  stock_code: string;
  company_name: string;
  industry: string;
  subindustry: string;
  current_price: number;
  dividend_yield: number;
  fcf_median: number;
  fcf_per_share: number;
  base_intrinsic_value: number;
  optimistic_intrinsic_value: number;
  conservative_intrinsic_value: number;
  discount_rate: number;
  margin_of_safety: number;
  consecutive_dividend: boolean;
  growthrate: number;
  net_current_asset_value: number;
  market_cap: number;
  market_cap_to_intrinsic_ratio: number;
}

// 수익기반 내재가치 주식 인터페이스
export interface ProfitStock {
  stock_code: string;
  company_name: string;
  industry: string;
  subindustry: string;
  current_price: number;
  dividend_yield: number;
  fcf_median: number;
  fcf_per_share: number;
  base_intrinsic_value: number;
  optimistic_intrinsic_value: number;
  conservative_intrinsic_value: number;
  discount_rate: number;
  margin_of_safety: number;
  consecutive_dividend: boolean;
  growthrate: number;
}

// S-RIM 주식 인터페이스
export interface SrimStock {
  stock_code: string;
  company_name: string;
  industry: string;
  subindustry: string;
  current_price: number;
  current_per: number;
  srim_base: number;
  srim_decline_10pct: number;
  srim_decline_20pct: number;
  margin_of_safety: number;
  dividend_yield: number;
  consecutive_dividend: boolean;
  weightedroe: number;
}

// 산업별 성장률 정보 인터페이스
export interface IndustryData {
  industry: string;
  minGrowthRate: number;
  maxGrowthRate: number;
  minPerpetualGrowthRate: number;
  maxPerpetualGrowthRate: number;
  subIndustries: string[];
}
