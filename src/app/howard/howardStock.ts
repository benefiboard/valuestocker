// src/app/howard/howardStock.ts
import { supabase } from '@/lib/supabaseClient';
import { HowardStock, StockDataResult } from '@/utils/stockDataTypes';
import {
  fetchAllDataWithPagination,
  fetchDataInBatches,
  getDebtRatioFilteredStocks,
} from '@/utils/stockDataUtils';
import { emptyResult, safeNumber, hasConsecutiveDividend } from '@/utils/stockDataCommon';

/**
 * 순자산가치 기반 가치주 데이터를 가져오는 함수
 * - 순자산가치(NCAV) > 시가총액인 종목 선별
 * - 안전마진은 (1 - 시가총액/순자산가치) * 100%로 계산
 */
export async function fetchHowardStocks(): Promise<StockDataResult<HowardStock>> {
  try {
    console.log('=== 순자산가치 기반 가치주 데이터 가져오기 시작 ===');

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

    // 부채비율 데이터가 있는 종목 수 확인
    const { count: debtRatioCount, error: debtRatioCountError } = await supabase
      .from('stock_naver_data')
      .select('*', { count: 'exact', head: true })
      .not('2024_debt_ratio', 'is', null);

    if (debtRatioCountError) {
      console.error('부채비율 데이터 있는 종목 수 확인 오류:', debtRatioCountError);
    } else {
      console.log(`부채비율 데이터가 있는 종목 수: ${debtRatioCount}`);
    }

    // 데이터 패치 확인동작 끝!!!!

    // 1. 부채비율 조건을 충족하는 종목 데이터 가져오기 (캐시 사용)
    const acceptableDebtStocks = await getDebtRatioFilteredStocks();

    if (!acceptableDebtStocks || acceptableDebtStocks.length === 0) {
      return emptyResult<HowardStock>('부채비율 조건을 충족하는 종목이 없습니다.');
    }

    const filteredStockCodes = acceptableDebtStocks.map((item) => item.stock_code);
    console.log(`부채비율 조건 충족 종목 수: ${filteredStockCodes.length}`);

    // 2. 주가 및 발행주식수 데이터 가져오기
    const stockDataInfo = await fetchDataInBatches<any>(
      'stock_naver_data',
      `stock_code, company_name, industry, subindustry, 
      shares_outstanding, 2024_shares_outstanding,
      2020_dividend, 2021_dividend, 2022_dividend, 2023_dividend, 2024_dividend,
      2020_operating_income, 2021_operating_income, 2022_operating_income, 2023_operating_income, 2024_operating_income,
      market_cap`,
      filteredStockCodes
    );

    if (!stockDataInfo || stockDataInfo.length === 0) {
      return emptyResult<HowardStock>('주식 데이터를 찾을 수 없습니다.');
    }

    // 3. stock_raw_data에서 순자산가치 계산을 위한 데이터 가져오기
    const rawData = await fetchDataInBatches<any>(
      'stock_raw_data',
      'stock_code, 2024_current_assets, 2024_current_liabilities',
      filteredStockCodes
    );

    if (!rawData || rawData.length === 0) {
      return emptyResult<HowardStock>('자산/부채 데이터를 찾을 수 없습니다.');
    }

    // 4. 현재가 데이터 가져오기
    const priceData = await fetchDataInBatches<any>(
      'stock_price',
      'stock_code, current_price',
      filteredStockCodes
    );

    if (!priceData || priceData.length === 0) {
      return emptyResult<HowardStock>('현재가 데이터를 찾을 수 없습니다.');
    }

    // 5. 배당 데이터 가져오기
    const dividendData = await fetchDataInBatches<any>(
      'stock_current',
      'stock_code, current_dividend',
      filteredStockCodes
    );

    // 6. 성장률 데이터 가져오기
    const growthData = await fetchDataInBatches<any>(
      'stock_naver_fairprice',
      'stock_code, growthrate',
      filteredStockCodes
    );

    // 7. 데이터 맵 생성
    console.log('데이터 맵 생성 중...');

    // 주식 정보 맵 (회사명, 산업, 발행주식수 등)
    const stockInfoMap = new Map();

    stockDataInfo.forEach((item) => {
      // 발행주식수 계산
      let sharesOutstanding = 0;
      // 2024년 발행주식수를 우선 사용
      if (item['2024_shares_outstanding']) {
        if (typeof item['2024_shares_outstanding'] === 'string') {
          sharesOutstanding = Number(item['2024_shares_outstanding'].replace(/,/g, ''));
        } else {
          sharesOutstanding = Number(item['2024_shares_outstanding']);
        }
      }
      // 없을 경우 기존 shares_outstanding 필드 사용
      else if (item['shares_outstanding']) {
        if (typeof item['shares_outstanding'] === 'string') {
          sharesOutstanding = Number(item['shares_outstanding'].replace(/,/g, ''));
        } else {
          sharesOutstanding = Number(item['shares_outstanding']);
        }
      }

      stockInfoMap.set(item.stock_code, {
        company_name: item.company_name || '',
        industry: item.industry || '미분류',
        subindustry: item.subindustry || '미분류',
        shares_outstanding: sharesOutstanding,
        market_cap: safeNumber(item.market_cap),
        consecutive_dividend: hasConsecutiveDividend(item),
        negative_income_count: [
          safeNumber(item['2020_operating_income']) < 0,
          safeNumber(item['2021_operating_income']) < 0,
          safeNumber(item['2022_operating_income']) < 0,
          safeNumber(item['2023_operating_income']) < 0,
          safeNumber(item['2024_operating_income']) < 0,
        ].filter(Boolean).length,
      });
    });

    // 순자산가치 맵
    const netAssetMap = new Map();

    rawData.forEach((item) => {
      const currentAssets = safeNumber(item['2024_current_assets']);
      const currentLiabilities = safeNumber(item['2024_current_liabilities']);
      const netCurrentAssetValue = currentAssets - currentLiabilities;

      netAssetMap.set(item.stock_code, {
        current_assets: currentAssets,
        current_liabilities: currentLiabilities,
        net_current_asset_value: netCurrentAssetValue,
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

    // 성장률 맵
    const growthRateMap = new Map(
      growthData.map((item) => [item.stock_code, safeNumber(item.growthrate)])
    );

    // 8. 순자산가치 기반 하워드 마크스 종목 필터링 및 계산
    console.log('순자산가치 기반 종목 필터링 및 계산 중...');
    const howardStocks: HowardStock[] = [];

    for (const stockCode of filteredStockCodes) {
      const stockInfo = stockInfoMap.get(stockCode);
      const netAssetInfo = netAssetMap.get(stockCode);
      const currentPrice = priceMap.get(stockCode);
      const dividendYield = dividendMap.get(stockCode) || 0;
      const growthRate = growthRateMap.get(stockCode) || 0;

      // 필요한 모든 데이터가 있는지 확인
      if (!stockInfo || !netAssetInfo || !currentPrice || stockInfo.shares_outstanding <= 0) {
        continue;
      }

      // 5년 중 3년 이상 영업이익이 음수인 기업 제외
      if (stockInfo.negative_income_count >= 3) {
        continue;
      }

      // 순자산가치 계산
      const netCurrentAssetValue = netAssetInfo.net_current_asset_value;

      // 순자산가치가 0 이하인 경우 제외
      if (netCurrentAssetValue <= 0) {
        continue;
      }

      // 시가총액 계산 (현재가 × 발행주식수)
      const marketCap = currentPrice * stockInfo.shares_outstanding;

      // 내재가치 대비 시가총액 비율 계산 (낮을수록 저평가)
      const marketCapToIntrinsicRatio = marketCap / netCurrentAssetValue;

      // 안전마진 계산 (1 - 시가총액/내재가치) * 100%
      const marginOfSafety = (1 - marketCap / netCurrentAssetValue) * 100;

      // 내재가치 기준 주당 가치 계산
      const intrinsicValuePerShare = netCurrentAssetValue / stockInfo.shares_outstanding;

      // 조건 확인: 내재가치 > 시가총액 (즉, 안전마진이 양수)
      if (netCurrentAssetValue > marketCap) {
        howardStocks.push({
          stock_code: stockCode,
          company_name: stockInfo.company_name,
          industry: stockInfo.industry,
          subindustry: stockInfo.subindustry,
          current_price: currentPrice,
          dividend_yield: dividendYield,
          fcf_median: 0, // 사용하지 않음
          fcf_per_share: 0, // 사용하지 않음
          base_intrinsic_value: intrinsicValuePerShare,
          optimistic_intrinsic_value: intrinsicValuePerShare * 1.2, // 낙관적 시나리오 (20% 추가)
          conservative_intrinsic_value: intrinsicValuePerShare * 0.8, // 보수적 시나리오 (20% 할인)
          discount_rate: 10, // 기본 10%로 설정
          margin_of_safety: marginOfSafety,
          consecutive_dividend: stockInfo.consecutive_dividend,
          growthrate: growthRate,
          net_current_asset_value: netCurrentAssetValue,
          market_cap: marketCap,
          market_cap_to_intrinsic_ratio: marketCapToIntrinsicRatio,
        });
      }
    }

    // 9. 산업군과 하위 산업군 목록 생성
    console.log('산업군 및 하위 산업군 목록 생성 중...');
    const uniqueIndustries = Array.from(
      new Set(howardStocks.map((stock) => stock.industry))
    ).sort();

    const uniqueSubIndustries = Array.from(
      new Set(howardStocks.map((stock) => stock.subindustry))
    ).sort();

    console.log(`최종 필터링 후 종목 수: ${howardStocks.length}`);

    return {
      stocks: howardStocks,
      industries: uniqueIndustries,
      subIndustries: uniqueSubIndustries,
      error: null,
    };
  } catch (err) {
    console.error('데이터 가져오기 오류:', err);
    return emptyResult<HowardStock>(
      err instanceof Error ? err.message : '데이터를 가져오는 중 오류가 발생했습니다.'
    );
  }
}
