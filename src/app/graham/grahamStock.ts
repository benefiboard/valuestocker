// src/app/graham/grahamStock.ts
import { supabase } from '@/lib/supabaseClient';
import { GrahamStock, StockDataResult } from '@/utils/stockDataTypes';
import { fetchAllDataWithPagination, fetchDataInBatches } from '@/utils/stockDataUtils';
import {
  emptyResult,
  safeNumber,
  hasConsecutiveDividend,
  isDebtRatioAcceptable,
} from '@/utils/stockDataCommon';

/**
 * 그레이엄 가치주 데이터를 가져오는 함수
 * - PER 0-15
 * - 부채비율 산업별 차등 적용
 * - 현재가 < 수정 그레이엄 가격
 * - 안전마진 > 0
 */
export async function fetchGrahamStocks(): Promise<StockDataResult<GrahamStock>> {
  try {
    console.log('=== 그레이엄 가치주 데이터 가져오기 시작 ===');

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

    // PER 조건에 맞는 종목 수 확인
    const { count: perCount, error: perCountError } = await supabase
      .from('stock_current')
      .select('*', { count: 'exact', head: true })
      .gt('current_per', 0)
      .lte('current_per', 15)
      .not('current_per', 'is', null);

    if (perCountError) {
      console.error('PER 조건에 맞는 종목 수 확인 오류:', perCountError);
    } else {
      console.log(`PER 조건에 맞는 종목 수: ${perCount}`);
    }

    // 데이터 패치 확인동작 끝!!!!

    // 1. PER 조건에 맞는 종목 가져오기
    const perData = await fetchAllDataWithPagination<any>(
      'stock_current',
      'stock_code, current_per, current_dividend, current_pbr',
      'stock_code',
      (query) => query.gt('current_per', 0).lte('current_per', 15).not('current_per', 'is', null)
    );

    if (!perData || perData.length === 0) {
      console.log('PER 조건에 맞는 주식이 없습니다.');
      return emptyResult<GrahamStock>('PER 조건에 맞는 주식을 찾을 수 없습니다.');
    }

    const perStockCodes = perData.map((item) => item.stock_code);
    console.log(`PER 조건 통과 종목 수: ${perStockCodes.length}`);

    // 2. 재무 데이터 및 부채비율 정보 한 번에 가져오기
    const stockDataInfo = await fetchDataInBatches<any>(
      'stock_naver_data',
      `stock_code, company_name, industry, subindustry, 2024_debt_ratio,
      2020_eps, 2021_eps, 2022_eps, 2023_eps, 2024_eps,
      2024_equity, 2024_bps,
      shares_outstanding,
      2020_dividend, 2021_dividend, 2022_dividend, 2023_dividend, 2024_dividend,
      2024_assets, 2024_liabilities,
      market_cap,
      2024_revenue,
      2020_net_income, 2021_net_income, 2022_net_income, 2023_net_income, 2024_net_income,
      2024_pbr, 2024_debt_ratio`,
      perStockCodes
    );

    if (!stockDataInfo || stockDataInfo.length === 0) {
      console.log('재무 데이터가 없습니다.');
      return emptyResult<GrahamStock>('재무 데이터를 찾을 수 없습니다.');
    }

    // 3. stock_raw_data 테이블에서 현재자산, 현재부채 데이터 가져오기 (추가됨)
    const rawDataInfo = await fetchDataInBatches<any>(
      'stock_raw_data',
      `stock_code, 2024_current_assets, 2024_current_liabilities`,
      perStockCodes
    );

    if (!rawDataInfo || rawDataInfo.length === 0) {
      console.log('유동자산/부채 데이터가 없습니다.');
      return emptyResult<GrahamStock>('유동자산/부채 데이터를 찾을 수 없습니다.');
    }

    // 4. 성장률 정보 가져오기
    const fairpriceData = await fetchDataInBatches<any>(
      'stock_naver_fairprice',
      'stock_code, growthrate',
      perStockCodes
    );

    if (!fairpriceData || fairpriceData.length === 0) {
      console.log('성장률 데이터가 없습니다.');
      return emptyResult<GrahamStock>('성장률 데이터를 찾을 수 없습니다.');
    }

    // 5. 현재가 데이터 가져오기
    const priceData = await fetchDataInBatches<any>(
      'stock_price',
      'stock_code, current_price',
      perStockCodes
    );

    if (!priceData || priceData.length === 0) {
      console.log('현재가 데이터가 없습니다.');
      return emptyResult<GrahamStock>('현재가 데이터를 찾을 수 없습니다.');
    }

    // 6. 데이터 맵 생성
    console.log('데이터 맵 생성 중...');

    // PER, 배당률, PBR 맵
    const perMap = new Map(
      perData.map((item) => [
        item.stock_code,
        {
          per: safeNumber(item.current_per),
          dividend: safeNumber(item.current_dividend),
          pbr: safeNumber(item.current_pbr),
        },
      ])
    );

    // 현재가 맵
    const priceMap = new Map(
      priceData.map((item) => [item.stock_code, safeNumber(item.current_price)])
    );

    // 성장률 맵
    const growthRateMap = new Map(
      fairpriceData.map((item) => [item.stock_code, safeNumber(item.growthrate)])
    );

    // 유동자산/부채 맵 (추가됨)
    const rawDataMap = new Map(
      rawDataInfo.map((item) => [
        item.stock_code,
        {
          current_assets: safeNumber(item['2024_current_assets']),
          current_liabilities: safeNumber(item['2024_current_liabilities']),
        },
      ])
    );

    // 7. 그레이엄 가치주 필터링 및 계산
    console.log('그레이엄 가치주 필터링 및 계산 중...');
    const grahamStocks: GrahamStock[] = [];

    for (const stockData of stockDataInfo) {
      const stockCode = stockData.stock_code;
      const perInfo = perMap.get(stockCode);
      const currentPrice = priceMap.get(stockCode);
      const growthRate = growthRateMap.get(stockCode) || 0;
      const rawData = rawDataMap.get(stockCode); // 유동자산/부채 데이터 추가

      // 필요한 모든 데이터가 있는지 확인
      if (!perInfo || !currentPrice || !rawData) {
        continue;
      }

      // 부채비율 조건 확인
      const debtRatio = safeNumber(stockData['2024_debt_ratio']);
      const subindustry = stockData.subindustry || '미분류';

      if (!isDebtRatioAcceptable(subindustry, debtRatio)) {
        continue;
      }

      // EPS 데이터 추출 및 평균 계산 (5년 데이터 활용)
      const epsValues = [
        safeNumber(stockData['2020_eps']),
        safeNumber(stockData['2021_eps']),
        safeNumber(stockData['2022_eps']),
        safeNumber(stockData['2023_eps']),
        safeNumber(stockData['2024_eps']),
      ].filter((eps) => eps > 0);

      const avgEps =
        epsValues.length > 0 ? epsValues.reduce((sum, eps) => sum + eps, 0) / epsValues.length : 0;

      // 주식수 계산
      let sharesOutstanding = 0;
      if (stockData['shares_outstanding']) {
        if (typeof stockData['shares_outstanding'] === 'string') {
          sharesOutstanding = Number(stockData['shares_outstanding'].replace(/,/g, ''));
        } else {
          sharesOutstanding = Number(stockData['shares_outstanding']);
        }
      }

      if (isNaN(sharesOutstanding) || sharesOutstanding <= 0) {
        continue;
      }

      // BPS 사용 (직접 필드 사용)
      const bps = safeNumber(stockData['2024_bps']);

      // 기존 그레이엄 가격 계산
      const grahamPrice = ((avgEps * 8 + bps) / 2) * 0.67;

      // NCAV 계산 - stock_raw_data에서 가져온 데이터 사용
      const currentAssets = rawData.current_assets;
      const currentLiabilities = rawData.current_liabilities;

      // 회사 전체 NCAV 계산
      const totalNCAV = currentAssets - currentLiabilities;

      // 주당 NCAV 계산
      const ncavPerShare = totalNCAV / sharesOutstanding;
      const nonNegativeNcav = ncavPerShare > 0 ? ncavPerShare : 0;
      const ncavPrice = nonNegativeNcav * (2 / 3);

      // 수정 그레이엄 가격 계산
      const modifiedGrahamPrice = ((avgEps * 8 + nonNegativeNcav) / 2) * 0.67;

      // 추가 지표 계산
      const marketCap = safeNumber(stockData['market_cap']);
      const revenue = safeNumber(stockData['2024_revenue']);
      const currentPbr = safeNumber(stockData['2024_pbr']) || perInfo.pbr;

      // 수익성 확인 (5년간 적자 없음)
      const netIncomeValues = [
        safeNumber(stockData['2020_net_income']),
        safeNumber(stockData['2021_net_income']),
        safeNumber(stockData['2022_net_income']),
        safeNumber(stockData['2023_net_income']),
        safeNumber(stockData['2024_net_income']),
      ];

      // 최소 4년 이상 수익이 있는지 확인 (5년 중 4년 이상)
      const positiveIncomeCount = netIncomeValues.filter((income) => income > 0).length;
      const hasProfitForMostYears = positiveIncomeCount >= 4;

      // 배당 확인 (5년 중 4회 이상 배당)
      const dividendValues = [
        safeNumber(stockData['2020_dividend']) > 0,
        safeNumber(stockData['2021_dividend']) > 0,
        safeNumber(stockData['2022_dividend']) > 0,
        safeNumber(stockData['2023_dividend']) > 0,
        safeNumber(stockData['2024_dividend']) > 0,
      ];
      const dividendYearsCount = dividendValues.filter(Boolean).length;
      const hasDividendForMostYears = dividendYearsCount >= 4;

      // 7가지 기준 체크
      const meetsSizeCriteria = marketCap >= 50000000000 && revenue >= 50000000000; // 500억 이상
      const meetsDebtCriteria = isDebtRatioAcceptable(subindustry, debtRatio);
      const meetsDividendCriteria = hasDividendForMostYears;
      const meetsProfitCriteria = hasProfitForMostYears;
      const meetsGrowthCriteria = growthRate >= 10; // 10% 이상
      const meetsPbrCriteria =
        subindustry === '은행' || subindustry === '손해보험' || subindustry === '생명보험'
          ? currentPbr <= 1.0 && currentPbr > 0
          : currentPbr <= 1.5 && currentPbr > 0;
      const meetsPerCriteria = perInfo.per <= 15 && perInfo.per > 0;

      // 충족한 기준 개수 계산
      const criteriaMetCount = [
        meetsSizeCriteria,
        meetsDebtCriteria,
        meetsDividendCriteria,
        meetsProfitCriteria,
        meetsGrowthCriteria,
        meetsPbrCriteria,
        meetsPerCriteria,
      ].filter(Boolean).length;

      // 저평가율 계산 (수정 그레이엄 가격 기준)
      const marginOfSafety =
        modifiedGrahamPrice > 0
          ? ((modifiedGrahamPrice - currentPrice) / modifiedGrahamPrice) * 100
          : 0;

      // 모든 기준 중 최소 6개 이상 충족하고, 현재가 < 수정 그레이엄 가격인 종목만 포함
      if (criteriaMetCount >= 6 && currentPrice < modifiedGrahamPrice && marginOfSafety > 0) {
        grahamStocks.push({
          stock_code: stockCode,
          company_name: stockData.company_name || '',
          industry: stockData.industry || '미분류',
          subindustry: stockData.subindustry || '미분류',
          current_per: perInfo.per,
          debtratio: debtRatio,
          current_price: currentPrice,
          dividend_yield: perInfo.dividend,
          graham_price: grahamPrice,
          consecutive_dividend: hasDividendForMostYears,
          dividend_years_count: dividendYearsCount,
          bps: bps,
          avg_eps: avgEps,
          ncav: ncavPerShare,
          ncav_price: ncavPrice,
          modified_graham_price: modifiedGrahamPrice,
          market_cap: marketCap,
          revenue: revenue,
          eps_growth_rate: growthRate,
          current_pbr: currentPbr,
          meets_size_criteria: meetsSizeCriteria,
          meets_debt_criteria: meetsDebtCriteria,
          meets_dividend_criteria: meetsDividendCriteria,
          meets_profit_criteria: meetsProfitCriteria,
          meets_growth_criteria: meetsGrowthCriteria,
          meets_pbr_criteria: meetsPbrCriteria,
          meets_per_criteria: meetsPerCriteria,
          criteria_met_count: criteriaMetCount,
        });
      }
    }

    // 8. 산업군과 하위 산업군 목록 생성
    console.log('산업군 및 하위 산업군 목록 생성 중...');
    const uniqueIndustries = Array.from(
      new Set(grahamStocks.map((stock) => stock.industry))
    ).sort();
    const uniqueSubIndustries = Array.from(
      new Set(grahamStocks.map((stock) => stock.subindustry))
    ).sort();

    console.log(`최종 필터링 후 종목 수: ${grahamStocks.length}`);

    return {
      stocks: grahamStocks,
      industries: uniqueIndustries,
      subIndustries: uniqueSubIndustries,
      error: null,
    };
  } catch (err) {
    console.error('데이터 가져오기 오류:', err);
    return emptyResult<GrahamStock>(
      err instanceof Error ? err.message : '데이터를 가져오는 중 오류가 발생했습니다.'
    );
  }
}
