// src/app/flavor/flavorStock.ts
import { supabase } from '@/lib/supabaseClient';
import { FlavorStock, StockDataResult } from '@/utils/stockDataTypes';
import { fetchAllDataWithPagination, fetchDataInBatches } from '@/utils/stockDataUtils';
import { emptyResult, safeNumber, hasConsecutiveDividend } from '@/utils/stockDataCommon';

/**
 * 고배당 가치주 데이터를 가져오는 함수
 * - 배당률 5% 이상
 * - PER 10 이하, PBR 1 이하
 * - 자산 정보와 연속 배당 확인
 */
export async function fetchFlavorStocks(): Promise<StockDataResult<FlavorStock>> {
  try {
    console.log('=== 고배당 가치주 데이터 가져오기 시작 ===');

    // 데이터 패치 확인동작

    // 전체 종목 수 확인
    const { count: totalCount, error: countError } = await supabase
      .from('stock_current')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('전체 종목 수 확인 오류:', countError);
    } else {
      console.log(`전체 종목 수: ${totalCount}`);
    }

    // 배당 데이터가 있는 종목 수 확인
    const { count: dividendCount, error: dividendCountError } = await supabase
      .from('stock_current')
      .select('*', { count: 'exact', head: true })
      .not('current_dividend', 'is', null);

    if (dividendCountError) {
      console.error('배당 데이터 있는 종목 수 확인 오류:', dividendCountError);
    } else {
      console.log(`배당 데이터가 있는 종목 수: ${dividendCount}`);
    }

    // 데이터 패치 확인동작 끝!!!!

    // 1. 배당률 데이터 페이지네이션으로 가져오기
    const dividendData = await fetchAllDataWithPagination<any>(
      'stock_current',
      'stock_code, current_dividend, current_per, current_pbr',
      'stock_code',
      (query) => query.not('current_dividend', 'is', null)
    );

    if (!dividendData || dividendData.length === 0) {
      return emptyResult<FlavorStock>('배당 데이터를 찾을 수 없습니다.');
    }

    // 배당률 5% 이상인 종목 코드만 필터링
    const highDividendStocks = dividendData.filter((item) => item['current_dividend'] >= 5);
    const stockCodes = highDividendStocks.map((item) => item.stock_code);

    console.log(`배당률 5% 이상 종목 수: ${stockCodes.length}`);

    if (stockCodes.length === 0) {
      return emptyResult<FlavorStock>('배당률 조건에 맞는 주식을 찾을 수 없습니다.');
    }

    // 2. stock_naver_data 테이블에서 자산, 배당, 산업 정보를 한 번에 가져오기
    const stockDataInfo = await fetchDataInBatches<any>(
      'stock_naver_data',
      `stock_code, 2024_assets, 
      2020_dividend, 2021_dividend, 2022_dividend, 2023_dividend, 2024_dividend,
      company_name, industry, subindustry`,
      stockCodes
    );

    if (!stockDataInfo || stockDataInfo.length === 0) {
      return emptyResult<FlavorStock>('주식 데이터를 찾을 수 없습니다.');
    }

    // 3. 주가 데이터 가져오기
    const priceData = await fetchDataInBatches<any>(
      'stock_price',
      'stock_code, current_price',
      stockCodes
    );

    if (!priceData || priceData.length === 0) {
      return emptyResult<FlavorStock>('현재가 데이터를 찾을 수 없습니다.');
    }

    // 4. 데이터 맵 생성
    console.log('데이터 맵 생성 중...');

    // 주가 맵
    const priceMap = new Map(
      priceData.map((item) => [item.stock_code, safeNumber(item.current_price)])
    );

    // 주식 정보 맵 (자산, 배당, 산업 정보 등)
    const stockInfoMap = new Map();

    stockDataInfo.forEach((item) => {
      stockInfoMap.set(item.stock_code, {
        company_name: item.company_name || '',
        industry: item.industry || '미분류',
        subindustry: item.subindustry || '미분류',
        assets: safeNumber(item['2024_assets']),
        consecutive_dividend: hasConsecutiveDividend(item),
      });
    });

    // 배당, PER, PBR 맵
    const currentDataMap = new Map();

    dividendData.forEach((item) => {
      currentDataMap.set(item.stock_code, {
        dividend: safeNumber(item.current_dividend),
        per: safeNumber(item.current_per),
        pbr: safeNumber(item.current_pbr),
      });
    });

    // 5. 모든 조건을 만족하는 종목 필터링
    console.log('조건 필터링 중...');
    const filteredStocks = stockCodes.filter((stockCode) => {
      const currentData = currentDataMap.get(stockCode);
      // PER, PBR 조건 확인
      return currentData && currentData.per > 0 && currentData.per <= 10 && currentData.pbr <= 1;
    });

    console.log(`PER, PBR 조건 통과 종목 수: ${filteredStocks.length}`);

    // 6. 최종 데이터 구성
    console.log('최종 데이터 구성 중...');
    const flavorStocks: FlavorStock[] = [];

    for (const stockCode of filteredStocks) {
      const stockInfo = stockInfoMap.get(stockCode);
      const currentData = currentDataMap.get(stockCode);
      const currentPrice = priceMap.get(stockCode);

      // 모든 필요한 데이터가 있는지 확인
      if (stockInfo && currentData && currentPrice) {
        flavorStocks.push({
          stock_code: stockCode,
          company_name: stockInfo.company_name,
          industry: stockInfo.industry,
          subindustry: stockInfo.subindustry,
          current_per: currentData.per,
          current_pbr: currentData.pbr,
          current_price: currentPrice,
          dividend_yield: currentData.dividend,
          assets: stockInfo.assets,
          consecutive_dividend: stockInfo.consecutive_dividend,
        });
      }
    }

    // 7. 산업군과 하위 산업군 목록 생성
    console.log('산업군 및 하위 산업군 목록 생성 중...');
    const uniqueIndustries = Array.from(
      new Set(flavorStocks.map((stock) => stock.industry))
    ).sort();

    const uniqueSubIndustries = Array.from(
      new Set(flavorStocks.map((stock) => stock.subindustry))
    ).sort();

    console.log(`최종 필터링 후 종목 수: ${flavorStocks.length}`);

    return {
      stocks: flavorStocks,
      industries: uniqueIndustries,
      subIndustries: uniqueSubIndustries,
      error: null,
    };
  } catch (err) {
    console.error('데이터 가져오기 오류:', err);
    return emptyResult<FlavorStock>(
      err instanceof Error ? err.message : '데이터를 가져오는 중 오류가 발생했습니다.'
    );
  }
}
