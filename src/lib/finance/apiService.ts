//src/lib/finance/apiService.ts

import { ApiResponse, StockPrice } from './types';

export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// 단일 연도 주가 데이터 가져오기
export async function fetchStockPrice(
  stockCode: string,
  useLatest: boolean = false
): Promise<StockPrice> {
  const currentYear = new Date().getFullYear();
  const baseYear = currentYear - 1;

  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      // useLatest가 true면 최신 데이터를, 아니면 기준 연도 데이터를 요청
      const response = await fetch(
        `/api/dartPriceDataByCode?${
          useLatest ? 'useLatest=true' : `year=${baseYear}`
        }&stockCode=${encodeURIComponent(stockCode)}`
      );
      const result = await response.json();

      if (result.success) {
        return result.data;
      }

      retryCount++;
      if (retryCount < maxRetries) {
        await delay(1000 * retryCount);
      }
    } catch (error) {
      retryCount++;
      if (retryCount < maxRetries) {
        await delay(1000 * retryCount);
      }
    }
  }

  throw new Error('주가 데이터를 가져오는데 실패했습니다.');
}

// 여러 연도 주가 데이터 가져오기 (최신 데이터 옵션 추가)
export async function fetchStockPrices(
  stockCode: string,
  includeLatest: boolean = false
): Promise<{
  priceDataMap: Record<string, StockPrice>;
  baseYearData: StockPrice | null;
  latestPriceData?: StockPrice | null;
}> {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear - 2, currentYear - 3];

  const priceDataMap: Record<string, StockPrice> = {};
  let baseYearData: StockPrice | null = null;
  let latestPriceData: StockPrice | null = null;
  let apiFailCount = 0;

  // 최신 데이터 먼저 가져오기 (요청한 경우)
  if (includeLatest) {
    try {
      latestPriceData = await fetchStockPrice(stockCode, true);
    } catch (error) {
      console.error('최신 주가 데이터 가져오기 실패:', error);
    }
  }

  // 연도별 주가 데이터 가져오기
  for (const year of years) {
    let retryCount = 0;
    const maxRetries = 3;
    let success = false;

    while (retryCount < maxRetries && !success) {
      try {
        const response = await fetch(
          `/api/dartPriceDataByCode?year=${year}&stockCode=${encodeURIComponent(stockCode)}`
        );
        const result = await response.json();

        if (result.success) {
          priceDataMap[year] = result.data;
          success = true;

          if (year === currentYear - 1) {
            baseYearData = result.data;
          }
        } else {
          retryCount++;
          if (retryCount < maxRetries) {
            await delay(1000 * retryCount);
          }
        }
      } catch (error) {
        retryCount++;
        if (retryCount < maxRetries) {
          await delay(1000 * retryCount);
        } else {
          apiFailCount++;
        }
      }
    }
  }

  if (!baseYearData) {
    throw new Error('기준 연도 주가 데이터를 가져오는데 실패했습니다.');
  }

  return includeLatest
    ? { priceDataMap, baseYearData, latestPriceData }
    : { priceDataMap, baseYearData };
}

// 재무 데이터 가져오기
export async function fetchFinancialData(dartCorpCode: string): Promise<ApiResponse> {
  const currentYear = new Date().getFullYear();
  const baseYear = currentYear - 1;

  try {
    // 연결재무제표 시도
    const response = await fetch(
      `/api/dartFinancialData?corpCode=${dartCorpCode}&year=${baseYear}&reportCode=11011&fsDiv=CFS`
    );
    const data: ApiResponse = await response.json();

    if (data.status && data.status !== '000') {
      throw new Error(
        `API 오류: ${data.message || '연결재무제표 데이터를 가져오는데 실패했습니다'}`
      );
    }

    if (data.list && data.list.length > 0) {
      return data;
    }

    // 일반 재무제표 시도
    const fallbackResponse = await fetch(
      `/api/dartFinancialData?corpCode=${dartCorpCode}&year=${baseYear}&reportCode=11011&fsDiv=OFS`
    );
    const fallbackData: ApiResponse = await fallbackResponse.json();

    if (fallbackData.status && fallbackData.status !== '000') {
      throw new Error('재무제표 데이터를 가져오는데 실패했습니다');
    }

    return fallbackData;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`재무 데이터 가져오기 실패: ${error.message}`);
    }
    throw new Error('재무 데이터 가져오기 실패: 알 수 없는 오류');
  }
}
