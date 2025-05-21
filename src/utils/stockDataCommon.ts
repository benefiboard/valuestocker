// src/utils/stockDataCommon.ts
import { StockDataResult } from './stockDataTypes';

// 빈 결과 객체 생성 함수 (타입 안전하게)
export const emptyResult = <T>(error: string): StockDataResult<T> => ({
  stocks: [],
  industries: [],
  subIndustries: [],
  error,
});

// 안전한 숫자 변환 함수 (NaN 방지)
export const safeNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

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
export function hasConsecutiveDividend(dividendData: any): boolean {
  return (
    safeNumber(dividendData['2020_dividend']) > 0 &&
    safeNumber(dividendData['2021_dividend']) > 0 &&
    safeNumber(dividendData['2022_dividend']) > 0 &&
    safeNumber(dividendData['2023_dividend']) > 0 &&
    safeNumber(dividendData['2024_dividend']) > 0
  );
}

// 영업이익 손실 개수 확인 함수
export function countNegativeOperatingIncomes(data: any): number {
  let count = 0;
  if (safeNumber(data['2020_operating_income']) < 0) count++;
  if (safeNumber(data['2021_operating_income']) < 0) count++;
  if (safeNumber(data['2022_operating_income']) < 0) count++;
  if (safeNumber(data['2023_operating_income']) < 0) count++;
  if (safeNumber(data['2024_operating_income']) < 0) count++;
  return count;
}

// 5년 DCF 계산 함수 (영구가치 없음)
export function calculateDCF5Year(
  fcfPerShare: number,
  growthRate: number,
  discountRate: number
): number {
  let intrinsicValue = 0;

  // 5년간의 FCF 현재가치 계산
  for (let year = 1; year <= 5; year++) {
    const futureFCF = fcfPerShare * Math.pow(1 + growthRate, year);
    const presentValue = futureFCF / Math.pow(1 + discountRate, year);
    intrinsicValue += presentValue;
  }

  return intrinsicValue;
}
