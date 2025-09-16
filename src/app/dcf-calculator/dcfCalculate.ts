// src/app/dcf-calculator/dcfCalculate.ts

import { supabase } from '../../lib/supabaseClient';
import {
  DCFCalculationParams,
  DCFResult,
  FCFData,
  StockNaverData,
  StockPriceData,
  FCFGrowthResult,
} from './types';

// stock_naver_data에서 FCF 데이터 가져오기
export const getStockNaverData = async (stockCode: string): Promise<StockNaverData | null> => {
  const { data, error } = await supabase
    .from('stock_naver_data')
    .select(
      `
      stock_code,
      company_name,
      shares_outstanding,
      market_cap,
      2020_free_cash_flow,
      2021_free_cash_flow,
      2022_free_cash_flow,
      2023_free_cash_flow,
      2024_free_cash_flow
    `
    )
    .eq('stock_code', stockCode)
    .single();

  if (error || !data) {
    console.error('Error fetching stock naver data:', error);
    return null;
  }

  return data;
};

// stock_price에서 현재가 데이터 가져오기
export const getStockPrice = async (stockCode: string): Promise<number | null> => {
  const { data, error } = await supabase
    .from('stock_price')
    .select('current_price')
    .eq('stock_code', stockCode)
    .single();

  if (error || !data) {
    console.error('Error fetching stock price data:', error);
    return null;
  }

  return data.current_price;
};

// FCF 성장률 계산 (패널티 시스템 + 25% 상한선)
export const calculateFCFGrowthRate = (fcfArray: number[]): FCFGrowthResult => {
  // 1. 음수 년도 개수 계산
  const negativeYears = fcfArray.filter((fcf) => fcf <= 0).length;

  // 2. 음수가 4회 이상이면 계산 불가
  if (negativeYears >= 4) {
    return {
      finalGrowthRate: 0,
      baseGrowthRate: 0,
      negativeYears,
      penaltyFactor: 0,
      reason: 'FCF 불안정 (음수 4회 이상)',
      recommendation: 'ROE 기반 수익가치 계산 또는 자산가치 평가 권장',
      isCalculable: false,
    };
  }

  // 3. 양수 년도만으로 평균 성장률 계산
  let growthRates: number[] = [];
  for (let i = 1; i < fcfArray.length; i++) {
    if (fcfArray[i - 1] > 0 && fcfArray[i] > 0) {
      const growth = fcfArray[i] / fcfArray[i - 1] - 1;
      growthRates.push(growth);
    }
  }

  if (growthRates.length === 0) {
    return {
      finalGrowthRate: 0,
      baseGrowthRate: 0,
      negativeYears,
      penaltyFactor: 0,
      reason: '연속된 양수 FCF 년도 부족',
      recommendation: 'DCF 평가 부적합, 다른 평가방법 사용',
      isCalculable: false,
    };
  }

  const baseGrowthRate = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;

  // 4. 패널티 적용
  const penaltyMap: { [key: number]: number } = {
    0: 1.0, // 패널티 없음
    1: 1.5, // 33% 할인
    2: 2.0, // 50% 할인
    3: 2.5, // 60% 할인
  };

  const penaltyFactor = penaltyMap[negativeYears] || 1.0;
  let finalGrowthRate = baseGrowthRate / penaltyFactor;

  // 5. 최대 25% 제한
  if (finalGrowthRate > 0.25) {
    finalGrowthRate = 0.25;
  }

  // 6. 음수 성장률은 0으로 처리
  if (finalGrowthRate < 0) {
    finalGrowthRate = 0;
  }

  const reason =
    negativeYears > 0 ? `음수 FCF ${negativeYears}회로 인한 보수적 조정` : '안정적 FCF 성장';

  return {
    finalGrowthRate,
    baseGrowthRate,
    negativeYears,
    penaltyFactor,
    reason,
    isCalculable: true,
  };
};

// 심플한 DCF 계산 (터미널 가치 없이)
export const calculateSimpleDCF = async (
  stockCode: string,
  params: DCFCalculationParams
): Promise<DCFResult | null> => {
  try {
    // 1. 데이터 가져오기
    const [naverData, currentPrice] = await Promise.all([
      getStockNaverData(stockCode),
      getStockPrice(stockCode),
    ]);

    if (!naverData || currentPrice === null) {
      throw new Error('주식 데이터를 찾을 수 없습니다.');
    }

    // 2. FCF 데이터 정리 (원 단위)
    const fcfArray = [
      naverData['2020_free_cash_flow'] || 0,
      naverData['2021_free_cash_flow'] || 0,
      naverData['2022_free_cash_flow'] || 0,
      naverData['2023_free_cash_flow'] || 0,
      naverData['2024_free_cash_flow'] || 0,
    ];

    const fcfData: FCFData[] = fcfArray.map((fcf, index) => ({
      year: 2020 + index,
      fcf,
      isPositive: fcf > 0,
    }));

    // 3. FCF 성장률 계산
    const growthResult = calculateFCFGrowthRate(fcfArray);

    if (!growthResult.isCalculable) {
      return {
        intrinsicValue: 0,
        intrinsicValuePerShare: 0,
        currentMarketCap: naverData.market_cap || 0,
        currentPrice,
        expectedReturn: -100,
        currentFCF: fcfArray[fcfArray.length - 1],
        finalGrowthRate: growthResult.finalGrowthRate,
        baseGrowthRate: growthResult.baseGrowthRate,
        negativeYears: growthResult.negativeYears,
        penaltyFactor: growthResult.penaltyFactor,
        projectedFCF: [],
        discountedFCF: [],
        terminalValue: 0,
        discountedTerminalValue: 0,
        fcfData,
        reason: growthResult.reason,
        recommendation: growthResult.recommendation,
        companyName: naverData.company_name,
        stockCode: naverData.stock_code,
        sharesOutstanding: naverData.shares_outstanding || 0,
      };
    }

    // 4. 최근 FCF 확인
    const currentFCF = fcfArray[fcfArray.length - 1];
    if (currentFCF <= 0) {
      return {
        intrinsicValue: 0,
        intrinsicValuePerShare: 0,
        currentMarketCap: naverData.market_cap || 0,
        currentPrice,
        expectedReturn: -100,
        currentFCF,
        finalGrowthRate: growthResult.finalGrowthRate,
        baseGrowthRate: growthResult.baseGrowthRate,
        negativeYears: growthResult.negativeYears,
        penaltyFactor: growthResult.penaltyFactor,
        projectedFCF: [],
        discountedFCF: [],
        terminalValue: 0,
        discountedTerminalValue: 0,
        fcfData,
        reason: '최근 FCF가 음수여서 계산 불가',
        recommendation: 'ROE 기반 수익가치 계산 권장',
        companyName: naverData.company_name,
        stockCode: naverData.stock_code,
        sharesOutstanding: naverData.shares_outstanding || 0,
      };
    }

    // 5. 10년간 FCF 예측 및 현재가치 계산
    const projectedFCF: number[] = [];
    const discountedFCF: number[] = [];
    let fcf = currentFCF;

    for (let year = 1; year <= params.projectionYears; year++) {
      // FCF 성장
      fcf = fcf * (1 + growthResult.finalGrowthRate);
      projectedFCF.push(fcf);

      // 현재가치로 할인
      const discountedValue = fcf / Math.pow(1 + params.discountRate / 100, year);
      discountedFCF.push(discountedValue);
    }

    // 6. 총 내재가치 = 10년간 할인된 FCF의 합 (터미널 가치 제외, 안전마진 없음)
    const totalIntrinsicValue = discountedFCF.reduce((sum, dcf) => sum + dcf, 0);

    // 7. 주당 내재가치 계산 (순수 값)
    const sharesOutstanding = naverData.shares_outstanding || 1;
    const intrinsicValuePerShare = totalIntrinsicValue / sharesOutstanding;

    // 8. 예상 수익률 계산
    const expectedReturn = ((intrinsicValuePerShare - currentPrice) / currentPrice) * 100;

    return {
      intrinsicValue: totalIntrinsicValue,
      intrinsicValuePerShare,
      currentMarketCap: naverData.market_cap || 0,
      currentPrice,
      expectedReturn,
      currentFCF,
      finalGrowthRate: growthResult.finalGrowthRate,
      baseGrowthRate: growthResult.baseGrowthRate,
      negativeYears: growthResult.negativeYears,
      penaltyFactor: growthResult.penaltyFactor,
      projectedFCF,
      discountedFCF,
      terminalValue: 0, // 터미널 가치 사용 안함
      discountedTerminalValue: 0, // 터미널 가치 사용 안함
      fcfData,
      reason: growthResult.reason,
      companyName: naverData.company_name,
      stockCode: naverData.stock_code,
      sharesOutstanding,
    };
  } catch (error) {
    console.error('DCF 계산 오류:', error);
    return null;
  }
};

// 기존 함수명 유지를 위한 별칭
export const calculateDCF = calculateSimpleDCF;
