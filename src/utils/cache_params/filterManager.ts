// src/utils/cache_params/filterManager.ts

import { FilterState, SortState } from './stockPageTypes';

export class FilterManager {
  /**
   * 필터 적용
   */
  static applyFilters<T extends Record<string, any> & { industry: string; subindustry: string }>(
    stocks: T[],
    filters: FilterState
  ): T[] {
    return stocks.filter((stock) => {
      return Object.entries(filters).every(([key, value]) => {
        // 빈 값이면 필터 적용 안함
        if (value === '' || value === null || value === undefined) {
          return true;
        }

        const stockValue = stock[key];

        // 타입별 필터링
        if (typeof value === 'string') {
          return stockValue === value;
        }

        if (typeof value === 'number') {
          // 범위 필터링을 위한 특별 처리
          if (key.includes('Min') && typeof stockValue === 'number') {
            return stockValue >= value;
          }
          if (key.includes('Max') && typeof stockValue === 'number') {
            return stockValue <= value;
          }
          return stockValue === value;
        }

        if (typeof value === 'boolean') {
          return stockValue === value;
        }

        return true;
      });
    });
  }

  /**
   * 정렬 적용
   */
  static applySorting<T extends Record<string, any> & { industry: string; subindustry: string }>(
    stocks: T[],
    sort: SortState
  ): T[] {
    return [...stocks].sort((a, b) => {
      const { field, direction } = sort;

      // 특별한 정렬 로직
      if (field === 'discount_rate') {
        const discountRateA = this.calculateDiscountRate(a);
        const discountRateB = this.calculateDiscountRate(b);
        return direction === 'asc' ? discountRateA - discountRateB : discountRateB - discountRateA;
      }

      // boolean 정렬
      if (field === 'consecutive_dividend') {
        return direction === 'asc'
          ? a.consecutive_dividend === b.consecutive_dividend
            ? 0
            : a.consecutive_dividend
            ? 1
            : -1
          : a.consecutive_dividend === b.consecutive_dividend
          ? 0
          : a.consecutive_dividend
          ? -1
          : 1;
      }

      const valueA = a[field];
      const valueB = b[field];

      // null/undefined 처리
      if (valueA == null && valueB == null) return 0;
      if (valueA == null) return direction === 'asc' ? 1 : -1;
      if (valueB == null) return direction === 'asc' ? -1 : 1;

      // 문자열 정렬
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return direction === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      }

      // 숫자 정렬
      return direction === 'asc'
        ? Number(valueA) - Number(valueB)
        : Number(valueB) - Number(valueA);
    });
  }

  /**
   * 저평가율 계산 (그레이엄 페이지용)
   */
  private static calculateDiscountRate(stock: any): number {
    if (!stock.modified_graham_price || stock.modified_graham_price <= 0) {
      return 0;
    }
    return (
      ((stock.modified_graham_price - stock.current_price) / stock.modified_graham_price) * 100
    );
  }

  /**
   * 하위 산업 목록 업데이트
   */
  static updateSubIndustries<
    T extends Record<string, any> & { industry: string; subindustry: string }
  >(stocks: T[], selectedIndustry: string): string[] {
    if (!selectedIndustry) {
      return Array.from(new Set(stocks.map((stock) => stock.subindustry))).sort();
    }

    return Array.from(
      new Set(
        stocks
          .filter((stock) => stock.industry === selectedIndustry)
          .map((stock) => stock.subindustry)
      )
    ).sort();
  }

  /**
   * 페이지네이션 적용
   */
  static applyPagination<T>(
    stocks: T[],
    currentPage: number,
    itemsPerPage: number
  ): {
    currentItems: T[];
    totalPages: number;
    startIndex: number;
    endIndex: number;
  } {
    const totalPages = Math.ceil(stocks.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = stocks.slice(startIndex, endIndex);

    return {
      currentItems,
      totalPages,
      startIndex,
      endIndex,
    };
  }

  /**
   * 필터 초기화 확인
   */
  static isFiltersEmpty(filters: FilterState, defaultFilters: FilterState): boolean {
    return Object.entries(filters).every(([key, value]) => {
      const defaultValue = defaultFilters[key];
      return value === defaultValue || value === '' || value === null || value === undefined;
    });
  }

  /**
   * 특정 필터 값 업데이트
   */
  static updateFilter(currentFilters: FilterState, key: string, value: any): FilterState {
    return {
      ...currentFilters,
      [key]: value,
    };
  }
}
