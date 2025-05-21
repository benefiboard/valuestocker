// src/utils/stockDataUtils.ts
import { supabase } from '@/lib/supabaseClient';
import { safeNumber, isDebtRatioAcceptable } from './stockDataCommon';

// 캐시 데이터 인터페이스
interface DebtRatioStocksCache {
  timestamp: string;
  stocks: Array<{
    stock_code: string;
    company_name: string;
    industry: string;
    subindustry: string;
    debtratio: number;
  }>;
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
      allData = [...allData, ...(data as T[])];
      console.log(`Retrieved ${data.length} records. Total so far: ${allData.length}`);
      page++;

      // 페이지 크기보다 작은 데이터를 받았을 때만 종료
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
export async function fetchDataInBatches<T>(
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
      allData = [...allData, ...(data as T[])];
      console.log(`Added ${data.length} records from batch ${i + 1}. Total: ${allData.length}`);
    }
  }

  return allData;
}

// 부채비율 조건을 충족하는 종목 가져오기 (단일 테이블 조회 + 캐싱 적용)
export async function getDebtRatioFilteredStocks() {
  try {
    // 로컬 스토리지에서 캐시 확인
    const cachedData = localStorage.getItem('debt_ratio_filtered_stocks');

    if (cachedData) {
      try {
        const parsedData = JSON.parse(cachedData) as DebtRatioStocksCache;

        // 캐시 유효기간 확인 (14일)
        const cachedDate = new Date(parsedData.timestamp);
        const now = new Date();
        const daysSinceCached = (now.getTime() - cachedDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceCached < 14) {
          console.log('캐시된 부채비율 데이터 사용');
          return parsedData.stocks;
        }
      } catch (e) {
        console.warn('캐시 데이터 파싱 오류, 새로운 데이터를 사용합니다');
      }
    }

    // 단일 테이블에서 모든 필요 데이터 조회
    const { data, error } = await supabase
      .from('stock_naver_data')
      .select('stock_code, company_name, industry, subindustry, 2024_debt_ratio')
      .not('2024_debt_ratio', 'is', null);

    if (error) throw error;

    // 부채비율 조건에 맞는 종목만 필터링
    const filteredStocks = data
      .filter((item) => {
        const debtRatio = safeNumber(item['2024_debt_ratio']);
        return isDebtRatioAcceptable(item.subindustry, debtRatio);
      })
      .map((item) => ({
        stock_code: item.stock_code,
        company_name: item.company_name || '',
        industry: item.industry || '미분류',
        subindustry: item.subindustry || '미분류',
        debtratio: safeNumber(item['2024_debt_ratio']),
      }));

    console.log(`부채비율 조건을 충족하는 종목 수: ${filteredStocks.length}`);

    // 캐시에 저장
    const cacheData: DebtRatioStocksCache = {
      timestamp: new Date().toISOString(),
      stocks: filteredStocks,
    };
    localStorage.setItem('debt_ratio_filtered_stocks', JSON.stringify(cacheData));
    console.log('새로운 부채비율 데이터 저장');

    return filteredStocks;
  } catch (error) {
    console.error('부채비율 데이터 조회 오류:', error);
    return [];
  }
}
