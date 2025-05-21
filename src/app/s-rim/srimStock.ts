// src/app/srim/srimStock.ts
import { supabase } from '@/lib/supabaseClient';
import { SrimStock, StockDataResult } from '@/utils/stockDataTypes';
import {
  fetchAllDataWithPagination,
  fetchDataInBatches,
  getDebtRatioFilteredStocks,
} from '@/utils/stockDataUtils';
import {
  emptyResult,
  safeNumber,
  hasConsecutiveDividend,
  countNegativeOperatingIncomes,
} from '@/utils/stockDataCommon';

/**
 * S-RIM(슈퍼 잔여이익모델) 기반 주식 데이터를 가져오는 함수
 * - 부채비율 조건 충족
 * - 현재가 < S-RIM 가격 (30% 이상 저평가)
 * - 3년 이상 영업이익 흑자
 */
export async function fetchSrimStocks(): Promise<StockDataResult<SrimStock>> {
  try {
    console.log('=== S-RIM 기반 주식 데이터 가져오기 시작 ===');

    // 데이터 패치 확인동작

    // 전체 종목 수 확인
    const { count: totalCount, error: countError } = await supabase
      .from('stock_naver_data')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('전체 종목 수 확인 오류:', countError);
    } else {
      console.log(`전체 종목 수: ${totalCount}`);
    }

    // S-RIM 데이터가 있는 종목 수 확인
    const { count: srimCount, error: srimCountError } = await supabase
      .from('stock_naver_fairprice')
      .select('*', { count: 'exact', head: true })
      .not('srimbase', 'is', null);

    if (srimCountError) {
      console.error('S-RIM 데이터 있는 종목 수 확인 오류:', srimCountError);
    } else {
      console.log(`S-RIM 데이터가 있는 종목 수: ${srimCount}`);
    }

    // 데이터 패치 확인동작 끝!!!!

    // 1. 부채비율 조건을 충족하는 종목 데이터 가져오기 (캐시 사용)
    const acceptableDebtStocks = await getDebtRatioFilteredStocks();

    if (!acceptableDebtStocks || acceptableDebtStocks.length === 0) {
      return emptyResult<SrimStock>('부채비율 조건을 충족하는 종목이 없습니다.');
    }

    const filteredStockCodes = acceptableDebtStocks.map((item) => item.stock_code);
    console.log(`부채비율 조건 충족 종목 수: ${filteredStockCodes.length}`);

    // 2. S-RIM 데이터 조회
    const srimData = await fetchDataInBatches<any>(
      'stock_naver_fairprice',
      'stock_code, company_name, industry, subindustry, srimbase, srimdecline10pct, srimdecline20pct, weightedroe',
      filteredStockCodes
    );

    if (!srimData || srimData.length === 0) {
      return emptyResult<SrimStock>('S-RIM 데이터를 찾을 수 없습니다.');
    }

    // 3. S-RIM 데이터가 유효한 종목 필터링
    const srimFilteredData = srimData.filter((item) => {
      const srimBase = safeNumber(item.srimbase);
      return srimBase > 0;
    });

    const srimFilteredCodes = srimFilteredData.map((item) => item.stock_code);

    console.log(`유효한 S-RIM 데이터가 있는 종목 수: ${srimFilteredCodes.length}`);

    if (srimFilteredCodes.length === 0) {
      return emptyResult<SrimStock>('유효한 S-RIM 데이터가 있는 종목이 없습니다.');
    }

    // 4. 현재가 데이터 가져오기
    const priceData = await fetchDataInBatches<any>(
      'stock_price',
      'stock_code, current_price',
      srimFilteredCodes
    );

    if (!priceData || priceData.length === 0) {
      return emptyResult<SrimStock>('현재가 데이터를 찾을 수 없습니다.');
    }

    // 5. PER 및 배당률 데이터 가져오기
    const perData = await fetchDataInBatches<any>(
      'stock_current',
      'stock_code, current_per, current_dividend',
      srimFilteredCodes
    );

    if (!perData || perData.length === 0) {
      return emptyResult<SrimStock>('PER 및 배당률 데이터를 찾을 수 없습니다.');
    }

    // 6. 영업이익 및 배당 이력 데이터 가져오기
    const operatingData = await fetchDataInBatches<any>(
      'stock_naver_data',
      `stock_code, 
      2020_operating_income, 2021_operating_income, 2022_operating_income, 2023_operating_income, 2024_operating_income,
      2020_dividend, 2021_dividend, 2022_dividend, 2023_dividend, 2024_dividend`,
      srimFilteredCodes
    );

    if (!operatingData || operatingData.length === 0) {
      return emptyResult<SrimStock>('영업이익 데이터를 찾을 수 없습니다.');
    }

    // 7. 데이터 맵 생성
    console.log('데이터 맵 생성 중...');

    // S-RIM 데이터 맵
    const srimMap = new Map();

    srimFilteredData.forEach((item) => {
      srimMap.set(item.stock_code, {
        company_name: item.company_name || '',
        industry: item.industry || '미분류',
        subindustry: item.subindustry || '미분류',
        srim_base: safeNumber(item.srimbase),
        srim_decline_10pct: safeNumber(item.srimdecline10pct),
        srim_decline_20pct: safeNumber(item.srimdecline20pct),
        weightedroe: safeNumber(item.weightedroe),
      });
    });

    // 현재가 맵
    const priceMap = new Map(
      priceData.map((item) => [item.stock_code, safeNumber(item.current_price)])
    );

    // PER 및 배당률 맵
    const perDividendMap = new Map();

    perData.forEach((item) => {
      perDividendMap.set(item.stock_code, {
        per: safeNumber(item.current_per),
        dividend: safeNumber(item.current_dividend),
      });
    });

    // 영업이익 및 배당 이력 맵
    const operatingMap = new Map();

    operatingData.forEach((item) => {
      // 영업이익 손실 개수 계산
      const negativeIncomeCount = countNegativeOperatingIncomes(item);

      // 연속 배당 여부 확인
      const consecutiveDividend = hasConsecutiveDividend(item);

      operatingMap.set(item.stock_code, {
        negative_income_count: negativeIncomeCount,
        consecutive_dividend: consecutiveDividend,
      });
    });

    // 8. 안전마진 30% 이상인 종목 필터링 및 최종 데이터 구성
    console.log('안전마진 계산 및 최종 데이터 구성 중...');
    const srimStocks: SrimStock[] = [];
    const MIN_MARGIN_OF_SAFETY = 30; // 30% 안전마진

    for (const stockCode of srimFilteredCodes) {
      const srimInfo = srimMap.get(stockCode);
      const currentPrice = priceMap.get(stockCode);
      const perDividend = perDividendMap.get(stockCode);
      const operatingInfo = operatingMap.get(stockCode);

      // 필요한 모든 데이터가 있는지 확인
      if (!srimInfo || !currentPrice || !perDividend || !operatingInfo) {
        continue;
      }

      // 5년 중 3년 이상 영업이익이 음수인 기업 제외
      if (operatingInfo.negative_income_count >= 3) {
        continue;
      }

      // 안전마진 계산
      const srimBase = srimInfo.srim_base;
      const marginOfSafety = srimBase > 0 ? ((srimBase - currentPrice) / srimBase) * 100 : 0;

      // 안전마진 30% 이상이고 S-RIM 가격이 현재가보다 큰 종목 선별
      if (marginOfSafety >= MIN_MARGIN_OF_SAFETY && srimBase > currentPrice) {
        srimStocks.push({
          stock_code: stockCode,
          company_name: srimInfo.company_name,
          industry: srimInfo.industry,
          subindustry: srimInfo.subindustry,
          current_price: currentPrice,
          current_per: perDividend.per,
          srim_base: srimInfo.srim_base,
          srim_decline_10pct: srimInfo.srim_decline_10pct,
          srim_decline_20pct: srimInfo.srim_decline_20pct,
          margin_of_safety: marginOfSafety,
          dividend_yield: perDividend.dividend,
          consecutive_dividend: operatingInfo.consecutive_dividend,
          weightedroe: srimInfo.weightedroe,
        });
      }
    }

    // 9. 산업군과 하위 산업군 목록 생성
    console.log('산업군 및 하위 산업군 목록 생성 중...');
    const uniqueIndustries = Array.from(new Set(srimStocks.map((stock) => stock.industry))).sort();
    const uniqueSubIndustries = Array.from(
      new Set(srimStocks.map((stock) => stock.subindustry))
    ).sort();

    console.log(`최종 필터링 후 종목 수: ${srimStocks.length}`);

    return {
      stocks: srimStocks,
      industries: uniqueIndustries,
      subIndustries: uniqueSubIndustries,
      error: null,
    };
  } catch (err) {
    console.error('데이터 가져오기 오류:', err);
    return emptyResult<SrimStock>(
      err instanceof Error ? err.message : '데이터를 가져오는 중 오류가 발생했습니다.'
    );
  }
}
