// src/app/quality/qualityStock.ts
import { supabase } from '@/lib/supabaseClient';
import { QualityStock, StockDataResult } from '@/utils/stockDataTypes';
import { fetchAllDataWithPagination, fetchDataInBatches } from '@/utils/stockDataUtils';
import { emptyResult, safeNumber, hasConsecutiveDividend } from '@/utils/stockDataCommon';

/**
 * 비즈니스 퀄리티 주식 데이터를 가져오는 함수
 * - ROE 10% 이상
 * - 영업이익률 15% 이상
 * - PER > 0
 */
export async function fetchQualityStocks(): Promise<StockDataResult<QualityStock>> {
  try {
    console.log('=== 비즈니스 퀄리티 주식 데이터 가져오기 시작 ===');

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

    // ROE 데이터가 있는 종목 수 확인
    const { count: roeCount, error: roeCountError } = await supabase
      .from('stock_naver_data')
      .select('*', { count: 'exact', head: true })
      .not('2024_roe', 'is', null);

    if (roeCountError) {
      console.error('ROE 데이터 있는 종목 수 확인 오류:', roeCountError);
    } else {
      console.log(`ROE 데이터가 있는 종목 수: ${roeCount}`);
    }

    // 데이터 패치 확인동작 끝!!!!

    // 1. 모든 재무 데이터를 한 번에 가져오기 (5년 데이터)
    const rawData = await fetchAllDataWithPagination<any>(
      'stock_naver_data',
      `stock_code, company_name, industry, subindustry,
      2020_roe, 2021_roe, 2022_roe, 2023_roe, 2024_roe,
      2020_operating_margin, 2021_operating_margin, 2022_operating_margin, 2023_operating_margin, 2024_operating_margin,
      2020_dividend, 2021_dividend, 2022_dividend, 2023_dividend, 2024_dividend`
    );

    if (!rawData || rawData.length === 0) {
      return emptyResult<QualityStock>('재무 데이터를 찾을 수 없습니다.');
    }

    console.log(`재무 데이터 가져오기 완료: ${rawData.length}개 종목`);

    // 2. 각 종목별로 ROE와 영업이익률 계산 및 필터링
    console.log('ROE와 영업이익률 계산 및 필터링 중...');
    const qualityStockData = [];

    for (const stock of rawData) {
      // ROE 계산
      const roeArray = [
        safeNumber(stock['2020_roe']),
        safeNumber(stock['2021_roe']),
        safeNumber(stock['2022_roe']),
        safeNumber(stock['2023_roe']),
        safeNumber(stock['2024_roe']),
      ].filter((roe) => roe > 0);

      // 영업이익률 계산
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
        qualityStockData.push({
          stock_code: stock.stock_code,
          company_name: stock.company_name || '',
          industry: stock.industry || '미분류',
          subindustry: stock.subindustry || '미분류',
          avg_roe: avgRoe,
          avg_operating_margin: avgMargin,
          consecutive_dividend: consecutiveDividend,
        });
      }
    }

    console.log(`ROE, 영업이익률 조건 통과 종목 수: ${qualityStockData.length}`);

    if (qualityStockData.length === 0) {
      return emptyResult<QualityStock>('조건에 맞는 주식을 찾을 수 없습니다.');
    }

    // 3. 조건을 만족하는 종목 코드 추출
    const filteredCodes = qualityStockData.map((item) => item.stock_code);

    // 4. PER 및 배당률 데이터 배치로 가져오기
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

    // 5. 현재가 데이터 가져오기
    const priceData = await fetchDataInBatches<any>(
      'stock_price',
      'stock_code, current_price',
      perFilteredCodes
    );

    if (!priceData || priceData.length === 0) {
      return emptyResult<QualityStock>('현재가 데이터를 찾을 수 없습니다.');
    }

    // 6. 데이터 맵 생성
    console.log('데이터 맵 생성 중...');

    // 퀄리티 스톡 맵(ROE, 영업이익률, 배당 정보)
    const qualityStockMap = new Map(qualityStockData.map((item) => [item.stock_code, item]));

    // PER, 배당률 맵
    const perMap = new Map(
      validPerData.map((item) => [
        item.stock_code,
        {
          per: safeNumber(item.current_per),
          dividend: safeNumber(item.current_dividend),
        },
      ])
    );

    // 주가 맵
    const priceMap = new Map(
      priceData.map((item) => [item.stock_code, safeNumber(item.current_price)])
    );

    // 7. 최종 데이터 구성
    console.log('최종 데이터 구성 중...');
    const qualityStocks: QualityStock[] = [];

    for (const stockCode of perFilteredCodes) {
      const qualityData = qualityStockMap.get(stockCode);
      const perData = perMap.get(stockCode);
      const currentPrice = priceMap.get(stockCode);

      // 모든 필요한 데이터가 있는지 확인
      if (qualityData && perData && currentPrice) {
        qualityStocks.push({
          stock_code: stockCode,
          company_name: qualityData.company_name,
          industry: qualityData.industry,
          subindustry: qualityData.subindustry,
          current_per: perData.per,
          current_price: currentPrice,
          dividend_yield: perData.dividend || 0,
          avg_roe: qualityData.avg_roe,
          avg_operating_margin: qualityData.avg_operating_margin,
          consecutive_dividend: qualityData.consecutive_dividend,
        });
      }
    }

    // 8. 산업군과 하위 산업군 목록 생성
    console.log('산업군 및 하위 산업군 목록 생성 중...');
    const uniqueIndustries = Array.from(
      new Set(qualityStocks.map((stock) => stock.industry))
    ).sort();
    const uniqueSubIndustries = Array.from(
      new Set(qualityStocks.map((stock) => stock.subindustry))
    ).sort();

    console.log(`최종 필터링 후 종목 수: ${qualityStocks.length}`);

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
