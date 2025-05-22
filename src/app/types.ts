// src/app/total/types.ts

import { InvestmentRating, ScoredChecklistItem, StockPrice } from './checklist/types';
import { CalculatedResults } from './fairprice/types';

// 통합 분석 결과 인터페이스
export interface TotalAnalysisResult {
  // 체크리스트 관련 결과
  checklistResults: ScoredChecklistItem[];
  investmentRating: InvestmentRating;

  // 적정가 관련 결과
  calculatedResults: CalculatedResults;

  // 공통 데이터
  stockPrice: StockPrice;

  // 메타 데이터
  lastUpdated: string;
}

// 종합 요약 데이터 인터페이스
export interface SummaryData {
  // 투자 등급 관련
  grade: string;
  score: number;
  coreItemsPassRate: number;

  // 적정가 관련
  fairPriceMedian: number;
  fairPriceRange: {
    low: number;
    high: number;
  };
  priceGapPercent: number; // 현재가와 적정가 간의 차이 비율

  // 투자 추천 관련
  recommendation: 'buy' | 'hold' | 'sell';
  reasonSummary: string;
}
