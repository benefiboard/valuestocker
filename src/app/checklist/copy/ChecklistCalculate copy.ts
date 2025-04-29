// src/app/checklist/ChecklistCalculate.ts

import { ChecklistItem, StockPrice, ScoredChecklistItem, InvestmentRating } from '../types';
import precalculatedData from '@/lib/finance/stock_checklist_2025.json';
import {
  FINANCIAL_COMPANIES,
  EXCLUDED_ITEMS_BY_INDUSTRY,
  getCoreItemTitles,
  getIndustryThresholds,
  INDUSTRY_GROUPS,
} from '../constants/industryThresholds';
import { initialChecklist, SCORE_THRESHOLDS } from '../constants/checklistItems';

// 미리 계산된 데이터와 현재 주가를 이용한 체크리스트 계산 함수
export const calculateJsonChecklist = (
  stockCode: string,
  stockPrice: StockPrice,
  industry: string = 'etc'
): ScoredChecklistItem[] => {
  // 미리 계산된 데이터 가져오기
  const stockData = (precalculatedData as any)[stockCode];

  if (!stockData) {
    console.error(`종목 데이터를 찾을 수 없습니다: ${stockCode}`);
    return [];
  }

  // 현재 주가
  const currentPrice = stockPrice.price;
  const currentEps = stockData.currentYearEps || 0;
  // 현재 EPS
  console.log('EPS 데이터:', currentEps);
  console.log('현재가격:', currentPrice);
  const currentPer = currentPrice / currentEps;
  console.log('현재 PER:', currentPer);
  console.log('스톡데이터전체:', stockData);
  // 현재 PER 계산

  // 금융회사 여부 확인
  const isFinancialCompany = FINANCIAL_COMPANIES.includes(stockCode);

  // 임계값 가져오기
  const thresholds = getIndustryThresholds(industry);

  // 산업군별 핵심 지표 목록 가져오기
  const coreItemTitles = isFinancialCompany
    ? ['PER', 'EPS 성장률', '순이익 증가율'] // 금융회사용 핵심 지표 3개
    : getCoreItemTitles(industry); // 다른 산업군용 핵심 지표

  console.log(`${industry} 산업군 핵심 지표:`, coreItemTitles);
  console.log(`금융회사 여부: ${isFinancialCompany}`);

  // 체크리스트 초기화
  let results = [...initialChecklist] as ScoredChecklistItem[];

  // 1. 각 항목의 카테고리 처리 (핵심 지표 vs 세부 지표)
  results = results.map((item) => {
    // 핵심 지표 카테고리인데 해당 산업의 핵심 지표가 아닌 경우 세부 지표로 변경
    if (item.category === '핵심 지표' && !coreItemTitles.includes(item.title)) {
      return {
        ...item,
        category: '세부 지표 - 핵심지표 외', // 세부 지표로 카테고리 변경
      };
    }
    // 세부 지표인데 해당 산업의 핵심 지표인 경우 핵심 지표로 변경
    else if (item.category !== '핵심 지표' && coreItemTitles.includes(item.title)) {
      return {
        ...item,
        category: '핵심 지표', // 핵심 지표로 카테고리 변경
      };
    }
    return item;
  });

  // 2. 금융회사의 경우 제외 항목 처리 (핵심 지표는 보존)
  if (isFinancialCompany) {
    console.log(`금융회사 감지: ${stockPrice.name} (${stockPrice.code})`);
    const excludedItems = EXCLUDED_ITEMS_BY_INDUSTRY['금융'] || [];
    results = results.filter((item) => {
      // 핵심 지표는 무조건 유지
      if (coreItemTitles.includes(item.title)) {
        return true;
      }
      // 제외 항목에 있으면 필터링
      return !excludedItems.includes(item.title);
    });
  }
  // 산업군별 제외 항목 처리 (핵심 지표는 보존)
  else {
    const excludedItems = EXCLUDED_ITEMS_BY_INDUSTRY[industry] || [];
    if (excludedItems.length > 0) {
      console.log(`${industry} 산업군 특화 평가: 일부 지표 제외 적용`);
      results = results.filter((item) => {
        // 핵심 지표는 무조건 유지
        if (coreItemTitles.includes(item.title)) {
          return true;
        }
        // 제외 항목에 있으면 필터링
        return !excludedItems.includes(item.title);
      });
    }
  }

  // 디버깅: 핵심 지표 목록 확인
  const finalCoreItems = results.filter((item) => item.category === '핵심 지표');
  console.log(`최종 핵심 지표 개수: ${finalCoreItems.length}개`);
  console.log(`핵심 지표 목록: ${finalCoreItems.map((item) => item.title).join(', ')}`);

  // 누락된 핵심 지표 확인
  const missingCoreItems = coreItemTitles.filter(
    (title) => !finalCoreItems.map((item) => item.title).includes(title)
  );
  if (missingCoreItems.length > 0) {
    console.log(`누락된 핵심 지표: ${missingCoreItems.join(', ')}`);

    // 누락된 핵심 지표 추가
    missingCoreItems.forEach((title) => {
      const templateItem = initialChecklist.find((item) => item.title === title);
      if (templateItem) {
        const newItem: ScoredChecklistItem = {
          ...templateItem,
          category: '핵심 지표',
          score: 0,
          maxScore: 10,
          isFailCriteria: true,
          actualValue: null,
          isPassed: false,
        };
        results.push(newItem);
        console.log(`핵심 지표 추가됨: ${title}`);
      }
    });
  }

  // 이제 각 체크리스트 항목을 JSON 데이터를 사용하여 업데이트
  results.forEach((item) => {
    // 기본값 설정
    item.score = 0;
    item.maxScore = 10;
    item.isFailCriteria = false;

    switch (item.title) {
      // 핵심 지표
      case 'PER':
        item.actualValue = currentPer;

        // 산업군별 차별화된 PER 평가
        if (currentPer <= 0) {
          item.score = 0; // 적자기업 (미달)
          item.isPassed = false;
        } else if (industry === '금융') {
          // 금융업 특화 PER 평가
          if (currentPer < thresholds.per * 0.8) item.score = 10;
          else if (currentPer < thresholds.per) item.score = 9;
          else if (currentPer < thresholds.per * 1.2) item.score = 8;
          else if (currentPer < thresholds.per * 1.5) item.score = 6;
          else if (currentPer < thresholds.per * 2) item.score = 4;
          else item.score = 2;

          item.isPassed = currentPer > 0.5 && currentPer < thresholds.per * 1.2;
        } else if (INDUSTRY_GROUPS.HIGH_GROWTH.includes(industry)) {
          // 고성장 산업 PER 평가
          if (currentPer < thresholds.per * 0.7) item.score = 10;
          else if (currentPer < thresholds.per) item.score = 9;
          else if (currentPer < thresholds.per * 1.3) item.score = 7;
          else if (currentPer < thresholds.per * 1.6) item.score = 5;
          else if (currentPer < thresholds.per * 2) item.score = 3;
          else item.score = 1;

          item.isPassed = currentPer > 0.5 && currentPer < thresholds.per;
        } else {
          // 일반 산업 PER 평가
          if (currentPer < thresholds.per * 0.6) item.score = 10;
          else if (currentPer < thresholds.per * 0.8) item.score = 9;
          else if (currentPer < thresholds.per) item.score = 8;
          else if (currentPer < thresholds.per * 1.3) item.score = 6;
          else if (currentPer < thresholds.per * 1.7) item.score = 3;
          else item.score = 1;

          item.isPassed = currentPer > 0.5 && currentPer < thresholds.per;
        }

        // 미달 여부 설정
        item.isFailCriteria = item.score === 0;

        // targetValue 업데이트
        item.targetValue = `0.5 < PER < ${thresholds.per}`;
        break;

      case '매출액 성장률':
        item.actualValue = stockData.revenueGrowthRate;

        // 매출 성장률 점수 계산
        if (isNaN(stockData.revenueGrowthRate)) {
          item.score = 0;
        } else if (stockData.revenueGrowthRate < 0) {
          item.score = 0;
        } else if (stockData.revenueGrowthRate >= 20) {
          item.score = 10;
        } else if (stockData.revenueGrowthRate >= 15) {
          item.score = 9;
        } else if (stockData.revenueGrowthRate >= 10) {
          item.score = 8;
        } else if (stockData.revenueGrowthRate >= 7) {
          item.score = 7;
        } else if (stockData.revenueGrowthRate >= 5) {
          item.score = 6;
        } else {
          item.score = 4;
        }

        item.isPassed = stockData.revenueGrowthRate >= 10 || stockData.revenueGrowthRate === 100; // 10% 이상 성장 또는 흑자전환
        item.isFailCriteria = item.score === 0;
        break;

      case '영업이익률':
        item.actualValue = stockData.avgOpMargin;

        // 산업군별 영업이익률 평가
        if (stockData.avgOpMargin < 0) {
          item.score = 0; // 적자는 무조건 0점
          item.isPassed = false;
          item.isFailCriteria = true;
        } else if (INDUSTRY_GROUPS.HIGH_GROWTH.includes(industry)) {
          // 고성장 산업 영업이익률 기준
          if (stockData.avgOpMargin >= thresholds.operatingMargin * 1.5) item.score = 10;
          else if (stockData.avgOpMargin >= thresholds.operatingMargin * 1.2) item.score = 9;
          else if (stockData.avgOpMargin >= thresholds.operatingMargin) item.score = 8;
          else if (stockData.avgOpMargin >= thresholds.operatingMargin * 0.8) item.score = 6;
          else if (stockData.avgOpMargin >= thresholds.operatingMargin * 0.5) item.score = 4;
          else item.score = 2;

          item.isPassed = stockData.avgOpMargin > thresholds.operatingMargin;
        } else if (INDUSTRY_GROUPS.STABLE.includes(industry)) {
          // 안정 산업 영업이익률 기준
          if (stockData.avgOpMargin >= thresholds.operatingMargin * 1.3) item.score = 10;
          else if (stockData.avgOpMargin >= thresholds.operatingMargin) item.score = 9;
          else if (stockData.avgOpMargin >= thresholds.operatingMargin * 0.8) item.score = 7;
          else if (stockData.avgOpMargin >= thresholds.operatingMargin * 0.6) item.score = 5;
          else item.score = 3;

          item.isPassed = stockData.avgOpMargin > thresholds.operatingMargin * 0.8;
        } else {
          // 일반 산업 영업이익률 기준
          if (stockData.avgOpMargin >= thresholds.operatingMargin * 1.5) item.score = 10;
          else if (stockData.avgOpMargin >= thresholds.operatingMargin * 1.2) item.score = 9;
          else if (stockData.avgOpMargin >= thresholds.operatingMargin) item.score = 8;
          else if (stockData.avgOpMargin >= thresholds.operatingMargin * 0.7) item.score = 6;
          else if (stockData.avgOpMargin >= thresholds.operatingMargin * 0.5) item.score = 5;
          else item.score = 3;

          item.isPassed = stockData.avgOpMargin > thresholds.operatingMargin;
        }

        // 미달 여부 설정
        item.isFailCriteria = item.score === 0;

        // targetValue 업데이트
        item.targetValue = `> ${thresholds.operatingMargin}%`;
        break;

      case '영업이익 성장률':
        item.actualValue = stockData.opIncomeGrowthRate;

        // 영업이익 성장률 점수 계산
        if (isNaN(stockData.opIncomeGrowthRate)) {
          item.score = 0;
        } else if (stockData.opIncomeGrowthRate < -10) {
          item.score = 0;
        } else if (stockData.opIncomeGrowthRate <= 0) {
          item.score = 2;
        } else if (stockData.opIncomeGrowthRate >= 25) {
          item.score = 10;
        } else if (stockData.opIncomeGrowthRate >= 20) {
          item.score = 9;
        } else if (stockData.opIncomeGrowthRate >= 15) {
          item.score = 8;
        } else if (stockData.opIncomeGrowthRate >= 10) {
          item.score = 7;
        } else if (stockData.opIncomeGrowthRate >= 5) {
          item.score = 6;
        } else {
          item.score = 4;
        }

        item.isPassed = stockData.opIncomeGrowthRate >= 10 || stockData.opIncomeGrowthRate === 100;
        // 흑자전환이면 미달에서 제외
        item.isFailCriteria = item.score === 0 && stockData.opIncomeGrowthRate !== 100;
        break;

      case 'EPS 성장률':
        item.actualValue = stockData.epsGrowthRate;

        // EPS 성장률 점수 계산
        if (isNaN(stockData.epsGrowthRate)) {
          item.score = 0;
        } else if (stockData.epsGrowthRate < -10) {
          item.score = 0;
        } else if (stockData.epsGrowthRate < 0) {
          item.score = 2;
        } else if (stockData.epsGrowthRate >= 25) {
          item.score = 10;
        } else if (stockData.epsGrowthRate >= 20) {
          item.score = 9;
        } else if (stockData.epsGrowthRate >= 15) {
          item.score = 8;
        } else if (stockData.epsGrowthRate >= 10) {
          item.score = 7;
        } else if (stockData.epsGrowthRate >= 5) {
          item.score = 6;
        } else {
          item.score = 4;
        }

        item.isPassed = stockData.epsGrowthRate >= 10 || stockData.epsGrowthRate === 100;
        // 흑자전환이면 미달에서 제외
        item.isFailCriteria = item.score === 0 && stockData.epsGrowthRate !== 100;
        break;

      case '순이익 증가율':
        item.actualValue = stockData.netIncomeGrowthRate;

        // 순이익 증가율 점수 계산
        if (isNaN(stockData.netIncomeGrowthRate)) {
          item.score = 0;
        } else if (stockData.netIncomeGrowthRate < -10) {
          item.score = 0;
        } else if (stockData.netIncomeGrowthRate < 0) {
          item.score = 2;
        } else if (stockData.netIncomeGrowthRate >= 50) {
          item.score = 7;
        } else if (stockData.netIncomeGrowthRate >= 40) {
          item.score = 9;
        } else if (stockData.netIncomeGrowthRate >= 30) {
          item.score = 10;
        } else if (stockData.netIncomeGrowthRate >= 20) {
          item.score = 9;
        } else if (stockData.netIncomeGrowthRate >= 10) {
          item.score = 7;
        } else if (stockData.netIncomeGrowthRate >= 5) {
          item.score = 6;
        } else {
          item.score = 4;
        }

        // 순이익은 20~50% 범위가 이상적이지만, 흑자전환도 매우 긍정적으로 평가
        item.isPassed =
          (stockData.netIncomeGrowthRate >= 20 && stockData.netIncomeGrowthRate < 50) ||
          stockData.netIncomeGrowthRate === 100;
        // 흑자전환이면 미달에서 제외
        item.isFailCriteria = item.score === 0 && stockData.netIncomeGrowthRate !== 100;
        break;

      case 'ROE (자기자본이익률)':
        item.actualValue = stockData.avgRoe;

        // 음수 ROE는 무조건 0점
        if (stockData.avgRoe < 0) {
          item.score = 0;
          item.isPassed = false;
          item.isFailCriteria = true;
        } else {
          // 금융사는 기준 다르게 적용
          if (isFinancialCompany) {
            item.score =
              stockData.avgRoe > 15
                ? 10 // 금융사 탁월
                : stockData.avgRoe > 10
                ? 9 // 금융사 우수
                : stockData.avgRoe > 8
                ? 8 // 금융사 양호
                : stockData.avgRoe > 6
                ? 7 // 금융사 보통
                : stockData.avgRoe > 0
                ? 4
                : 0; // 금융사 미흡

            // 금융사는 8% 이상이면 양호
            item.isPassed = stockData.avgRoe > 8;
          } else {
            // 기존 일반 기업 기준
            item.score =
              stockData.avgRoe > 20
                ? 10
                : stockData.avgRoe > 15
                ? 8
                : stockData.avgRoe > 10
                ? 6
                : stockData.avgRoe > 5
                ? 4
                : stockData.avgRoe > 0
                ? 2
                : 0;

            // 일반 기업은 15% 이상
            item.isPassed = stockData.avgRoe > 15;
          }

          item.isFailCriteria = stockData.avgRoe < 0;
        }
        break;

      case 'PBR (주가순자산비율)':
        // 현재 PBR 계산
        const currentBps = stockData.currentBps;
        const pbr = currentBps > 0 ? currentPrice / currentBps : 0;
        item.actualValue = pbr;

        // 금융사는 기준 다르게 적용
        if (isFinancialCompany) {
          item.score =
            pbr < 0.7
              ? 10 // 금융사는 더 낮은 PBR이 정상
              : pbr < 1.0
              ? 8
              : pbr < 1.2
              ? 6
              : pbr < 1.5
              ? 4
              : 2;

          // 금융사는 1.0 미만이면 양호
          item.isPassed = pbr < 1.0;

          // 금융사의 경우 targetValue 수정
          item.targetValue = '< 1.0';
        } else {
          // 기존 일반 기업 기준
          item.score = pbr < 1 ? 10 : pbr < 1.2 ? 8 : pbr < 1.5 ? 6 : pbr < 2 ? 4 : 2;

          // 일반 기업은 1.2 미만
          item.isPassed = pbr < 1.2;
        }
        break;

      case '부채비율':
        item.actualValue = stockData.debtRatio;
        item.score =
          stockData.debtRatio < 50
            ? 10
            : stockData.debtRatio < 80
            ? 8
            : stockData.debtRatio < 100
            ? 6
            : stockData.debtRatio < 150
            ? 4
            : stockData.debtRatio < 200
            ? 2
            : 0;
        item.isPassed = stockData.debtRatio < 100;
        item.isFailCriteria = stockData.debtRatio > 200;
        break;

      case '현금회전일수':
        item.actualValue = stockData.cashCycleDays;
        item.score =
          stockData.cashCycleDays < 60
            ? 10
            : stockData.cashCycleDays < 90
            ? 8
            : stockData.cashCycleDays < 120
            ? 6
            : stockData.cashCycleDays < 150
            ? 4
            : 2;
        item.isPassed = stockData.cashCycleDays < 120;
        break;

      case '매출총이익률':
        // 필요한 데이터가 없으면 중립 평가
        if (stockData.grossProfitMargin === null) {
          item.actualValue = null;
          item.score = 5;
          item.isPassed = null;
        } else {
          item.actualValue = stockData.grossProfitMargin;
          const grossProfitMargin = stockData.grossProfitMargin as number;
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
        }
        break;

      case 'FCF 비율':
        item.actualValue = stockData.fcfRatio;
        item.score =
          stockData.fcfRatio > 10
            ? 10
            : stockData.fcfRatio > 7
            ? 8
            : stockData.fcfRatio > 5
            ? 6
            : stockData.fcfRatio > 3
            ? 4
            : stockData.fcfRatio > 0
            ? 2
            : 0;
        item.isPassed = stockData.fcfRatio > 7;
        break;

      case '현재 PER < 3년 최고 PER * 0.4':
        const maxPerTimes04 = stockData.maxPerTimes04;
        item.actualValue = currentPer;

        if (currentPer <= 0) {
          item.score = 0;
          item.isPassed = false;
          item.isFailCriteria = true;
        } else {
          if (isFinancialCompany) {
            // 금융주는 PER 변동성이 작아 기준 완화
            const maxPer = stockData.maxPer;
            const maxPerRatio = maxPer > 0 ? currentPer / maxPer : 0;
            item.score =
              maxPerRatio < 0.6 ? 10 : maxPerRatio < 0.75 ? 8 : maxPerRatio < 0.9 ? 6 : 4;
            item.isPassed = currentPer < maxPer * 0.7;
            item.targetValue = '< 3년 최고 PER * 0.7'; // 금융주용 기준 수정
          } else {
            // 기존 일반 기업 기준
            const maxPer = stockData.maxPer;
            item.score =
              currentPer < maxPerTimes04
                ? 10
                : currentPer < maxPer * 0.6
                ? 7
                : currentPer < maxPer * 0.8
                ? 4
                : 2;
            item.isPassed = currentPer < maxPerTimes04;
          }
        }
        break;

      case 'PER < 3년 평균 PER':
        if (currentPer <= 0) {
          item.actualValue = currentPer;
          item.score = 0;
          item.isPassed = false;
          item.isFailCriteria = true;
        } else {
          item.actualValue = currentPer;
          const avgPer = stockData.avgPer;

          if (isFinancialCompany) {
            // 금융주는 PER 등락이 작아 기준 조정
            const avgPerRatio = avgPer > 0 ? currentPer / avgPer : 0;
            item.score =
              avgPerRatio < 0.95 ? 10 : avgPerRatio < 1.1 ? 8 : avgPerRatio < 1.2 ? 6 : 4;
            item.isPassed = currentPer < avgPer * 1.1; // 10% 이내면 양호로 간주
            item.targetValue = '< 3년 평균 PER * 1.1'; // 금융주용 기준 수정
          } else {
            // 기존 일반 기업 기준
            const avgPerRatio = avgPer > 0 ? currentPer / avgPer : 0;
            item.score = avgPerRatio < 0.8 ? 10 : avgPerRatio < 1 ? 8 : avgPerRatio < 1.2 ? 5 : 2;
            item.isPassed = currentPer < avgPer;
          }
        }
        break;

      case 'BPS 성장률':
        item.actualValue = stockData.bpsGrowthRate;

        if (isFinancialCompany) {
          // 금융주는 낮은 BPS 성장률도 정상적임
          const bpsGrowthRate = stockData.bpsGrowthRate as number;
          item.score =
            bpsGrowthRate > 10
              ? 10 // 10% 이상 (탁월)
              : bpsGrowthRate > 7
              ? 9 // 7% 이상 (우수)
              : bpsGrowthRate > 5
              ? 8 // 5% 이상 (양호)
              : bpsGrowthRate > 3
              ? 7 // 3% 이상 (보통)
              : bpsGrowthRate > 0
              ? 5
              : 2; // 0% 이상 (미흡)

          // 금융주는 3% 이상이면 통과
          item.isPassed = bpsGrowthRate > 3;
          // 금융주용 기준값 수정
          item.targetValue = '> 3%';
        } else {
          // 기존 일반 기업 기준
          const bpsGrowthRate = stockData.bpsGrowthRate as number;
          item.score =
            bpsGrowthRate > 15
              ? 10
              : bpsGrowthRate > 10
              ? 8
              : bpsGrowthRate > 7.2
              ? 6
              : bpsGrowthRate > 5
              ? 4
              : 2;

          item.isPassed = bpsGrowthRate > 7.2; // 7.2% 이상
        }
        break;

      case '유동비율':
        item.actualValue = stockData.currentRatio;
        item.score =
          stockData.currentRatio > 200
            ? 10
            : stockData.currentRatio > 150
            ? 8
            : stockData.currentRatio > 120
            ? 6
            : stockData.currentRatio > 100
            ? 4
            : 2;
        item.isPassed = stockData.currentRatio > 150;
        break;

      case '이자보상배율':
        item.actualValue = stockData.interestCoverageRatio;

        // 음수 이자보상배율은 0점 처리
        if (stockData.interestCoverageRatio <= 0) {
          item.score = 0;
          item.isPassed = false;
          item.isFailCriteria = true;
        } else {
          item.score =
            stockData.interestCoverageRatio > 5
              ? 10
              : stockData.interestCoverageRatio > 3
              ? 8
              : stockData.interestCoverageRatio > 2
              ? 6
              : stockData.interestCoverageRatio > 1
              ? 4
              : 2;
          item.isPassed = stockData.interestCoverageRatio > 2;
        }
        break;

      case '장기부채 대비 순이익':
        item.actualValue = stockData.nonCurrentLiabilitiesToNetIncome;

        // 순이익이 음수면 바로 미달 처리
        if (stockData.nonCurrentLiabilitiesToNetIncome <= 0) {
          item.score = 0;
          item.isPassed = false;
          item.isFailCriteria = true;
        } else {
          // 값을 숫자로 확실히 처리
          const ratio = stockData.nonCurrentLiabilitiesToNetIncome as number;
          item.score = ratio < 1 ? 10 : ratio < 2 ? 8 : ratio < 3 ? 6 : ratio < 5 ? 4 : 2;
          item.isPassed = ratio < 3;
        }
        break;

      case '이익잉여금 vs 당좌자산 증가율':
        // 이익잉여금 성장률 가져오기
        const retainedEarningsGrowthRate = stockData.retainedEarningsGrowthRate;

        // 이익잉여금이 음수이거나 감소중이면 미달
        if (retainedEarningsGrowthRate < 0) {
          item.actualValue = retainedEarningsGrowthRate;
          item.score = 0;
          item.isPassed = false;
          item.isFailCriteria = true;
        } else {
          const targetGrowthRate = retainedEarningsGrowthRate * 0.5;
          item.actualValue = targetGrowthRate;

          // 당좌자산 증가율 데이터가 없으면 중립 평가
          // JSON에는 당좌자산 증가율이 없으므로 중립적 평가
          item.isPassed = null;
          item.score = 5;
        }
        break;
    }
  });

  // 산업군별 가중치 적용
  results.forEach((item) => {
    // 산업군별 가중치 조정 함수
    const getItemWeight = (item: ScoredChecklistItem, industry: string): number => {
      // 기본 가중치 = 1.0
      let weight = 1.0;

      // 산업군 그룹에 따라 가중치 조정
      if (INDUSTRY_GROUPS.HIGH_GROWTH.includes(industry)) {
        // 고성장/기술 산업군 가중치
        if (['매출액 성장률', 'EPS 성장률'].includes(item.title)) {
          weight = 1.3;
        } else if (['영업이익률'].includes(item.title)) {
          weight = 1.2;
        } else if (['부채비율'].includes(item.title)) {
          weight = 0.8;
        }
      } else if (INDUSTRY_GROUPS.STABLE.includes(industry)) {
        // 안정/유틸리티 산업군 가중치
        if (['ROE (자기자본이익률)', 'FCF 비율'].includes(item.title)) {
          weight = 1.3;
        } else if (['매출액 성장률', 'EPS 성장률', '영업이익 성장률'].includes(item.title)) {
          weight = 0.7;
        }
      } else if (INDUSTRY_GROUPS.CYCLICAL.includes(industry)) {
        // 경기순환 산업군 가중치
        if (['PBR (주가순자산비율)'].includes(item.title)) {
          weight = 1.3;
        } else if (['현금회전일수'].includes(item.title)) {
          weight = 1.2;
        } else if (['영업이익률'].includes(item.title)) {
          weight = 1.1;
        }
      } else if (INDUSTRY_GROUPS.CONSUMER.includes(industry)) {
        // 소비자 서비스 산업군 가중치
        if (['매출총이익률'].includes(item.title)) {
          weight = 1.3;
        } else if (['현금회전일수'].includes(item.title)) {
          weight = 1.2;
        }
      }

      return weight;
    };

    const weight = getItemWeight(item, industry);
    if (weight !== 1.0) {
      console.log(`항목 "${item.title}" 가중치 조정: ×${weight}`);

      // 가중치 적용 (최대 점수 넘지 않도록)
      const weightedScore = Math.min(item.score * weight, item.maxScore);

      // 소수점 첫째자리까지 반올림
      item.score = Math.round(weightedScore * 10) / 10;
    }
  });

  // 최종 정렬 (핵심 지표 먼저, 그 다음 세부 지표)
  results.sort((a, b) => {
    // 핵심 지표와 세부 지표 구분
    const aIsCore = a.category === '핵심 지표';
    const bIsCore = b.category === '핵심 지표';

    // 핵심 지표는 먼저
    if (aIsCore && !bIsCore) return -1;
    if (!aIsCore && bIsCore) return 1;

    // 둘 다 핵심 지표인 경우 coreItemTitles 배열의 순서대로
    if (aIsCore && bIsCore) {
      return coreItemTitles.indexOf(a.title) - coreItemTitles.indexOf(b.title);
    }

    // 둘 다 세부 지표인 경우 카테고리 기준으로 정렬
    return a.category.localeCompare(b.category);
  });

  return results;
};

// 투자 등급 계산 함수 - UI 로직 제거
export const calculateJsonInvestmentRating = (
  checklistResults: ScoredChecklistItem[],
  stockCode?: string,
  industry: string = 'etc'
): InvestmentRating => {
  // 금융회사 여부 확인
  const isFinancialCompany = stockCode ? FINANCIAL_COMPANIES.includes(stockCode) : false;

  // 산업군별 핵심 지표 목록
  const coreItemTitles = isFinancialCompany
    ? ['PER', 'EPS 성장률', '순이익 증가율'] // 금융회사용 핵심 지표 3개
    : getCoreItemTitles(industry); // 다른 산업군용 핵심 지표

  if (checklistResults.length === 0) {
    return {
      score: 0,
      maxScore: 0,
      percentage: 0,
      grade: 'N/A',
      coreItemsScore: 0,
      detailedItemsScore: 0,
      hasCriticalFailure: false,
      coreItemsCount: 0,
      coreItemsPassCount: 0,
      isFinancialCompany,
    };
  }

  // 핵심 지표와 세부 지표 분리
  const coreItems = checklistResults.filter((item) => coreItemTitles.includes(item.title));
  const detailedItems = checklistResults.filter((item) => !coreItemTitles.includes(item.title));

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

  // 미달인 핵심 지표 개수
  const failedCoreItemsCount = coreItems.filter((item) => item.isFailCriteria).length;

  // 금융회사면 1개라도 미달이면 D, 아니면 2개 이상 미달이면 D
  const hasCriticalFailure = isFinancialCompany
    ? failedCoreItemsCount >= 1
    : failedCoreItemsCount >= 2;

  // 핵심 지표 중 통과된 항목 수
  const coreItemsPassCount = coreItems.filter((item) => item.score >= 6).length;

  // 등급 산정 (설명 없이 등급만 계산)
  let grade;
  const percentage = (totalScore / maxPossibleScore) * 100;

  if (hasCriticalFailure) {
    // 미달이 있으면 최대 D등급까지만 가능
    grade = percentage >= 40 ? 'D' : 'F';
  } else if (coreItemsPassCount < 3 && !isFinancialCompany) {
    // 금융회사가 아닌 경우에만 핵심 지표 통과 개수 제한 적용
    grade = percentage >= 50 ? 'C' : 'D';
  } else if (isFinancialCompany && coreItemsPassCount < 1) {
    // 금융회사는 최소 1개 이상의 핵심 지표는 통과해야 함
    grade = percentage >= 50 ? 'C' : 'D';
  } else {
    // 정상 등급 산정
    if (percentage >= 75) {
      grade = 'A+';
    } else if (percentage >= 65) {
      grade = 'A';
    } else if (percentage >= 55) {
      grade = 'B+';
    } else if (percentage >= 45) {
      grade = 'B';
    } else if (percentage >= 35) {
      grade = 'C+';
    } else if (percentage >= 25) {
      grade = 'C';
    } else {
      grade = 'D';
    }
  }

  return {
    score: Math.round(totalScore * 10) / 10,
    maxScore: maxPossibleScore,
    percentage: Math.round(percentage),
    grade,
    coreItemsScore: Math.round(coreItemsScore * 10) / 10,
    detailedItemsScore: Math.round(detailedItemsScore * 10) / 10,
    hasCriticalFailure,
    coreItemsCount: coreItems.length,
    coreItemsPassCount,
    isFinancialCompany,
  };
};
