// src/utils/stockDataService.ts

import { supabase } from '@/lib/supabaseClient';
import { getAcceptableDebtStocks } from './stockDataCache';

// 타입 정의
export interface FlavorStock {
  stock_code: string;
  company_name: string;
  industry: string;
  subindustry: string;
  current_per: number;
  current_pbr: number;
  current_price: number;
  dividend_yield: number;
  assets: number;
  consecutive_dividend: boolean;
}

export interface GrahamStock {
  stock_code: string;
  company_name: string;
  industry: string;
  subindustry: string;
  current_per: number;
  debtratio: number;
  current_price: number;
  dividend_yield: number;
}

export interface EnhancedGrahamStock extends GrahamStock {
  graham_price: number; // 그레이엄 가격
  consecutive_dividend: boolean; // 연속 배당 여부
  bps: number; // 주당 순자산가치 (Book Per Share)
  avg_eps: number; // 3년 평균 EPS
  ncav: number; // 순유동자산가치 (Net Current Asset Value)
  ncav_price: number; // NCAV의 2/3 가격
  modified_graham_price: number; // 수정 그레이엄 가격
  market_cap: number; // 시가총액 추가
  revenue: number; // 매출액 추가
  eps_growth_rate: number; // EPS 성장률 추가
  current_pbr: number; // PBR 추가
  meets_size_criteria: boolean; // 규모 기준 충족 여부
  meets_debt_criteria: boolean; // 부채비율 기준 충족 여부
  meets_dividend_criteria: boolean; // 배당 기준 충족 여부
  meets_profit_criteria: boolean; // 수익성 기준 충족 여부
  meets_growth_criteria: boolean; // 성장성 기준 충족 여부
  meets_pbr_criteria: boolean; // PBR 기준 충족 여부
  meets_per_criteria: boolean; // PER 기준 충족 여부
  criteria_met_count: number; // 충족한 기준 개수
  dividend_years_count?: number;
}

export interface QualityStock {
  stock_code: string;
  company_name: string;
  industry: string;
  subindustry: string;
  current_per: number;
  current_price: number;
  dividend_yield: number;
  avg_roe: number; // 5년 평균 ROE
  avg_operating_margin: number; // 5년 평균 영업이익률
  consecutive_dividend: boolean;
}

export interface HowardStock {
  stock_code: string;
  company_name: string;
  industry: string;
  subindustry: string;
  current_price: number;
  dividend_yield: number;
  fcf_median: number; // 중앙값 FCF
  fcf_per_share: number; // 주당 FCF
  base_intrinsic_value: number; // 기본 시나리오 내재가치
  optimistic_intrinsic_value: number; // 낙관 시나리오 내재가치
  conservative_intrinsic_value: number; // 보수 시나리오 내재가치
  discount_rate: number; // 할인율 (%)
  margin_of_safety: number; // 안전마진 (%)
  consecutive_dividend: boolean; // 5년 연속 배당 여부
  growthrate: number; // 성장률
  net_current_asset_value: number; // 순자산가치
  market_cap: number; // 시가총액
  market_cap_to_intrinsic_ratio: number; // 시가총액/내재가치 비율
}

export interface ProfitStock {
  stock_code: string;
  company_name: string;
  industry: string;
  subindustry: string;
  current_price: number;
  dividend_yield: number;
  fcf_median: number; // 중앙값 FCF
  fcf_per_share: number; // 주당 FCF
  base_intrinsic_value: number; // 기본 시나리오 내재가치
  optimistic_intrinsic_value: number; // 낙관 시나리오 내재가치
  conservative_intrinsic_value: number; // 보수 시나리오 내재가치
  discount_rate: number; // 할인율 (%)
  margin_of_safety: number; // 안전마진 (%)
  consecutive_dividend: boolean; // 5년 연속 배당 여부
  growthrate: number; // 성장률
}

export interface LynchStock {
  stock_code: string;
  company_name: string;
  industry: string;
  subindustry: string;
  current_price: number;
  current_per: number; // 현재 PER
  peg: number; // PEG 값 (peg_price 대신)
  growth_rate: number; // 성장률
  average_eps: number; // 평균 EPS
  margin_of_safety: number; // 안전마진 (1 - PEG) * 100
  dividend_yield: number; // 배당률
  consecutive_dividend: boolean; // 5년 연속 배당 여부
}

export interface SrimStock {
  stock_code: string;
  company_name: string;
  industry: string;
  subindustry: string;
  current_price: number;
  current_per: number;
  srim_base: number; // S-RIM 기본 시나리오
  srim_decline_10pct: number; // ROE 10% 감소 시나리오
  srim_decline_20pct: number; // ROE 20% 감소 시나리오
  margin_of_safety: number; // 안전마진
  dividend_yield: number; // 배당률
  consecutive_dividend: boolean; // 5년 연속 배당 여부
  weightedroe: number; // 최신 ROE
}

export interface StockDataResult<T> {
  stocks: T[];
  industries: string[];
  subIndustries: string[];
  error: string | null;
}

// 빈 결과 객체 생성 함수 (타입 안전하게)
const emptyResult = <T>(error: string): StockDataResult<T> => ({
  stocks: [],
  industries: [],
  subIndustries: [],
  error,
});

// 안전한 숫자 변환 함수 (NaN 방지)
const safeNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// 산업별 성장률 정보를 위한 인터페이스
interface IndustryData {
  industry: string;
  minGrowthRate: number;
  maxGrowthRate: number;
  minPerpetualGrowthRate: number;
  maxPerpetualGrowthRate: number;
  subIndustries: string[];
}

// 기본 페이지네이션 유틸리티 함수
export async function fetchAllDataWithPagination<T>(
  tableName: string,
  selectQuery: string = '*',
  orderBy: string = 'stock_code',
  additionalFilters?: (query: any) => any
): Promise<T[]> {
  const PAGE_SIZE = 1000;
  let allData: T[] = [];
  let page = 0;
  let hasMoreData = true;

  console.log(`Fetching all data from ${tableName} with pagination...`);

  while (hasMoreData) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    console.log(`Fetching page ${page + 1}: records ${from} to ${to}`);

    let query = supabase
      .from(tableName)
      .select(selectQuery)
      .range(from, to)
      .order(orderBy, { ascending: true });

    // 추가 필터 적용
    if (additionalFilters) {
      query = additionalFilters(query);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Error fetching data from ${tableName}:`, error);
      break;
    }

    if (data && data.length > 0) {
      // 타입 단언(Type Assertion)을 사용하여 TypeScript 에러 해결
      allData = [...allData, ...(data as T[])];
      console.log(`Retrieved ${data.length} records. Total so far: ${allData.length}`);
      page++;

      if (data.length < PAGE_SIZE) {
        hasMoreData = false;
        console.log(`Last page reached with ${data.length} records`);
      }
    } else {
      hasMoreData = false;
      console.log('No more data available');
    }
  }

  console.log(`Completed fetching data from ${tableName}. Total records: ${allData.length}`);
  return allData;
}

// 배치 처리 유틸리티 함수
async function fetchDataInBatches<T>(
  tableName: string,
  selectQuery: string,
  stockCodes: string[]
): Promise<T[]> {
  const BATCH_SIZE = 1000;
  let allData: T[] = [];

  // stockCodes를 BATCH_SIZE 크기의 배치로 분할
  const batches = [];
  for (let i = 0; i < stockCodes.length; i += BATCH_SIZE) {
    batches.push(stockCodes.slice(i, i + BATCH_SIZE));
  }

  console.log(
    `Processing ${stockCodes.length} codes in ${batches.length} batches from ${tableName}`
  );

  // 각 배치별로 데이터 요청
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`Processing batch ${i + 1}/${batches.length} with ${batch.length} codes`);

    const { data, error } = await supabase
      .from(tableName)
      .select(selectQuery)
      .in('stock_code', batch);

    if (error) {
      console.error(`Error fetching batch ${i + 1} from ${tableName}:`, error);
      throw new Error(error.message);
    }

    if (data) {
      // 타입 단언(Type Assertion)을 사용하여 TypeScript 에러 해결
      allData = [...allData, ...(data as T[])];
      console.log(`Added ${data.length} records from batch ${i + 1}. Total: ${allData.length}`);
    }
  }

  return allData;
}

// 산업군별 부채비율 체크 유틸리티 함수
export function isDebtRatioAcceptable(subindustry: string, debtRatio: number): boolean {
  // 데이터가 없는 경우 제외
  if (
    subindustry === undefined ||
    subindustry === null ||
    debtRatio === undefined ||
    debtRatio === null
  ) {
    return false;
  }

  // 산업군별 부채비율 기준 적용
  if (subindustry === '은행') {
    return debtRatio < 1500;
  } else if (subindustry === '손해보험' || subindustry === '생명보험') {
    return debtRatio < 1000;
  } else {
    return debtRatio < 150;
  }
}

// 5년 연속 배당 확인 함수
function hasConsecutiveDividend(dividendData: any): boolean {
  return (
    safeNumber(dividendData['2020_dividend']) > 0 &&
    safeNumber(dividendData['2021_dividend']) > 0 &&
    safeNumber(dividendData['2022_dividend']) > 0 &&
    safeNumber(dividendData['2023_dividend']) > 0 &&
    safeNumber(dividendData['2024_dividend']) > 0
  );
}

// 영업이익 손실 개수 확인 함수
function countNegativeOperatingIncomes(data: any): number {
  let count = 0;
  if (safeNumber(data['2020_operating_income']) < 0) count++;
  if (safeNumber(data['2021_operating_income']) < 0) count++;
  if (safeNumber(data['2022_operating_income']) < 0) count++;
  if (safeNumber(data['2023_operating_income']) < 0) count++;
  if (safeNumber(data['2024_operating_income']) < 0) count++;
  return count;
}

// fetchLynchStocks 함수 - PEG 기반으로 수정된 버전 (테이블명 및 5년 데이터 활용)
// fetchLynchStocks 함수 - PEG 기반으로 수정된 버전 (테이블명 및 5년 데이터 활용)
export async function fetchLynchStocks(): Promise<StockDataResult<LynchStock>> {
  try {
    console.log('=== 피터 린치 PEG 기반 주식 데이터 가져오기 시작 ===');

    // 부채비율 조건을 충족하는 종목 데이터 가져오기 (캐시된 JSON 사용)
    const acceptableDebtStocks = await getAcceptableDebtStocks();

    if (!acceptableDebtStocks || acceptableDebtStocks.length === 0) {
      return emptyResult<LynchStock>('부채비율 조건을 충족하는 종목이 없습니다.');
    }

    const validStockCodes = acceptableDebtStocks.map((item) => item.stock_code);
    console.log(`부채비율 조건을 충족하는 종목 수: ${validStockCodes.length}`);

    // 2. stock_current 테이블에서 PEG 값과 필요한 데이터 조회
    const currentData = await fetchDataInBatches<any>(
      'stock_current',
      'stock_code, peg, current_per, current_dividend',
      validStockCodes
    );

    if (!currentData || currentData.length === 0) {
      return emptyResult<LynchStock>('현재 주식 데이터를 찾을 수 없습니다.');
    }

    // PEG가 0초과 1이하인 종목만 필터링
    const pegStockData = currentData.filter((item) => {
      const peg = safeNumber(item.peg);
      return peg > 0 && peg <= 1;
    });
    const pegStockCodes = pegStockData.map((item) => item.stock_code);
    console.log(`0 < PEG ≤ 1인 종목 수: ${pegStockCodes.length}`);

    // 3. 필요한 추가 데이터 가져오기
    const stockInfo = await fetchDataInBatches<any>(
      'stock_naver_fairprice',
      'stock_code, company_name, industry, subindustry, growthrate', // averageeps 제거
      pegStockCodes
    );

    const priceData = await fetchDataInBatches<any>(
      'stock_price',
      'stock_code, current_price',
      pegStockCodes
    );

    const rawData = await fetchDataInBatches<any>(
      'stock_naver_data',
      `stock_code, 
      2020_dividend, 2021_dividend, 2022_dividend, 2023_dividend, 2024_dividend,
      2020_operating_income, 2021_operating_income, 2022_operating_income, 2023_operating_income, 2024_operating_income,
      2020_eps, 2021_eps, 2022_eps, 2023_eps, 2024_eps`, // 5년치 EPS 데이터 추가
      pegStockCodes
    );

    // 4. 데이터 맵 생성
    console.log('데이터 맵 생성 중...');
    const stockInfoMap = new Map(stockInfo.map((item) => [item.stock_code, item]));
    const priceMap = new Map(
      priceData.map((item) => [item.stock_code, safeNumber(item.current_price)])
    );
    const rawDataMap = new Map(rawData.map((item) => [item.stock_code, item]));
    const currentDataMap = new Map(pegStockData.map((item) => [item.stock_code, item]));

    // 5. PEG 기반 주식 데이터 생성
    console.log('PEG 기반 주식 데이터 생성 중...');
    const lynchStocks: LynchStock[] = [];

    for (const stockCode of pegStockCodes) {
      const info = stockInfoMap.get(stockCode);
      const currentPrice = priceMap.get(stockCode);
      const rawStockData = rawDataMap.get(stockCode);
      const currentInfo = currentDataMap.get(stockCode);

      // 필요한 모든 데이터가 있는지 확인
      if (!info || !currentPrice || !rawStockData || !currentInfo) {
        continue;
      }

      // 5년 중 3년 이상 영업이익이 음수인 기업 제외
      if (countNegativeOperatingIncomes(rawStockData) >= 3) {
        continue;
      }

      // 5년치 EPS 데이터로 평균 EPS 계산
      const epsValues = [
        safeNumber(rawStockData['2020_eps']),
        safeNumber(rawStockData['2021_eps']),
        safeNumber(rawStockData['2022_eps']),
        safeNumber(rawStockData['2023_eps']),
        safeNumber(rawStockData['2024_eps']),
      ];

      // 0이 아닌 값들만 필터링하여 평균 계산
      const validEpsValues = epsValues.filter((value) => value !== 0);
      const averageEps =
        validEpsValues.length > 0
          ? validEpsValues.reduce((sum, value) => sum + value, 0) / validEpsValues.length
          : 0;

      // PEG 값과 안전마진 계산
      const pegValue = safeNumber(currentInfo.peg);
      const marginOfSafety = (1 - pegValue) * 100; // (1 - PEG) × 100

      // 5년 연속 배당 확인
      const consecutiveDividend = hasConsecutiveDividend(rawStockData);

      lynchStocks.push({
        stock_code: stockCode,
        company_name: info.company_name,
        industry: info.industry || '미분류',
        subindustry: info.subindustry || '미분류',
        current_price: currentPrice,
        current_per: safeNumber(currentInfo.current_per),
        peg: pegValue,
        growth_rate: safeNumber(info.growthrate), // Fairprice 테이블의 성장률 직접 사용
        average_eps: averageEps, // 직접 계산한 평균 EPS 사용
        margin_of_safety: marginOfSafety,
        dividend_yield: safeNumber(currentInfo.current_dividend) || 0,
        consecutive_dividend: consecutiveDividend,
      });
    }

    // 6. 산업군과 하위 산업군 목록 생성
    console.log('산업군 및 하위 산업군 목록 생성 중...');
    const uniqueIndustries = Array.from(new Set(lynchStocks.map((stock) => stock.industry))).sort();
    const uniqueSubIndustries = Array.from(
      new Set(lynchStocks.map((stock) => stock.subindustry))
    ).sort();

    console.log(`최종 종목 수: ${lynchStocks.length}`);

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

// 향상된 그레이엄 가치주 데이터 가져오기 (테이블명 및 5년 데이터 활용)
export async function fetchEnhancedGrahamStocks(): Promise<StockDataResult<EnhancedGrahamStock>> {
  try {
    console.log('=== 향상된 그레이엄 가치주 데이터 가져오기 시작 ===');

    // 1. PER 조건에 맞는 종목 가져오기 (PER 0-15로 수정)
    const perData = await fetchAllDataWithPagination<any>(
      'stock_current',
      'stock_code, current_per, current_dividend',
      'stock_code',
      (query) => query.gt('current_per', 0).lte('current_per', 15).not('current_per', 'is', null)
    );

    if (!perData || perData.length === 0) {
      console.log('PER 조건에 맞는 주식이 없습니다.');
      return emptyResult<EnhancedGrahamStock>('PER 조건에 맞는 주식을 찾을 수 없습니다.');
    }

    const perStockCodes = perData.map((item) => item.stock_code);
    console.log(`PER 조건 통과 종목 수: ${perStockCodes.length}`);

    // 2. 부채비율 조건에 맞는 종목 배치로 가져오기
    const debtData = await fetchDataInBatches<any>(
      'stock_naver_checklist',
      'stock_code, company_name, industry, subindustry, debtratio',
      perStockCodes
    );

    // 부채비율 조건 필터링 (산업별 차등 적용)
    const filteredDebtData = debtData.filter(
      (item) => item.debtratio !== null && isDebtRatioAcceptable(item.subindustry, item.debtratio)
    );

    if (!filteredDebtData || filteredDebtData.length === 0) {
      console.log('부채비율 조건에 맞는 주식이 없습니다.');
      return emptyResult<EnhancedGrahamStock>('부채비율 조건에 맞는 주식을 찾을 수 없습니다.');
    }

    const debtStockCodes = filteredDebtData.map((item) => item.stock_code);
    console.log(`부채비율 조건 통과 종목 수: ${debtStockCodes.length}`);

    // 3. 현재가 데이터 배치로 가져오기
    const priceData = await fetchDataInBatches<any>(
      'stock_price',
      'stock_code, current_price',
      debtStockCodes
    );

    if (!priceData || priceData.length === 0) {
      console.log('현재가 데이터가 없습니다.');
      return emptyResult<EnhancedGrahamStock>('현재가 데이터를 찾을 수 없습니다.');
    }

    // 4. 재무 데이터 배치로 가져오기 (직접 필드 사용)
    const rawData = await fetchDataInBatches<any>(
      'stock_naver_data',
      `stock_code,
      2020_eps, 2021_eps, 2022_eps, 2023_eps, 2024_eps,
      2024_equity, 2024_bps,
      shares_outstanding,
      2020_dividend, 2021_dividend, 2022_dividend, 2023_dividend, 2024_dividend,
      2024_assets, 2024_liabilities,
      market_cap,
      2024_revenue,
      2020_net_income, 2021_net_income, 2022_net_income, 2023_net_income, 2024_net_income,
      2024_pbr, 2024_debt_ratio,
      2024_assets, 2024_liabilities`,
      debtStockCodes
    );

    if (!rawData || rawData.length === 0) {
      console.log('재무 데이터가 없습니다.');
      return emptyResult<EnhancedGrahamStock>('재무 데이터를 찾을 수 없습니다.');
    }

    // 5. stock_naver_fairprice 테이블에서 growthrate 가져오기 (추가)
    const fairpriceData = await fetchDataInBatches<any>(
      'stock_naver_fairprice',
      'stock_code, growthrate',
      debtStockCodes
    );

    if (!fairpriceData || fairpriceData.length === 0) {
      console.log('성장률 데이터가 없습니다.');
      return emptyResult<EnhancedGrahamStock>('성장률 데이터를 찾을 수 없습니다.');
    }

    // 6. 데이터 맵 생성
    console.log('데이터 맵 생성 중...');
    const perMap = new Map(
      perData.map((item) => [
        item.stock_code,
        {
          per: safeNumber(item.current_per),
          dividend: safeNumber(item.current_dividend),
        },
      ])
    );

    const debtMap = new Map(
      filteredDebtData.map((item) => [
        item.stock_code,
        {
          company_name: item.company_name,
          industry: item.industry || '미분류',
          subindustry: item.subindustry || '미분류',
          debtratio: safeNumber(item.debtratio),
        },
      ])
    );

    const priceMap = new Map(
      priceData.map((item) => [item.stock_code, safeNumber(item.current_price)])
    );

    const rawDataMap = new Map(rawData.map((item) => [item.stock_code, item]));

    // 성장률 맵 생성 (추가)
    const fairpriceMap = new Map(
      fairpriceData.map((item) => [
        item.stock_code,
        {
          growthrate: safeNumber(item.growthrate),
        },
      ])
    );

    // 7. 종목 필터링 및 그레이엄 가격 계산
    console.log('종목 필터링 및 그레이엄 가격 계산 중...');
    const enhancedGrahamStocks: EnhancedGrahamStock[] = [];

    for (const stockCode of debtStockCodes) {
      const debtInfo = debtMap.get(stockCode);
      const perInfo = perMap.get(stockCode);
      const currentPrice = priceMap.get(stockCode);
      const rawStockData = rawDataMap.get(stockCode);
      const fairpriceInfo = fairpriceMap.get(stockCode); // 성장률 정보 가져오기 (추가)

      // 필요한 모든 데이터가 있는지 확인 (fairpriceInfo 추가)
      if (!debtInfo || !perInfo || !currentPrice || !rawStockData || !fairpriceInfo) {
        continue;
      }

      // EPS 데이터 추출 및 평균 계산 (5년 데이터 활용)
      const epsValues = [
        safeNumber(rawStockData['2020_eps']),
        safeNumber(rawStockData['2021_eps']),
        safeNumber(rawStockData['2022_eps']),
        safeNumber(rawStockData['2023_eps']),
        safeNumber(rawStockData['2024_eps']),
      ].filter((eps) => eps > 0);

      const avgEps =
        epsValues.length > 0 ? epsValues.reduce((sum, eps) => sum + eps, 0) / epsValues.length : 0;

      // 성장률은 fairprice 테이블에서 가져오기 (EPS 성장률 직접 계산 코드 대체)
      const epsGrowthRate = fairpriceInfo.growthrate; // 이미 계산된 성장률 사용

      // 주식수 계산
      let sharesOutstanding = 0;
      if (rawStockData['shares_outstanding']) {
        if (typeof rawStockData['shares_outstanding'] === 'string') {
          sharesOutstanding = Number(rawStockData['shares_outstanding'].replace(/,/g, ''));
        } else {
          sharesOutstanding = Number(rawStockData['shares_outstanding']);
        }
      }

      if (isNaN(sharesOutstanding) || sharesOutstanding <= 0) {
        continue;
      }

      // BPS 사용 (직접 필드 사용)
      const bps = safeNumber(rawStockData['2024_bps']);

      // 기존 그레이엄 가격 계산
      const grahamPrice = ((avgEps * 8 + bps) / 2) * 0.67;

      // NCAV 계산
      const currentAssets = safeNumber(rawStockData['2024_current_assets']);
      const currentLiabilities = safeNumber(rawStockData['2024_current_liabilities']);

      // 회사 전체 NCAV 계산
      const totalNCAV = currentAssets - currentLiabilities;

      // 주당 NCAV 계산
      const ncavPerShare = totalNCAV / sharesOutstanding;
      const nonNegativeNcav = ncavPerShare > 0 ? ncavPerShare : 0;
      const ncavPrice = nonNegativeNcav * (2 / 3);

      // 수정 그레이엄 가격 계산
      const modifiedGrahamPrice = ((avgEps * 8 + nonNegativeNcav) / 2) * 0.67;

      // 추가 지표 계산 (직접 필드 사용)
      const marketCap = safeNumber(rawStockData['market_cap']);
      const revenue = safeNumber(rawStockData['2024_revenue']);

      // PBR 직접 사용
      const currentPbr = safeNumber(rawStockData['2024_pbr']);

      // 수익성 확인 (5년간 적자 없음)
      const netIncome2020 = safeNumber(rawStockData['2020_net_income']);
      const netIncome2021 = safeNumber(rawStockData['2021_net_income']);
      const netIncome2022 = safeNumber(rawStockData['2022_net_income']);
      const netIncome2023 = safeNumber(rawStockData['2023_net_income']);
      const netIncome2024 = safeNumber(rawStockData['2024_net_income']);

      // 최소 4년 이상 수익이 있는지 확인 (5년 중 4년 이상)
      const positiveIncomeCount = [
        netIncome2020,
        netIncome2021,
        netIncome2022,
        netIncome2023,
        netIncome2024,
      ].filter((income) => income > 0).length;
      const hasProfitForMostYears = positiveIncomeCount >= 4;

      // 배당을 확인하는 로직 변경: 5년 연속 배당에서 4회 이상 배당으로 변경
      const dividendYears = [
        rawStockData['2020_dividend'] !== null && safeNumber(rawStockData['2020_dividend']) > 0,
        rawStockData['2021_dividend'] !== null && safeNumber(rawStockData['2021_dividend']) > 0,
        rawStockData['2022_dividend'] !== null && safeNumber(rawStockData['2022_dividend']) > 0,
        rawStockData['2023_dividend'] !== null && safeNumber(rawStockData['2023_dividend']) > 0,
        rawStockData['2024_dividend'] !== null && safeNumber(rawStockData['2024_dividend']) > 0,
      ];
      const dividendYearsCount = dividendYears.filter(Boolean).length;
      const hasDividendForMostYears = dividendYearsCount >= 4;

      // 7가지 기준 체크
      const meetsSizeCriteria = marketCap >= 50000000000 && revenue >= 50000000000; // 500억 이상
      const meetsDebtCriteria = isDebtRatioAcceptable(debtInfo.subindustry, debtInfo.debtratio);
      const meetsDividendCriteria = hasDividendForMostYears; // 변경: 연속 배당에서 4회 이상으로 변경
      const meetsProfitCriteria = hasProfitForMostYears;
      const meetsGrowthCriteria = epsGrowthRate >= 10; // 변경: 20%에서 10%로 기준 완화
      const meetsPbrCriteria =
        debtInfo.subindustry === '은행' ||
        debtInfo.subindustry === '손해보험' ||
        debtInfo.subindustry === '생명보험'
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
      const discountRate =
        modifiedGrahamPrice > 0
          ? ((modifiedGrahamPrice - currentPrice) / modifiedGrahamPrice) * 100
          : 0;

      // 모든 기준 중 최소 6개 이상 충족하고, 현재가 < 수정 그레이엄 가격인 종목만 포함
      if (criteriaMetCount >= 6 && currentPrice < modifiedGrahamPrice && discountRate > 0) {
        enhancedGrahamStocks.push({
          stock_code: stockCode,
          company_name: debtInfo.company_name,
          industry: debtInfo.industry,
          subindustry: debtInfo.subindustry,
          current_per: perInfo.per,
          debtratio: debtInfo.debtratio,
          current_price: currentPrice,
          dividend_yield: perInfo.dividend,
          graham_price: grahamPrice,
          consecutive_dividend: hasDividendForMostYears,
          //dividend_years_count: dividendYearsCount, // 새로운 필드: 배당 연도 수
          bps: bps,
          avg_eps: avgEps,
          ncav: ncavPerShare,
          ncav_price: ncavPrice,
          modified_graham_price: modifiedGrahamPrice,
          market_cap: marketCap,
          revenue: revenue,
          eps_growth_rate: epsGrowthRate,
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
      new Set(enhancedGrahamStocks.map((stock) => stock.industry))
    ).sort();

    const uniqueSubIndustries = Array.from(
      new Set(enhancedGrahamStocks.map((stock) => stock.subindustry))
    ).sort();

    console.log(`최종 필터링 후 종목 수: ${enhancedGrahamStocks.length}`);

    return {
      stocks: enhancedGrahamStocks,
      industries: uniqueIndustries,
      subIndustries: uniqueSubIndustries,
      error: null,
    };
  } catch (err) {
    console.error('데이터 가져오기 오류:', err);
    return emptyResult<EnhancedGrahamStock>(
      err instanceof Error ? err.message : '데이터를 가져오는 중 오류가 발생했습니다.'
    );
  }
}

// 고배당 가치주 데이터 가져오기 (Flavor Stocks) (테이블명 및 5년 데이터 활용)
export async function fetchFlavorStocks(): Promise<StockDataResult<FlavorStock>> {
  try {
    console.log('=== 고배당 가치주 데이터 가져오기 시작 ===');

    // 1. 배당률 데이터 페이지네이션으로 가져오기
    const dividendData = await fetchAllDataWithPagination<any>(
      'stock_current',
      'stock_code, current_dividend',
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

    // 2. 자산 데이터 배치로 가져오기
    const assetsData = await fetchDataInBatches<any>(
      'stock_naver_data',
      'stock_code, 2024_assets',
      stockCodes
    );

    // 2-1. 연속 배당 확인을 위한 데이터 가져오기
    const dividendRawData = await fetchDataInBatches<any>(
      'stock_naver_data',
      'stock_code, 2020_dividend, 2021_dividend, 2022_dividend, 2023_dividend, 2024_dividend',
      stockCodes
    );

    // 3. PER, PBR 데이터 배치로 가져오기
    const currentData = await fetchDataInBatches<any>(
      'stock_current',
      'stock_code, current_per, current_pbr',
      stockCodes
    );

    // PER, PBR 조건 필터링
    const filteredCurrentData = currentData.filter(
      (item) =>
        item.current_per !== null &&
        item.current_pbr !== null &&
        item.current_per > 0 &&
        item.current_per <= 10 &&
        item.current_pbr <= 1
    );

    if (!filteredCurrentData || filteredCurrentData.length === 0) {
      return emptyResult<FlavorStock>('PER, PBR 조건에 맞는 주식을 찾을 수 없습니다.');
    }

    // 필터링된 종목 코드
    const filteredCodes = filteredCurrentData.map((item) => item.stock_code);
    console.log(`PER, PBR 조건 통과 종목 수: ${filteredCodes.length}`);

    // 4. 현재가 및 회사 정보 데이터 배치로 가져오기
    const stockInfo = await fetchDataInBatches<any>(
      'stock_price',
      'stock_code, company_name, current_price',
      filteredCodes
    );

    // 5. 산업 정보 배치로 가져오기
    const industryInfo = await fetchDataInBatches<any>(
      'stock_naver_checklist',
      'stock_code, industry, subindustry',
      filteredCodes
    );

    // 6. 데이터 맵 생성
    console.log('데이터 맵 생성 중...');
    const perPbrMap = new Map(
      filteredCurrentData.map((item) => [
        item.stock_code,
        { per: item.current_per, pbr: item.current_pbr },
      ])
    );

    const assetsMap = new Map(
      assetsData.map((item) => [item.stock_code, item['2024_assets'] || 0])
    );

    // 배당 데이터 맵 생성
    const dividendMap = new Map(
      dividendData.map((item) => [item.stock_code, item['current_dividend'] || 0])
    );

    // 연속 배당 확인 맵 생성
    const consecutiveDividendMap = new Map(
      dividendRawData.map((item) => [item.stock_code, hasConsecutiveDividend(item)])
    );

    // 통합 맵 생성
    const dividendAssetsMap = new Map(
      dividendData.map((item) => [
        item.stock_code,
        {
          dividend: item['current_dividend'] || 0,
          assets: assetsMap.get(item.stock_code) || 0,
        },
      ])
    );

    const industryMap = new Map(
      industryInfo.map((item) => [
        item.stock_code,
        {
          industry: item.industry || '미분류',
          subindustry: item.subindustry || '미분류',
        },
      ])
    );

    // 7. 모든 조건을 만족하는 종목 데이터 구성
    console.log('최종 데이터 구성 중...');
    const flavorStocks: FlavorStock[] = stockInfo
      .filter((item) => filteredCodes.includes(item.stock_code))
      .map((item) => ({
        stock_code: item.stock_code,
        company_name: item.company_name,
        industry: industryMap.get(item.stock_code)?.industry || '미분류',
        subindustry: industryMap.get(item.stock_code)?.subindustry || '미분류',
        current_per: perPbrMap.get(item.stock_code)?.per || 0,
        current_pbr: perPbrMap.get(item.stock_code)?.pbr || 0,
        current_price: item.current_price || 0,
        dividend_yield: dividendAssetsMap.get(item.stock_code)?.dividend || 0,
        assets: dividendAssetsMap.get(item.stock_code)?.assets || 0,
        consecutive_dividend: consecutiveDividendMap.get(item.stock_code) || false,
      }));

    // 8. 산업군과 하위 산업군 목록 생성
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

// 비즈니스 퀄리티 주식 데이터 가져오기 (테이블명 및 5년 데이터 활용)
export async function fetchQualityStocks(): Promise<StockDataResult<QualityStock>> {
  try {
    console.log('=== 비즈니스 퀄리티 주식 데이터 가져오기 시작 ===');

    // 1. 재무 데이터 페이지네이션으로 가져오기 (5년 데이터 활용)
    const rawData = await fetchAllDataWithPagination<any>(
      'stock_naver_data',
      `stock_code, 
      2020_roe, 2021_roe, 2022_roe, 2023_roe, 2024_roe,
      2020_operating_margin, 2021_operating_margin, 2022_operating_margin, 2023_operating_margin, 2024_operating_margin,
      2020_dividend, 2021_dividend, 2022_dividend, 2023_dividend, 2024_dividend`
    );

    if (!rawData || rawData.length === 0) {
      return emptyResult<QualityStock>('재무 데이터를 찾을 수 없습니다.');
    }

    console.log(`재무 데이터 가져오기 완료: ${rawData.length}개 종목`);

    // 2. 각 종목별로 ROE와 영업이익률 계산 및 필터링 (직접 필드 사용)
    console.log('ROE와 영업이익률 계산 및 필터링 중...');
    const qualityStocksMap = new Map();

    rawData.forEach((stock) => {
      // ROE 계산 (직접 필드 사용)
      const roeArray = [
        safeNumber(stock['2020_roe']),
        safeNumber(stock['2021_roe']),
        safeNumber(stock['2022_roe']),
        safeNumber(stock['2023_roe']),
        safeNumber(stock['2024_roe']),
      ].filter((roe) => roe > 0);

      // 영업이익률 계산 (직접 필드 사용)
      const marginArray = [
        safeNumber(stock['2020_operating_margin']),
        safeNumber(stock['2021_operating_margin']),
        safeNumber(stock['2022_operating_margin']),
        safeNumber(stock['2023_operating_margin']),
        safeNumber(stock['2024_operating_margin']),
      ].filter((margin) => margin > 0);

      // 평균 계산
      const avgRoe =
        roeArray.length > 0 ? roeArray.reduce((a, b) => a + b, 0) / roeArray.length : 0;
      const avgMargin =
        marginArray.length > 0 ? marginArray.reduce((a, b) => a + b, 0) / marginArray.length : 0;

      // 5년 연속 배당 여부 체크
      const consecutiveDividend = hasConsecutiveDividend(stock);

      // 조건에 맞는 종목만 저장 (ROE >= 10%, 영업이익률 >= 15%)
      if (avgRoe >= 10 && avgMargin >= 15) {
        qualityStocksMap.set(stock.stock_code, {
          avg_roe: avgRoe,
          avg_operating_margin: avgMargin,
          consecutive_dividend: consecutiveDividend,
        });
      }
    });

    // 3. 조건을 만족하는 종목 코드
    const filteredCodes = Array.from(qualityStocksMap.keys());
    console.log(`ROE, 영업이익률 조건 통과 종목 수: ${filteredCodes.length}`);

    if (filteredCodes.length === 0) {
      return emptyResult<QualityStock>('조건에 맞는 주식을 찾을 수 없습니다.');
    }

    // 4. PER 데이터 배치로 가져오기 - 음수 PER 제외
    const perData = await fetchDataInBatches<any>(
      'stock_current',
      'stock_code, current_per, current_dividend',
      filteredCodes
    );

    // PER 조건 필터링 (PER > 0)
    const validPerData = perData.filter(
      (item) => item.current_per !== null && item.current_per > 0
    );
    const perFilteredCodes = validPerData.map((item) => item.stock_code);

    console.log(`PER 조건 통과 종목 수: ${perFilteredCodes.length}`);

    if (perFilteredCodes.length === 0) {
      return emptyResult<QualityStock>('PER 조건까지 만족하는 주식을 찾을 수 없습니다.');
    }

    // 5. 현재가 및 회사 정보 배치로 가져오기
    const stockInfo = await fetchDataInBatches<any>(
      'stock_price',
      'stock_code, company_name, current_price',
      perFilteredCodes
    );

    // 6. 산업 정보 배치로 가져오기
    const industryInfo = await fetchDataInBatches<any>(
      'stock_naver_checklist',
      'stock_code, industry, subindustry',
      perFilteredCodes
    );

    // 7. 데이터 맵 생성
    console.log('데이터 맵 생성 중...');
    const perMap = new Map(
      validPerData.map((item) => [
        item.stock_code,
        {
          per: item.current_per || 0,
          dividend: item['current_dividend'] || 0,
        },
      ])
    );

    const industryMap = new Map(
      industryInfo.map((item) => [
        item.stock_code,
        {
          industry: item.industry || '미분류',
          subindustry: item.subindustry || '미분류',
        },
      ])
    );

    // 8. 모든 조건을 만족하는 종목 데이터 구성
    console.log('최종 데이터 구성 중...');
    const qualityStocks: QualityStock[] = stockInfo
      .filter((item) => perFilteredCodes.includes(item.stock_code))
      .map((item) => {
        const qualityData = qualityStocksMap.get(item.stock_code);
        const perData = perMap.get(item.stock_code);

        return {
          stock_code: item.stock_code,
          company_name: item.company_name,
          industry: industryMap.get(item.stock_code)?.industry || '미분류',
          subindustry: industryMap.get(item.stock_code)?.subindustry || '미분류',
          current_per: perData?.per || 0,
          current_price: item.current_price || 0,
          dividend_yield: perData?.dividend || 0,
          avg_roe: qualityData?.avg_roe || 0,
          avg_operating_margin: qualityData?.avg_operating_margin || 0,
          consecutive_dividend: qualityData?.consecutive_dividend || false,
        };
      });

    // 9. 산업군과 하위 산업군 목록 생성
    console.log('산업군 및 하위 산업군 목록 생성 중...');
    const uniqueIndustries = Array.from(
      new Set(qualityStocks.map((stock) => stock.industry))
    ).sort();

    const uniqueSubIndustries = Array.from(
      new Set(qualityStocks.map((stock) => stock.subindustry))
    ).sort();

    console.log(`최종 필터링 후 종목 수: ${qualityStocks.length}`);

    // 10. 최종 결과 반환
    return {
      stocks: qualityStocks,
      industries: uniqueIndustries,
      subIndustries: uniqueSubIndustries,
      error: null,
    };
  } catch (err) {
    console.error('데이터 가져오기 오류:', err);
    return emptyResult<QualityStock>(
      err instanceof Error ? err.message : '데이터를 가져오는 중 오류가 발생했습니다.'
    );
  }
}

// fetchSrimStocks 함수 구현 (테이블명 및 5년 데이터 활용)
export async function fetchSrimStocks(): Promise<StockDataResult<SrimStock>> {
  try {
    console.log('=== S-RIM 기반 주식 데이터 가져오기 시작 ===');

    // 부채비율 조건을 충족하는 종목 데이터 가져오기 (캐시된 JSON 사용)
    const acceptableDebtStocks = await getAcceptableDebtStocks();

    if (!acceptableDebtStocks || acceptableDebtStocks.length === 0) {
      return emptyResult<SrimStock>('부채비율 조건을 충족하는 종목이 없습니다.');
    }

    const validStockCodes = acceptableDebtStocks.map((item) => item.stock_code);
    console.log(`부채비율 조건을 충족하는 종목 수: ${validStockCodes.length}`);

    // 2. 부채비율 조건을 충족하는 종목에 대해서만 stock_naver_fairprice 테이블에서 필요한 데이터 조회
    const fairpriceData = await fetchDataInBatches<any>(
      'stock_naver_fairprice',
      'stock_code, company_name, industry, subindustry, srimbase, srimdecline10pct, srimdecline20pct, weightedroe',
      validStockCodes
    );

    if (!fairpriceData || fairpriceData.length === 0) {
      return emptyResult<SrimStock>('적정가 데이터를 찾을 수 없습니다.');
    }

    const fairpriceStockCodes = fairpriceData.map((item) => item.stock_code);
    console.log(`필터링 후 적정가 데이터가 있는 종목 수: ${fairpriceStockCodes.length}`);

    // 3. 현재가 데이터 배치로 가져오기
    const priceData = await fetchDataInBatches<any>(
      'stock_price',
      'stock_code, current_price',
      fairpriceStockCodes
    );

    // 4. 배당률 및 PER 데이터 배치로 가져오기
    const dividendData = await fetchDataInBatches<any>(
      'stock_current',
      'stock_code, current_dividend, current_per',
      fairpriceStockCodes
    );

    // 5. 연속 배당 확인과 영업이익 확인을 위한 데이터 배치로 가져오기 (5년 데이터 활용)
    const rawData = await fetchDataInBatches<any>(
      'stock_naver_data',
      `stock_code, 
      2020_dividend, 2021_dividend, 2022_dividend, 2023_dividend, 2024_dividend,
      2020_operating_income, 2021_operating_income, 2022_operating_income, 2023_operating_income, 2024_operating_income`,
      fairpriceStockCodes
    );

    // 6. 데이터 맵 생성 및 연결
    console.log('데이터 맵 생성 중...');
    const fairpriceMap = new Map(fairpriceData.map((item) => [item.stock_code, item]));
    const priceMap = new Map(
      priceData.map((item) => [item.stock_code, safeNumber(item.current_price)])
    );
    const dividendMap = new Map(
      dividendData.map((item) => [
        item.stock_code,
        {
          dividend: safeNumber(item.current_dividend),
          per: safeNumber(item.current_per),
        },
      ])
    );
    const rawDataMap = new Map(rawData.map((item) => [item.stock_code, item]));

    // 7. S-RIM 기반 저평가 주식 필터링 (안전마진 30% 이상)
    console.log('S-RIM 기반 저평가 주식 필터링 중...');
    const srimStocks: SrimStock[] = [];
    const MIN_MARGIN_OF_SAFETY = 0.3; // 30% 안전마진

    for (const stockCode of fairpriceStockCodes) {
      const fairpriceItem = fairpriceMap.get(stockCode);
      const currentPrice = priceMap.get(stockCode);
      const dividendInfo = dividendMap.get(stockCode);
      const rawStockData = rawDataMap.get(stockCode);

      // 필요한 모든 데이터가 있는지 확인
      if (!fairpriceItem || !currentPrice || !rawStockData || !dividendInfo) {
        continue;
      }

      // 5년 중 3년 이상 영업이익이 음수인 기업 제외
      if (countNegativeOperatingIncomes(rawStockData) >= 3) {
        continue;
      }

      // S-RIM 기본 시나리오 가치 확인
      const srimBase = safeNumber(fairpriceItem.srimbase);
      const srimDecline10pct = safeNumber(fairpriceItem.srimdecline10pct);
      const srimDecline20pct = safeNumber(fairpriceItem.srimdecline20pct);

      // S-RIM 기본 가치가 0 이하인 경우 제외
      if (srimBase <= 0) {
        continue;
      }

      // 안전마진 계산
      const marginOfSafety = (srimBase - currentPrice) / srimBase;

      // 5년 연속 배당 확인
      const consecutiveDividend = hasConsecutiveDividend(rawStockData);

      // 30% 이상 저평가된 종목만 추가
      if (marginOfSafety >= MIN_MARGIN_OF_SAFETY) {
        srimStocks.push({
          stock_code: stockCode,
          company_name: fairpriceItem.company_name,
          industry: fairpriceItem.industry || '미분류',
          subindustry: fairpriceItem.subindustry || '미분류',
          current_price: currentPrice,
          current_per: dividendInfo.per,
          srim_base: srimBase,
          srim_decline_10pct: srimDecline10pct,
          srim_decline_20pct: srimDecline20pct,
          margin_of_safety: marginOfSafety * 100, // 백분율로 변환
          dividend_yield: dividendInfo.dividend || 0,
          consecutive_dividend: consecutiveDividend,
          weightedroe: safeNumber(fairpriceItem.weightedroe),
        });
      }
    }

    // 8. 산업군과 하위 산업군 목록 생성
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

// fetchHowardStocks 함수 - 페이지네이션 적용 (테이블명 및 5년 데이터 활용)
// fetchHowardStocks 함수 - 순자산가치 기반 가치주 계산으로 수정
export async function fetchHowardStocks(): Promise<StockDataResult<HowardStock>> {
  try {
    console.log('=== 순자산가치 기반 가치주 데이터 가져오기 시작 ===');

    // 1. 산업별 성장률 데이터 불러오기 (참고용으로 유지)
    const industryData = (await import('@/lib/industry-DATA.json').then(
      (module) => module.default
    )) as IndustryData[];

    // 2. 캐시된 JSON 파일에서 부채비율 조건을 충족하는 종목 데이터 가져오기
    console.log('캐시된 부채비율 데이터 불러오는 중...');
    const acceptableDebtStocks = await getAcceptableDebtStocks();

    if (!acceptableDebtStocks || acceptableDebtStocks.length === 0) {
      return emptyResult<HowardStock>('부채비율 조건을 충족하는 종목이 없습니다.');
    }

    const stockCodes = acceptableDebtStocks.map((item) => item.stock_code);
    console.log(`부채비율 조건 충족 종목 수: ${stockCodes.length}`);

    // 3. 현재가 데이터 배치로 가져오기
    const priceData = await fetchDataInBatches<any>(
      'stock_price',
      'stock_code, current_price',
      stockCodes
    );

    // 4. 배당률 정보 배치로 가져오기
    const dividendData = await fetchDataInBatches<any>(
      'stock_current',
      'stock_code, current_dividend',
      stockCodes
    );

    // 5. 재무 데이터 배치로 가져오기 (5년 데이터 활용 - FCF 및 자산/부채 데이터)
    const rawData = await fetchDataInBatches<any>(
      'stock_naver_data',
      `stock_code,
      shares_outstanding,
      2020_operating_cash_flow, 2020_capex, 2020_free_cash_flow, 2020_operating_income,
      2021_operating_cash_flow, 2021_capex, 2021_free_cash_flow, 2021_operating_income,
      2022_operating_cash_flow, 2022_capex, 2022_free_cash_flow, 2022_operating_income,
      2023_operating_cash_flow, 2023_capex, 2023_free_cash_flow, 2023_operating_income,
      2024_operating_cash_flow, 2024_capex, 2024_free_cash_flow, 2024_operating_income,
      2024_shares_outstanding,
      2020_dividend, 2021_dividend, 2022_dividend, 2023_dividend, 2024_dividend`,
      stockCodes
    );

    // 6. 순자산가치 계산을 위한 데이터 가져오기 (stock_raw_data 테이블에서)
    console.log('순자산가치 계산을 위한 데이터 가져오는 중...');
    const netAssetData = await fetchDataInBatches<any>(
      'stock_raw_data',
      'stock_code, 2024_current_assets, 2024_current_liabilities',
      stockCodes
    );

    // 7. 성장률 데이터 배치로 가져오기 (참고용으로 유지)
    console.log('성장률 데이터 불러오는 중...');
    const growthData = await fetchDataInBatches<any>(
      'stock_naver_fairprice',
      'stock_code, growthrate',
      stockCodes
    );

    // 8. 데이터 맵 생성 - 캐시된 부채비율 데이터 활용
    console.log('데이터 맵 생성 중...');
    const stockMap = new Map(
      acceptableDebtStocks.map((item) => [
        item.stock_code,
        {
          stock_code: item.stock_code,
          company_name: item.company_name,
          industry: item.industry,
          subindustry: item.subindustry,
          debtratio: item.debtratio,
        },
      ])
    );

    const priceMap = new Map(
      priceData.map((item) => [item.stock_code, safeNumber(item.current_price)])
    );
    const dividendMap = new Map(
      dividendData.map((item) => [item.stock_code, safeNumber(item.current_dividend)])
    );
    const rawDataMap = new Map(rawData.map((item) => [item.stock_code, item]));
    const netAssetMap = new Map(netAssetData.map((item) => [item.stock_code, item]));

    // 성장률 맵 생성 (참고용으로 유지)
    const growthRateMap = new Map(
      growthData.map((item) => [item.stock_code, safeNumber(item.growthrate)])
    );

    // 9. 순자산가치 기반 내재가치 계산 및 종목 필터링
    console.log('순자산가치 기반 내재가치 계산 및 종목 필터링 중...');
    const howardStocks: HowardStock[] = [];

    for (const stockCode of stockCodes) {
      const stockInfo = stockMap.get(stockCode);
      const currentPrice = priceMap.get(stockCode);
      const dividendYield = dividendMap.get(stockCode);
      const rawStockData = rawDataMap.get(stockCode);
      const netAssetData = netAssetMap.get(stockCode);
      const growthRate = growthRateMap.get(stockCode) || 0;

      // 필요한 모든 데이터가 있는지 확인
      if (!stockInfo || !currentPrice || !rawStockData || !netAssetData) {
        continue;
      }

      // 2024년 유동자산과 유동부채 데이터 확인
      const currentAssets = safeNumber(netAssetData['2024_current_assets']);
      const currentLiabilities = safeNumber(netAssetData['2024_current_liabilities']);

      // 순자산 또는 자산/부채 데이터가 없으면 제외
      if (currentAssets <= 0 || currentLiabilities < 0) {
        continue;
      }

      // 발행주식수 계산
      let sharesOutstanding = 0;
      // 2024년 발행주식수를 우선 사용
      if (rawStockData['2024_shares_outstanding']) {
        if (typeof rawStockData['2024_shares_outstanding'] === 'string') {
          sharesOutstanding = Number(rawStockData['2024_shares_outstanding'].replace(/,/g, ''));
        } else {
          sharesOutstanding = Number(rawStockData['2024_shares_outstanding']);
        }
      }
      // 없을 경우 기존 shares_outstanding 필드 사용
      else if (rawStockData['shares_outstanding']) {
        if (typeof rawStockData['shares_outstanding'] === 'string') {
          sharesOutstanding = Number(rawStockData['shares_outstanding'].replace(/,/g, ''));
        } else {
          sharesOutstanding = Number(rawStockData['shares_outstanding']);
        }
      }

      if (isNaN(sharesOutstanding) || sharesOutstanding <= 0) {
        continue;
      }

      // 순자산가치 계산 (유동자산 - 유동부채)
      const netCurrentAssetValue = currentAssets - currentLiabilities;

      // 시가총액 계산 (현재가 × 발행주식수)
      const marketCap = currentPrice * sharesOutstanding;

      // 내재가치 대비 시가총액 비율 계산 (낮을수록 저평가)
      const marketCapToIntrinsicRatio = marketCap / netCurrentAssetValue;

      // 안전마진 계산 (1 - 시가총액/내재가치) * 100%
      const marginOfSafety =
        netCurrentAssetValue > 0 ? (1 - marketCap / netCurrentAssetValue) * 100 : 0;

      // 내재가치 기준 주당 가치 계산
      const intrinsicValuePerShare = netCurrentAssetValue / sharesOutstanding;

      // 5년 연속 배당 확인
      const consecutiveDividend = hasConsecutiveDividend(rawStockData);

      // 조건 확인: 내재가치 > 시가총액 (즉, 안전마진이 양수)
      if (netCurrentAssetValue > marketCap) {
        howardStocks.push({
          stock_code: stockCode,
          company_name: stockInfo.company_name,
          industry: stockInfo.industry || '미분류',
          subindustry: stockInfo.subindustry || '미분류',
          current_price: currentPrice,
          dividend_yield: dividendYield || 0,
          fcf_median: 0, // 사용하지 않음
          fcf_per_share: 0, // 사용하지 않음
          growthrate: growthRate,
          base_intrinsic_value: intrinsicValuePerShare, // 주당 순자산가치로 변경
          net_current_asset_value: netCurrentAssetValue, // 순자산가치 추가
          market_cap: marketCap, // 시가총액 추가
          market_cap_to_intrinsic_ratio: marketCapToIntrinsicRatio, // 시가총액/내재가치 비율 추가
          optimistic_intrinsic_value: intrinsicValuePerShare * 1.2, // 낙관적 시나리오 (20% 추가)
          conservative_intrinsic_value: intrinsicValuePerShare * 0.8, // 보수적 시나리오 (20% 할인)
          discount_rate: 10, // 기본 10%로 설정 (참고용으로 유지)
          margin_of_safety: marginOfSafety, // 안전마진
          consecutive_dividend: consecutiveDividend,
        });
      }
    }

    // 10. 산업군과 하위 산업군 목록 생성
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

// 수익기반 내재가치 주식 데이터 가져오기 (테이블명 및 5년 데이터 활용)
export async function fetchProfitStocks(): Promise<StockDataResult<ProfitStock>> {
  try {
    console.log('=== 수익기반 내재가치 주식 데이터 가져오기 시작 ===');

    // 1. 산업별 성장률 데이터 불러오기 (대체 성장률로 사용 가능하도록 유지)
    const industryData = (await import('@/lib/industry-DATA.json').then(
      (module) => module.default
    )) as IndustryData[];

    // 2. 캐시된 JSON 파일에서 부채비율 조건을 충족하는 종목 데이터 가져오기
    console.log('캐시된 부채비율 데이터 불러오는 중...');
    const acceptableDebtStocks = await getAcceptableDebtStocks();

    if (!acceptableDebtStocks || acceptableDebtStocks.length === 0) {
      return emptyResult<ProfitStock>('부채비율 조건을 충족하는 종목이 없습니다.');
    }

    const stockCodes = acceptableDebtStocks.map((item) => item.stock_code);
    console.log(`부채비율 조건 충족 종목 수: ${stockCodes.length}`);

    // 3. 현재가 데이터 배치로 가져오기
    const priceData = await fetchDataInBatches<any>(
      'stock_price',
      'stock_code, current_price',
      stockCodes
    );

    // 4. 배당률 정보 배치로 가져오기
    const dividendData = await fetchDataInBatches<any>(
      'stock_current',
      'stock_code, current_dividend',
      stockCodes
    );

    // 5. 재무 데이터 배치로 가져오기 (5년 데이터 활용 - FCF 용)
    const rawData = await fetchDataInBatches<any>(
      'stock_naver_data',
      `stock_code,
      shares_outstanding,
      2020_operating_cash_flow, 2020_capex, 2020_free_cash_flow, 2020_operating_income,
      2021_operating_cash_flow, 2021_capex, 2021_free_cash_flow, 2021_operating_income,
      2022_operating_cash_flow, 2022_capex, 2022_free_cash_flow, 2022_operating_income,
      2023_operating_cash_flow, 2023_capex, 2023_free_cash_flow, 2023_operating_income,
      2024_operating_cash_flow, 2024_capex, 2024_free_cash_flow, 2024_operating_income,
      2020_dividend, 2021_dividend, 2022_dividend, 2023_dividend, 2024_dividend`,
      stockCodes
    );

    // 6. 성장률 데이터 배치로 가져오기
    console.log('성장률 데이터와 내재가치 불러오는 중...');
    const fairPriceData = await fetchDataInBatches<any>(
      'stock_naver_fairprice',
      'stock_code, growthrate, profitbasedprice',
      stockCodes
    );

    // 7. 내재가치 데이터 가져오기 (profitBasedPrice) - 새로 추가
    // console.log('내재가치 데이터 불러오는 중...');
    // const fairPriceData = await fetchDataInBatches<any>(
    //   'stock_naver_fairprice',
    //   'stock_code, profitbasedprice',
    //   stockCodes
    // );

    // 8. 데이터 맵 생성 - 캐시된 부채비율 데이터 활용
    console.log('데이터 맵 생성 중...');
    const stockMap = new Map(
      acceptableDebtStocks.map((item) => [
        item.stock_code,
        {
          stock_code: item.stock_code,
          company_name: item.company_name,
          industry: item.industry,
          subindustry: item.subindustry,
          debtratio: item.debtratio,
        },
      ])
    );

    const priceMap = new Map(
      priceData.map((item) => [item.stock_code, safeNumber(item.current_price)])
    );
    const dividendMap = new Map(
      dividendData.map((item) => [item.stock_code, safeNumber(item.current_dividend)])
    );
    const rawDataMap = new Map(rawData.map((item) => [item.stock_code, item]));

    // 성장률 맵 생성
    const growthRateMap = new Map(
      fairPriceData.map((item) => [item.stock_code, safeNumber(item.growthrate)])
    );

    // 내재가치 맵 생성 - 새로 추가
    const fairPriceMap = new Map(
      fairPriceData.map((item) => [item.stock_code, safeNumber(item.profitbasedprice)])
    );

    // 9. 하워드 막스 내재가치 계산 및 종목 필터링
    console.log('하워드 막스 내재가치 계산 및 종목 필터링 중...');
    const profitStocks: ProfitStock[] = [];
    const MIN_MARGIN_OF_SAFETY = 0.3; // 30% 안전마진

    for (const stockCode of stockCodes) {
      const stockInfo = stockMap.get(stockCode);
      const currentPrice = priceMap.get(stockCode);
      const dividendYield = dividendMap.get(stockCode);
      const rawStockData = rawDataMap.get(stockCode);
      const growthRate = growthRateMap.get(stockCode) || 0;

      // 새로 추가: 내재가치 가져오기
      const profitBasedPrice = fairPriceMap.get(stockCode) || 0;

      // 필요한 모든 데이터가 있는지 확인
      if (!stockInfo || !currentPrice || !rawStockData || profitBasedPrice <= 0) {
        continue;
      }

      // 성장률이 0 이하인 종목은 제외
      if (growthRate <= 0) {
        continue;
      }

      // 5년 중 3년 이상 영업이익이 음수인 기업 제외
      if (countNegativeOperatingIncomes(rawStockData) >= 3) {
        continue;
      }

      // 발행주식수 계산
      let sharesOutstanding = 0;
      if (rawStockData['shares_outstanding']) {
        if (typeof rawStockData['shares_outstanding'] === 'string') {
          sharesOutstanding = Number(rawStockData['shares_outstanding'].replace(/,/g, ''));
        } else {
          sharesOutstanding = Number(rawStockData['shares_outstanding']);
        }
      }

      if (isNaN(sharesOutstanding) || sharesOutstanding <= 0) {
        continue;
      }

      // FCF 계산 (직접 필드 사용 우선) - FCF 중앙값은 계속 계산 (필요할 수 있으므로)
      const fcfValues = [
        safeNumber(rawStockData['2020_free_cash_flow']),
        safeNumber(rawStockData['2021_free_cash_flow']),
        safeNumber(rawStockData['2022_free_cash_flow']),
        safeNumber(rawStockData['2023_free_cash_flow']),
        safeNumber(rawStockData['2024_free_cash_flow']),
      ];

      // FCF 값이 0인 경우 영업현금흐름 - 자본지출로 계산
      for (let i = 0; i < 5; i++) {
        const year = 2020 + i;
        if (fcfValues[i] === 0) {
          const ocf = safeNumber(rawStockData[`${year}_operating_cash_flow`]);
          const capex = safeNumber(rawStockData[`${year}_capex`]);
          fcfValues[i] = ocf - capex;
        }
      }

      // 유효한 FCF 값 필터링
      const validFcfValues = fcfValues.filter((fcf) => fcf !== 0);
      if (validFcfValues.length === 0) {
        continue;
      }

      // 정렬 후 중앙값 가져오기
      validFcfValues.sort((a, b) => a - b);
      const fcfMedian =
        validFcfValues.length % 2 === 0
          ? (validFcfValues[validFcfValues.length / 2 - 1] +
              validFcfValues[validFcfValues.length / 2]) /
            2
          : validFcfValues[Math.floor(validFcfValues.length / 2)];

      // 주당 FCF 계산 - 참고용으로 계산만 하고 UI에 표시하지 않을 예정
      const fcfPerShare = fcfMedian / sharesOutstanding;

      // profitBasedPrice를 기준으로 내재가치 설정 - 변경된 부분
      const baseIntrinsicValue = profitBasedPrice;

      // 보수적 내재가치는 기본값의 80% (20% 할인)
      const conservativeIntrinsicValue = profitBasedPrice * 0.8;

      // 낙관적 내재가치는 기본값의 120% (20% 프리미엄)
      const optimisticIntrinsicValue = profitBasedPrice * 1.2;

      // 안전마진 계산
      const marginOfSafety =
        baseIntrinsicValue > 0 ? (baseIntrinsicValue - currentPrice) / baseIntrinsicValue : 0;

      // 5년 연속 배당 확인
      const consecutiveDividend = hasConsecutiveDividend(rawStockData);

      // 조건 확인: 현재가 < 기본 시나리오 내재가치 & 안전마진 >= 30%
      if (currentPrice < baseIntrinsicValue && marginOfSafety >= MIN_MARGIN_OF_SAFETY) {
        profitStocks.push({
          stock_code: stockCode,
          company_name: stockInfo.company_name,
          industry: stockInfo.industry || '미분류',
          subindustry: stockInfo.subindustry || '미분류',
          current_price: currentPrice,
          dividend_yield: dividendYield || 0,
          fcf_median: fcfMedian,
          fcf_per_share: fcfPerShare, // UI에서 보여주지 않지만 데이터는 유지
          growthrate: growthRate,
          base_intrinsic_value: baseIntrinsicValue,
          optimistic_intrinsic_value: optimisticIntrinsicValue,
          conservative_intrinsic_value: conservativeIntrinsicValue,
          discount_rate: 10, // 기본 10%로 설정
          margin_of_safety: marginOfSafety * 100,
          consecutive_dividend: consecutiveDividend,
        });
      }
    }

    // 10. 산업군과 하위 산업군 목록 생성
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

// 5년 DCF 계산 함수 (영구가치 없음)
function calculateDCF5Year(fcfPerShare: number, growthRate: number, discountRate: number): number {
  let intrinsicValue = 0;

  // 5년간의 FCF 현재가치 계산
  for (let year = 1; year <= 5; year++) {
    const futureFCF = fcfPerShare * Math.pow(1 + growthRate, year);
    const presentValue = futureFCF / Math.pow(1 + discountRate, year);
    intrinsicValue += presentValue;
  }

  return intrinsicValue;
}
