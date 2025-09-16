// src/app/pbr-calculator/pbrCalculate.ts

import { PBRCalculationParams, PBRResult } from './types';

// 적정 PBR 계산 함수
// 공식: 적정 PBR = [(1 + 예상ROE) / (1 + 기대수익률)]^지속가능연수
export const calculateAppropriatePBR = (params: PBRCalculationParams): number => {
  const { expectedROE, requiredReturn, sustainableYears } = params;

  // 퍼센트를 소수로 변환
  const roeDecimal = expectedROE / 100;
  const returnDecimal = requiredReturn / 100;

  // 적정 PBR 계산
  const base = (1 + roeDecimal) / (1 + returnDecimal);
  const appropriatePBR = Math.pow(base, sustainableYears);

  return appropriatePBR;
};

// 예상수익률 계산 함수
// 공식: 예상수익률 = (1 + 예상 ROE)/(현재PBR^(1/지속가능연수)) - 1
export const calculateExpectedReturn = (
  expectedROE: number,
  currentPBR: number,
  sustainableYears: number
): number => {
  const roeDecimal = expectedROE / 100;

  // 예상수익률 계산 (지수에 1/지속가능연수 사용)
  const expectedReturn = (1 + roeDecimal) / Math.pow(currentPBR, 1 / sustainableYears) - 1;

  // 퍼센트로 변환
  return expectedReturn * 100;
};

// 전체 PBR 계산 함수
export const calculatePBR = (params: PBRCalculationParams): PBRResult => {
  // 1. 적정 PBR 계산
  const appropriatePBR = calculateAppropriatePBR(params);

  // 2. 예상수익률 계산 (현재PBR 사용)
  const expectedReturn = calculateExpectedReturn(
    params.expectedROE,
    params.currentPBR,
    params.sustainableYears
  );

  return {
    appropriatePBR,
    expectedReturn,
    params,
  };
};

// 입력값 유효성 검사 함수
export const validatePBRParams = (params: PBRCalculationParams): string | null => {
  const { expectedROE, requiredReturn, sustainableYears, currentPBR } = params;

  if (expectedROE < 1 || expectedROE > 100) {
    return '예상 ROE는 1%에서 100% 사이여야 합니다.';
  }

  if (requiredReturn < 1 || requiredReturn > 100) {
    return '기대수익률은 1%에서 100% 사이여야 합니다.';
  }

  if (sustainableYears < 1 || sustainableYears > 100) {
    return '지속가능연수는 1년에서 100년 사이여야 합니다.';
  }

  if (currentPBR <= 0 || currentPBR > 999) {
    return '현재 PBR은 0보다 크고 999 이하여야 합니다.';
  }

  return null; // 유효함
};
