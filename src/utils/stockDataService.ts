// src/utils/stockDataService.ts

import { supabase } from '@/lib/supabaseClient';

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
  ncav: number; // 순유동자산가치 (Net Current Asset Value) 추가
  ncav_price: number; // NCAV의 2/3 가격 (그레이엄의 NCAV 투자 기준) 추가
  modified_graham_price: number; // 수정 그레이엄 가격 [(3년간 EPS 평균 × 8) + NCAV] ÷ 2 × 67% 추가
}

export interface QualityStock {
  stock_code: string;
  company_name: string;
  industry: string;
  subindustry: string;
  current_per: number;
  current_price: number;
  dividend_yield: number;
  avg_roe: number; // 3년 평균 ROE
  avg_operating_margin: number; // 3년 평균 영업이익률
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
  consecutive_dividend: boolean; // 3년 연속 배당 여부
}

export interface LynchStock {
  stock_code: string;
  company_name: string;
  industry: string;
  subindustry: string;
  current_price: number;
  current_per: number; // 현재 PER 추가
  peg_price: number; // PEG 기반 적정주가
  growth_rate: number; // 성장률
  average_eps: number; // 평균 EPS
  margin_of_safety: number; // 안전마진
  dividend_yield: number; // 배당률
  consecutive_dividend: boolean; // 3년 연속 배당 여부
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
  consecutive_dividend: boolean; // 3년 연속 배당 여부
  latestroe: number; // 최신 ROE
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

// stockDataService.ts에 추가할 코드

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

// DCF 모델 계산 함수
function calculateDCF(
  startingFCF: number,
  growthRate: number,
  perpetualGrowthRate: number,
  discountRate: number
): number {
  // FCF가 음수인 경우 0으로 처리
  if (startingFCF <= 0) return 0;

  let presentValue = 0;
  let yearlyFCF = startingFCF;

  // 10년간의 현금흐름 현재가치 계산
  for (let year = 1; year <= 10; year++) {
    yearlyFCF *= 1 + growthRate;
    presentValue += yearlyFCF / Math.pow(1 + discountRate, year);
  }

  // 할인율과 영구성장률의 차이가 너무 작으면 오류 방지
  if (discountRate - perpetualGrowthRate < 0.01) {
    perpetualGrowthRate = discountRate - 0.01;
  }

  // 영구가치(Terminal Value) 계산
  const terminalValue =
    (yearlyFCF * (1 + perpetualGrowthRate)) / (discountRate - perpetualGrowthRate);

  // 영구가치의 현재가치
  const presentTerminalValue = terminalValue / Math.pow(1 + discountRate, 10);

  // 총 내재가치
  return presentValue + presentTerminalValue;
}

// 고배당 가치주 데이터 가져오기 (Flavor Stocks)
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
      'stock_raw_data',
      'stock_code, 2024_assets',
      stockCodes
    );

    // 2-1. 연속 배당 확인을 위한 데이터 가져오기
    const dividendRawData = await fetchDataInBatches<any>(
      'stock_raw_data',
      'stock_code, 2022_dividend, 2023_dividend, 2024_dividend',
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
      'stock_checklist',
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
      dividendRawData.map((item) => [
        item.stock_code,
        safeNumber(item['2022_dividend']) > 0 &&
          safeNumber(item['2023_dividend']) > 0 &&
          safeNumber(item['2024_dividend']) > 0,
      ])
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
        consecutive_dividend: consecutiveDividendMap.get(item.stock_code) || false, // 연속 배당 정보 추가
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

// 비즈니스 퀄리티 주식 데이터 가져오기
export async function fetchQualityStocks(): Promise<StockDataResult<QualityStock>> {
  try {
    console.log('=== 비즈니스 퀄리티 주식 데이터 가져오기 시작 ===');

    // 1. 재무 데이터 페이지네이션으로 가져오기
    const rawData = await fetchAllDataWithPagination<any>(
      'stock_raw_data',
      `stock_code, 
      2022_net_income, 2023_net_income, 2024_net_income,
      2022_equity, 2023_equity, 2024_equity,
      2022_operating_income, 2023_operating_income, 2024_operating_income,
      2022_revenue, 2023_revenue, 2024_revenue,
      2022_dividend, 2023_dividend, 2024_dividend` // 배당 데이터 필드 추가
    );

    if (!rawData || rawData.length === 0) {
      return emptyResult<QualityStock>('재무 데이터를 찾을 수 없습니다.');
    }

    console.log(`재무 데이터 가져오기 완료: ${rawData.length}개 종목`);

    // 2. 각 종목별로 ROE와 영업이익률 계산 및 필터링
    console.log('ROE와 영업이익률 계산 및 필터링 중...');
    const qualityStocksMap = new Map();

    rawData.forEach((stock) => {
      // ROE 계산 (당기순이익 ÷ 자본총계)
      const roeArray = [];
      if (stock['2022_net_income'] && stock['2022_equity'] && stock['2022_equity'] !== 0) {
        roeArray.push((stock['2022_net_income'] / stock['2022_equity']) * 100);
      }
      if (stock['2023_net_income'] && stock['2023_equity'] && stock['2023_equity'] !== 0) {
        roeArray.push((stock['2023_net_income'] / stock['2023_equity']) * 100);
      }
      if (stock['2024_net_income'] && stock['2024_equity'] && stock['2024_equity'] !== 0) {
        roeArray.push((stock['2024_net_income'] / stock['2024_equity']) * 100);
      }

      // 영업이익률 계산 (영업이익 ÷ 매출)
      const marginArray = [];
      if (stock['2022_operating_income'] && stock['2022_revenue'] && stock['2022_revenue'] !== 0) {
        marginArray.push((stock['2022_operating_income'] / stock['2022_revenue']) * 100);
      }
      if (stock['2023_operating_income'] && stock['2023_revenue'] && stock['2023_revenue'] !== 0) {
        marginArray.push((stock['2023_operating_income'] / stock['2023_revenue']) * 100);
      }
      if (stock['2024_operating_income'] && stock['2024_revenue'] && stock['2024_revenue'] !== 0) {
        marginArray.push((stock['2024_operating_income'] / stock['2024_revenue']) * 100);
      }

      // 평균 계산
      const avgRoe =
        roeArray.length > 0 ? roeArray.reduce((a, b) => a + b, 0) / roeArray.length : 0;
      const avgMargin =
        marginArray.length > 0 ? marginArray.reduce((a, b) => a + b, 0) / marginArray.length : 0;

      // 연속 배당 여부 체크 추가
      const consecutiveDividend =
        safeNumber(stock['2022_dividend']) > 0 &&
        safeNumber(stock['2023_dividend']) > 0 &&
        safeNumber(stock['2024_dividend']) > 0;

      // 조건에 맞는 종목만 저장 (ROE >= 10%, 영업이익률 >= 15%)
      if (avgRoe >= 10 && avgMargin >= 15) {
        qualityStocksMap.set(stock.stock_code, {
          avg_roe: avgRoe,
          avg_operating_margin: avgMargin,
          consecutive_dividend: consecutiveDividend, // 연속 배당 정보 추가
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
      'stock_checklist',
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
    const QualityStocks: QualityStock[] = stockInfo
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
          consecutive_dividend: qualityData?.consecutive_dividend || false, // 연속 배당 여부 추가
        };
      });

    // 9. 산업군과 하위 산업군 목록 생성
    console.log('산업군 및 하위 산업군 목록 생성 중...');
    const uniqueIndustries = Array.from(
      new Set(QualityStocks.map((stock) => stock.industry))
    ).sort();

    const uniqueSubIndustries = Array.from(
      new Set(QualityStocks.map((stock) => stock.subindustry))
    ).sort();

    console.log(`최종 필터링 후 종목 수: ${QualityStocks.length}`);

    // 10. 최종 결과 반환
    return {
      stocks: QualityStocks,
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

// fetchLynchStocks 함수 - 수정된 버전
export async function fetchLynchStocks(): Promise<StockDataResult<LynchStock>> {
  try {
    console.log('=== 피터 린치 PEG 기반 주식 데이터 가져오기 시작 ===');

    // 1. 먼저 stock_checklist 테이블에서 부채비율 기준에 맞는 종목만 필터링
    console.log('부채비율 기준에 맞는 종목 필터링 중...');
    const checklistData = await fetchAllDataWithPagination<any>(
      'stock_checklist',
      'stock_code, subindustry, debtratio'
    );

    if (!checklistData || checklistData.length === 0) {
      return emptyResult<LynchStock>('체크리스트 데이터를 찾을 수 없습니다.');
    }

    // 산업군별 부채비율 조건에 맞는 종목만 필터링
    const validStockCodes = checklistData
      .filter((item) => isDebtRatioAcceptable(item.subindustry, safeNumber(item.debtratio)))
      .map((item) => item.stock_code);

    console.log(`부채비율 조건을 충족하는 종목 수: ${validStockCodes.length}`);

    // 부채비율 조건을 충족하는 종목이 없는 경우
    if (validStockCodes.length === 0) {
      return emptyResult<LynchStock>('부채비율 조건을 충족하는 종목이 없습니다.');
    }

    // 2. 부채비율 조건을 충족하는 종목에 대해서만 stock_fairprice 테이블에서 필요한 데이터 조회
    const fairpriceData = await fetchDataInBatches<any>(
      'stock_fairprice',
      'stock_code, company_name, industry, subindustry, pegbased, growthrate, averageeps',
      validStockCodes
    );

    if (!fairpriceData || fairpriceData.length === 0) {
      return emptyResult<LynchStock>('적정가 데이터를 찾을 수 없습니다.');
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

    // 5. 연속 배당 확인과 영업이익 확인을 위한 데이터 배치로 가져오기
    const rawData = await fetchDataInBatches<any>(
      'stock_raw_data',
      `stock_code, 
      2022_dividend, 2023_dividend, 2024_dividend,
      2022_operating_income, 2023_operating_income, 2024_operating_income`,
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

    // 7. PEG 기반 저평가 주식 필터링 (안전마진 30% 이상)
    console.log('PEG 기반 저평가 주식 필터링 중...');
    const lynchStocks: LynchStock[] = [];
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

      // 영업이익 데이터 확인 및 음수 개수 카운트
      const operatingIncome2022 = safeNumber(rawStockData['2022_operating_income']);
      const operatingIncome2023 = safeNumber(rawStockData['2023_operating_income']);
      const operatingIncome2024 = safeNumber(rawStockData['2024_operating_income']);

      // 3년 중 2년 이상 영업이익이 음수인 기업 제외
      let negativeOperatingIncomeCount = 0;
      if (operatingIncome2022 < 0) negativeOperatingIncomeCount++;
      if (operatingIncome2023 < 0) negativeOperatingIncomeCount++;
      if (operatingIncome2024 < 0) negativeOperatingIncomeCount++;

      if (negativeOperatingIncomeCount >= 2) {
        continue;
      }

      // PEG 기반 적정주가 확인
      const pegPrice = safeNumber(fairpriceItem.pegbased);

      // 적정주가가 0 이하인 경우 제외
      if (pegPrice <= 0) {
        continue;
      }

      // 안전마진 계산
      const marginOfSafety = (pegPrice - currentPrice) / pegPrice;

      // 연속 배당 확인
      const consecutiveDividend =
        safeNumber(rawStockData['2022_dividend']) > 0 &&
        safeNumber(rawStockData['2023_dividend']) > 0 &&
        safeNumber(rawStockData['2024_dividend']) > 0;

      // 30% 이상 저평가된 종목만 추가
      if (marginOfSafety >= MIN_MARGIN_OF_SAFETY) {
        lynchStocks.push({
          stock_code: stockCode,
          company_name: fairpriceItem.company_name,
          industry: fairpriceItem.industry || '미분류',
          subindustry: fairpriceItem.subindustry || '미분류',
          current_price: currentPrice,
          current_per: dividendInfo.per,
          peg_price: pegPrice,
          growth_rate: safeNumber(fairpriceItem.growthrate),
          average_eps: safeNumber(fairpriceItem.averageeps),
          margin_of_safety: marginOfSafety * 100, // 백분율로 변환
          dividend_yield: dividendInfo.dividend || 0,
          consecutive_dividend: consecutiveDividend,
        });
      }
    }

    // 8. 산업군과 하위 산업군 목록 생성
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

// fetchSrimStocks 함수 구현 (수정 버전)
export async function fetchSrimStocks(): Promise<StockDataResult<SrimStock>> {
  try {
    console.log('=== S-RIM 기반 주식 데이터 가져오기 시작 ===');

    // 1. 먼저 stock_checklist 테이블에서 부채비율 기준에 맞는 종목만 필터링
    console.log('부채비율 기준에 맞는 종목 필터링 중...');
    const checklistData = await fetchAllDataWithPagination<any>(
      'stock_checklist',
      'stock_code, subindustry, debtratio'
    );

    if (!checklistData || checklistData.length === 0) {
      return emptyResult<SrimStock>('체크리스트 데이터를 찾을 수 없습니다.');
    }

    // 산업군별 부채비율 조건에 맞는 종목만 필터링
    const validStockCodes = checklistData
      .filter((item) => isDebtRatioAcceptable(item.subindustry, safeNumber(item.debtratio)))
      .map((item) => item.stock_code);

    console.log(`부채비율 조건을 충족하는 종목 수: ${validStockCodes.length}`);

    // 부채비율 조건을 충족하는 종목이 없는 경우
    if (validStockCodes.length === 0) {
      return emptyResult<SrimStock>('부채비율 조건을 충족하는 종목이 없습니다.');
    }

    // 2. 부채비율 조건을 충족하는 종목에 대해서만 stock_fairprice 테이블에서 필요한 데이터 조회
    const fairpriceData = await fetchDataInBatches<any>(
      'stock_fairprice',
      'stock_code, company_name, industry, subindustry, srimbase, srimdecline10pct, srimdecline20pct, latestroe',
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

    // 5. 연속 배당 확인과 영업이익 확인을 위한 데이터 배치로 가져오기
    const rawData = await fetchDataInBatches<any>(
      'stock_raw_data',
      `stock_code, 
      2022_dividend, 2023_dividend, 2024_dividend,
      2022_operating_income, 2023_operating_income, 2024_operating_income`,
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

      // 영업이익 데이터 확인 및 음수 개수 카운트
      const operatingIncome2022 = safeNumber(rawStockData['2022_operating_income']);
      const operatingIncome2023 = safeNumber(rawStockData['2023_operating_income']);
      const operatingIncome2024 = safeNumber(rawStockData['2024_operating_income']);

      // 3년 중 2년 이상 영업이익이 음수인 기업 제외
      let negativeOperatingIncomeCount = 0;
      if (operatingIncome2022 < 0) negativeOperatingIncomeCount++;
      if (operatingIncome2023 < 0) negativeOperatingIncomeCount++;
      if (operatingIncome2024 < 0) negativeOperatingIncomeCount++;

      if (negativeOperatingIncomeCount >= 2) {
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

      // 연속 배당 확인
      const consecutiveDividend =
        safeNumber(rawStockData['2022_dividend']) > 0 &&
        safeNumber(rawStockData['2023_dividend']) > 0 &&
        safeNumber(rawStockData['2024_dividend']) > 0;

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
          latestroe: safeNumber(fairpriceItem.latestroe),
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

// fetchHowardStocks 함수 - 페이지네이션 적용 (수정된 버전)
export async function fetchHowardStocks(): Promise<StockDataResult<HowardStock>> {
  try {
    console.log('=== 하워드 막스 내재가치 주식 데이터 가져오기 시작 ===');

    // 1. 산업별 성장률 데이터 불러오기
    const industryData = (await import('@/lib/industry-DATA.json').then(
      (module) => module.default
    )) as IndustryData[];

    // 2. stock_checklist 테이블에서 부채비율 조건에 맞는 종목만 필터링
    console.log('부채비율 기준에 맞는 종목 필터링 중...');
    const stockData = await fetchAllDataWithPagination<any>(
      'stock_checklist',
      'stock_code, company_name, industry, subindustry, debtratio'
    );

    if (!stockData || stockData.length === 0) {
      return emptyResult<HowardStock>('주식 데이터를 찾을 수 없습니다.');
    }

    // 산업군별 부채비율 조건에 맞는 종목만 필터링
    const filteredStockData = stockData.filter((item) =>
      isDebtRatioAcceptable(item.subindustry, safeNumber(item.debtratio))
    );

    const stockCodes = filteredStockData.map((item) => item.stock_code);
    console.log(
      `총 종목 수: ${stockData.length}, 부채비율 조건 충족 종목 수: ${stockCodes.length}`
    );

    // 부채비율 조건을 충족하는 종목이 없는 경우
    if (stockCodes.length === 0) {
      return emptyResult<HowardStock>('부채비율 조건을 충족하는 종목이 없습니다.');
    }

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

    // 5. 재무 데이터 배치로 가져오기
    const rawData = await fetchDataInBatches<any>(
      'stock_raw_data',
      `stock_code,
      shares_outstanding,
      2022_operating_cash_flow, 2022_capex, 2022_free_cash_flow, 2022_operating_income,
      2023_operating_cash_flow, 2023_capex, 2023_free_cash_flow, 2023_operating_income,
      2024_operating_cash_flow, 2024_capex, 2024_free_cash_flow, 2024_operating_income,
      2022_dividend, 2023_dividend, 2024_dividend`,
      stockCodes
    );

    // 6. 데이터 맵 생성
    console.log('데이터 맵 생성 중...');
    const stockMap = new Map(filteredStockData.map((item) => [item.stock_code, item]));
    const priceMap = new Map(
      priceData.map((item) => [item.stock_code, safeNumber(item.current_price)])
    );
    const dividendMap = new Map(
      dividendData.map((item) => [item.stock_code, safeNumber(item.current_dividend)])
    );
    const rawDataMap = new Map(rawData.map((item) => [item.stock_code, item]));

    // 7. 하워드 막스 내재가치 계산 및 종목 필터링
    console.log('하워드 막스 내재가치 계산 및 종목 필터링 중...');
    const howardStocks: HowardStock[] = [];
    const DISCOUNT_RATE = 0.08; // 요구사항대로 8% 고정
    const MIN_MARGIN_OF_SAFETY = 0.3; // 30% 안전마진

    for (const stockCode of stockCodes) {
      const stockInfo = stockMap.get(stockCode);
      const currentPrice = priceMap.get(stockCode);
      const dividendYield = dividendMap.get(stockCode);
      const rawStockData = rawDataMap.get(stockCode);

      // 필요한 모든 데이터가 있는지 확인
      if (!stockInfo || !currentPrice || !rawStockData) {
        continue;
      }

      // 영업이익 데이터 확인 및 음수 개수 카운트
      const operatingIncome2022 = safeNumber(rawStockData['2022_operating_income']);
      const operatingIncome2023 = safeNumber(rawStockData['2023_operating_income']);
      const operatingIncome2024 = safeNumber(rawStockData['2024_operating_income']);

      // 3년 중 2년 이상 영업이익이 음수인 기업 제외
      let negativeOperatingIncomeCount = 0;
      if (operatingIncome2022 < 0) negativeOperatingIncomeCount++;
      if (operatingIncome2023 < 0) negativeOperatingIncomeCount++;
      if (operatingIncome2024 < 0) negativeOperatingIncomeCount++;

      if (negativeOperatingIncomeCount >= 2) {
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

      // FCF 계산 (없거나 0이면 영업현금흐름 - 자본지출 방식 사용)
      let fcf2022 = safeNumber(rawStockData['2022_free_cash_flow']);
      let fcf2023 = safeNumber(rawStockData['2023_free_cash_flow']);
      let fcf2024 = safeNumber(rawStockData['2024_free_cash_flow']);

      // FCF가 null이거나 0인 경우 영업현금흐름 - 자본지출로 계산
      if (fcf2022 === 0) {
        const ocf2022 = safeNumber(rawStockData['2022_operating_cash_flow']);
        const capex2022 = safeNumber(rawStockData['2022_capex']);
        fcf2022 = ocf2022 - capex2022;
      }

      if (fcf2023 === 0) {
        const ocf2023 = safeNumber(rawStockData['2023_operating_cash_flow']);
        const capex2023 = safeNumber(rawStockData['2023_capex']);
        fcf2023 = ocf2023 - capex2023;
      }

      if (fcf2024 === 0) {
        const ocf2024 = safeNumber(rawStockData['2024_operating_cash_flow']);
        const capex2024 = safeNumber(rawStockData['2024_capex']);
        fcf2024 = ocf2024 - capex2024;
      }

      // FCF 정규화 (중앙값 방식)
      const fcfValues = [fcf2022, fcf2023, fcf2024].filter((fcf) => fcf !== 0);
      if (fcfValues.length === 0) {
        continue;
      }

      // 정렬 후 중앙값 가져오기
      fcfValues.sort((a, b) => a - b);
      const fcfMedian =
        fcfValues.length % 2 === 0
          ? (fcfValues[fcfValues.length / 2 - 1] + fcfValues[fcfValues.length / 2]) / 2
          : fcfValues[Math.floor(fcfValues.length / 2)];

      // 주당 FCF 계산
      const fcfPerShare = fcfMedian / sharesOutstanding;

      // 산업별 성장률 데이터 찾기
      let industryInfo = industryData.find((item) => item.industry === stockInfo.industry);
      if (!industryInfo) {
        // 해당 산업이 없으면 'etc' 카테고리 사용
        industryInfo = industryData.find((item) => item.industry === 'etc')!;
      }

      // 시나리오별 성장률 및 영구성장률 설정
      const baseGrowthRate = industryInfo.minGrowthRate / 100;
      const optimisticGrowthRate = industryInfo.maxGrowthRate / 100;
      const conservativeGrowthRate = Math.max(0.01, (industryInfo.minGrowthRate - 1) / 100); // 최소 1%

      const basePerpetualGrowthRate = industryInfo.minPerpetualGrowthRate / 100;
      const optimisticPerpetualGrowthRate = industryInfo.maxPerpetualGrowthRate / 100;
      const conservativePerpetualGrowthRate = industryInfo.minPerpetualGrowthRate / 100;

      // 시나리오별 할인율 설정
      const baseDiscountRate = DISCOUNT_RATE;
      const optimisticDiscountRate = DISCOUNT_RATE - 0.02; // 6%
      const conservativeDiscountRate = DISCOUNT_RATE + 0.04; // 12%

      // DCF 모델로 내재가치 계산 (10년 + 영구가치)
      const baseIntrinsicValue = calculateDCF(
        fcfPerShare,
        baseGrowthRate,
        basePerpetualGrowthRate,
        baseDiscountRate
      );

      const optimisticIntrinsicValue = calculateDCF(
        fcfPerShare,
        optimisticGrowthRate,
        optimisticPerpetualGrowthRate,
        optimisticDiscountRate
      );

      const conservativeIntrinsicValue = calculateDCF(
        fcfPerShare,
        conservativeGrowthRate,
        conservativePerpetualGrowthRate,
        conservativeDiscountRate
      );

      // 안전마진 계산
      const marginOfSafety =
        baseIntrinsicValue > 0 ? (baseIntrinsicValue - currentPrice) / baseIntrinsicValue : 0;

      // 연속 배당 확인
      const consecutiveDividend =
        safeNumber(rawStockData['2022_dividend']) > 0 &&
        safeNumber(rawStockData['2023_dividend']) > 0 &&
        safeNumber(rawStockData['2024_dividend']) > 0;

      // 조건 확인: 현재가 < 기본 시나리오 내재가치 & 안전마진 >= 30%
      if (currentPrice < baseIntrinsicValue && marginOfSafety >= MIN_MARGIN_OF_SAFETY) {
        howardStocks.push({
          stock_code: stockCode,
          company_name: stockInfo.company_name,
          industry: stockInfo.industry || '미분류',
          subindustry: stockInfo.subindustry || '미분류',
          current_price: currentPrice,
          dividend_yield: dividendYield || 0,
          fcf_median: fcfMedian,
          fcf_per_share: fcfPerShare,
          base_intrinsic_value: baseIntrinsicValue,
          optimistic_intrinsic_value: optimisticIntrinsicValue,
          conservative_intrinsic_value: conservativeIntrinsicValue,
          discount_rate: DISCOUNT_RATE * 100,
          margin_of_safety: marginOfSafety * 100,
          consecutive_dividend: consecutiveDividend,
        });
      }
    }

    // 8. 산업군과 하위 산업군 목록 생성
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

// 향상된 그레이엄 가치주 데이터 가져오기
export async function fetchEnhancedGrahamStocks(): Promise<StockDataResult<EnhancedGrahamStock>> {
  try {
    console.log('=== 향상된 그레이엄 가치주 데이터 가져오기 시작 ===');

    // 1. PER 조건에 맞는 종목 가져오기 (PER 0-10)
    const perData = await fetchAllDataWithPagination<any>(
      'stock_current',
      'stock_code, current_per, current_dividend',
      'stock_code',
      (query) => query.gt('current_per', 0).lte('current_per', 10).not('current_per', 'is', null)
    );

    if (!perData || perData.length === 0) {
      console.log('PER 조건에 맞는 주식이 없습니다.');
      return emptyResult<EnhancedGrahamStock>('PER 조건에 맞는 주식을 찾을 수 없습니다.');
    }

    const perStockCodes = perData.map((item) => item.stock_code);
    console.log(`PER 조건 통과 종목 수: ${perStockCodes.length}`);

    // 2. 부채비율 조건에 맞는 종목 배치로 가져오기 (부채비율 100% 미만)
    const debtData = await fetchDataInBatches<any>(
      'stock_checklist',
      'stock_code, company_name, industry, subindustry, debtratio',
      perStockCodes
    );

    // 부채비율 조건 필터링
    const filteredDebtData = debtData.filter(
      (item) => item.debtratio !== null && item.debtratio < 100
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

    // 4. 재무 데이터 배치로 가져오기
    const rawData = await fetchDataInBatches<any>(
      'stock_raw_data',
      `stock_code,
      2022_eps, 2023_eps, 2024_eps,
      2024_equity,
      shares_outstanding,
      2022_dividend, 2023_dividend, 2024_dividend,
      2024_current_assets, 2024_current_liabilities, 2024_non_current_liabilities`,
      debtStockCodes
    );

    if (!rawData || rawData.length === 0) {
      console.log('재무 데이터가 없습니다.');
      return emptyResult<EnhancedGrahamStock>('재무 데이터를 찾을 수 없습니다.');
    }

    // 5. 데이터 맵 생성
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

    // 6. 종목 필터링 및 그레이엄 가격 계산
    console.log('종목 필터링 및 그레이엄 가격 계산 중...');
    const enhancedGrahamStocks: EnhancedGrahamStock[] = [];

    for (const stockCode of debtStockCodes) {
      const debtInfo = debtMap.get(stockCode);
      const perInfo = perMap.get(stockCode);
      const currentPrice = priceMap.get(stockCode);
      const rawStockData = rawDataMap.get(stockCode);

      // 필요한 모든 데이터가 있는지 확인
      if (!debtInfo || !perInfo || !currentPrice || !rawStockData) {
        continue;
      }

      // EPS 데이터 추출 및 평균 계산
      const eps2022 = safeNumber(rawStockData['2022_eps']);
      const eps2023 = safeNumber(rawStockData['2023_eps']);
      const eps2024 = safeNumber(rawStockData['2024_eps']);

      const epsData = [eps2022, eps2023, eps2024].filter((eps) => eps > 0);
      const avgEps =
        epsData.length > 0 ? epsData.reduce((sum, eps) => sum + eps, 0) / epsData.length : 0;

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

      // BPS 계산 (주당 순자산가치)
      const equity = safeNumber(rawStockData['2024_equity']);
      const bps = equity / sharesOutstanding;

      // 기존 그레이엄 가격 계산: [(3년간 eps 평균 * 8) + 2024년 bps} / 2] * 67%
      const grahamPrice = ((avgEps * 8 + bps) / 2) * 0.67;

      // NCAV 계산
      const currentAssets = safeNumber(rawStockData['2024_current_assets']);
      const currentLiabilities = safeNumber(rawStockData['2024_current_liabilities']);
      const nonCurrentLiabilities = safeNumber(rawStockData['2024_non_current_liabilities']);

      // 회사 전체 NCAV 계산
      const totalNCAV = currentAssets - (currentLiabilities + nonCurrentLiabilities);

      // 주당 NCAV 계산
      const ncavPerShare = totalNCAV / sharesOutstanding;

      // NCAV가 음수인 경우 0으로 처리
      const nonNegativeNcav = ncavPerShare > 0 ? ncavPerShare : 0;

      // NCAV의 2/3 가격 (그레이엄의 투자 기준)
      const ncavPrice = nonNegativeNcav * (2 / 3);

      // 수정 그레이엄 가격 계산: [(3년간 EPS 평균 × 8) + NCAV] ÷ 2 × 67%
      const modifiedGrahamPrice = ((avgEps * 8 + nonNegativeNcav) / 2) * 0.67;

      // 저평가율 계산 (그레이엄 가격 기준)
      const discountRate =
        modifiedGrahamPrice > 0
          ? ((modifiedGrahamPrice - currentPrice) / modifiedGrahamPrice) * 100
          : 0;

      // 연속 배당 확인
      const consecutiveDividend =
        safeNumber(rawStockData['2022_dividend']) > 0 &&
        safeNumber(rawStockData['2023_dividend']) > 0 &&
        safeNumber(rawStockData['2024_dividend']) > 0;

      // 조건 확인: 현재가 < 수정 그레이엄 가격 (저평가 종목만 포함)
      if (currentPrice < modifiedGrahamPrice && discountRate > 0) {
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
          consecutive_dividend: consecutiveDividend,
          bps: bps,
          avg_eps: avgEps,
          ncav: ncavPerShare,
          ncav_price: ncavPrice,
          modified_graham_price: modifiedGrahamPrice,
        });
      }
    }

    // 7. 산업군과 하위 산업군 목록 생성
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
