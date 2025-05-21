// src/app/lynch/lynchStock.ts
import { supabase } from '@/lib/supabaseClient';
import { LynchStock, StockDataResult } from '@/utils/stockDataTypes';
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
 * 피터 린치 PEG 기반 주식 데이터를 가져오는 함수
 * - PEG(PER/성장률) 0~1 사이 종목
 * - 부채비율 조건 충족
 * - 3년 이상 영업이익 흑자
 */
export async function fetchLynchStocks(): Promise<StockDataResult<LynchStock>> {
  try {
    console.log('=== 피터 린치 PEG 기반 주식 데이터 가져오기 시작 ===');

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

    // PEG 데이터가 있는 종목 수 확인
    const { count: pegCount, error: pegCountError } = await supabase
      .from('stock_current')
      .select('*', { count: 'exact', head: true })
      .not('peg', 'is', null);

    if (pegCountError) {
      console.error('PEG 데이터 있는 종목 수 확인 오류:', pegCountError);
    } else {
      console.log(`PEG 데이터가 있는 종목 수: ${pegCount}`);
    }

    // 데이터 패치 확인동작 끝!!!!

    // 1. 부채비율 조건을 충족하는 종목 데이터 가져오기 (캐시 사용)
    const acceptableDebtStocks = await getDebtRatioFilteredStocks();

    if (!acceptableDebtStocks || acceptableDebtStocks.length === 0) {
      return emptyResult<LynchStock>('부채비율 조건을 충족하는 종목이 없습니다.');
    }

    const filteredStockCodes = acceptableDebtStocks.map((item) => item.stock_code);
    console.log(`부채비율 조건 충족 종목 수: ${filteredStockCodes.length}`);

    // 2. PEG 데이터 조회
    const pegData = await fetchDataInBatches<any>(
      'stock_current',
      'stock_code, peg, current_per, current_dividend',
      filteredStockCodes
    );

    if (!pegData || pegData.length === 0) {
      return emptyResult<LynchStock>('PEG 데이터를 찾을 수 없습니다.');
    }

    // 3. PEG 0~1 필터링
    const pegFilteredData = pegData.filter((item) => {
      const peg = safeNumber(item.peg);
      return peg > 0 && peg <= 1;
    });

    const pegFilteredCodes = pegFilteredData.map((item) => item.stock_code);

    console.log(`0 < PEG ≤ 1인 종목 수: ${pegFilteredCodes.length}`);

    if (pegFilteredCodes.length === 0) {
      return emptyResult<LynchStock>('PEG 조건을 충족하는 종목이 없습니다.');
    }

    // 4. 기업정보 및 성장률 데이터 가져오기
    const stockInfoData = await fetchDataInBatches<any>(
      'stock_naver_fairprice',
      'stock_code, company_name, industry, subindustry, growthrate',
      pegFilteredCodes
    );

    if (!stockInfoData || stockInfoData.length === 0) {
      return emptyResult<LynchStock>('기업 정보를 찾을 수 없습니다.');
    }

    // 5. 현재가 데이터 가져오기
    const priceData = await fetchDataInBatches<any>(
      'stock_price',
      'stock_code, current_price',
      pegFilteredCodes
    );

    if (!priceData || priceData.length === 0) {
      return emptyResult<LynchStock>('현재가 데이터를 찾을 수 없습니다.');
    }

    // 6. EPS 및 배당 데이터 가져오기
    const epsData = await fetchDataInBatches<any>(
      'stock_naver_data',
      `stock_code, 
      2020_eps, 2021_eps, 2022_eps, 2023_eps, 2024_eps,
      2020_dividend, 2021_dividend, 2022_dividend, 2023_dividend, 2024_dividend,
      2020_operating_income, 2021_operating_income, 2022_operating_income, 2023_operating_income, 2024_operating_income`,
      pegFilteredCodes
    );

    if (!epsData || epsData.length === 0) {
      return emptyResult<LynchStock>('EPS 데이터를 찾을 수 없습니다.');
    }

    // 7. 데이터 맵 생성
    console.log('데이터 맵 생성 중...');

    // PEG, PER, 배당률 맵
    const pegMap = new Map();

    pegFilteredData.forEach((item) => {
      pegMap.set(item.stock_code, {
        peg: safeNumber(item.peg),
        per: safeNumber(item.current_per),
        dividend: safeNumber(item.current_dividend),
      });
    });

    // 기업 정보 및 성장률 맵
    const infoMap = new Map();

    stockInfoData.forEach((item) => {
      infoMap.set(item.stock_code, {
        company_name: item.company_name || '',
        industry: item.industry || '미분류',
        subindustry: item.subindustry || '미분류',
        growthrate: safeNumber(item.growthrate),
      });
    });

    // 현재가 맵
    const priceMap = new Map(
      priceData.map((item) => [item.stock_code, safeNumber(item.current_price)])
    );

    // EPS 및 영업이익 맵
    const epsMap = new Map();

    epsData.forEach((item) => {
      // EPS 평균 계산
      const epsValues = [
        safeNumber(item['2020_eps']),
        safeNumber(item['2021_eps']),
        safeNumber(item['2022_eps']),
        safeNumber(item['2023_eps']),
        safeNumber(item['2024_eps']),
      ].filter((eps) => eps !== 0);

      const averageEps =
        epsValues.length > 0 ? epsValues.reduce((sum, eps) => sum + eps, 0) / epsValues.length : 0;

      // 연속 배당 여부
      const consecutiveDividend = hasConsecutiveDividend(item);

      // 영업이익 손실 개수
      const negativeIncomeCount = countNegativeOperatingIncomes(item);

      epsMap.set(item.stock_code, {
        average_eps: averageEps,
        consecutive_dividend: consecutiveDividend,
        negative_income_count: negativeIncomeCount,
      });
    });

    // 8. 최종 데이터 구성
    console.log('최종 데이터 구성 중...');
    const lynchStocks: LynchStock[] = [];

    for (const stockCode of pegFilteredCodes) {
      const pegInfo = pegMap.get(stockCode);
      const info = infoMap.get(stockCode);
      const currentPrice = priceMap.get(stockCode);
      const epsInfo = epsMap.get(stockCode);

      // 필요한 모든 데이터가 있는지 확인
      if (!pegInfo || !info || !currentPrice || !epsInfo) {
        continue;
      }

      // 5년 중 3년 이상 영업이익이 음수인 기업 제외
      if (epsInfo.negative_income_count >= 3) {
        continue;
      }

      // 안전마진 계산 (1 - PEG) * 100
      const marginOfSafety = (1 - pegInfo.peg) * 100;

      lynchStocks.push({
        stock_code: stockCode,
        company_name: info.company_name,
        industry: info.industry,
        subindustry: info.subindustry,
        current_price: currentPrice,
        current_per: pegInfo.per,
        peg: pegInfo.peg,
        growth_rate: info.growthrate,
        average_eps: epsInfo.average_eps,
        margin_of_safety: marginOfSafety,
        dividend_yield: pegInfo.dividend,
        consecutive_dividend: epsInfo.consecutive_dividend,
      });
    }

    // 9. 산업군과 하위 산업군 목록 생성
    console.log('산업군 및 하위 산업군 목록 생성 중...');
    const uniqueIndustries = Array.from(new Set(lynchStocks.map((stock) => stock.industry))).sort();
    const uniqueSubIndustries = Array.from(
      new Set(lynchStocks.map((stock) => stock.subindustry))
    ).sort();

    console.log(`최종 필터링 후 종목 수: ${lynchStocks.length}`);

    return {
      stocks: lynchStocks,
      industries: uniqueIndustries,
      subIndustries: uniqueSubIndustries,
      error: null,
    };
  } catch (err) {
    console.error('데이터 가져오기 오류:', err);
    return emptyResult<LynchStock>(
      err instanceof Error ? err.message : '데이터를 가져오는 중 오류가 발생했습니다.'
    );
  }
}
