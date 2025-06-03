// src/utils/cache_params/configs/grahamPageConfig.ts

import { StockPageConfig } from '../stockPageTypes';
import { GrahamStock } from '@/utils/stockDataTypes';
import { fetchGrahamStocks } from '@/app/graham/grahamStock';

export const grahamPageConfig: StockPageConfig<GrahamStock> = {
  // 캐시 설정
  cacheKey: 'graham-stocks-cache',
  fetchFunction: fetchGrahamStocks,
  cacheDuration: 2 * 60 * 60 * 1000, // 2시간

  // 기본 정렬
  defaultSort: {
    field: 'discount_rate',
    direction: 'desc',
  },

  // 기본 필터 값
  defaultFilters: {
    industryFilter: '',
    subIndustryFilter: '',
    dividendMinFilter: '',
    dividendMaxFilter: '',
    consecutiveDividendFilter: null,
    minCriteriaFilter: 6,
  },

  // 페이지 설정
  itemsPerPage: 20,
};

// 그레이엄 페이지 전용 필터 키 매핑
export const grahamFilterKeys = {
  industry: 'industryFilter',
  subindustry: 'subIndustryFilter',
  dividendMin: 'dividendMinFilter',
  dividendMax: 'dividendMaxFilter',
  consecutiveDividend: 'consecutiveDividendFilter',
  minCriteria: 'minCriteriaFilter',
} as const;

// 그레이엄 페이지 전용 정렬 필드
export const grahamSortFields = [
  'current_per',
  'debtratio',
  'company_name',
  'industry',
  'subindustry',
  'current_price',
  'dividend_yield',
  'graham_price',
  'modified_graham_price',
  'discount_rate',
  'consecutive_dividend',
  'ncav',
  'ncav_price',
  'market_cap',
  'revenue',
  'eps_growth_rate',
  'current_pbr',
  'criteria_met_count',
] as const;

export type GrahamSortField = (typeof grahamSortFields)[number];
