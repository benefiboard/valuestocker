// src/app/capm/capmCalculate.ts

import { supabase } from '../../lib/supabaseClient';
import { CAPMCalculationParams, CAPMResult, ROEData, StockRawData } from './types';

// ROE 계산 함수
const calculateROE = (netIncome: number, equity: number): number => {
  if (equity <= 0) return 0;
  return (netIncome / equity) * 100;
};

// stock_raw_data에서 데이터 가져오기
export const getStockRawData = async (stockCode: string): Promise<StockRawData | null> => {
  const { data, error } = await supabase
    .from('stock_raw_data')
    .select(
      `
      stock_code,
      company_name,
      2022_net_income,
      2022_equity,
      2023_net_income,
      2023_equity,
      2024_net_income,
      2024_equity
    `
    )
    .eq('stock_code', stockCode)
    .single();

  if (error || !data) {
    console.error('Error fetching stock raw data:', error);
    return null;
  }

  return data;
};

// stock_current에서 PBR 데이터 가져오기
export const getStockCurrentPBR = async (stockCode: string): Promise<number | null> => {
  const { data, error } = await supabase
    .from('stock_current')
    .select('current_pbr')
    .eq('stock_code', stockCode)
    .single();

  if (error || !data) {
    console.error('Error fetching stock current data:', error);
    return null;
  }

  return data.current_pbr;
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

// 예상 적정 PBR 계산
export const calculateExpectedPBR = (params: CAPMCalculationParams): number => {
  const { settingROE, discountRate, sustainableYears } = params;

  // 예상 적정 PBR = [(1+설정ROE)/(1+r)]^n
  const base = (1 + settingROE / 100) / (1 + discountRate / 100);
  const expectedPBR = Math.pow(base, sustainableYears);

  return expectedPBR;
};

// 예상 수익률 계산
export const calculateExpectedReturn = (expectedPBR: number, currentPBR: number): number => {
  if (currentPBR <= 0) return 0;
  return ((expectedPBR - currentPBR) / currentPBR) * 100;
};

// CAPM 전체 계산
export const calculateCAPM = async (
  stockCode: string,
  params: CAPMCalculationParams
): Promise<CAPMResult | null> => {
  try {
    // 1. 데이터 가져오기 (병렬 처리)
    const [rawData, currentPBR, currentPrice] = await Promise.all([
      getStockRawData(stockCode),
      getStockCurrentPBR(stockCode),
      getStockPrice(stockCode),
    ]);

    if (!rawData || currentPBR === null || currentPrice === null) {
      throw new Error('주식 데이터를 찾을 수 없습니다.');
    }

    // 2. 연도별 ROE 계산
    const roeData: ROEData[] = [
      {
        year: 2022,
        netIncome: rawData['2022_net_income'],
        equity: rawData['2022_equity'],
        roe: calculateROE(rawData['2022_net_income'], rawData['2022_equity']),
      },
      {
        year: 2023,
        netIncome: rawData['2023_net_income'],
        equity: rawData['2023_equity'],
        roe: calculateROE(rawData['2023_net_income'], rawData['2023_equity']),
      },
      {
        year: 2024,
        netIncome: rawData['2024_net_income'],
        equity: rawData['2024_equity'],
        roe: calculateROE(rawData['2024_net_income'], rawData['2024_equity']),
      },
    ];

    // 3. 평균 ROE 계산
    const validROEs = roeData.filter((data) => data.roe > 0);
    const averageROE =
      validROEs.length > 0
        ? validROEs.reduce((sum, data) => sum + data.roe, 0) / validROEs.length
        : 0;

    // 4. 예상 적정 PBR 계산
    const expectedPBR = calculateExpectedPBR(params);

    // 5. BPS(주당순자산) 계산 및 예상 적정가 계산
    const bps = currentPBR > 0 ? currentPrice / currentPBR : 0;
    const expectedPrice = bps * expectedPBR;

    // 6. 예상 수익률 계산
    const expectedReturn = calculateExpectedReturn(expectedPBR, currentPBR);

    return {
      expectedPBR,
      currentPBR,
      currentPrice,
      expectedPrice,
      expectedReturn,
      roeData,
      averageROE,
      companyName: rawData.company_name,
      stockCode: rawData.stock_code,
    };
  } catch (error) {
    console.error('CAPM 계산 오류:', error);
    return null;
  }
};
