// src/utils/cache_params/useStockPageState.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StockPageConfig,
  StockPageState,
  FilterState,
  SortState,
  PaginationState,
} from './stockPageTypes';
import { CacheManager } from './cacheManager';
import { FilterManager } from './filterManager';
import { useURLState } from './urlStateManager';

export function useStockPageState<
  T extends Record<string, any> & { industry: string; subindustry: string }
>(config: StockPageConfig<T>): StockPageState<T> {
  // 기본 상태
  const [stocks, setStocks] = useState<T[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [subIndustries, setSubIndustries] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // URL 상태 관리
  const { parseCurrentState, updateURL } = useURLState(config.defaultFilters, config.defaultSort);

  // URL에서 초기 상태 파싱
  const initialState = parseCurrentState();
  const [filters, setFiltersState] = useState<FilterState>(initialState.filters);
  const [sort, setSortState] = useState<SortState>(initialState.sort);
  const [currentPage, setCurrentPage] = useState<number>(initialState.currentPage);

  // 필터링된 데이터 계산
  const filteredStocks = useMemo(() => {
    let filtered = FilterManager.applyFilters(stocks, filters);

    // 산업군 변경 시 하위 산업군 목록 업데이트 로직
    if (filters.industryFilter) {
      const newSubIndustries = FilterManager.updateSubIndustries(
        stocks,
        filters.industryFilter as string
      );
      setSubIndustries(newSubIndustries);

      // 기존 하위 산업군이 새 목록에 없으면 초기화
      if (
        filters.subIndustryFilter &&
        !newSubIndustries.includes(filters.subIndustryFilter as string)
      ) {
        const newFilters = { ...filters, subIndustryFilter: '' };
        setFiltersState(newFilters);
        updateURL(newFilters, sort, 1, true);
        return filtered;
      }
    } else {
      // 산업군 필터가 없을 때 모든 하위 산업군 표시
      const allSubIndustries = FilterManager.updateSubIndustries(stocks, '');
      setSubIndustries(allSubIndustries);
    }

    return FilterManager.applySorting(filtered, sort);
  }, [stocks, filters, sort, updateURL]);

  // 페이지네이션 계산
  const paginationData = useMemo(() => {
    return FilterManager.applyPagination(filteredStocks, currentPage, config.itemsPerPage);
  }, [filteredStocks, currentPage, config.itemsPerPage]);

  const pagination: PaginationState = {
    currentPage,
    totalPages: paginationData.totalPages,
    itemsPerPage: config.itemsPerPage,
  };

  // 데이터 로딩 함수
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // 캐시 확인
      const cachedData = CacheManager.getCachedData<T>(config.cacheKey, config.cacheDuration);

      if (cachedData) {
        console.log('캐시된 데이터 사용:', config.cacheKey);
        setStocks(cachedData.data);
        setIndustries(cachedData.industries);
        setSubIndustries(cachedData.subIndustries);
      } else {
        console.log('서버에서 새로운 데이터 가져오기:', config.cacheKey);
        const result = await config.fetchFunction();

        if (result.error) {
          setError(result.error);
          setStocks([]);
          setIndustries([]);
          setSubIndustries([]);
        } else {
          setStocks(result.stocks);
          setIndustries(result.industries);
          setSubIndustries(result.subIndustries);

          // 캐시에 저장
          CacheManager.setCachedData(config.cacheKey, result);
        }
      }
    } catch (err) {
      console.error('데이터 로딩 오류:', err);
      setError(err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [config]);

  // 초기 데이터 로드
  useEffect(() => {
    loadData();
  }, [loadData]);

  // URL 상태 변경 감지
  useEffect(() => {
    const newState = parseCurrentState();
    setFiltersState(newState.filters);
    setSortState(newState.sort);
    setCurrentPage(newState.currentPage);
  }, [parseCurrentState]);

  // 필터 업데이트 함수
  const setFilters = useCallback(
    (newFilters: FilterState) => {
      setFiltersState(newFilters);
      setCurrentPage(1);
      updateURL(newFilters, sort, 1);
    },
    [sort, updateURL]
  );

  // 필터 초기화 함수
  const resetFilters = useCallback(() => {
    const defaultFilters = config.defaultFilters;
    const defaultSort = config.defaultSort;
    setFiltersState(defaultFilters);
    setSortState(defaultSort);
    setCurrentPage(1);
    updateURL(defaultFilters, defaultSort, 1);
  }, [config.defaultFilters, config.defaultSort, updateURL]);

  // 정렬 업데이트 함수
  const setSort = useCallback(
    (newSort: SortState) => {
      setSortState(newSort);
      setCurrentPage(1);
      updateURL(filters, newSort, 1);
    },
    [filters, updateURL]
  );

  // 정렬 토글 함수
  const toggleSort = useCallback(
    (field: string) => {
      const newSort: SortState = {
        field,
        direction: sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc',
      };
      setSort(newSort);
    },
    [sort, setSort]
  );

  // 페이지네이션 업데이트 함수
  const setPagination = useCallback(
    (newPagination: Partial<PaginationState>) => {
      if (newPagination.currentPage !== undefined) {
        setCurrentPage(newPagination.currentPage);
        updateURL(filters, sort, newPagination.currentPage);
      }
    },
    [filters, sort, updateURL]
  );

  // 페이지 변경 핸들러
  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= paginationData.totalPages) {
        setCurrentPage(newPage);
        updateURL(filters, sort, newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [paginationData.totalPages, filters, sort, updateURL]
  );

  // 데이터 새로고침 함수
  const refreshData = useCallback(async () => {
    CacheManager.clearCache(config.cacheKey);
    await loadData();
  }, [config.cacheKey, loadData]);

  return {
    // 데이터
    stocks,
    filteredStocks,
    currentItems: paginationData.currentItems,
    industries,
    subIndustries,

    // 상태
    loading,
    error,

    // 필터
    filters,
    setFilters,
    resetFilters,

    // 정렬
    sort,
    setSort,
    toggleSort,

    // 페이지네이션
    pagination,
    setPagination,
    handlePageChange,

    // 유틸리티
    refreshData,
  };
}
