// src/utils/cache_params/cacheManager.ts

import { CacheData, StockDataResult } from './stockPageTypes';

export class CacheManager {
  /**
   * 캐시에서 데이터 가져오기
   */
  static getCachedData<T extends Record<string, any> & { industry: string; subindustry: string }>(
    cacheKey: string,
    cacheDuration: number
  ): CacheData<T> | null {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const parsedData: CacheData<T> = JSON.parse(cached);

      // 캐시 만료 확인
      if (Date.now() - parsedData.timestamp > cacheDuration) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return parsedData;
    } catch (error) {
      console.error('캐시 데이터 읽기 오류:', error);
      localStorage.removeItem(cacheKey);
      return null;
    }
  }

  /**
   * 캐시에 데이터 저장
   */
  static setCachedData<T extends Record<string, any> & { industry: string; subindustry: string }>(
    cacheKey: string,
    result: StockDataResult<T>
  ): void {
    try {
      const cacheData: CacheData<T> = {
        data: result.stocks,
        industries: result.industries,
        subIndustries: result.subIndustries,
        timestamp: Date.now(),
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('캐시 데이터 저장 오류:', error);
    }
  }

  /**
   * 캐시 삭제
   */
  static clearCache(cacheKey: string): void {
    try {
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.error('캐시 삭제 오류:', error);
    }
  }

  /**
   * 모든 주식 관련 캐시 삭제
   */
  static clearAllStockCaches(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.includes('stocks') || key.includes('graham') || key.includes('value')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('전체 캐시 삭제 오류:', error);
    }
  }

  /**
   * 캐시 상태 확인
   */
  static getCacheInfo(cacheKey: string): { exists: boolean; age?: number; size?: number } {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) {
        return { exists: false };
      }

      const parsedData = JSON.parse(cached);
      const age = Date.now() - parsedData.timestamp;
      const size = new Blob([cached]).size;

      return {
        exists: true,
        age,
        size,
      };
    } catch (error) {
      return { exists: false };
    }
  }
}
