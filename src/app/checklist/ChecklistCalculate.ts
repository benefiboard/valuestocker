// src/app/checklist/ChecklistCalculate.ts

import { ChecklistItem, FinancialDataCheckList, StockPrice } from '@/lib/finance/types';

// 수정된 체크리스트 타입 정의 (점수 시스템 추가)
export interface ScoredChecklistItem extends ChecklistItem {
  score: number; // 0-10 점수
  maxScore: number; // 최대 점수
  isFailCriteria: boolean; // 과락 여부
}

// 초기 체크리스트 정의 (초기 상태)
export const initialChecklist: ChecklistItem[] = [
  // 핵심 지표
  {
    category: '핵심 지표',
    title: 'PER',
    description:
      '주가수익비율(Price Earning Ratio). 주가를 주당순이익(EPS)으로 나눈 값으로, 주가가 수익 대비 얼마나 비싼지 평가하는 지표입니다.',
    targetValue: '0.5 < PER < 15',
    actualValue: null,
    isPassed: null,
    formula: '주가 ÷ EPS',
    importance: 3,
  },
  {
    category: '핵심 지표',
    title: '매출액 성장률',
    description: '3년간 매출액의 평균 성장률. 회사의 성장성을 나타내는 중요한 지표입니다.',
    targetValue: '> 10%',
    actualValue: null,
    isPassed: null,
    formula: '3년간 매출액 성장률 평균',
    importance: 4,
  },
  {
    category: '핵심 지표',
    title: '영업이익률',
    description:
      '매출액 대비 영업이익의 비율. 회사의 핵심 사업에서 얼마나 효율적으로 이익을 창출하는지 보여줍니다.',
    targetValue: '> 10%',
    actualValue: null,
    isPassed: null,
    formula: '영업이익 ÷ 매출액 × 100%',
    importance: 5,
  },
  {
    category: '핵심 지표',
    title: '영업이익 성장률',
    description:
      '3년간 영업이익의 평균 성장률. 기업의 수익성이 개선되고 있는지 평가하는 지표입니다.',
    targetValue: '> 10%',
    actualValue: null,
    isPassed: null,
    formula: '3년간 영업이익 성장률 평균',
    importance: 5,
  },
  {
    category: '핵심 지표',
    title: 'EPS 성장률',
    description:
      '3년간 주당순이익(EPS)의 성장률. 주주 입장에서 기업의 수익성 개선 정도를 평가합니다.',
    targetValue: '> 10%',
    actualValue: null,
    isPassed: null,
    formula: '3년간 EPS 성장률 평균',
    importance: 4,
  },
  {
    category: '핵심 지표',
    title: '순이익 증가율',
    description: '3년간 순이익의 증가율. 너무 높은 성장률은 지속가능성이 의심될 수 있습니다.',
    targetValue: '20% < 순이익 증가율 < 50%',
    actualValue: null,
    isPassed: null,
    formula: '3년간 순이익 증가율 평균',
    importance: 4,
  },

  // 세부 지표 - PER 관련
  {
    category: '세부 지표 - PER 관련',
    title: '현재 PER < 3년 최고 PER * 0.4',
    description: '현재 주가가 과거 3년 최고 PER 대비 저평가되어 있는지 확인합니다.',
    targetValue: '< 3년 최고 PER * 0.4',
    actualValue: null,
    isPassed: null,
    formula: '현재 PER vs 3년 최고 PER × 0.4',
    importance: 3,
  },
  {
    category: '세부 지표 - PER 관련',
    title: 'PER < 3년 평균 PER',
    description: '현재 PER이 과거 3년 평균보다 낮은지 확인하여 저평가 여부를 판단합니다.',
    targetValue: '< 3년 평균 PER',
    actualValue: null,
    isPassed: null,
    formula: '현재 PER vs 3년 평균 PER',
    importance: 3,
  },

  // 세부 지표 - 자산 가치 관련
  {
    category: '세부 지표 - 자산 가치',
    title: 'PBR (주가순자산비율)',
    description:
      '주가를 BPS(주당순자산가치)로 나눈 값으로, 기업의 장부상 가치 대비 주가 수준을 평가합니다.',
    targetValue: '< 1.2',
    actualValue: null,
    isPassed: null,
    formula: '주가 ÷ BPS',
    importance: 3,
  },
  {
    category: '세부 지표 - 자산 가치',
    title: 'BPS 성장률',
    description: '3년간 주당순자산가치(BPS)의 성장률. 기업의 순자산 증가 속도를 평가합니다.',
    targetValue: '> 7.2%',
    actualValue: null,
    isPassed: null,
    formula: '3년간 BPS 성장률 평균',
    importance: 2,
  },

  // 세부 지표 - 재무 건전성
  {
    category: '세부 지표 - 재무 건전성',
    title: '부채비율',
    description:
      '자본 대비 부채의 비율. 타인자본 의존도를 나타내며, 낮을수록 재무적으로 안정적입니다.',
    targetValue: '< 100%',
    actualValue: null,
    isPassed: null,
    formula: '부채총계 ÷ 자본총계 × 100%',
    importance: 4,
  },
  {
    category: '세부 지표 - 재무 건전성',
    title: '유동비율',
    description: '유동부채 대비 유동자산의 비율. 단기 지급능력을 평가하는 지표입니다.',
    targetValue: '> 150%',
    actualValue: null,
    isPassed: null,
    formula: '유동자산 ÷ 유동부채 × 100%',
    importance: 3,
  },
  {
    category: '세부 지표 - 재무 건전성',
    title: '이자보상배율',
    description: '이자비용 대비 영업이익의 비율. 기업이 이자비용을 갚을 수 있는 능력을 평가합니다.',
    targetValue: '> 2',
    actualValue: null,
    isPassed: null,
    formula: '영업이익 ÷ 이자비용',
    importance: 3,
  },

  // 세부 지표 - 수익성 및 효율성
  {
    category: '세부 지표 - 수익성 및 효율성',
    title: 'ROE (자기자본이익률)',
    description:
      '자기자본 대비 당기순이익의 비율. 투자된 자본으로 얼마나 효율적으로 이익을 창출하는지 보여줍니다.',
    targetValue: '> 15%',
    actualValue: null,
    isPassed: null,
    formula: '당기순이익 ÷ 자기자본 × 100%',
    importance: 4,
  },
  {
    category: '세부 지표 - 수익성 및 효율성',
    title: '장기부채 대비 순이익',
    description: '장기부채가 연간 순이익의 3배 이하인지 확인하여 부채 상환 능력을 평가합니다.',
    targetValue: '장기부채 < 연간 순이익 × 3',
    actualValue: null,
    isPassed: null,
    formula: '장기부채 ÷ 연간 순이익',
    importance: 3,
  },
  {
    category: '세부 지표 - 수익성 및 효율성',
    title: '현금회전일수',
    description: '기업의 현금 회수 주기를 평가하는 지표입니다. 짧을수록 현금흐름이 양호합니다.',
    targetValue: '< 120일',
    actualValue: null,
    isPassed: null,
    formula: '재고자산 회전일수 + 매출채권 회전일수 - 매입채무 회전일수',
    importance: 2,
  },
  {
    category: '세부 지표 - 수익성 및 효율성',
    title: '이익잉여금 vs 당좌자산 증가율',
    description: '이익 성장이 실질 자산 증가로 이어지는지 확인하는 지표입니다.',
    targetValue: '이익잉여금 성장률 × 0.5 < 당좌자산 증가율',
    actualValue: null,
    isPassed: null,
    formula: '이익잉여금 성장률 × 0.5 vs 당좌자산 증가율',
    importance: 2,
  },

  // 세부 지표 - 현금흐름 및 경쟁력
  {
    category: '세부 지표 - 현금흐름 및 경쟁력',
    title: 'FCF 비율',
    description: '매출액 대비 잉여현금흐름(FCF)의 비율. 실제 기업의 현금창출 능력을 평가합니다.',
    targetValue: '> 7%',
    actualValue: null,
    isPassed: null,
    formula: 'FCF ÷ 매출액 × 100%',
    importance: 3,
  },
  {
    category: '세부 지표 - 현금흐름 및 경쟁력',
    title: '매출총이익률',
    description: '매출액 대비 매출총이익의 비율. 원가관리 능력과 경쟁우위를 평가합니다.',
    targetValue: '> 40%',
    actualValue: null,
    isPassed: null,
    formula: '매출총이익 ÷ 매출액 × 100%',
    importance: 3,
  },
];

// 새로운 점수 계산 함수 추가
const calculatePERScore = (per: number): number => {
  if (per <= 0) return 0; // 적자기업 (과락)
  if (per <= 8) return 10; // 매우 저평가
  if (per <= 15) return 9; // 저평가
  if (per <= 20) return 8; // 적정가
  if (per <= 30) return 6; // 약간 고평가
  if (per <= 50) return 3; // 고평가
  return 1; // 매우 고평가
};

const calculateRevenueGrowthScore = (growthRate: number): number => {
  if (growthRate < 0) return 0; // 역성장 (과락)
  if (growthRate >= 20) return 10; // 매우 우수
  if (growthRate >= 15) return 9; // 우수
  if (growthRate >= 10) return 8; // 양호
  if (growthRate >= 7) return 7; // 보통
  if (growthRate >= 5) return 6; // 미흡
  return 4; // 저조
};

const calculateOperatingMarginScore = (margin: number): number => {
  if (margin < 0) return 0; // 적자 (과락)
  if (margin >= 25) return 10; // 탁월
  if (margin >= 20) return 9; // 매우 우수
  if (margin >= 15) return 8; // 우수
  if (margin >= 10) return 7; // 양호
  if (margin >= 7) return 6; // 보통
  if (margin >= 5) return 5; // 미흡
  return 3; // 저조
};

const calculateOperatingIncomeGrowthScore = (growthRate: number): number => {
  if (growthRate < -10) return 0; // 심각한 감소 (과락)
  if (growthRate < 0) return 2; // 감소
  if (growthRate >= 25) return 10; // 탁월
  if (growthRate >= 20) return 9; // 매우 우수
  if (growthRate >= 15) return 8; // 우수
  if (growthRate >= 10) return 7; // 양호
  if (growthRate >= 5) return 6; // 보통
  return 4; // 미흡
};

const calculateEPSGrowthScore = (growthRate: number): number => {
  if (growthRate < -10) return 0; // 심각한 감소 (과락)
  if (growthRate < 0) return 2; // 감소
  if (growthRate >= 25) return 10; // 탁월
  if (growthRate >= 20) return 9; // 매우 우수
  if (growthRate >= 15) return 8; // 우수
  if (growthRate >= 10) return 7; // 양호
  if (growthRate >= 5) return 6; // 보통
  return 4; // 미흡
};

const calculateNetIncomeGrowthScore = (growthRate: number): number => {
  if (growthRate < -10) return 0; // 심각한 감소 (과락)
  if (growthRate < 0) return 2; // 감소
  if (growthRate >= 50) return 7; // 성장성 높음, 지속가능성 우려
  if (growthRate >= 40) return 9; // 이상적
  if (growthRate >= 30) return 10; // 최적
  if (growthRate >= 20) return 9; // 매우 우수
  if (growthRate >= 10) return 7; // 우수
  if (growthRate >= 5) return 6; // 양호
  return 4; // 미흡
};

// 체크리스트 계산 함수
export const calculateChecklist = (
  financialData: FinancialDataCheckList,
  stockPrice: StockPrice
): ScoredChecklistItem[] => {
  const results = [...initialChecklist] as ScoredChecklistItem[];
  const n = stockPrice.sharesOutstanding; // 발행주식수
  const currentPrice = stockPrice.price; // 현재 주가

  // 현재 연도와 과거 연도
  const years = financialData.years;
  const currentYear = years[0];
  const previousYear = years[1];
  const twoYearsAgo = years[2];

  // 각 연도별 EPS 확인 또는 계산
  const currentEps =
    financialData.epsByYear[currentYear] ||
    (n > 0 ? financialData.netIncomeByYear[currentYear] / n : 0);
  const previousEps =
    financialData.epsByYear[previousYear] ||
    (n > 0 ? financialData.netIncomeByYear[previousYear] / n : 0);
  const twoYearsAgoEps =
    financialData.epsByYear[twoYearsAgo] ||
    (n > 0 ? financialData.netIncomeByYear[twoYearsAgo] / n : 0);

  // 각 연도별 매출액
  const currentRevenue = financialData.revenueByYear[currentYear] || 0;
  const previousRevenue = financialData.revenueByYear[previousYear] || 0;
  const twoYearsAgoRevenue = financialData.revenueByYear[twoYearsAgo] || 0;

  // 각 연도별 영업이익
  const currentOperatingIncome = financialData.operatingIncomes[currentYear] || 0;
  const previousOperatingIncome = financialData.operatingIncomes[previousYear] || 0;
  const twoYearsAgoOperatingIncome = financialData.operatingIncomes[twoYearsAgo] || 0;

  // 각 연도별 당기순이익
  const currentNetIncome = financialData.netIncomeByYear[currentYear] || 0;
  const previousNetIncome = financialData.netIncomeByYear[previousYear] || 0;
  const twoYearsAgoNetIncome = financialData.netIncomeByYear[twoYearsAgo] || 0;

  // 각 연도별 자기자본
  const currentEquity = financialData.equityByYear[currentYear] || 0;
  const previousEquity = financialData.equityByYear[previousYear] || 0;
  const twoYearsAgoEquity = financialData.equityByYear[twoYearsAgo] || 0;

  // 각 연도별 이익잉여금
  const currentRetainedEarnings = financialData.retainedEarningsByYear[currentYear] || 0;
  const previousRetainedEarnings = financialData.retainedEarningsByYear[previousYear] || 0;
  const twoYearsAgoRetainedEarnings = financialData.retainedEarningsByYear[twoYearsAgo] || 0;

  // BPS(주당순자산가치) 계산
  const currentBps = n > 0 ? currentEquity / n : 0;
  const previousBps = n > 0 ? previousEquity / n : 0;
  const twoYearsAgoBps = n > 0 ? twoYearsAgoEquity / n : 0;

  // PER 계산
  const currentPer = currentEps > 0 ? currentPrice / currentEps : 0;
  const previousPer = previousEps > 0 ? (stockPrice.price * 0.9) / previousEps : 0; // 가정: 작년 주가는 현재의 90%
  const twoYearsAgoPer = twoYearsAgoEps > 0 ? (stockPrice.price * 0.8) / twoYearsAgoEps : 0; // 가정: 재작년 주가는 현재의 80%

  // 성장률 계산함수(모든 성장 지표에 적용)
  const calculateGrowthRate = (values: number[]): number => {
    // 최근 값과 과거 첫 값만 사용하여 전체 기간 성장 추세 확인
    const latest = values[0]; // 최근 연도 값
    const oldest = values[values.length - 1]; // 가장 오래된 연도 값

    // 둘 다 양수이면 정상 성장률 계산
    if (latest > 0 && oldest > 0) {
      const years = values.length - 1;
      return Math.pow(latest / oldest, 1 / years) - 1;
    }

    // 적자에서 흑자로 전환된 경우 (가치투자 관점에서 매우 긍정적)
    if (oldest <= 0 && latest > 0) {
      return 1; // 100% 긍정적 평가 (흑자전환)
    }

    // 흑자에서 적자로 전환된 경우 (가치투자 관점에서 부정적)
    if (oldest > 0 && latest <= 0) {
      return -1; // 100% 부정적 평가
    }

    // 둘 다 적자인 경우, 손실 감소 여부 확인
    if (oldest < 0 && latest < 0) {
      return (Math.abs(oldest) - Math.abs(latest)) / Math.abs(oldest);
    }

    return 0;
  };

  // 성장률 계산
  const revenueGrowthRate = calculateGrowthRate(
    [currentRevenue, previousRevenue, twoYearsAgoRevenue].filter((val) => val > 0)
  );

  const opIncomeGrowthRate = calculateGrowthRate(
    [currentOperatingIncome, previousOperatingIncome, twoYearsAgoOperatingIncome].filter(
      (val) => val > 0
    )
  );

  const epsGrowthRate = calculateGrowthRate(
    [currentEps, previousEps, twoYearsAgoEps].filter((val) => val > 0)
  );

  const netIncomeGrowthRate = calculateGrowthRate(
    [currentNetIncome, previousNetIncome, twoYearsAgoNetIncome].filter((val) => val > 0)
  );

  const bpsGrowthRate = calculateGrowthRate(
    [currentBps, previousBps, twoYearsAgoBps].filter((val) => val > 0)
  );

  const retainedEarningsGrowthRate = calculateGrowthRate(
    [currentRetainedEarnings, previousRetainedEarnings, twoYearsAgoRetainedEarnings].filter(
      (val) => val > 0
    )
  );

  // 당좌자산 증가율 계산 (관련 데이터가 없어서 임의로 설정)
  const quickAssetsGrowthRate = 5; // 가정값

  // 현재 영업이익률
  // 각 연도별 영업이익률 계산
  const opMarginValues = [
    currentRevenue > 0 ? (currentOperatingIncome / currentRevenue) * 100 : 0,
    previousRevenue > 0 ? (previousOperatingIncome / previousRevenue) * 100 : 0,
    twoYearsAgoRevenue > 0 ? (twoYearsAgoOperatingIncome / twoYearsAgoRevenue) * 100 : 0,
  ];

  // 음수 영업이익률 확인
  const hasNegativeOpMargin = opMarginValues.some((margin) => margin < 0);

  // 양수 영업이익률만 합산 (음수는 0으로 처리)
  let totalOpMargin = 0;
  opMarginValues.forEach((margin) => {
    if (margin > 0) totalOpMargin += margin;
  });

  // 평균 영업이익률 계산 - 음수가 있으면 4.5로 나눔
  const avgOpMargin = hasNegativeOpMargin
    ? totalOpMargin / 4.5
    : totalOpMargin / opMarginValues.filter((margin) => margin !== 0).length || 1;

  // 매출총이익률 계산
  const grossProfitMargin =
    financialData.revenue > 0 ? (financialData.grossProfit / financialData.revenue) * 100 : 0;

  // PBR 계산
  const pbr = currentBps > 0 ? currentPrice / currentBps : 0;

  // ROE 계산 - 음수 처리 및 4.5 분모 적용
  const roeValues = [
    currentEquity > 0 ? (currentNetIncome / currentEquity) * 100 : 0,
    previousEquity > 0 ? (previousNetIncome / previousEquity) * 100 : 0,
    twoYearsAgoEquity > 0 ? (twoYearsAgoNetIncome / twoYearsAgoEquity) * 100 : 0,
  ];

  // 음수 ROE 확인
  const hasNegativeRoe = roeValues.some((roe) => roe < 0);

  // 양수 ROE만 합산 (음수는 0으로 처리)
  let totalRoe = 0;
  roeValues.forEach((roe) => {
    if (roe > 0) totalRoe += roe;
  });

  // 평균 ROE 계산 - 음수가 있으면 4.5로 나눔
  const avgRoe = hasNegativeRoe
    ? totalRoe / 4.5
    : totalRoe / roeValues.filter((roe) => roe !== 0).length || 1;

  // 부채비율 계산
  const debtRatio =
    financialData.equity > 0
      ? ((financialData.assets - financialData.equity) / financialData.equity) * 100
      : 0;

  // 유동비율 계산
  const currentRatio =
    financialData.currentLiabilities > 0
      ? (financialData.currentAssets / financialData.currentLiabilities) * 100
      : 0;

  // 이자보상배율 계산
  const interestCoverageRatio =
    financialData.interestExpense > 0
      ? financialData.operatingIncome / financialData.interestExpense
      : 0;

  // 장기부채 대비 순이익 비율
  const nonCurrentLiabilitiesToNetIncome =
    currentNetIncome > 0 ? financialData.nonCurrentLiabilities / currentNetIncome : 0;

  // 현금회전일수 계산 (매출액 기준)
  const inventoryTurnoverDays =
    financialData.costOfSales > 0
      ? (financialData.inventories / financialData.costOfSales) * 365
      : 0;
  const receivablesTurnoverDays =
    financialData.revenue > 0 ? (financialData.tradeReceivables / financialData.revenue) * 365 : 0;
  const payablesTurnoverDays =
    financialData.costOfSales > 0
      ? (financialData.tradePayables / financialData.costOfSales) * 365
      : 0;
  const cashCycleDays = inventoryTurnoverDays + receivablesTurnoverDays - payablesTurnoverDays;

  // FCF 비율 계산
  const fcfRatio =
    financialData.revenue > 0 ? (financialData.freeCashFlow / financialData.revenue) * 100 : 0;

  // 이제 각 체크리스트 항목을 계산하여 결과 업데이트
  results.forEach((item, index) => {
    // 기본값 설정
    item.score = 0;
    item.maxScore = 10;
    item.isFailCriteria = false;

    switch (item.title) {
      // 핵심 지표
      case 'PER':
        item.actualValue = currentPer;
        const perScore = calculatePERScore(currentPer);
        item.score = perScore;
        item.isPassed = currentPer > 0.5 && currentPer < 15;
        item.isFailCriteria = perScore === 0;
        break;

      case '매출액 성장률':
        item.actualValue = revenueGrowthRate * 100;
        const revenueGrowthScore = calculateRevenueGrowthScore(revenueGrowthRate * 100);
        item.score = revenueGrowthScore;
        item.isPassed = revenueGrowthRate >= 0.1 || revenueGrowthRate === 1; // 10% 이상 성장 또는 흑자전환
        item.isFailCriteria = revenueGrowthScore === 0;
        break;

      case '영업이익률':
        item.actualValue = avgOpMargin;
        const opMarginScore = calculateOperatingMarginScore(avgOpMargin);
        item.score = opMarginScore;
        item.isPassed = avgOpMargin > 10 || (avgOpMargin > 0 && previousOperatingIncome < 0); // 10% 이상 또는 흑자전환
        // 흑자전환이면 과락에서 제외
        item.isFailCriteria =
          opMarginScore === 0 && !(avgOpMargin > 0 && previousOperatingIncome < 0); // 흑자전환이면 과락에서 제외
        break;

      case '영업이익 성장률':
        item.actualValue = opIncomeGrowthRate * 100;
        const opIncomeGrowthScore = calculateOperatingIncomeGrowthScore(opIncomeGrowthRate * 100);
        item.score = opIncomeGrowthScore;
        item.isPassed = opIncomeGrowthRate >= 0.1 || opIncomeGrowthRate === 1;
        // 흑자전환이면 과락에서 제외
        item.isFailCriteria = opIncomeGrowthScore === 0 && opIncomeGrowthRate !== 1;
        break;

      case 'EPS 성장률':
        item.actualValue = epsGrowthRate * 100;
        const epsGrowthScore = calculateEPSGrowthScore(epsGrowthRate * 100);
        item.score = epsGrowthScore;
        item.isPassed = epsGrowthRate >= 0.1 || epsGrowthRate === 1;
        // 흑자전환이면 과락에서 제외
        item.isFailCriteria = epsGrowthScore === 0 && epsGrowthRate !== 1;
        break;

      case '순이익 증가율':
        item.actualValue = netIncomeGrowthRate * 100;
        const netIncomeGrowthScore = calculateNetIncomeGrowthScore(netIncomeGrowthRate * 100);
        item.score = netIncomeGrowthScore;
        // 순이익은 20~50% 범위가 이상적이지만, 흑자전환도 매우 긍정적으로 평가
        item.isPassed =
          (netIncomeGrowthRate >= 0.2 && netIncomeGrowthRate < 0.5) || netIncomeGrowthRate === 1;
        // 흑자전환이면 과락에서 제외
        item.isFailCriteria = netIncomeGrowthScore === 0 && netIncomeGrowthRate !== 1;
        break;

      // 세부 지표 - PER 관련
      case '현재 PER < 3년 최고 PER * 0.4':
        const maxPer = Math.max(currentPer, previousPer, twoYearsAgoPer);
        item.actualValue = currentPer;
        const maxPerRatio = maxPer > 0 ? currentPer / maxPer : 0;
        item.score = maxPerRatio < 0.4 ? 10 : maxPerRatio < 0.6 ? 7 : maxPerRatio < 0.8 ? 4 : 2;
        item.isPassed = currentPer < maxPer * 0.4;
        break;

      case 'PER < 3년 평균 PER':
        const validPers = [currentPer, previousPer, twoYearsAgoPer].filter((per) => per > 0);
        const avgPer =
          validPers.length > 0 ? validPers.reduce((a, b) => a + b, 0) / validPers.length : 0;
        item.actualValue = currentPer;
        const avgPerRatio = avgPer > 0 ? currentPer / avgPer : 0;
        item.score = avgPerRatio < 0.8 ? 10 : avgPerRatio < 1 ? 8 : avgPerRatio < 1.2 ? 5 : 2;
        item.isPassed = currentPer < avgPer;
        break;

      // 세부 지표 - 자산 가치 관련
      case 'PBR (주가순자산비율)':
        item.actualValue = pbr;
        item.score = pbr < 1 ? 10 : pbr < 1.2 ? 8 : pbr < 1.5 ? 6 : pbr < 2 ? 4 : 2;
        item.isPassed = pbr < 1.2;
        break;

      case 'BPS 성장률':
        item.actualValue = bpsGrowthRate * 100;
        item.score =
          bpsGrowthRate > 0.15
            ? 10
            : bpsGrowthRate > 0.1
            ? 8
            : bpsGrowthRate > 0.072
            ? 6
            : bpsGrowthRate > 0.05
            ? 4
            : 2;
        item.isPassed = bpsGrowthRate > 0.072; // 7.2% 이상
        break;

      // 세부 지표 - 재무 건전성
      case '부채비율':
        item.actualValue = debtRatio;
        item.score =
          debtRatio < 50
            ? 10
            : debtRatio < 80
            ? 8
            : debtRatio < 100
            ? 6
            : debtRatio < 150
            ? 4
            : debtRatio < 200
            ? 2
            : 0;
        item.isPassed = debtRatio < 100;
        item.isFailCriteria = debtRatio > 200;
        break;

      case '유동비율':
        item.actualValue = currentRatio;
        item.score =
          currentRatio > 200
            ? 10
            : currentRatio > 150
            ? 8
            : currentRatio > 120
            ? 6
            : currentRatio > 100
            ? 4
            : 2;
        item.isPassed = currentRatio > 150;
        break;

      case '이자보상배율':
        item.actualValue = interestCoverageRatio;
        item.score =
          interestCoverageRatio > 5
            ? 10
            : interestCoverageRatio > 3
            ? 8
            : interestCoverageRatio > 2
            ? 6
            : interestCoverageRatio > 1
            ? 4
            : 2;
        item.isPassed = interestCoverageRatio > 2;
        break;

      // 세부 지표 - 수익성 및 효율성
      case 'ROE (자기자본이익률)':
        item.actualValue = avgRoe;
        item.score =
          avgRoe > 20
            ? 10
            : avgRoe > 15
            ? 8
            : avgRoe > 10
            ? 6
            : avgRoe > 5
            ? 4
            : avgRoe > 0
            ? 2
            : 0;
        item.isPassed = avgRoe > 15;
        item.isFailCriteria = avgRoe < 0;
        break;

      case '장기부채 대비 순이익':
        item.actualValue = nonCurrentLiabilitiesToNetIncome;
        item.score =
          nonCurrentLiabilitiesToNetIncome < 1
            ? 10
            : nonCurrentLiabilitiesToNetIncome < 2
            ? 8
            : nonCurrentLiabilitiesToNetIncome < 3
            ? 6
            : nonCurrentLiabilitiesToNetIncome < 5
            ? 4
            : 2;
        item.isPassed = nonCurrentLiabilitiesToNetIncome < 3;
        break;

      case '현금회전일수':
        item.actualValue = cashCycleDays;
        item.score =
          cashCycleDays < 60
            ? 10
            : cashCycleDays < 90
            ? 8
            : cashCycleDays < 120
            ? 6
            : cashCycleDays < 150
            ? 4
            : 2;
        item.isPassed = cashCycleDays < 120;
        break;

      case '이익잉여금 vs 당좌자산 증가율':
        item.actualValue = retainedEarningsGrowthRate * 50; // 50%로 변환
        const retainedToQuickAssets =
          retainedEarningsGrowthRate * 0.5 < quickAssetsGrowthRate / 100;
        item.score = retainedToQuickAssets ? 10 : 3;
        item.isPassed = retainedToQuickAssets;
        break;

      // 세부 지표 - 현금흐름 및 경쟁력
      case 'FCF 비율':
        item.actualValue = fcfRatio;
        item.score =
          fcfRatio > 10
            ? 10
            : fcfRatio > 7
            ? 8
            : fcfRatio > 5
            ? 6
            : fcfRatio > 3
            ? 4
            : fcfRatio > 0
            ? 2
            : 0;
        item.isPassed = fcfRatio > 7;
        break;

      case '매출총이익률':
        item.actualValue = grossProfitMargin;
        item.score =
          grossProfitMargin > 50
            ? 10
            : grossProfitMargin > 40
            ? 8
            : grossProfitMargin > 30
            ? 6
            : grossProfitMargin > 20
            ? 4
            : grossProfitMargin > 10
            ? 2
            : 0;
        item.isPassed = grossProfitMargin > 40;
        break;
    }
  });

  return results;
};

// 등급 평가 함수
export interface InvestmentRating {
  score: number;
  maxScore: number;
  percentage: number;
  grade: string;
  description: string;
  coreItemsScore: number;
  detailedItemsScore: number;
  hasCriticalFailure: boolean;
  coreItemsCount: number;
  coreItemsPassCount: number;
}

export const calculateInvestmentRating = (
  checklistResults: ScoredChecklistItem[]
): InvestmentRating => {
  if (checklistResults.length === 0) {
    return {
      score: 0,
      maxScore: 0,
      percentage: 0,
      grade: 'N/A',
      description: '평가할 데이터가 부족합니다.',
      coreItemsScore: 0,
      detailedItemsScore: 0,
      hasCriticalFailure: false,
      coreItemsCount: 0,
      coreItemsPassCount: 0,
    };
  }

  // 핵심 지표와 세부 지표 분리
  const coreItems = checklistResults.filter((item) => item.category === '핵심 지표');
  const detailedItems = checklistResults.filter((item) => item.category !== '핵심 지표');

  // 핵심 지표 점수 계산 (핵심 지표의 평균)
  const coreItemsTotalScore = coreItems.reduce((sum, item) => sum + item.score, 0);
  const coreItemsMaxScore = coreItems.reduce((sum, item) => sum + item.maxScore, 0);
  const coreItemsScore = coreItemsTotalScore / coreItems.length;

  // 세부 지표 점수 계산
  const detailedItemsTotalScore = detailedItems.reduce((sum, item) => sum + item.score, 0);
  const detailedItemsMaxScore = detailedItems.reduce((sum, item) => sum + item.maxScore, 0);
  const detailedItemsScore =
    detailedItems.length > 0 ? detailedItemsTotalScore / detailedItems.length : 0;

  // 합산 점수 계산 (핵심 지표 70%, 세부 지표 30%)
  const totalScore = coreItemsScore * 0.7 + detailedItemsScore * 0.3;
  const maxPossibleScore = 10; // 최대 점수는 10점

  // 과락 여부 확인
  const hasCriticalFailure = coreItems.some((item) => item.isFailCriteria);

  // 핵심 지표 중 통과된 항목 수
  const coreItemsPassCount = coreItems.filter((item) => item.score >= 6).length;

  // 등급 산정
  let grade, description;
  const percentage = (totalScore / maxPossibleScore) * 100;

  if (hasCriticalFailure) {
    // 과락이 있으면 최대 D등급까지만 가능
    if (percentage >= 40) {
      grade = 'D';
      description = '핵심 지표에 심각한 문제가 있어 투자에 주의가 필요합니다.';
    } else {
      grade = 'F';
      description = '핵심 지표에 심각한 문제가 있어 투자에 적합하지 않습니다.';
    }
  } else if (coreItemsPassCount < 3) {
    // 핵심 지표 중 통과 항목이 3개 미만이면 최대 C등급까지만 가능
    if (percentage >= 50) {
      grade = 'C';
      description = '일부 핵심 지표가 기준을 충족하지 못해 투자 전 추가 분석이 필요합니다.';
    } else {
      grade = 'D';
      description = '대부분의 핵심 지표가 기준을 충족하지 못해 투자에 주의가 필요합니다.';
    }
  } else {
    // 정상 등급 산정
    if (percentage >= 75) {
      grade = 'A+';
      description = '우수한 투자 대상입니다. 모든 핵심 지표가 매우 양호합니다.';
    } else if (percentage >= 65) {
      grade = 'A';
      description = '양호한 투자 대상입니다. 핵심 지표가 대부분 양호합니다.';
    } else if (percentage >= 55) {
      grade = 'B+';
      description = '괜찮은 투자 대상입니다. 일부 보완이 필요한 지표가 있습니다.';
    } else if (percentage >= 45) {
      grade = 'B';
      description = '평균적인 투자 대상입니다. 몇몇 지표에서 개선이 필요합니다.';
    } else if (percentage >= 35) {
      grade = 'C+';
      description = '투자 시 주의가 필요합니다. 여러 지표에서 문제점이 발견되었습니다.';
    } else if (percentage >= 25) {
      grade = 'C';
      description = '투자 위험이 큽니다. 많은 지표에서 문제점이 발견되었습니다.';
    } else {
      grade = 'D';
      description = '투자에 적합하지 않습니다. 대부분의 지표가 기준에 미달합니다.';
    }
  }

  return {
    score: Math.round(totalScore * 10) / 10, // 소수점 첫째자리까지 표시
    maxScore: maxPossibleScore,
    percentage: Math.round(percentage),
    grade,
    description,
    coreItemsScore: Math.round(coreItemsScore * 10) / 10,
    detailedItemsScore: Math.round(detailedItemsScore * 10) / 10,
    hasCriticalFailure,
    coreItemsCount: coreItems.length,
    coreItemsPassCount,
  };
};
