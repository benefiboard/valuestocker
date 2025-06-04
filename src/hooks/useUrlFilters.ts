// hooks/useUrlFilters.ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

// 범용 필터 스키마 타입
export type FilterSchema<T> = {
  [K in keyof T]: {
    type: 'string' | 'number' | 'boolean';
    defaultValue: T[K];
    urlKey: string; // URL에서 사용할 키 이름
    shouldShow?: (value: T[K], defaultValue: T[K]) => boolean; // URL에 표시할지 결정
  };
};

// Flavor 페이지 전용 필터 타입
export interface FlavorPageFilters {
  page: number;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  industryFilter: string;
  subIndustryFilter: string;
  dividendMinFilter: number | string;
  dividendMaxFilter: number | string;
  assetMinFilter: number | string;
  assetMaxFilter: number | string;
  consecutiveDividendFilter: boolean | null;
}

// Quality 페이지 전용 필터 타입
export interface QualityPageFilters {
  page: number;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  industryFilter: string;
  subIndustryFilter: string;
  roeMinFilter: number | string;
  roeMaxFilter: number | string;
  marginMinFilter: number | string;
  marginMaxFilter: number | string;
  consecutiveDividendFilter: boolean | null;
}

// S-RIM 페이지 전용 필터 타입
export interface SrimPageFilters {
  page: number;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  industryFilter: string;
  subIndustryFilter: string;
  safetyMinFilter: number;
  safetyMaxFilter: number;
  dividendMinFilter: number;
  dividendMaxFilter: number;
  consecutiveDividendFilter: boolean | null;
}

// Profit 페이지 전용 필터 타입
export interface ProfitPageFilters {
  page: number;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  industryFilter: string;
  subIndustryFilter: string;
  safetyMinFilter: number;
  safetyMaxFilter: number;
  dividendMinFilter: number;
  dividendMaxFilter: number;
  consecutiveDividendFilter: boolean | null;
}

// Graham 페이지 전용 필터 타입
export interface GrahamPageFilters {
  page: number;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  industryFilter: string;
  subIndustryFilter: string;
  dividendMinFilter: number;
  dividendMaxFilter: number;
  consecutiveDividendFilter: boolean | null;
  minCriteriaFilter: number;
}

// Lynch 페이지 전용 필터 타입
export interface LynchPageFilters {
  page: number;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  industryFilter: string;
  subIndustryFilter: string;
  pegMinFilter: number;
  pegMaxFilter: number;
  safetyMinFilter: number;
  safetyMaxFilter: number;
  growthMinFilter: number;
  growthMaxFilter: number;
  dividendMinFilter: number;
  dividendMaxFilter: number;
  consecutiveDividendFilter: boolean | null;
}

// Howard 페이지 전용 필터 타입
export interface HowardPageFilters {
  page: number;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  industryFilter: string;
  subIndustryFilter: string;
  safetyMinFilter: number;
  safetyMaxFilter: number;
  dividendMinFilter: number;
  dividendMaxFilter: number;
  consecutiveDividendFilter: boolean | null;
}

// Howard 페이지 필터 스키마
export const howardPageSchema: FilterSchema<HowardPageFilters> = {
  page: {
    type: 'number',
    defaultValue: 1,
    urlKey: 'page',
    shouldShow: (value) => value > 1,
  },
  sortField: {
    type: 'string',
    defaultValue: 'margin_of_safety',
    urlKey: 'sort',
    shouldShow: (value, defaultValue) => value !== defaultValue,
  },
  sortDirection: {
    type: 'string',
    defaultValue: 'desc' as const,
    urlKey: 'sortDir',
    shouldShow: (value, defaultValue) => value !== defaultValue,
  },
  industryFilter: {
    type: 'string',
    defaultValue: '',
    urlKey: 'industry',
    shouldShow: (value) => value !== '',
  },
  subIndustryFilter: {
    type: 'string',
    defaultValue: '',
    urlKey: 'subIndustry',
    shouldShow: (value) => value !== '',
  },
  safetyMinFilter: {
    type: 'number',
    defaultValue: 0,
    urlKey: 'safetyMin',
    shouldShow: (value) => value !== 0 && value !== 0 && value !== null,
  },
  safetyMaxFilter: {
    type: 'number',
    defaultValue: 0,
    urlKey: 'safetyMax',
    shouldShow: (value) => value !== 0 && value !== 0 && value !== null,
  },
  dividendMinFilter: {
    type: 'number',
    defaultValue: 0,
    urlKey: 'dividendMin',
    shouldShow: (value) => value !== 0 && value !== 0 && value !== null,
  },
  dividendMaxFilter: {
    type: 'number',
    defaultValue: 0,
    urlKey: 'dividendMax',
    shouldShow: (value) => value !== 0 && value !== 0 && value !== null,
  },
  consecutiveDividendFilter: {
    type: 'boolean',
    defaultValue: null,
    urlKey: 'consecutiveDividend',
    shouldShow: (value) => value !== null,
  },
};

// Lynch 페이지 필터 스키마
export const lynchPageSchema: FilterSchema<LynchPageFilters> = {
  page: {
    type: 'number',
    defaultValue: 1,
    urlKey: 'page',
    shouldShow: (value) => value > 1,
  },
  sortField: {
    type: 'string',
    defaultValue: 'peg',
    urlKey: 'sort',
    shouldShow: (value, defaultValue) => value !== defaultValue,
  },
  sortDirection: {
    type: 'string',
    defaultValue: 'asc' as const,
    urlKey: 'sortDir',
    shouldShow: (value, defaultValue) => value !== defaultValue,
  },
  industryFilter: {
    type: 'string',
    defaultValue: '',
    urlKey: 'industry',
    shouldShow: (value) => value !== '',
  },
  subIndustryFilter: {
    type: 'string',
    defaultValue: '',
    urlKey: 'subIndustry',
    shouldShow: (value) => value !== '',
  },
  pegMinFilter: {
    type: 'number',
    defaultValue: 0,
    urlKey: 'pegMin',
    shouldShow: (value) => value !== 0 && value !== null,
  },
  pegMaxFilter: {
    type: 'number',
    defaultValue: 0,
    urlKey: 'pegMax',
    shouldShow: (value) => value !== 0 && value !== null,
  },
  safetyMinFilter: {
    type: 'number',
    defaultValue: 0,
    urlKey: 'safetyMin',
    shouldShow: (value) => value > 0, // 0보다 클 때만 URL에 표시
  },
  safetyMaxFilter: {
    type: 'number',
    defaultValue: 0,
    urlKey: 'safetyMax',
    shouldShow: (value) => value !== 0 && value !== null,
  },
  growthMinFilter: {
    type: 'number',
    defaultValue: 0,
    urlKey: 'growthMin',
    shouldShow: (value) => value !== 0 && value !== null,
  },
  growthMaxFilter: {
    type: 'number',
    defaultValue: 0,
    urlKey: 'growthMax',
    shouldShow: (value) => value !== 0 && value !== null,
  },
  dividendMinFilter: {
    type: 'number',
    defaultValue: 0,
    urlKey: 'dividendMin',
    shouldShow: (value) => value !== 0 && value !== null,
  },
  dividendMaxFilter: {
    type: 'number',
    defaultValue: 0,
    urlKey: 'dividendMax',
    shouldShow: (value) => value !== 0 && value !== null,
  },
  consecutiveDividendFilter: {
    type: 'boolean',
    defaultValue: null,
    urlKey: 'consecutiveDividend',
    shouldShow: (value) => value !== null,
  },
};

// Graham 페이지 필터 스키마
export const grahamPageSchema: FilterSchema<GrahamPageFilters> = {
  page: {
    type: 'number',
    defaultValue: 1,
    urlKey: 'page',
    shouldShow: (value) => value > 1,
  },
  sortField: {
    type: 'string',
    defaultValue: 'discount_rate',
    urlKey: 'sort',
    shouldShow: (value, defaultValue) => value !== defaultValue,
  },
  sortDirection: {
    type: 'string',
    defaultValue: 'desc' as const,
    urlKey: 'sortDir',
    shouldShow: (value, defaultValue) => value !== defaultValue,
  },
  industryFilter: {
    type: 'string',
    defaultValue: '',
    urlKey: 'industry',
    shouldShow: (value) => value !== '',
  },
  subIndustryFilter: {
    type: 'string',
    defaultValue: '',
    urlKey: 'subIndustry',
    shouldShow: (value) => value !== '',
  },
  dividendMinFilter: {
    type: 'number',
    defaultValue: 0,
    urlKey: 'dividendMin',
    shouldShow: (value) => value !== 0 && value !== null,
  },
  dividendMaxFilter: {
    type: 'number',
    defaultValue: 0,
    urlKey: 'dividendMax',
    shouldShow: (value) => value !== 0 && value !== null,
  },
  consecutiveDividendFilter: {
    type: 'boolean',
    defaultValue: null,
    urlKey: 'consecutiveDividend',
    shouldShow: (value) => value !== null,
  },
  minCriteriaFilter: {
    type: 'number',
    defaultValue: 6,
    urlKey: 'minCriteria',
    shouldShow: (value, defaultValue) => value !== defaultValue,
  },
};

// Profit 페이지 필터 스키마
export const profitPageSchema: FilterSchema<ProfitPageFilters> = {
  page: {
    type: 'number',
    defaultValue: 1,
    urlKey: 'page',
    shouldShow: (value) => value > 1,
  },
  sortField: {
    type: 'string',
    defaultValue: 'margin_of_safety',
    urlKey: 'sort',
    shouldShow: (value, defaultValue) => value !== defaultValue,
  },
  sortDirection: {
    type: 'string',
    defaultValue: 'desc' as const,
    urlKey: 'sortDir',
    shouldShow: (value, defaultValue) => value !== defaultValue,
  },
  industryFilter: {
    type: 'string',
    defaultValue: '',
    urlKey: 'industry',
    shouldShow: (value) => value !== '',
  },
  subIndustryFilter: {
    type: 'string',
    defaultValue: '',
    urlKey: 'subIndustry',
    shouldShow: (value) => value !== '',
  },
  safetyMinFilter: {
    type: 'number',
    defaultValue: 0,
    urlKey: 'safetyMin',
    shouldShow: (value) => value !== 0 && value !== null,
  },
  safetyMaxFilter: {
    type: 'number',
    defaultValue: 0,
    urlKey: 'safetyMax',
    shouldShow: (value) => value !== 0 && value !== null,
  },
  dividendMinFilter: {
    type: 'number',
    defaultValue: 0,
    urlKey: 'dividendMin',
    shouldShow: (value) => value !== 0 && value !== null,
  },
  dividendMaxFilter: {
    type: 'number',
    defaultValue: 0,
    urlKey: 'dividendMax',
    shouldShow: (value) => value !== 0 && value !== null,
  },
  consecutiveDividendFilter: {
    type: 'boolean',
    defaultValue: null,
    urlKey: 'consecutiveDividend',
    shouldShow: (value) => value !== null,
  },
};

// S-RIM 페이지 필터 스키마
export const srimPageSchema: FilterSchema<SrimPageFilters> = {
  page: {
    type: 'number',
    defaultValue: 1,
    urlKey: 'page',
    shouldShow: (value) => value > 1,
  },
  sortField: {
    type: 'string',
    defaultValue: 'margin_of_safety',
    urlKey: 'sort',
    shouldShow: (value, defaultValue) => value !== defaultValue,
  },
  sortDirection: {
    type: 'string',
    defaultValue: 'desc' as const,
    urlKey: 'sortDir',
    shouldShow: (value, defaultValue) => value !== defaultValue,
  },
  industryFilter: {
    type: 'string',
    defaultValue: '',
    urlKey: 'industry',
    shouldShow: (value) => value !== '',
  },
  subIndustryFilter: {
    type: 'string',
    defaultValue: '',
    urlKey: 'subIndustry',
    shouldShow: (value) => value !== '',
  },
  safetyMinFilter: {
    type: 'number',
    defaultValue: 0,
    urlKey: 'safetyMin',
    shouldShow: (value) => value !== 0 && value !== null,
  },
  safetyMaxFilter: {
    type: 'number',
    defaultValue: 0,
    urlKey: 'safetyMax',
    shouldShow: (value) => value !== 0 && value !== null,
  },
  dividendMinFilter: {
    type: 'number',
    defaultValue: 0,
    urlKey: 'dividendMin',
    shouldShow: (value) => value !== 0 && value !== null,
  },
  dividendMaxFilter: {
    type: 'number',
    defaultValue: 0,
    urlKey: 'dividendMax',
    shouldShow: (value) => value !== 0 && value !== null,
  },
  consecutiveDividendFilter: {
    type: 'boolean',
    defaultValue: null,
    urlKey: 'consecutiveDividend',
    shouldShow: (value) => value !== null,
  },
};

export const qualityPageSchema: FilterSchema<QualityPageFilters> = {
  page: {
    type: 'number',
    defaultValue: 1,
    urlKey: 'page',
    shouldShow: (value) => value > 1,
  },
  sortField: {
    type: 'string',
    defaultValue: 'avg_roe',
    urlKey: 'sort',
    shouldShow: (value, defaultValue) => value !== defaultValue,
  },
  sortDirection: {
    type: 'string',
    defaultValue: 'desc' as const,
    urlKey: 'sortDir',
    shouldShow: (value, defaultValue) => value !== defaultValue,
  },
  industryFilter: {
    type: 'string',
    defaultValue: '',
    urlKey: 'industry',
    shouldShow: (value) => value !== '',
  },
  subIndustryFilter: {
    type: 'string',
    defaultValue: '',
    urlKey: 'subIndustry',
    shouldShow: (value) => value !== '',
  },
  roeMinFilter: {
    type: 'number',
    defaultValue: 10,
    urlKey: 'roeMin',
    shouldShow: (value, defaultValue) => value !== defaultValue && value !== '',
  },
  roeMaxFilter: {
    type: 'string',
    defaultValue: '',
    urlKey: 'roeMax',
    shouldShow: (value) => value !== '' && value !== null,
  },
  marginMinFilter: {
    type: 'number',
    defaultValue: 15,
    urlKey: 'marginMin',
    shouldShow: (value, defaultValue) => value !== defaultValue && value !== '',
  },
  marginMaxFilter: {
    type: 'string',
    defaultValue: '',
    urlKey: 'marginMax',
    shouldShow: (value) => value !== '' && value !== null,
  },
  consecutiveDividendFilter: {
    type: 'boolean',
    defaultValue: null,
    urlKey: 'consecutiveDividend',
    shouldShow: (value) => value !== null,
  },
};

export const flavorPageSchema: FilterSchema<FlavorPageFilters> = {
  page: {
    type: 'number',
    defaultValue: 1,
    urlKey: 'page',
    shouldShow: (value) => value > 1, // 2페이지 이상만 표시
  },
  sortField: {
    type: 'string',
    defaultValue: 'dividend_yield',
    urlKey: 'sort',
    shouldShow: (value, defaultValue) => value !== defaultValue,
  },
  sortDirection: {
    type: 'string',
    defaultValue: 'desc' as const,
    urlKey: 'sortDir',
    shouldShow: (value, defaultValue) => value !== defaultValue,
  },
  industryFilter: {
    type: 'string',
    defaultValue: '',
    urlKey: 'industry',
    shouldShow: (value) => value !== '',
  },
  subIndustryFilter: {
    type: 'string',
    defaultValue: '',
    urlKey: 'subIndustry',
    shouldShow: (value) => value !== '',
  },
  dividendMinFilter: {
    type: 'number',
    defaultValue: 5,
    urlKey: 'dividendMin',
    shouldShow: (value, defaultValue) => value !== defaultValue && value !== '',
  },
  dividendMaxFilter: {
    type: 'string',
    defaultValue: '',
    urlKey: 'dividendMax',
    shouldShow: (value) => value !== '' && value !== null,
  },
  assetMinFilter: {
    type: 'number',
    defaultValue: 0,
    urlKey: 'assetMin',
    shouldShow: (value, defaultValue) => value !== defaultValue && value !== '',
  },
  assetMaxFilter: {
    type: 'string',
    defaultValue: '',
    urlKey: 'assetMax',
    shouldShow: (value) => value !== '' && value !== null,
  },
  consecutiveDividendFilter: {
    type: 'boolean',
    defaultValue: null,
    urlKey: 'consecutiveDividend',
    shouldShow: (value) => value !== null,
  },
};

// 값을 문자열로 변환
function serializeValue(value: any, type: string): string {
  if (value === null || value === undefined || value === '') return '';

  switch (type) {
    case 'boolean':
      return value === true ? 'true' : value === false ? 'false' : '';
    case 'number':
      return value.toString();
    case 'string':
    default:
      return value.toString();
  }
}

// 문자열을 타입에 맞게 변환
function deserializeValue(value: string | null, type: string, defaultValue: any): any {
  if (!value || value === '') return defaultValue;

  switch (type) {
    case 'boolean':
      if (value === 'true') return true;
      if (value === 'false') return false;
      if (value === 'null') return null;
      return defaultValue;
    case 'number':
      const num = parseFloat(value);
      return isNaN(num) ? defaultValue : num;
    case 'string':
    default:
      return value;
  }
}

export function useUrlFilters<T extends Record<string, any>>(
  schema: FilterSchema<T>
): {
  filters: T;
  updateFilter: (key: keyof T, value: T[keyof T]) => void;
  updateFilters: (updates: Partial<T>) => void;
  resetFilters: () => void;
  isLoading: boolean;
} {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // URL에서 초기 상태 복원
  const getInitialFilters = useCallback((): T => {
    const initialFilters = {} as T;

    for (const [key, config] of Object.entries(schema)) {
      const urlValue = searchParams.get(config.urlKey);
      initialFilters[key as keyof T] = deserializeValue(urlValue, config.type, config.defaultValue);
    }

    return initialFilters;
  }, [schema, searchParams]);

  const [filters, setFilters] = useState<T>(getInitialFilters);
  const [isLoading, setIsLoading] = useState(true);

  // 컴포넌트 마운트 시 URL에서 상태 복원
  useEffect(() => {
    setFilters(getInitialFilters());
    setIsLoading(false);
  }, [getInitialFilters]);

  // URL 업데이트 함수
  const updateUrl = useCallback(
    (newFilters: T) => {
      const params = new URLSearchParams();

      for (const [key, config] of Object.entries(schema)) {
        const value = newFilters[key as keyof T];
        const shouldShow = config.shouldShow
          ? config.shouldShow(value, config.defaultValue)
          : value !== config.defaultValue;

        if (shouldShow) {
          const serialized = serializeValue(value, config.type);
          if (serialized) {
            params.set(config.urlKey, serialized);
          }
        }
      }

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

      // 현재 URL과 다를 때만 업데이트
      const currentUrl = `${pathname}${
        searchParams.toString() ? '?' + searchParams.toString() : ''
      }`;
      if (newUrl !== currentUrl) {
        router.push(newUrl, { scroll: false });
      }
    },
    [schema, pathname, router, searchParams]
  );

  // 단일 필터 업데이트
  const updateFilter = useCallback(
    (key: keyof T, value: T[keyof T]) => {
      const newFilters = { ...filters, [key]: value };
      setFilters(newFilters);
      updateUrl(newFilters);
    },
    [filters, updateUrl]
  );

  // 다중 필터 업데이트
  const updateFilters = useCallback(
    (updates: Partial<T>) => {
      const newFilters = { ...filters, ...updates };
      setFilters(newFilters);
      updateUrl(newFilters);
    },
    [filters, updateUrl]
  );

  // 필터 초기화
  const resetFilters = useCallback(() => {
    const defaultFilters = {} as T;
    for (const [key, config] of Object.entries(schema)) {
      defaultFilters[key as keyof T] = config.defaultValue;
    }
    setFilters(defaultFilters);
    updateUrl(defaultFilters);
  }, [schema, updateUrl]);

  return {
    filters,
    updateFilter,
    updateFilters,
    resetFilters,
    isLoading,
  };
}
