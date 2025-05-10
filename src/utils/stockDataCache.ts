// src/utils/stockDataCache.ts
import acceptableDebtStocksData from '@/lib/finance/acceptable_debt_stocks.json';

interface StockDataCache {
  version: string;
  generatedAt: string;
  totalStocks: number;
  stocks: any[];
}

export async function getAcceptableDebtStocks() {
  // 로컬 스토리지에서 캐시 확인
  const cachedData = localStorage.getItem('acceptable_debt_stocks');

  if (cachedData) {
    try {
      const parsedData = JSON.parse(cachedData) as StockDataCache;

      // 캐시 유효기간 확인 (180일 = 약 6개월)
      const cachedDate = new Date(parsedData.generatedAt);
      const now = new Date();
      const daysSinceCached = (now.getTime() - cachedDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceCached < 180) {
        console.log('캐시된 부채비율 데이터 사용:', parsedData.version);
        return parsedData.stocks;
      }
    } catch (e) {
      console.warn('캐시 데이터 파싱 오류, 새로운 데이터를 사용합니다');
    }
  }

  // JSON 파일에서 직접 데이터 가져오기 (fetch 대신 import 사용)
  try {
    // 새 데이터 캐싱
    localStorage.setItem('acceptable_debt_stocks', JSON.stringify(acceptableDebtStocksData));
    console.log('새로운 부채비율 데이터 저장:', acceptableDebtStocksData.version);

    return acceptableDebtStocksData.stocks;
  } catch (error) {
    console.error('부채비율 데이터 접근 오류:', error);
    // 오류 발생 시 빈 배열 반환
    return [];
  }
}
