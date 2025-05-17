// src/fairprice/FairpriceCalculate.ts

import {
  CalculatedResults,
  CategorizedModels,
  ModelItem,
  StockFairPriceData,
  StockPrice,
} from './types';
import { supabase } from '@/lib/supabaseClient';

// Supabase에서 주식 데이터를 가져오는 함수
export const getStockDataFromSupabase = async (
  stockCode: string
): Promise<StockFairPriceData | null> => {
  const { data, error } = await supabase
    .from('new_stock_fairprice')
    .select('*')
    .eq('stock_code', stockCode)
    .single();

  if (error || !data) return null;

  console.log('Supabase 데이터:', data); // 디버깅용 로그

  // Supabase에서 가져온 데이터를 StockFairPriceData 형식으로 변환
  return {
    stock_code: data.stock_code,
    dart_code: data.dart_code,
    company_name: data.company_name,
    industry: data.industry,
    subIndustry: data.subindustry || '',
    last_updated: data.last_updated || new Date().toISOString(),
    shares_outstanding: data.shares_outstanding || '0',

    // 새로운 적정가 모델 결과
    bps: Number(data.bps || 0),
    weightedRoe: Number(data.weightedroe || 0),
    sRimBase: Number(data.srimbase || 0),
    sRimDecline10pct: Number(data.srimdecline10pct || 0),
    sRimDecline20pct: Number(data.srimdecline20pct || 0),
    profitBasedPrice: Number(data.profitbasedprice || 0),

    // 적정가 범위
    priceRange_lowRange: Number(data.pricerange_lowrange || 0),
    priceRange_midRange: Number(data.pricerange_midrange || 0),
    priceRange_highRange: Number(data.pricerange_highrange || 0),

    // 추가 필드
    trustScore: Number(data.trustscore || 0),
    riskScore: Number(data.riskscore || 0),
  };
};

// Supabase에서 주가 데이터를 가져오는 함수
export const getStockPriceFromSupabase = async (stockCode: string): Promise<StockPrice | null> => {
  const { data, error } = await supabase
    .from('stock_price')
    .select('*')
    .eq('stock_code', stockCode)
    .single();

  if (error || !data) return null;

  console.log('주가 데이터:', data); // 디버깅용 로그

  return {
    code: data.stock_code,
    name: data.company_name,
    price: Number(data.current_price || 0),
    sharesOutstanding: 0, // 필요하면 채울 수 있음
    formattedDate: data.last_updated,
  };
};

// 신호등 시스템 함수
export const getPriceRatio = (currentPrice: number, fairPriceMedian: number): number => {
  return currentPrice / fairPriceMedian;
};

// 모델 분류 함수 - 새로운 카테고리 구조 적용
export const categorizeModels = (results: CalculatedResults) => {
  // 1. 자산 가치 기반 모델
  const assetBased = [{ name: 'BPS 기반 적정가', value: results.bps }];

  // 2. 수익 가치 기반 모델
  const profitBased = [{ name: '수익가치 기반 적정가', value: results.profitBasedPrice }];

  // 3. S-RIM 시나리오 (기본 시나리오는 계산에 포함, 나머지는 참고용)
  const srimMain = [{ name: 'S-RIM 기본 시나리오', value: results.sRimBase }];

  const srimScenarios = [
    { name: 'S-RIM ROE 10% 감소', value: results.sRimDecline10pct, isReference: true },
    { name: 'S-RIM ROE 20% 감소', value: results.sRimDecline20pct, isReference: true },
  ];

  // 중앙값, 평균 등 계산에 사용할 모델들 (참고용 시나리오 제외)
  const modelsForCalculation = [...assetBased, ...srimMain, ...profitBased];

  return {
    assetBased,
    profitBased,
    srimMain,
    srimScenarios,
    all: modelsForCalculation, // 계산용 시나리오만 포함
  };
};

// 이상치 탐지 함수
export const detectOutliers = (
  categorizedModels: CategorizedModels
): {
  outliers: ModelItem[];
  hasOutliers: boolean;
} => {
  // 계산에 사용할 모델들만 대상으로 함
  const allModels = categorizedModels.all;
  const validValues = allModels.filter((item) => item.value > 0).map((item) => item.value);

  // 중앙값 계산
  validValues.sort((a, b) => a - b);
  const median = validValues[Math.floor(validValues.length / 2)];

  // 이상치 판별
  const outliers: ModelItem[] = [];

  allModels.forEach((model) => {
    // 이상치 판별 조건
    if (model.value <= 0) {
      outliers.push({ ...model, reason: 'negative_or_zero' });
    } else if (model.value > median * 3 || model.value < median / 3) {
      outliers.push({ ...model, reason: 'value_range' });
    }
  });

  return {
    outliers,
    hasOutliers: outliers.length > 0,
  };
};

// Supabase에서 데이터를 추출해서 CalculatedResults 객체를 생성하는 함수
export const extractCalculatedResultsFromSupabase = async (
  stockCode: string
): Promise<CalculatedResults | null> => {
  // 디버깅 메시지 추가
  console.log(`Supabase에서 데이터 가져오기 시작: ${stockCode}`);

  const stockDataItem = await getStockDataFromSupabase(stockCode);
  if (!stockDataItem) {
    console.error('주식 데이터를 찾을 수 없음:', stockCode);
    return null;
  }

  const latestPrice = await getStockPriceFromSupabase(stockCode);
  if (!latestPrice) {
    console.error('주가 데이터를 찾을 수 없음:', stockCode);
    return null;
  }

  const currentPrice = latestPrice.price;
  console.log(`현재가: ${currentPrice}, 적정가 중앙값: ${stockDataItem.priceRange_midRange}`);

  // Supabase 데이터로 결과 생성
  const results: CalculatedResults = {
    // 새로운 모델 값들 가져오기
    bps: stockDataItem.bps,
    sRimBase: stockDataItem.sRimBase,
    sRimDecline10pct: stockDataItem.sRimDecline10pct,
    sRimDecline20pct: stockDataItem.sRimDecline20pct,
    profitBasedPrice: stockDataItem.profitBasedPrice,
    latestPrice,

    // 가중평균 ROE 추가
    weightedRoe: stockDataItem.weightedRoe,

    // 적정가 범위
    priceRange: {
      lowRange: stockDataItem.priceRange_lowRange,
      midRange: stockDataItem.priceRange_midRange,
      highRange: stockDataItem.priceRange_highRange,
    },

    // Supabase에서 직접 가져오는 값들
    trustScore: stockDataItem.trustScore,
    riskScore: stockDataItem.riskScore,
    priceRatio: getPriceRatio(currentPrice, stockDataItem.priceRange_midRange),
  };

  // 문제 진단을 위한 로그 추가
  console.log('계산된 결과값들:');
  console.log('bps:', results.bps);
  console.log('sRimBase:', results.sRimBase);
  console.log('sRimDecline10pct:', results.sRimDecline10pct);
  console.log('sRimDecline20pct:', results.sRimDecline20pct);
  console.log('profitBasedPrice:', results.profitBasedPrice);
  console.log('weightedRoe:', results.weightedRoe);
  console.log('priceRange:', results.priceRange);

  // 모델 분류 및 이상치 계산
  const categorizedModels = categorizeModels(results);
  results.categorizedModels = categorizedModels;

  const { outliers, hasOutliers } = detectOutliers(categorizedModels);
  results.outliers = outliers;
  results.hasOutliers = hasOutliers;

  // PER 분석 (필요시 구현)
  if (results.weightedRoe && results.weightedRoe <= 0) {
    results.perAnalysis = {
      status: 'negative',
      message: '현재 기업이 손실을 기록 중입니다.',
    };
  } else if (currentPrice / results.bps > 5) {
    results.perAnalysis = {
      status: 'extreme_high',
      message: 'PBR이 매우 높습니다. 고평가 위험이 있습니다.',
    };
  } else {
    results.perAnalysis = {
      status: 'normal',
      message: '정상 범위 내의 평가입니다.',
    };
  }

  return results;
};
