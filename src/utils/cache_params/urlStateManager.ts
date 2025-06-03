// src/utils/cache_params/urlStateManager.ts

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { FilterState, SortState, URLParams } from './stockPageTypes';

export class URLStateManager {
  /**
   * URL에서 상태 파싱
   */
  static parseFromURL(
    searchParams: URLSearchParams,
    defaultFilters: FilterState,
    defaultSort: SortState
  ) {
    const urlFilters: FilterState = { ...defaultFilters };
    const urlSort: SortState = { ...defaultSort };
    let currentPage = 1;

    // 페이지 파싱
    const pageParam = searchParams.get('page');
    if (pageParam) {
      const parsedPage = parseInt(pageParam);
      if (!isNaN(parsedPage) && parsedPage > 0) {
        currentPage = parsedPage;
      }
    }

    // 정렬 파싱
    const sortParam = searchParams.get('sort');
    const directionParam = searchParams.get('direction');
    if (sortParam) {
      urlSort.field = sortParam;
    }
    if (directionParam && (directionParam === 'asc' || directionParam === 'desc')) {
      urlSort.direction = directionParam;
    }

    // 필터 파싱
    searchParams.forEach((value, key) => {
      if (key !== 'page' && key !== 'sort' && key !== 'direction') {
        // 숫자 변환 시도
        const numberValue = Number(value);
        if (!isNaN(numberValue)) {
          urlFilters[key] = numberValue;
        } else if (value === 'true') {
          urlFilters[key] = true;
        } else if (value === 'false') {
          urlFilters[key] = false;
        } else if (value === 'null') {
          urlFilters[key] = null;
        } else {
          urlFilters[key] = value;
        }
      }
    });

    return {
      filters: urlFilters,
      sort: urlSort,
      currentPage,
    };
  }

  /**
   * 상태를 URL 파라미터로 변환
   */
  static buildURLParams(
    filters: FilterState,
    sort: SortState,
    currentPage: number,
    defaultFilters: FilterState,
    defaultSort: SortState
  ): URLParams {
    const params: URLParams = {};

    // 페이지 (기본값 1이 아닐 때만)
    if (currentPage !== 1) {
      params.page = currentPage.toString();
    }

    // 정렬 (기본값과 다를 때만)
    if (sort.field !== defaultSort.field) {
      params.sort = sort.field;
    }
    if (sort.direction !== defaultSort.direction) {
      params.direction = sort.direction;
    }

    // 필터 (기본값과 다를 때만)
    Object.entries(filters).forEach(([key, value]) => {
      const defaultValue = defaultFilters[key];
      if (value !== defaultValue && value !== '' && value !== null && value !== undefined) {
        params[key] = String(value);
      }
    });

    return params;
  }
}

/**
 * URL 상태 관리를 위한 커스텀 훅
 */
export function useURLState(defaultFilters: FilterState, defaultSort: SortState) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL에서 현재 상태 파싱
  const parseCurrentState = useCallback(() => {
    return URLStateManager.parseFromURL(searchParams, defaultFilters, defaultSort);
  }, [searchParams, defaultFilters, defaultSort]);

  // URL 업데이트
  const updateURL = useCallback(
    (filters: FilterState, sort: SortState, currentPage: number, replace: boolean = false) => {
      const params = URLStateManager.buildURLParams(
        filters,
        sort,
        currentPage,
        defaultFilters,
        defaultSort
      );

      const searchParamsObj = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParamsObj.set(key, value);
        }
      });

      const newURL = `${window.location.pathname}?${searchParamsObj.toString()}`;

      if (replace) {
        router.replace(newURL);
      } else {
        router.push(newURL);
      }
    },
    [router, defaultFilters, defaultSort]
  );

  return {
    parseCurrentState,
    updateURL,
  };
}
