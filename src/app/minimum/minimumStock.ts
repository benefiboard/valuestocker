// src/app/minimum/minimumStock.ts
import { supabase } from '@/lib/supabaseClient';
import { MinimumStock, StockDataResult } from '@/utils/stockDataTypes';
import { fetchAllDataWithPagination, fetchDataInBatches } from '@/utils/stockDataUtils';
import { emptyResult, safeNumber, hasConsecutiveDividend } from '@/utils/stockDataCommon';

// 확장된 MinimumStock 타입
interface EnhancedMinimumStock extends MinimumStock {
  ncav_discount_rate: number; // NCAV 할인율 (%)
  liquidation_discount_rate: number; // 청산가치 할인율 (%)
  value_case: 'both' | 'ncav_only' | 'liquidation_only'; // 케이스 구분
  best_discount_rate: number; // 더 높은 할인율 (정렬용)
}

/**
 * 할인율 계산 함수
 * @param intrinsicValue 내재가치 (NCAV 또는 청산가치)
 * @param currentPrice 현재가
 * @returns 할인율 (%) - 현재가가 내재가치보다 낮을 때만 양수
 */
function calculateDiscountRate(intrinsicValue: number, currentPrice: number): number {
  if (!intrinsicValue || intrinsicValue <= 0 || !currentPrice || currentPrice <= 0) {
    return 0;
  }

  if (currentPrice >= intrinsicValue) {
    return 0; // 할인 없음
  }

  return Math.round(((intrinsicValue - currentPrice) / intrinsicValue) * 100 * 10) / 10; // 소수점 1자리
}

/**
 * 케이스 판단 함수
 */
function determineValueCase(
  ncavDiscountRate: number,
  liquidationDiscountRate: number
): 'both' | 'ncav_only' | 'liquidation_only' {
  const hasNcavDiscount = ncavDiscountRate > 0;
  const hasLiquidationDiscount = liquidationDiscountRate > 0;

  if (hasNcavDiscount && hasLiquidationDiscount) {
    return 'both';
  } else if (hasNcavDiscount) {
    return 'ncav_only';
  } else {
    return 'liquidation_only';
  }
}

/**
 * 극도 저평가주 데이터를 가져오는 함수
 * - 주당 NCAV 또는 주당 청산가치가 현재가보다 높은 종목
 * - Benjamin Graham의 Net Current Asset Value 개념 활용
 * - 할인율 및 케이스 구분 추가
 */
export async function fetchMinimumStocks(): Promise<StockDataResult<EnhancedMinimumStock>> {
  try {
    console.log('=== 극도 저평가주 데이터 가져오기 시작 ===');

    // 데이터 패치 확인동작
    const { count: totalCount, error: countError } = await supabase
      .from('stock_current')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('전체 종목 수 확인 오류:', countError);
    } else {
      console.log(`전체 종목 수: ${totalCount}`);
    }

    const { count: balanceCount, error: balanceCountError } = await supabase
      .from('stock_naver_balance')
      .select('*', { count: 'exact', head: true })
      .or('2024_ncav_per_shares.not.is.null,2024_liquidation_value_per_shares.not.is.null');

    if (balanceCountError) {
      console.error('밸런스 데이터 있는 종목 수 확인 오류:', balanceCountError);
    } else {
      console.log(`NCAV/청산가치 데이터가 있는 종목 수: ${balanceCount}`);
    }

    // 1. NCAV/청산가치 데이터 페이지네이션으로 가져오기
    const balanceData = await fetchAllDataWithPagination<any>(
      'stock_naver_balance',
      'stock_code, 2024_ncav_per_shares, 2024_liquidation_value_per_shares',
      'stock_code',
      (query) =>
        query.or('2024_ncav_per_shares.not.is.null,2024_liquidation_value_per_shares.not.is.null')
    );

    if (!balanceData || balanceData.length === 0) {
      return emptyResult<EnhancedMinimumStock>('NCAV/청산가치 데이터를 찾을 수 없습니다.');
    }

    console.log(`NCAV/청산가치 데이터 조회 완료: ${balanceData.length}개`);

    // 2. 현재가 데이터 가져오기
    const stockCodes = balanceData.map((item) => item.stock_code);
    const priceData = await fetchDataInBatches<any>(
      'stock_price',
      'stock_code, current_price',
      stockCodes
    );

    if (!priceData || priceData.length === 0) {
      return emptyResult<EnhancedMinimumStock>('현재가 데이터를 찾을 수 없습니다.');
    }

    // 3. 현재가 맵 생성
    const priceMap = new Map(
      priceData.map((item) => [item.stock_code, safeNumber(item.current_price)])
    );

    // 4. 할인율 계산 및 조건에 맞는 종목 필터링
    const enhancedBalanceData = balanceData
      .map((item) => {
        const currentPrice = priceMap.get(item.stock_code);
        const ncavPerShare = safeNumber(item['2024_ncav_per_shares']);
        const liquidationPerShare = safeNumber(item['2024_liquidation_value_per_shares']);

        if (!currentPrice || currentPrice <= 0) return null;

        // 할인율 계산
        const ncavDiscountRate = calculateDiscountRate(ncavPerShare, currentPrice);
        const liquidationDiscountRate = calculateDiscountRate(liquidationPerShare, currentPrice);

        // 조건 확인: NCAV 또는 청산가치 중 하나라도 현재가보다 높으면 선택
        if (ncavDiscountRate <= 0 && liquidationDiscountRate <= 0) {
          return null; // 둘 다 할인이 없으면 제외
        }

        // 케이스 판단
        const valueCase = determineValueCase(ncavDiscountRate, liquidationDiscountRate);

        // 최고 할인율 (정렬용)
        const bestDiscountRate = Math.max(ncavDiscountRate, liquidationDiscountRate);

        return {
          stock_code: item.stock_code,
          ncav_per_share: ncavPerShare,
          liquidation_per_share: liquidationPerShare,
          current_price: currentPrice,
          ncav_discount_rate: ncavDiscountRate,
          liquidation_discount_rate: liquidationDiscountRate,
          value_case: valueCase,
          best_discount_rate: bestDiscountRate,
        };
      })
      .filter((item) => item !== null);

    console.log(`조건 만족 종목 수: ${enhancedBalanceData.length}`);

    if (enhancedBalanceData.length === 0) {
      return emptyResult<EnhancedMinimumStock>('조건에 맞는 주식을 찾을 수 없습니다.');
    }

    const filteredStockCodes = enhancedBalanceData.map((item) => item!.stock_code);

    // 5. stock_current 테이블에서 PER, 배당률 정보 가져오기
    const currentData = await fetchDataInBatches<any>(
      'stock_current',
      'stock_code, current_dividend, current_per',
      filteredStockCodes
    );

    // 6. stock_naver_data 테이블에서 배당, 산업 정보 가져오기
    const stockDataInfo = await fetchDataInBatches<any>(
      'stock_naver_data',
      `stock_code, 
      2020_dividend, 2021_dividend, 2022_dividend, 2023_dividend, 2024_dividend,
      company_name, industry, subindustry`,
      filteredStockCodes
    );

    if (!stockDataInfo || stockDataInfo.length === 0) {
      return emptyResult<EnhancedMinimumStock>('주식 데이터를 찾을 수 없습니다.');
    }

    // 7. 데이터 맵 생성
    console.log('데이터 맵 생성 중...');

    // 주식 정보 맵 (배당, 산업 정보 등)
    const stockInfoMap = new Map();
    stockDataInfo.forEach((item) => {
      stockInfoMap.set(item.stock_code, {
        company_name: item.company_name || '',
        industry: item.industry || '미분류',
        subindustry: item.subindustry || '미분류',
        consecutive_dividend: hasConsecutiveDividend(item),
      });
    });

    // 현재 데이터 맵 (배당, PER)
    const currentDataMap = new Map();
    if (currentData && currentData.length > 0) {
      currentData.forEach((item) => {
        currentDataMap.set(item.stock_code, {
          dividend: safeNumber(item.current_dividend),
          per: safeNumber(item.current_per),
        });
      });
    }

    // 8. 최종 데이터 구성
    console.log('최종 데이터 구성 중...');
    const minimumStocks: EnhancedMinimumStock[] = [];

    for (const enhancedItem of enhancedBalanceData) {
      if (!enhancedItem) continue;

      const stockInfo = stockInfoMap.get(enhancedItem.stock_code);
      const currentInfo = currentDataMap.get(enhancedItem.stock_code);

      // 모든 필요한 데이터가 있는지 확인
      if (stockInfo) {
        minimumStocks.push({
          stock_code: enhancedItem.stock_code,
          company_name: stockInfo.company_name,
          industry: stockInfo.industry,
          subindustry: stockInfo.subindustry,
          ncav_per_share: enhancedItem.ncav_per_share,
          liquidation_per_share: enhancedItem.liquidation_per_share,
          current_per: currentInfo ? currentInfo.per : 0,
          current_price: enhancedItem.current_price,
          dividend_yield: currentInfo ? currentInfo.dividend : 0,
          consecutive_dividend: stockInfo.consecutive_dividend,
          // 새로 추가된 필드들
          ncav_discount_rate: enhancedItem.ncav_discount_rate,
          liquidation_discount_rate: enhancedItem.liquidation_discount_rate,
          value_case: enhancedItem.value_case,
          best_discount_rate: enhancedItem.best_discount_rate,
        });
      }
    }

    // 9. 산업군과 하위 산업군 목록 생성
    console.log('산업군 및 하위 산업군 목록 생성 중...');
    const uniqueIndustries = Array.from(
      new Set(minimumStocks.map((stock) => stock.industry))
    ).sort();

    const uniqueSubIndustries = Array.from(
      new Set(minimumStocks.map((stock) => stock.subindustry))
    ).sort();

    console.log(`최종 필터링 후 종목 수: ${minimumStocks.length}`);

    return {
      stocks: minimumStocks,
      industries: uniqueIndustries,
      subIndustries: uniqueSubIndustries,
      error: null,
    };
  } catch (err) {
    console.error('데이터 가져오기 오류:', err);
    return emptyResult<EnhancedMinimumStock>(
      err instanceof Error ? err.message : '데이터를 가져오는 중 오류가 발생했습니다.'
    );
  }
}
