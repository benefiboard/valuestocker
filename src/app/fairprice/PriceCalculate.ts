// src/lib/finance/PriceCalculate.ts

import {
  ApiResponse,
  CalculatedResults,
  CategorizedModels,
  FinancialData,
  ModelItem,
  StockPrice,
  UserData,
} from '@/lib/finance/types';

// 데이터 신뢰성 점수 계산 함수
export const calculateDataReliability = (
  financialData: FinancialData
): { score: number; message: string } => {
  let score = 10; // 기본 만점

  // 연속된 연도의 데이터가 있는지 확인
  if (financialData.years.length < 3) score -= 3;

  // EPS 데이터 완전성 확인
  const missingEpsYears = financialData.years.filter((year) => !financialData.epsByYear[year]);
  score -= missingEpsYears.length;

  // 음수 이익 확인
  const negativeEpsYears = financialData.years.filter((year) => financialData.epsByYear[year] < 0);
  if (negativeEpsYears.length > 0) score -= 2;

  // 데이터의 급격한 변동 확인
  let hasVolatileData = false;
  for (let i = 1; i < financialData.years.length; i++) {
    const currentEps = financialData.epsByYear[financialData.years[i - 1]];
    const prevEps = financialData.epsByYear[financialData.years[i]];
    if (currentEps && prevEps && Math.abs(currentEps / prevEps - 1) > 0.5) {
      hasVolatileData = true;
      break;
    }
  }
  if (hasVolatileData) score -= 2;

  // 신뢰성 메시지 생성
  let message = '';
  if (score >= 8) message = '데이터 신뢰성이 높습니다.';
  else if (score >= 5) message = '데이터 신뢰성이 보통입니다. 추가 검토를 권장합니다.';
  else message = '데이터 신뢰성이 낮습니다. 결과 해석에 주의가 필요합니다.';

  return {
    score: Math.max(0, score),
    message,
  };
};

// 적정가 범위 계산 함수
export const calculatePriceRange = (
  results: CalculatedResults
): {
  lowRange: number;
  midRange: number;
  highRange: number;
} => {
  const validPrices = [
    results.epsPer,
    results.controllingShareHolder,
    results.threeIndicatorsBps,
    results.threeIndicatorsEps,
    results.threeIndicatorsRoeEps,
    results.yamaguchi,
    results.sRimBase,
    results.pegBased,
  ].filter((price) => price > 0);

  validPrices.sort((a, b) => a - b);

  return {
    lowRange: validPrices[Math.floor(validPrices.length * 0.25)],
    midRange: validPrices[Math.floor(validPrices.length * 0.5)],
    highRange: validPrices[Math.floor(validPrices.length * 0.75)],
  };
};

// 변동계수 계산 헬퍼 함수
const calculateCV = (values: number[]): number => {
  if (values.length <= 1) return 0;

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  if (mean === 0) return 0;

  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return stdDev / Math.abs(mean);
};

// 위험-수익 프로필 함수
export const getRiskRewardProfile = (
  financialData: FinancialData
): {
  riskLevel: string;
  message: string;
} => {
  // EPS 변동성 계산
  const epsValues = Object.values(financialData.epsByYear).filter(
    (eps) => eps !== undefined && eps !== null
  ) as number[];
  const epsCV = calculateCV(epsValues);

  // ROE 변동성 계산
  const roeValues: number[] = [];
  financialData.years.forEach((year) => {
    const netIncome = financialData.netIncomeByYear[year];
    const equity = financialData.equityByYear[year];
    if (netIncome && equity && equity > 0) {
      roeValues.push((netIncome / equity) * 100);
    }
  });
  const roeCV = calculateCV(roeValues);

  // 위험 점수 계산
  const riskScore = (epsCV + roeCV) / 2;

  let riskLevel = '중간';
  let message = '';

  if (riskScore < 0.3) {
    riskLevel = '낮음';
    message = '수익성이 안정적입니다. 예측 가능성이 높은 기업입니다.';
  } else if (riskScore < 0.6) {
    riskLevel = '중간';
    message = '보통 수준의 수익 변동성을 보입니다.';
  } else {
    riskLevel = '높음';
    message = '수익성 변동이 큽니다. 주의가 필요합니다.';
  }

  return { riskLevel, message };
};

// 모든 적정가 계산 함수
export const calculateAllPrices = (
  financialData: FinancialData,
  stockData: StockPrice,
  priceDataMap?: Record<string, StockPrice>,
  userData?: UserData,
  latestPriceData?: StockPrice | null
): CalculatedResults => {
  console.log('===== 적정가 계산 입력 데이터 =====');
  console.log('주식 데이터:', {
    code: stockData.code,
    name: stockData.name,
    price: stockData.price,
    sharesOutstanding: stockData.sharesOutstanding,
  });

  // 계산에 사용할 주가 데이터
  const stockPricesForCalc = priceDataMap || {};

  // 사용자 입력값 사용 또는 기본값 설정
  const userInputs = userData || {
    treasuryShares: '',
    targetPER: '10',
    expectedReturn: '8',
    pegRatio: '1.0',
  };

  // 발행주식수
  const n = stockData.sharesOutstanding;
  console.log('발행주식수:', n);

  // 자기주식수
  const nt = userInputs.treasuryShares === '' ? 0 : Number(userInputs.treasuryShares);
  console.log('자기주식수:', nt);

  // 적정 PER 배수
  const targetPer = Number(userInputs.targetPER);
  console.log('적정 PER 배수:', targetPer);

  // 기대수익률/할인율
  const discountRate = Number(userInputs.expectedReturn);
  console.log('기대수익률/할인율:', discountRate, '%');

  // EPS 데이터 없으면 당기순이익/발행주식수로 계산 시도
  if (
    Object.keys(financialData.epsByYear).length === 0 &&
    Object.keys(financialData.netIncomeByYear).length > 0
  ) {
    console.log('EPS 데이터 부족, 당기순이익/발행주식수로 계산');
    financialData.years.forEach((year) => {
      if (financialData.netIncomeByYear[year] && n > 0) {
        financialData.epsByYear[year] = financialData.netIncomeByYear[year] / n;
        console.log(
          `${year}년 EPS 계산: ${financialData.epsByYear[year]}원 (당기순이익 ${financialData.netIncomeByYear[year]} / 발행주식수 ${n})`
        );
      }
    });
  }

  // EPS 3년치 평균 계산
  console.log('===== EPS 데이터 =====');
  console.log('EPS 원본 데이터:', financialData.epsByYear);

  let totalEps = 0;
  let validEpsCount = 0;
  let hasNegativeEps = false;

  financialData.years.forEach((year) => {
    const yearEps = financialData.epsByYear[year];
    if (yearEps !== null && yearEps !== undefined) {
      if (yearEps < 0) {
        hasNegativeEps = true;
        // 음수 EPS는 0으로 처리
      } else {
        totalEps += yearEps;
      }
      validEpsCount++;
    }
  });

  const averageEps =
    validEpsCount > 0
      ? hasNegativeEps
        ? totalEps / 4.5 // 음수 EPS가 있으면 4.5로 나눔
        : totalEps / validEpsCount
      : 0;
  console.log('평균 EPS:', averageEps);

  // 기준연도(현재-1) 기준 재무 데이터
  const latestEps = financialData.epsByYear[financialData.years[0]] || 0; // 최신 EPS
  console.log('최신 EPS:', latestEps);

  const bps = financialData.equityAttributableToOwners / n; // BPS
  console.log('BPS(주당순자산):', bps);

  console.log('===== ROE 계산 =====');
  let totalRoe = 0;
  let validRoeCount = 0;
  let hasNegativeRoe = false; // 음수 ROE 존재 여부 체크

  financialData.years.forEach((year) => {
    const yearNetIncome = financialData.netIncomeByYear[year];
    const yearEquity = financialData.equityByYear[year];

    if (yearNetIncome && yearEquity && yearEquity > 0) {
      const yearRoe = (yearNetIncome / yearEquity) * 100;
      console.log(`${year}년 ROE: ${yearRoe.toFixed(2)}%`);

      // 음수 ROE 체크
      if (yearRoe < 0) {
        hasNegativeRoe = true;
        totalRoe += 0; // 음수는 0으로 처리
      } else {
        totalRoe += yearRoe;
      }

      validRoeCount++;
    } else {
      console.log(`${year}년 ROE: 계산 불가 (데이터 부족)`);
    }
  });

  // 평균 ROE 계산
  const averageRoe =
    validRoeCount > 0
      ? hasNegativeRoe
        ? totalRoe / 4.5 // 음수 ROE가 하나라도 있으면 4.5로 나눔
        : totalRoe / validRoeCount // 모두 양수면 기존 방식대로
      : (financialData.netIncome / financialData.equityAttributableToOwners) * 100;

  console.log('ROE(%) 평균:', averageRoe.toFixed(2));
  console.log('당기순이익:', financialData.netIncome);
  console.log('지배주주 소유지분:', financialData.equityAttributableToOwners);

  // 과거 PER 계산 (연도별 종가 / EPS)
  console.log('===== PER 계산 =====');
  console.log('주가 데이터:', stockPricesForCalc);

  let historicalPER = 0;
  let validPERCount = 0;

  // 각 연도의 PER 합산
  financialData.years.forEach((year) => {
    const yearEps = financialData.epsByYear[year];
    const yearPrice = stockPricesForCalc[year]?.price;

    console.log(`${year}년 주가:`, yearPrice);
    console.log(`${year}년 EPS:`, yearEps);

    // 값이 존재하기만 하면 됨 (주가는 필수)
    if (yearEps !== null && yearEps !== undefined && yearPrice) {
      const per = yearPrice / yearEps;
      console.log(`${year}년 PER:`, per);
      historicalPER += per;
      validPERCount++;
    } else {
      console.log(`${year}년 PER: 계산 불가 (EPS 값이 없거나 주가 데이터 없음)`);
    }
  });

  // 평균 PER 계산 (유효한 값이 없으면 기본값 10 사용)
  const averagePER = validPERCount > 0 ? historicalPER / validPERCount : 10;
  console.log('평균 PER:', averagePER);

  // 영업이익 평균 계산
  console.log('===== 영업이익 데이터 =====');
  console.log('영업이익 원본 데이터:', financialData.operatingIncomes);

  const operatingIncomeValues = Object.values(financialData.operatingIncomes);
  console.log('영업이익 값 목록:', operatingIncomeValues);

  let totalOpIncome = 0;
  let hasNegativeOpIncome = false;

  operatingIncomeValues.forEach((income) => {
    if (income < 0) {
      hasNegativeOpIncome = true;
      // 음수 영업이익은 0으로 처리
    } else {
      totalOpIncome += income;
    }
  });

  const yearlyOperatingIncome =
    operatingIncomeValues.length > 0
      ? hasNegativeOpIncome
        ? totalOpIncome / 4.5 // 음수가 있으면 4.5로 나눔
        : totalOpIncome / operatingIncomeValues.length
      : 0;
  console.log('평균 영업이익:', yearlyOperatingIncome);

  //peg계산법
  let growthRate = 0;

  // 최근 2년간의 EPS 데이터가 있을 경우 성장률 계산
  if (
    financialData.years.length >= 2 &&
    financialData.epsByYear[financialData.years[0]] &&
    financialData.epsByYear[financialData.years[1]]
  ) {
    const latestEps = financialData.epsByYear[financialData.years[0]];
    const prevYearEps = financialData.epsByYear[financialData.years[1]];

    // 성장률 계산 (1년 성장률)
    if (prevYearEps !== 0) {
      growthRate = (latestEps / prevYearEps - 1) * 100;
    }

    console.log('1년 EPS 성장률:', growthRate.toFixed(2) + '%');
  }

  // 또는 3년 CAGR 계산 (데이터가 충분하다면)
  else if (
    financialData.years.length >= 3 &&
    financialData.epsByYear[financialData.years[0]] &&
    financialData.epsByYear[financialData.years[2]]
  ) {
    const latestEps = financialData.epsByYear[financialData.years[0]];
    const oldestEps = financialData.epsByYear[financialData.years[2]];

    // 2년간의 CAGR 계산
    if (oldestEps > 0) {
      growthRate = (Math.pow(latestEps / oldestEps, 1 / 2) - 1) * 100;
    }

    console.log('2년 CAGR 성장률:', growthRate.toFixed(2) + '%');
  }

  // 성장률이 음수인 경우 또는 계산이 불가능한 경우
  if (growthRate <= 0) {
    // 대안: 당기순이익 성장률 사용
    if (
      financialData.years.length >= 2 &&
      financialData.netIncomeByYear[financialData.years[0]] &&
      financialData.netIncomeByYear[financialData.years[1]]
    ) {
      const latestNetIncome = financialData.netIncomeByYear[financialData.years[0]];
      const prevYearNetIncome = financialData.netIncomeByYear[financialData.years[1]];

      if (prevYearNetIncome > 0) {
        growthRate = (latestNetIncome / prevYearNetIncome - 1) * 100;
        console.log('당기순이익 기반 성장률:', growthRate.toFixed(2) + '%');
      }
    }
  }

  // 여전히 성장률이 음수 또는 0인 경우, 산업 평균 또는 안전한 기본값 사용
  if (growthRate <= 0) {
    growthRate = 5; // 기본 성장률 5% 가정
    console.log('유효한 성장률 계산 불가, 기본값 사용:', growthRate.toFixed(2) + '%');
  }

  // PEG 기반 적정 PER 계산
  const pegRatio = Number(userInputs.pegRatio) || 1.0; // 사용자 입력값 또는 기본값 1.0
  let pegBasedPER = growthRate * pegRatio;

  // PER 값의 범위 제한 (너무 낮거나 높은 값 방지)
  pegBasedPER = Math.max(5, Math.min(50, pegBasedPER)); // 5~50 범위로 제한

  console.log('PEG 비율:', pegRatio);
  console.log('성장률:', growthRate.toFixed(2) + '%');
  console.log('PEG 기반 적정 PER:', pegBasedPER.toFixed(2));

  // 계산 결과 저장 객체
  const calculatedResults: CalculatedResults = {
    epsPer: 0,
    controllingShareHolder: 0,
    threeIndicatorsBps: 0,
    threeIndicatorsEps: 0,
    threeIndicatorsRoeEps: 0,
    yamaguchi: 0,
    sRimBase: 0,
    sRimDecline10pct: 0,
    sRimDecline20pct: 0,
    averageEps: averageEps,
    averagePER: averagePER,
    pegBased: 0,
    growthRate: growthRate,
    pegBasedPER: pegBasedPER,
    // 새로운 필드 추가
    dataReliability: calculateDataReliability(financialData),
    priceRange: { lowRange: 0, midRange: 0, highRange: 0 },
    riskProfile: getRiskRewardProfile(financialData),
    priceSignal: { signal: '', message: '' },
  };

  console.log('===== 적정주가 계산 =====');

  // 1. EPS × 과거 3년 평균 PER
  calculatedResults.epsPer = averageEps * averagePER;
  console.log('1. 평균EPS:', averageEps, '원');
  console.log('1. 평균PER:', averagePER);
  console.log('1. EPS × 평균 PER:', calculatedResults.epsPer);

  // 2. 당기순이익 기반 PER 모델
  calculatedResults.controllingShareHolder = (financialData.netIncome * targetPer) / n;
  console.log('2. 당기순이익 기반 PER 모델:', calculatedResults.controllingShareHolder);

  // 3-5. 3가지 지표 비교 방식
  calculatedResults.threeIndicatorsBps = bps; // BPS에는 곱하기 1
  console.log('3. BPS 기준(P₁):', calculatedResults.threeIndicatorsBps);

  calculatedResults.threeIndicatorsEps = averageEps * 10;
  console.log('4. EPS 기준(P₂):', calculatedResults.threeIndicatorsEps);

  calculatedResults.threeIndicatorsRoeEps = (averageRoe / 100) * 100 * averageEps;
  console.log('5. ROE×EPS 기준(P₃):', calculatedResults.threeIndicatorsRoeEps);

  // 6. 야마구치 요해이 공식
  const vb = (yearlyOperatingIncome * (1 - 25 / 100)) / (discountRate / 100);
  console.log('영업가치(Vb):', vb);

  const va =
    financialData.currentAssets -
    financialData.currentLiabilities * 1.2 +
    financialData.investmentAssets;
  console.log('비사업가치(Va):', va);

  calculatedResults.yamaguchi = (vb + va - financialData.nonCurrentLiabilities) / n;
  console.log('6. 야마구치 요해이 공식:', calculatedResults.yamaguchi);

  // 7. 사경인의 S-rim
  const e = financialData.equityAttributableToOwners;
  console.log('자기자본(E):', e);

  const r_srim = discountRate / 100;
  console.log('할인율(r):', r_srim);

  // 기본 S-rim (ROE 유지 시나리오)
  calculatedResults.sRimBase = (e + (e * (averageRoe / 100 - r_srim)) / r_srim) / (n - nt);
  console.log('7-1. S-rim 기본:', calculatedResults.sRimBase);

  // ROE 10% 감소 시나리오
  const roe_10pct_decrease = (averageRoe / 100) * 0.9;
  console.log('ROE 10% 감소:', roe_10pct_decrease);

  calculatedResults.sRimDecline10pct =
    (e + (e * (roe_10pct_decrease - r_srim)) / r_srim) / (n - nt);
  console.log('7-2. S-rim ROE 10% 감소:', calculatedResults.sRimDecline10pct);

  // ROE 20% 감소 시나리오
  const roe_20pct_decrease = (averageRoe / 100) * 0.8;
  console.log('ROE 20% 감소:', roe_20pct_decrease);

  calculatedResults.sRimDecline20pct =
    (e + (e * (roe_20pct_decrease - r_srim)) / r_srim) / (n - nt);
  console.log('7-3. S-rim ROE 20% 감소:', calculatedResults.sRimDecline20pct);

  calculatedResults.pegBased = latestEps * pegBasedPER;
  console.log('8. PEG 기반 적정주가:', calculatedResults.pegBased);

  console.log('===== 최종 계산 결과 =====');
  console.log(JSON.stringify(calculatedResults, null, 2));

  calculatedResults.priceRange = calculatePriceRange(calculatedResults);

  // 결과 분류
  const categorizedModels = categorizeModels(calculatedResults);
  calculatedResults.categorizedModels = categorizedModels;

  // 이상치 탐지
  const { normalModels, outliers, hasOutliers } = detectOutliers(categorizedModels);
  calculatedResults.outliers = outliers;
  calculatedResults.hasOutliers = hasOutliers;

  // PER 분석
  const eps = financialData.epsByYear[financialData.years[0]];
  const per = stockData.price / (eps || 1); // eps가 0일 경우 대비
  calculatedResults.perAnalysis = analyzePER(per, eps);

  // 적정가 범위 계산 (이상치 제외)
  // 이상치가 있으면 이상치를 제외한 값들로 범위 계산
  const normalValues = normalModels.map((item) => item.value).filter((value) => value > 0);

  // 정상 모델이 최소 3개 이상 있을 때만 계산
  if (normalValues.length >= 3) {
    normalValues.sort((a, b) => a - b);
    calculatedResults.priceRange = {
      lowRange: normalValues[Math.floor(normalValues.length * 0.25)],
      midRange: normalValues[Math.floor(normalValues.length * 0.5)],
      highRange: normalValues[Math.floor(normalValues.length * 0.75)],
    };
    console.log('이상치를 제외한 적정가 범위 계산:', calculatedResults.priceRange);
  } else {
    // 정상 모델이 너무 적으면 기존 방식 사용
    calculatedResults.priceRange = calculatePriceRange(calculatedResults);
    console.log('기존 방식의 적정가 범위 계산:', calculatedResults.priceRange);
  }
  // 현재 가격 변수를 한 번만 정의
  const currentPrice = latestPriceData?.price || 0;

  // 정의된 변수를 사용
  calculatedResults.priceSignal = getPriceSignal(
    currentPrice,
    calculatedResults.priceRange.midRange
  );

  console.log('추가 분석 결과:', {
    dataReliability: calculatedResults.dataReliability,
    priceRange: calculatedResults.priceRange,
    riskProfile: calculatedResults.riskProfile,
    priceSignal: calculatedResults.priceSignal,
    categorizedModels: calculatedResults.categorizedModels,
    outliers: calculatedResults.outliers,
    hasOutliers: calculatedResults.hasOutliers,
    perAnalysis: calculatedResults.perAnalysis,
  });

  return calculatedResults;
};

// 신호등 시스템 함수
export const getPriceSignal = (
  currentPrice: number,
  fairPriceMedian: number
): {
  signal: string;
  message: string;
} => {
  console.log('현재주가 뭐지?', currentPrice);
  const ratio = currentPrice / fairPriceMedian;

  if (ratio < 0.7) return { signal: 'green', message: '크게 저평가됨 (30% 이상)' };
  if (ratio < 0.9) return { signal: 'lightgreen', message: '저평가됨 (10-30%)' };
  if (ratio < 1.1) return { signal: 'yellow', message: '적정가 근처 (±10%)' };
  if (ratio < 1.3) return { signal: 'orange', message: '고평가됨 (10-30%)' };
  return { signal: 'red', message: '크게 고평가됨 (30% 이상)' };
};

// 모델 분류 함수 수정
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

// PER 상태 분석 함수
export const analyzePER = (per: number, eps: number): { status: string; message: string } => {
  // 상태 분석
  let status = 'normal';
  let message = '';

  if (eps <= 0) {
    status = 'negative';
    message = '회사가 손실을 기록하여 PER을 계산할 수 없습니다.';
  } else if (per > 200) {
    status = 'extreme_high';
    message =
      'PER이 200 이상으로 비정상적으로 높습니다. 이익 규모가 매우 작거나 일시적 상황일 수 있습니다.';
  } else if (per > 80) {
    status = 'very_high';
    message = 'PER이 매우 높습니다. 고성장이 예상되거나 일시적 이익 감소 상황일 수 있습니다.';
  } else if (per < 5) {
    status = 'very_low';
    message = 'PER이 매우 낮습니다. 저평가되었거나 구조적 문제가 있을 수 있습니다.';
  }

  return { status, message };
};

// 이상치 탐지 함수
export const detectOutliers = (
  categorizedModels: CategorizedModels
): {
  normalModels: ModelItem[];
  outliers: ModelItem[];
  hasOutliers: boolean;
} => {
  // 계산에 사용할 모델들만 대상으로 함 (참고용 시나리오 제외)
  const allModels = categorizedModels.all;
  const validValues = allModels.filter((item) => item.value > 0).map((item) => item.value);

  // 중앙값 계산
  validValues.sort((a, b) => a - b);
  const median = validValues[Math.floor(validValues.length / 2)];

  // 이상치 판별 (BPS는 무조건 포함)
  const normalModels: ModelItem[] = [];
  const outliers: ModelItem[] = [];

  allModels.forEach((model) => {
    // BPS는 항상 정상 모델로 포함 (음수가 아닌 한)
    if (model.name.includes('BPS') && model.value > 0) {
      normalModels.push(model);
    }
    // 나머지 지표들은 일반적인 이상치 처리
    else if (model.value <= 0) {
      outliers.push({ ...model, reason: 'negative_or_zero' });
    } else if (model.value > median * 3 || model.value < median / 3) {
      outliers.push({ ...model, reason: 'value_range' });
    } else {
      normalModels.push(model);
    }
  });

  return {
    normalModels,
    outliers,
    hasOutliers: outliers.length > 0,
  };
};
