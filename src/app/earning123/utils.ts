// src/app/earning/utils.ts

import { InvestmentParams, InvestmentResult, YearlyData } from './types';

export function calculateInvestmentReturn(params: InvestmentParams): InvestmentResult {
  const {
    mode,
    years,
    returnRate,
    yearlyInvestment = 0,
    initialInvestment = 0,
    inflationRate,
    yearlyExpense,
  } = params;

  console.log('계산 시작 - 파라미터:', {
    mode,
    years,
    returnRate,
    yearlyInvestment,
    initialInvestment,
    inflationRate,
    yearlyExpense,
  });

  const r = returnRate / 100; // 연 수익률
  const inflationMultiplier = 1 + inflationRate / 100; // 인플레이션 배수

  let currentAmount = 0;
  let totalInvested = 0;
  let totalExpenses = 0;
  const yearlyBreakdown: YearlyData[] = [];

  if (mode === 'lumpsum') {
    // 예금형: 초기 투자금액만 복리 계산
    currentAmount = initialInvestment;
    totalInvested = initialInvestment;

    for (let year = 1; year <= years; year++) {
      const startAmount = currentAmount;

      // 복리 수익 계산
      const returns = currentAmount * r;
      currentAmount += returns;

      // 인플레이션이 적용된 생활비 계산
      const adjustedExpense = yearlyExpense * Math.pow(inflationMultiplier, year - 1);
      currentAmount -= adjustedExpense;
      totalExpenses += adjustedExpense;

      // 잔액이 음수가 되지 않도록
      if (currentAmount < 0) {
        currentAmount = 0;
      }

      yearlyBreakdown.push({
        year,
        startAmount,
        investment: 0,
        returns,
        expense: adjustedExpense,
        endAmount: currentAmount,
      });

      // 잔액이 0이면 중단
      if (currentAmount === 0) break;
    }
  } else {
    // 적금형: 매년 추가 투자
    console.log('적금형 계산 시작');

    for (let year = 1; year <= years; year++) {
      const startAmount = currentAmount;

      // 기존 잔액에 대한 수익
      const returns = currentAmount * r;
      currentAmount += returns;

      // 매년 추가 투자
      currentAmount += yearlyInvestment;
      totalInvested += yearlyInvestment;

      // 인플레이션이 적용된 생활비 계산
      const adjustedExpense = yearlyExpense * Math.pow(inflationMultiplier, year - 1);
      currentAmount -= adjustedExpense;
      totalExpenses += adjustedExpense;

      // 잔액이 음수가 되지 않도록
      if (currentAmount < 0) {
        currentAmount = 0;
      }

      console.log(
        `${year}년차: 시작=${startAmount}, 수익=${returns}, 투자=${yearlyInvestment}, 생활비=${adjustedExpense}, 종료=${currentAmount}`
      );

      yearlyBreakdown.push({
        year,
        startAmount,
        investment: yearlyInvestment,
        returns,
        expense: adjustedExpense,
        endAmount: currentAmount,
      });

      // 잔액이 0이면 중단
      if (currentAmount === 0) break;
    }
  }

  const totalReturn = currentAmount - totalInvested + totalExpenses;

  return {
    finalAmount: currentAmount,
    totalInvested,
    totalReturn,
    totalExpenses,
    yearlyBreakdown,
  };
}

// 숫자 포맷팅 함수들
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.round(num));
}

export function formatCurrency(num: number): string {
  if (num >= 100000000) {
    const billions = num / 100000000;
    if (billions >= 10) {
      return `${Math.round(billions)}억원`;
    }
    return `${billions.toFixed(1)}억원`;
  } else if (num >= 10000000) {
    return `${Math.round(num / 10000000)}천만원`;
  } else if (num >= 10000) {
    return `${Math.round(num / 10000)}만원`;
  }
  return `${formatNumber(num)}원`;
}

// 수익률 계산
export function calculateReturnRate(finalAmount: number, totalInvested: number): number {
  if (totalInvested === 0) return 0;
  return ((finalAmount - totalInvested) / totalInvested) * 100;
}

// CAGR (연평균 성장률) 계산
export function calculateCAGR(initialValue: number, finalValue: number, years: number): number {
  if (initialValue === 0 || years === 0) return 0;
  return (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
}
