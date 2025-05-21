// src/app/profit/profitStock.ts
import { supabase } from '@/lib/supabaseClient';
import { ProfitStock, StockDataResult } from '@/utils/stockDataTypes';
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
 * 수익기반 내재가치 주식 데이터를 가져오는 함수
 * - 부채비율 조건 충족
 * - 성장률 > 0
 * - 현재가 < 내재가치 (안전마진 30% 이상)
 * - 3년 이상 영업이익 흑자
 */
export async function fetchProfitStocks(): Promise<StockDataResult<ProfitStock>> {
  try {
    console.log('=== 수익기반 내재가치 주식 데이터 가져오기 시작 ===');

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

    // 내재가치 데이터가 있는 종목 수 확인
    const { count: fairpriceCount, error: fairpriceCountError } = await supabase
      .from('stock_naver_fairprice')
      .select('*', { count: 'exact', head: true })
      .not('profitbasedprice', 'is', null);

    if (fairpriceCountError) {
      console.error('내재가치 데이터 있는 종목 수 확인 오류:', fairpriceCountError);
    } else {
      console.log(`내재가치 데이터가 있는 종목 수: ${fairpriceCount}`);
    }

    // 데이터 패치 확인동작 끝!!!!

    // 1. 부채비율 조건을 충족하는 종목 데이터 가져오기 (캐시 사용)
    const acceptableDebtStocks = await getDebtRatioFilteredStocks();

    if (!acceptableDebtStocks || acceptableDebtStocks.length === 0) {
      return emptyResult<ProfitStock>('부채비율 조건을 충족하는 종목이 없습니다.');
    }

    const filteredStockCodes = acceptableDebtStocks.map((item) => item.stock_code);
    console.log(`부채비율 조건 충족 종목 수: ${filteredStockCodes.length}`);

    // 2. 내재가치 및 성장률 데이터 조회
    const fairpriceData = await fetchDataInBatches<any>(
      'stock_naver_fairprice',
      'stock_code, company_name, industry, subindustry, profitbasedprice, growthrate',
      filteredStockCodes
    );

    if (!fairpriceData || fairpriceData.length === 0) {
      return emptyResult<ProfitStock>('내재가치 데이터를 찾을 수 없습니다.');
    }

    // 3. 내재가치 및 성장률 필터링 (유효한 데이터만)
    const fairpriceFilteredData = fairpriceData.filter((item) => {
      const profitBasedPrice = safeNumber(item.profitbasedprice);
      const growthRate = safeNumber(item.growthrate);
      return profitBasedPrice > 0 && growthRate > 0;
    });

    const fairpriceFilteredCodes = fairpriceFilteredData.map((item) => item.stock_code);

    console.log(`유효한 내재가치 데이터가 있는 종목 수: ${fairpriceFilteredCodes.length}`);

    if (fairpriceFilteredCodes.length === 0) {
      return emptyResult<ProfitStock>('유효한 내재가치 데이터가 있는 종목이 없습니다.');
    }

    // 4. 현재가 데이터 가져오기
    const priceData = await fetchDataInBatches<any>(
      'stock_price',
      'stock_code, current_price',
      fairpriceFilteredCodes
    );

    if (!priceData || priceData.length === 0) {
      return emptyResult<ProfitStock>('현재가 데이터를 찾을 수 없습니다.');
    }

    // 5. 배당률 데이터 가져오기
    const dividendData = await fetchDataInBatches<any>(
      'stock_current',
      'stock_code, current_dividend',
      fairpriceFilteredCodes
    );

    // 6. 영업이익, 배당 이력 및 FCF 데이터 가져오기
    const operatingData = await fetchDataInBatches<any>(
      'stock_naver_data',
      `stock_code, 
      shares_outstanding,
      2020_operating_income, 2021_operating_income, 2022_operating_income, 2023_operating_income, 2024_operating_income,
      2020_operating_cash_flow, 2020_capex, 2020_free_cash_flow,
      2021_operating_cash_flow, 2021_capex, 2021_free_cash_flow,
      2022_operating_cash_flow, 2022_capex, 2022_free_cash_flow,
      2023_operating_cash_flow, 2023_capex, 2023_free_cash_flow,
      2024_operating_cash_flow, 2024_capex, 2024_free_cash_flow,
      2020_dividend, 2021_dividend, 2022_dividend, 2023_dividend, 2024_dividend`,
      fairpriceFilteredCodes
    );

    if (!operatingData || operatingData.length === 0) {
      return emptyResult<ProfitStock>('영업이익 데이터를 찾을 수 없습니다.');
    }

    // 7. 데이터 맵 생성
    console.log('데이터 맵 생성 중...');

    // 내재가치 및 성장률 맵
    const fairpriceMap = new Map();

    fairpriceFilteredData.forEach((item) => {
      fairpriceMap.set(item.stock_code, {
        company_name: item.company_name || '',
        industry: item.industry || '미분류',
        subindustry: item.subindustry || '미분류',
        profitbasedprice: safeNumber(item.profitbasedprice),
        growthrate: safeNumber(item.growthrate),
      });
    });

    // 현재가 맵
    const priceMap = new Map(
      priceData.map((item) => [item.stock_code, safeNumber(item.current_price)])
    );

    // 배당률 맵
    const dividendMap = new Map(
      dividendData.map((item) => [item.stock_code, safeNumber(item.current_dividend)])
    );

    // 영업이익, FCF 및 배당 이력 맵
    const operatingMap = new Map();

    operatingData.forEach((item) => {
      // 영업이익 손실 개수 계산
      const negativeIncomeCount = countNegativeOperatingIncomes(item);

      // 연속 배당 여부 확인
      const consecutiveDividend = hasConsecutiveDividend(item);

      // FCF 계산 (직접 필드 사용 우선)
      const fcfValues = [
        safeNumber(item['2020_free_cash_flow']),
        safeNumber(item['2021_free_cash_flow']),
        safeNumber(item['2022_free_cash_flow']),
        safeNumber(item['2023_free_cash_flow']),
        safeNumber(item['2024_free_cash_flow']),
      ];

      // FCF 값이 0인 경우 영업현금흐름 - 자본지출로 계산
      for (let i = 0; i < 5; i++) {
        const year = 2020 + i;
        if (fcfValues[i] === 0) {
          const ocf = safeNumber(item[`${year}_operating_cash_flow`]);
          const capex = safeNumber(item[`${year}_capex`]);
          fcfValues[i] = ocf - capex;
        }
      }

      // 유효한 FCF 값 필터링
      const validFcfValues = fcfValues.filter((fcf) => fcf !== 0);

      // 중앙값 계산
      let fcfMedian = 0;
      if (validFcfValues.length > 0) {
        // 정렬 후 중앙값 가져오기
        validFcfValues.sort((a, b) => a - b);
        fcfMedian =
          validFcfValues.length % 2 === 0
            ? (validFcfValues[validFcfValues.length / 2 - 1] +
                validFcfValues[validFcfValues.length / 2]) /
              2
            : validFcfValues[Math.floor(validFcfValues.length / 2)];
      }

      // 주식수 계산
      let sharesOutstanding = 0;
      if (item['shares_outstanding']) {
        if (typeof item['shares_outstanding'] === 'string') {
          sharesOutstanding = Number(item['shares_outstanding'].replace(/,/g, ''));
        } else {
          sharesOutstanding = Number(item['shares_outstanding']);
        }
      }

      // 주당 FCF 계산
      const fcfPerShare = sharesOutstanding > 0 ? fcfMedian / sharesOutstanding : 0;

      operatingMap.set(item.stock_code, {
        negative_income_count: negativeIncomeCount,
        consecutive_dividend: consecutiveDividend,
        fcf_median: fcfMedian,
        fcf_per_share: fcfPerShare,
      });
    });

    // 8. 안전마진 30% 이상인 종목 필터링 및 최종 데이터 구성
    console.log('안전마진 계산 및 최종 데이터 구성 중...');
    const profitStocks: ProfitStock[] = [];
    const MIN_MARGIN_OF_SAFETY = 0.3; // 30% 안전마진

    for (const stockCode of fairpriceFilteredCodes) {
      const fairpriceInfo = fairpriceMap.get(stockCode);
      const currentPrice = priceMap.get(stockCode);
      const dividend = dividendMap.get(stockCode) || 0;
      const operatingInfo = operatingMap.get(stockCode);

      // 필요한 모든 데이터가 있는지 확인
      if (!fairpriceInfo || !currentPrice || !operatingInfo) {
        continue;
      }

      // 5년 중 3년 이상 영업이익이 음수인 기업 제외
      if (operatingInfo.negative_income_count >= 3) {
        continue;
      }

      // 내재가치 및 안전마진 계산
      const profitBasedPrice = fairpriceInfo.profitbasedprice;
      const marginOfSafety =
        profitBasedPrice > 0 ? (profitBasedPrice - currentPrice) / profitBasedPrice : 0;

      // 내재가치가 현재가보다 높고 안전마진이 30% 이상인 종목 선별
      if (currentPrice < profitBasedPrice && marginOfSafety >= MIN_MARGIN_OF_SAFETY) {
        profitStocks.push({
          stock_code: stockCode,
          company_name: fairpriceInfo.company_name,
          industry: fairpriceInfo.industry,
          subindustry: fairpriceInfo.subindustry,
          current_price: currentPrice,
          dividend_yield: dividend,
          fcf_median: operatingInfo.fcf_median,
          fcf_per_share: operatingInfo.fcf_per_share,
          growthrate: fairpriceInfo.growthrate,
          base_intrinsic_value: profitBasedPrice,
          optimistic_intrinsic_value: profitBasedPrice * 1.2, // 낙관적 시나리오 (20% 프리미엄)
          conservative_intrinsic_value: profitBasedPrice * 0.8, // 보수적 시나리오 (20% 할인)
          discount_rate: 10, // 기본 10%로 설정
          margin_of_safety: marginOfSafety * 100, // 백분율로 변환
          consecutive_dividend: operatingInfo.consecutive_dividend,
        });
      }
    }

    // 9. 산업군과 하위 산업군 목록 생성
    console.log('산업군 및 하위 산업군 목록 생성 중...');
    const uniqueIndustries = Array.from(
      new Set(profitStocks.map((stock) => stock.industry))
    ).sort();
    const uniqueSubIndustries = Array.from(
      new Set(profitStocks.map((stock) => stock.subindustry))
    ).sort();

    console.log(`최종 필터링 후 종목 수: ${profitStocks.length}`);

    return {
      stocks: profitStocks,
      industries: uniqueIndustries,
      subIndustries: uniqueSubIndustries,
      error: null,
    };
  } catch (err) {
    console.error('데이터 가져오기 오류:', err);
    return emptyResult<ProfitStock>(
      err instanceof Error ? err.message : '데이터를 가져오는 중 오류가 발생했습니다.'
    );
  }
}
