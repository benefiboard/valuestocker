// src/app/pbr-calculator/types.ts

export interface PBRCalculationParams {
  expectedROE: number; // 예상 ROE (%)
  requiredReturn: number; // 기대수익률 (%)
  sustainableYears: number; // 지속가능연수 (년)
  currentPBR: number; // 현재 PBR (배)
}

export interface PBRResult {
  appropriatePBR: number; // 계산된 적정 PBR
  expectedReturn: number; // 예상수익률 (%)
  params: PBRCalculationParams; // 입력 파라미터
}
