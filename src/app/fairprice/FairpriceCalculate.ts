// src/app/fairprice/fairpriceCalculate.ts

import {
  CalculatedResults,
  CategorizedModels,
  ModelItem,
  StockFairPriceData,
  StockPrice,
} from './types';
import stockData from '../../lib/finance/stock_fairprice_2025.json';
import stockPriceData from '../../lib/finance/stock_price_2025.json';

// 주식 데이터를 JSON에서 가져오는 함수
export const getStockDataFromJson = (stockCode: string): StockFairPriceData | null => {
  // JSON에서 해당 주식 코드에 맞는 데이터 가져오기
  const data = (stockData as Record<string, StockFairPriceData>)[stockCode];
  if (!data) return null;
  return data;
};

// 최신 주가 데이터를 JSON에서 가져오는 함수
export const getStockPriceFromJson = (stockCode: string): StockPrice | null => {
  const data = (stockPriceData as Record<string, any>)[stockCode];
  if (!data) return null;

  return {
    code: data.stock_code,
    name: data.company_name,
    price: Number(data.current_price),
    sharesOutstanding: 0, // 필요하면 채울 수 있음
    formattedDate: data.last_updated,
  };
};

// 신호등 시스템 함수
export const getPriceRatio = (currentPrice: number, fairPriceMedian: number): number => {
  return currentPrice / fairPriceMedian;
};

// 모델 분류 함수
export const categorizeModels = (results: CalculatedResults) => {
  // 1. 자산 가치 기반 모델 (S-RIM은 기본 시나리오만 포함)
  const assetBased = [
    { name: 'BPS 기준(P₁, 순자산가치)', value: results.threeIndicatorsBps },
    { name: 'S-RIM 기본 시나리오', value: results.sRimBase },
    // 10%, 20% 감소 시나리오는 제외
  ];

  // 참고용 S-RIM 시나리오 - 중앙값/평균 계산에 포함되지 않음
  const srimScenarios = [
    { name: 'S-RIM ROE 10% 감소', value: results.sRimDecline10pct, isReference: true },
    { name: 'S-RIM ROE 20% 감소', value: results.sRimDecline20pct, isReference: true },
  ];

  // 2. 수익 가치 기반 모델
  const earningsBased = [
    { name: 'EPS × 과거 평균 PER', value: results.epsPer },
    { name: '당기순이익 기반 PER 모델', value: results.controllingShareHolder },
    { name: 'EPS 기준(P₂)', value: results.threeIndicatorsEps },
    { name: 'PEG 기반 적정주가', value: results.pegBased },
  ];

  // 3. 혼합 모델
  const mixedModels = [
    { name: 'ROE×EPS 기준(P₃)', value: results.threeIndicatorsRoeEps },
    { name: '야마구치 요해이 공식', value: results.yamaguchi },
  ];

  // 중앙값, 평균 등 계산에 사용할 모델들 (참고용 S-RIM 시나리오 제외)
  const modelsForCalculation = [...assetBased, ...earningsBased, ...mixedModels];

  return {
    assetBased,
    earningsBased,
    mixedModels,
    srimScenarios, // 별도 카테고리로 분리
    all: modelsForCalculation, // 참고용 시나리오 제외한 모든 모델
  };
};

// 이상치 탐지 함수
export const detectOutliers = (
  categorizedModels: CategorizedModels
): {
  outliers: ModelItem[];
  hasOutliers: boolean;
} => {
  // 계산에 사용할 모델들만 대상으로 함 (참고용 시나리오 제외)
  const allModels = categorizedModels.all;
  const validValues = allModels.filter((item) => item.value > 0).map((item) => item.value);

  // 중앙값 계산
  validValues.sort((a, b) => a - b);
  const median = validValues[Math.floor(validValues.length / 2)];

  // 이상치 판별
  const outliers: ModelItem[] = [];

  allModels.forEach((model) => {
    // 이상치 판별 조건
    if (!(model.name.includes('BPS') && model.value > 0)) {
      // BPS는 음수가 아닌 한 이상치로 판별하지 않음
      if (model.value <= 0) {
        outliers.push({ ...model, reason: 'negative_or_zero' });
      } else if (model.value > median * 3 || model.value < median / 3) {
        outliers.push({ ...model, reason: 'value_range' });
      }
    }
  });

  return {
    outliers,
    hasOutliers: outliers.length > 0,
  };
};

// JSON에서 데이터를 추출해서 CalculatedResults 객체를 생성하는 함수
export const extractCalculatedResultsFromJson = (stockCode: string): CalculatedResults | null => {
  const stockDataItem = getStockDataFromJson(stockCode);
  if (!stockDataItem) return null;

  const latestPrice = getStockPriceFromJson(stockCode);
  if (!latestPrice) return null;

  const currentPrice = latestPrice.price;

  // JSON에서 직접 가져올 수 있는 값들
  const results: CalculatedResults = {
    // 직접 모델 값들 가져오기
    epsPer: stockDataItem.epsPer,
    controllingShareHolder: stockDataItem.controllingShareHolder,
    threeIndicatorsBps: stockDataItem.threeIndicatorsBps,
    threeIndicatorsEps: stockDataItem.threeIndicatorsEps,
    threeIndicatorsRoeEps: stockDataItem.threeIndicatorsRoeEps,
    yamaguchi: stockDataItem.yamaguchi,
    sRimBase: stockDataItem.sRimBase,
    pegBased: stockDataItem.pegBased,
    sRimDecline10pct: stockDataItem.sRimDecline10pct,
    sRimDecline20pct: stockDataItem.sRimDecline20pct,
    latestPrice,

    // 적정가 범위 (JSON에서 priceRange_* 접두사로 저장됨)
    priceRange: {
      lowRange: stockDataItem.priceRange_lowRange,
      midRange: stockDataItem.priceRange_midRange,
      highRange: stockDataItem.priceRange_highRange,
    },

    // JSON에서 직접 가져오는 값들
    trustScore: stockDataItem.trustScore,
    riskScore: stockDataItem.riskScore,
    priceRatio: getPriceRatio(currentPrice, stockDataItem.priceRange_midRange),
  };

  // 모델 분류 및 이상치 계산
  const categorizedModels = categorizeModels(results);
  results.categorizedModels = categorizedModels;

  const { outliers, hasOutliers } = detectOutliers(categorizedModels);
  results.outliers = outliers;
  results.hasOutliers = hasOutliers;

  return results;
};
