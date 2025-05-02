// src/lib/stockDataService.ts

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

// 고배당 가치주 데이터 가져오기 (Flavor Stocks)
export async function fetchFlavorStocks(): Promise<StockDataResult<FlavorStock>> {
  try {
    // 1. 배당률 데이터 가져오기 (stock_current 테이블에서)
    const { data: dividendData, error: dividendError } = await supabase
      .from('stock_current')
      .select('stock_code, current_dividend')
      .not('current_dividend', 'is', null);

    if (dividendError) throw new Error(dividendError.message);

    if (!dividendData || dividendData.length === 0) {
      return emptyResult<FlavorStock>('배당 데이터를 찾을 수 없습니다.');
    }

    // 1-2. 자산 데이터 가져오기 (stock_raw_data 테이블에서)
    const { data: assetsData, error: assetsError } = await supabase
      .from('stock_raw_data')
      .select('stock_code, 2024_assets')
      .in(
        'stock_code',
        dividendData.map((item) => item.stock_code)
      );

    if (assetsError) throw new Error(assetsError.message);

    // 기본 필터링 조건(PER, PBR)에 맞는 종목 코드만 추출
    const stockCodes = dividendData
      .filter((item) => item['current_dividend'] >= 5) // 기본 최소 배당률 5%
      .map((item) => item.stock_code);

    if (stockCodes.length === 0) {
      return emptyResult<FlavorStock>('배당률 조건에 맞는 주식을 찾을 수 없습니다.');
    }

    // 2. PER, PBR 조건에 맞는 종목 가져오기
    const { data: currentData, error: currentError } = await supabase
      .from('stock_current')
      .select('stock_code, current_per, current_pbr')
      .in('stock_code', stockCodes)
      .gt('current_per', 0)
      .lte('current_per', 10)
      .lte('current_pbr', 1)
      .not('current_per', 'is', null)
      .not('current_pbr', 'is', null);

    if (currentError) throw new Error(currentError.message);

    if (!currentData || currentData.length === 0) {
      return emptyResult<FlavorStock>('PER, PBR 조건에 맞는 주식을 찾을 수 없습니다.');
    }

    // 조건을 만족하는 종목 코드
    const filteredCodes = currentData.map((item) => item.stock_code);

    // 3. 현재가 및 회사 정보 데이터 가져오기
    const { data: stockInfo, error: stockInfoError } = await supabase
      .from('stock_price')
      .select(
        `
        stock_code,
        company_name,
        current_price
      `
      )
      .in('stock_code', filteredCodes);

    if (stockInfoError) throw new Error(stockInfoError.message);

    // 4. 산업 정보 가져오기
    const { data: industryInfo, error: industryError } = await supabase
      .from('stock_checklist')
      .select(
        `
        stock_code,
        industry,
        subindustry
      `
      )
      .in('stock_code', filteredCodes);

    if (industryError) throw new Error(industryError.message);

    // 5. 데이터 조인
    const perPbrMap = new Map(
      currentData.map((item) => [item.stock_code, { per: item.current_per, pbr: item.current_pbr }])
    );

    const assetsMap = new Map(
      assetsData?.map((item) => [item.stock_code, item['2024_assets'] || 0]) || []
    );

    // 배당 데이터 맵 생성
    const dividendMap = new Map(
      dividendData.map((item) => [item.stock_code, item['current_dividend'] || 0])
    );

    // 기존 dividendAssetsMap 대신 두 맵을 사용하여 새로운 맵 생성
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
      industryInfo?.map((item) => [
        item.stock_code,
        {
          industry: item.industry || '미분류',
          subindustry: item.subindustry || '미분류',
        },
      ]) || []
    );

    // 모든 조건을 만족하는 종목 데이터 구성
    const flavorStocks: FlavorStock[] =
      stockInfo?.map((item) => ({
        stock_code: item.stock_code,
        company_name: item.company_name,
        industry: industryMap.get(item.stock_code)?.industry || '미분류',
        subindustry: industryMap.get(item.stock_code)?.subindustry || '미분류',
        current_per: perPbrMap.get(item.stock_code)?.per || 0,
        current_pbr: perPbrMap.get(item.stock_code)?.pbr || 0,
        current_price: item.current_price || 0,
        dividend_yield: dividendAssetsMap.get(item.stock_code)?.dividend || 0,
        assets: dividendAssetsMap.get(item.stock_code)?.assets || 0,
      })) || [];

    // 산업군과 하위 산업군 목록 생성
    const uniqueIndustries = Array.from(
      new Set(flavorStocks.map((stock) => stock.industry))
    ).sort();

    const uniqueSubIndustries = Array.from(
      new Set(flavorStocks.map((stock) => stock.subindustry))
    ).sort();

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

// 그레이엄 가치주 데이터 가져오기 (Graham Stocks)
export async function fetchGrahamStocks(): Promise<StockDataResult<GrahamStock>> {
  try {
    // 1. PER 조건에 맞는 종목 먼저 가져오기
    const { data: currentData, error: currentError } = await supabase
      .from('stock_current')
      .select('stock_code, current_per')
      .gt('current_per', 0) // PER이 0보다 큰 경우 (0 초과)
      .lte('current_per', 10) // PER이 10 이하
      .not('current_per', 'is', null);

    if (currentError) throw new Error(currentError.message);

    if (!currentData || currentData.length === 0) {
      return emptyResult<GrahamStock>('PER 조건에 맞는 주식을 찾을 수 없습니다.');
    }

    // PER 조건을 만족하는 종목 코드
    const perStockCodes = currentData.map((item) => item.stock_code);

    // 2. 부채비율 조건에 맞는 종목 가져오기
    const { data: checklist, error: checklistError } = await supabase
      .from('stock_checklist')
      .select(
        `
        stock_code,
        company_name,
        industry,
        subindustry,
        debtratio
      `
      )
      .in('stock_code', perStockCodes) // PER 조건을 만족하는 종목만 필터링
      .lt('debtratio', 100)
      .not('debtratio', 'is', null);

    if (checklistError) throw new Error(checklistError.message);

    if (!checklist || checklist.length === 0) {
      return emptyResult<GrahamStock>('부채비율 조건에 맞는 주식을 찾을 수 없습니다.');
    }

    // 최종 조건을 만족하는 종목 코드
    const filteredCodes = checklist.map((item) => item.stock_code);

    // 3. 현재가 데이터 가져오기
    const { data: priceData, error: priceError } = await supabase
      .from('stock_price')
      .select('stock_code, current_price')
      .in('stock_code', filteredCodes);

    if (priceError) throw new Error(priceError.message);

    // 4. 배당률 데이터 가져오기
    const { data: dividendAssetsData, error: dividendError } = await supabase
      .from('stock_current')
      .select('stock_code, current_dividend')
      .in('stock_code', filteredCodes);

    if (dividendError) throw new Error(dividendError.message);

    // 5. 데이터 조인
    const perMap = new Map(currentData.map((item) => [item.stock_code, item.current_per]));

    const priceMap = new Map(priceData?.map((item) => [item.stock_code, item.current_price]) || []);

    const dividendMap = new Map(
      dividendAssetsData?.map((item) => [item.stock_code, item['current_dividend'] || 0]) || []
    );

    // 모든 조건을 만족하는 종목만 필터링
    const filteredChecklist = checklist.filter((item) => filteredCodes.includes(item.stock_code));

    if (filteredChecklist.length === 0) {
      return emptyResult<GrahamStock>('조건에 맞는 주식을 찾을 수 없습니다.');
    }

    // 데이터 형식 변환
    const grahamStocks: GrahamStock[] = filteredChecklist.map((item) => ({
      stock_code: item.stock_code,
      company_name: item.company_name,
      industry: item.industry || '미분류',
      subindustry: item.subindustry || '미분류',
      current_per: perMap.get(item.stock_code) || 0,
      debtratio: item.debtratio || 0,
      current_price: priceMap.get(item.stock_code) || 0,
      dividend_yield: dividendMap.get(item.stock_code) || 0,
    }));

    // 산업군과 하위 산업군 목록 생성
    const uniqueIndustries = Array.from(
      new Set(grahamStocks.map((stock) => stock.industry))
    ).sort();

    const uniqueSubIndustries = Array.from(
      new Set(grahamStocks.map((stock) => stock.subindustry))
    ).sort();

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

// 비즈니스 퀄리티 주식 데이터 가져오기
export async function fetchQualityStocks(): Promise<StockDataResult<QualityStock>> {
  try {
    // 1. stock_raw_data 테이블에서 ROE와 영업이익률 계산에 필요한 데이터 가져오기
    const { data: rawData, error: rawDataError } = await supabase.from('stock_raw_data').select(`
        stock_code, 
        2022_net_income, 2023_net_income, 2024_net_income,
        2022_equity, 2023_equity, 2024_equity,
        2022_operating_income, 2023_operating_income, 2024_operating_income,
        2022_revenue, 2023_revenue, 2024_revenue
      `);

    if (rawDataError) throw new Error(rawDataError.message);
    if (!rawData || rawData.length === 0) {
      return emptyResult<QualityStock>('재무 데이터를 찾을 수 없습니다.');
    }

    // 2. 각 종목별로 ROE와 영업이익률 계산
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

      // 조건에 맞는 종목만 저장 (ROE >= 10%, 영업이익률 >= 15%)
      if (avgRoe >= 10 && avgMargin >= 15) {
        qualityStocksMap.set(stock.stock_code, {
          avg_roe: avgRoe,
          avg_operating_margin: avgMargin,
        });
      }
    });

    // 3. 조건을 만족하는 종목 코드
    const filteredCodes = Array.from(qualityStocksMap.keys());

    if (filteredCodes.length === 0) {
      return emptyResult<QualityStock>('조건에 맞는 주식을 찾을 수 없습니다.');
    }

    // 4. PER 데이터 가져오기 - 음수 PER 제외
    const { data: perData, error: perError } = await supabase
      .from('stock_current')
      .select('stock_code, current_per, current_dividend')
      .in('stock_code', filteredCodes)
      .gt('current_per', 0); // current_per > 0 조건 추가 (음수 PER 제외)

    if (perError) throw new Error(perError.message);

    // PER 조건을 만족하는 종목 코드만 다시 필터링
    const perFilteredCodes = perData?.map((item) => item.stock_code) || [];

    if (perFilteredCodes.length === 0) {
      return emptyResult<QualityStock>('PER 조건까지 만족하는 주식을 찾을 수 없습니다.');
    }

    // 5. 현재가 및 회사 정보 데이터 가져오기
    const { data: stockInfo, error: stockInfoError } = await supabase
      .from('stock_price')
      .select(
        `
        stock_code,
        company_name,
        current_price
      `
      )
      .in('stock_code', perFilteredCodes);

    if (stockInfoError) throw new Error(stockInfoError.message);

    // 6. 산업 정보 가져오기
    const { data: industryInfo, error: industryError } = await supabase
      .from('stock_checklist')
      .select(
        `
        stock_code,
        industry,
        subindustry
      `
      )
      .in('stock_code', perFilteredCodes);

    if (industryError) throw new Error(industryError.message);

    // 7. 데이터 맵 생성
    const perMap = new Map(
      perData?.map((item) => [
        item.stock_code,
        {
          per: item.current_per || 0,
          dividend: item['current_dividend'] || 0,
        },
      ]) || []
    );

    const industryMap = new Map(
      industryInfo?.map((item) => [
        item.stock_code,
        {
          industry: item.industry || '미분류',
          subindustry: item.subindustry || '미분류',
        },
      ]) || []
    );

    // 8. 모든 조건을 만족하는 종목 데이터 구성
    const QualityStocks: QualityStock[] =
      stockInfo?.map((item) => {
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
        };
      }) || [];

    // 9. 산업군과 하위 산업군 목록 생성
    const uniqueIndustries = Array.from(
      new Set(QualityStocks.map((stock) => stock.industry))
    ).sort();

    const uniqueSubIndustries = Array.from(
      new Set(QualityStocks.map((stock) => stock.subindustry))
    ).sort();

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
