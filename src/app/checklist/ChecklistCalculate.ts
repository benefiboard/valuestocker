// src/app/checklist/ChecklistCalculate.ts

import {
  ChecklistItem,
  StockPrice,
  ScoredChecklistItem,
  InvestmentRating,
  JsonChecklistData,
  StockCurrent,
} from './types';
import { supabase } from '../../lib/supabaseClient';
import {
  FINANCIAL_COMPANIES,
  EXCLUDED_ITEMS_BY_INDUSTRY,
  getCoreItemTitles,
  getIndustryThresholds,
  INDUSTRY_GROUPS,
} from './constants/industryThresholds';
import { initialChecklist, SCORE_THRESHOLDS } from './constants/checklistItems';

// Supabase에서 체크리스트 데이터 가져오기 (stock_naver_checklist 테이블)
export const getStockChecklistFromSupabase = async (
  stockCode: string
): Promise<JsonChecklistData | null> => {
  const { data, error } = await supabase
    .from('stock_naver_checklist')
    .select('*')
    .eq('stock_code', stockCode)
    .single();

  if (error || !data) {
    console.error('체크리스트 데이터 조회 실패:', error);
    return null;
  }

  // 컬럼명 매핑 (Supabase 소문자 -> CamelCase)
  return {
    stock_code: data.stock_code,
    dart_code: data.dart_code,
    company_name: data.company_name,
    shares_outstanding: data.shares_outstanding || '0',
    last_updated: data.last_updated,
    industry: data.industry,
    subIndustry: data.subindustry,

    // 성장률 지표들
    revenueGrowthRate: Number(data.revenuegrowthrate || 0),
    opIncomeGrowthRate: Number(data.opincomegrowthrate || 0),
    epsGrowthRate: Number(data.epsgrowthrate || 0),
    netIncomeGrowthRate: Number(data.netincomegrowthrate || 0),
    bpsGrowthRate: Number(data.bpsgrowthrate || 0),

    // 수익성 및 효율성 지표들
    avgOpMargin: Number(data.avgopmargin || 0),
    avgRoe: Number(data.avgroe || 0),
    avgRoa: Number(data.avgroa || 0),
    assetTurnover: Number(data.assetturnover || 0),
    equityTurnover: Number(data.equityturnover || 0),

    // 재무 건전성 지표들
    debtRatio: Number(data.debtratio || 0),
    interestBearingDebtRatio: Number(data.interestbearingdebtratio || 0),
    equityRatio: Number(data.equityratio || 0),

    // 현금흐름 및 경쟁력 지표들
    fcfRatio: Number(data.fcfratio || 0),
    opCashFlowToRevenueRatio: Number(data.opcashflowtorevenueratio || 0),
    fcfMargin: Number(data.fcfmargin || 0),
    dividendYield: Number(data.dividendyield || 0),

    // PER 관련 지표들
    avgPer: Number(data.avgper || 0),
    maxPer: Number(data.maxper || 0),
    maxPerTimes04: Number(data.maxpertimes04 || 0),

    // 연도별 값
    currentBps: Number(data.currentbps || 0),
    previousBps: Number(data.previousbps || 0),
    twoYearsAgoBps: Number(data.twoyearsagobps || 0),
    currentYearPer: Number(data.currentyearper || 0),
    previousYearPer: Number(data.previousyearper || 0),
    twoYearsAgoPer: Number(data.twoyearsagoper || 0),
    currentYearEps: Number(data.currentyeareps || 0),

    // 위험 플래그 필드들
    has_consecutive_operating_losses: data.has_consecutive_operating_losses || false,
    operating_to_net_income_discrepancy: data.operating_to_net_income_discrepancy || false,
    operating_margin_critical: data.operating_margin_critical || false,
    insufficient_profitable_years: data.insufficient_profitable_years || false,
  };
};

// Supabase에서 주가 데이터 가져오기
export const getStockPriceFromSupabase = async (stockCode: string): Promise<StockPrice | null> => {
  const { data, error } = await supabase
    .from('stock_price')
    .select('*')
    .eq('stock_code', stockCode)
    .single();

  if (error || !data) {
    console.error('주가 데이터 조회 실패:', error);
    return null;
  }

  console.log('주가 데이터:', data);

  return {
    code: data.stock_code,
    name: data.company_name,
    price: data.current_price || 0,
    sharesOutstanding: 0, // 체크리스트 데이터에서 채워질 예정
    formattedDate: data.last_updated,
  };
};

// Supabase에서 현재 PER 데이터 가져오기
export const getStockCurrentFromSupabase = async (
  stockCode: string
): Promise<StockCurrent | null> => {
  const { data, error } = await supabase
    .from('stock_current')
    .select('*')
    .eq('stock_code', stockCode)
    .single();

  if (error || !data) {
    console.error('현재 PER 데이터 조회 실패:', error);
    return null;
  }

  return {
    code: data.stock_code,
    currentPer: data.current_per || 0,
  };
};

// Supabase에서 데이터를 가져와서 체크리스트 계산
export const calculateChecklist = async (
  stockCode: string,
  industry: string = 'etc'
): Promise<ScoredChecklistItem[]> => {
  // 1. 체크리스트 데이터 가져오기
  const stockData = await getStockChecklistFromSupabase(stockCode);
  if (!stockData) {
    console.error(`체크리스트 데이터를 찾을 수 없습니다: ${stockCode}`);
    return [];
  }

  // window 객체에 임시 저장 (calculateInvestmentRating에서 사용하기 위함)
  if (typeof window !== 'undefined') {
    if (!(window as any).tempStockData) {
      (window as any).tempStockData = {};
    }
    (window as any).tempStockData[stockCode] = stockData;
  }

  // 2. 주가 정보 가져오기
  const stockPrice = await getStockPriceFromSupabase(stockCode);
  console.log('주가 데이터:', stockPrice);
  if (!stockPrice) {
    console.error(`주가 데이터를 찾을 수 없습니다: ${stockCode}`);
    return [];
  }

  // 3. 현재 PER 정보 가져오기
  const stockCurrent = await getStockCurrentFromSupabase(stockCode);
  if (!stockCurrent) {
    console.log(`현재 PER 데이터를 찾을 수 없습니다: ${stockCode}, 계산된 PER를 사용합니다.`);
  }

  // sharesOutstanding 채우기
  stockPrice.sharesOutstanding = parseFloat(stockData.shares_outstanding || '0');

  // 4. 현재 PER 설정 (stock_current에서 가져오거나 계산)
  const currentPer = stockCurrent?.currentPer || stockPrice.price / stockData.currentYearEps;

  // 5. 기존 함수로 체크리스트 계산 (현재 PER 전달)
  return calculateJsonChecklist(stockCode, stockPrice, industry, currentPer);
};

// 미리 계산된 데이터와 현재 주가를 이용한 체크리스트 계산 함수
export const calculateJsonChecklist = (
  stockCode: string,
  stockPrice: StockPrice,
  industry: string = 'etc',
  currentPer: number = 0
): ScoredChecklistItem[] => {
  // 미리 계산된 데이터 가져오기
  let stockData: any;

  // Supabase에서 가져온 데이터인 경우 (비동기로 이미 가져온 경우)
  if (
    typeof window !== 'undefined' &&
    (window as any).tempStockData &&
    (window as any).tempStockData[stockCode]
  ) {
    stockData = (window as any).tempStockData[stockCode];
  } else {
    // 기존 방식 (JSON 파일에서 로드)
    try {
      const precalculatedData = require('@/lib/finance/stock_checklist_2025.json');
      stockData = precalculatedData[stockCode];
    } catch (error) {
      console.error(`JSON 데이터를 로드할 수 없습니다: ${error}`);
      return [];
    }
  }

  if (!stockData) {
    console.error(`종목 데이터를 찾을 수 없습니다: ${stockCode}`);
    return [];
  }

  // 현재 주가
  const currentPrice = stockPrice.price;
  const currentEps = stockData.currentYearEps || 0;

  // 현재 PER 계산 (제공된 값 없으면 직접 계산)
  const per = currentPer > 0 ? currentPer : currentEps > 0 ? currentPrice / currentEps : 0;
  console.log('현재 PER:', per);
  console.log('현재가격:', currentPrice);

  // 현재 PBR 계산
  const currentBps = stockData.currentBps || 0;
  const pbr = currentBps > 0 ? currentPrice / currentBps : 0;
  console.log('현재 PBR:', pbr);
  console.log('스톡데이터전체:', stockData);

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

  // 현재 영업이익률 확인 (성장률 지표 평가 조정에 사용)
  const currentOpMargin = stockData.avgOpMargin || 0;
  console.log(`현재 영업이익률: ${currentOpMargin}%`);

  // 이제 각 체크리스트 항목을 JSON 데이터를 사용하여 업데이트
  results.forEach((item) => {
    // 기본값 설정
    item.score = 0;
    item.maxScore = 10;
    item.isFailCriteria = false;

    switch (item.title) {
      // 핵심 지표
      case 'PER':
        item.actualValue = per;

        // 산업군별 차별화된 PER 평가
        if (per <= 0) {
          item.score = 0; // 적자기업 (미달)
          item.isPassed = false;
        } else if (industry === '금융') {
          // 금융업 특화 PER 평가
          if (per < thresholds.per * 0.8) item.score = 10;
          else if (per < thresholds.per) item.score = 9;
          else if (per < thresholds.per * 1.2) item.score = 8;
          else if (per < thresholds.per * 1.5) item.score = 6;
          else if (per < thresholds.per * 2) item.score = 4;
          else item.score = 2;

          item.isPassed = per > 0.5 && per < thresholds.per * 1.2;
        } else if (INDUSTRY_GROUPS.HIGH_GROWTH.includes(industry)) {
          // 고성장 산업 PER 평가
          if (per < thresholds.per * 0.7) item.score = 10;
          else if (per < thresholds.per) item.score = 9;
          else if (per < thresholds.per * 1.3) item.score = 7;
          else if (per < thresholds.per * 1.6) item.score = 5;
          else if (per < thresholds.per * 2) item.score = 3;
          else item.score = 1;

          item.isPassed = per > 0.5 && per < thresholds.per;
        } else {
          // 일반 산업 PER 평가
          if (per < thresholds.per * 0.6) item.score = 10;
          else if (per < thresholds.per * 0.8) item.score = 9;
          else if (per < thresholds.per) item.score = 8;
          else if (per < thresholds.per * 1.3) item.score = 6;
          else if (per < thresholds.per * 1.7) item.score = 3;
          else item.score = 1;

          item.isPassed = per > 0.5 && per < thresholds.per;
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

        // 영업이익률에 따른 조정된 기준 적용
        if (currentOpMargin >= 20) {
          // 매우 높은 영업이익률(20% 이상)
          console.log('영업이익률 20% 이상 기업 - 영업이익 성장률 기준 조정 적용');
          if (stockData.opIncomeGrowthRate >= 0) {
            item.score = 8; // 양수 성장이면 이미 좋은 점수
          } else if (stockData.opIncomeGrowthRate >= -10) {
            item.score = 6; // 소폭 감소는 합리적 평가
          } else if (stockData.opIncomeGrowthRate >= -20) {
            item.score = 4; // 중간 감소도 여전히 양호
          } else {
            item.score = 2; // 큰 감소만 낮은 점수
          }
          // 영업이익률 20% 이상 기업은 -10%까지 통과 인정
          item.isPassed = stockData.opIncomeGrowthRate >= -10;
          // 표시 기준값 변경
          item.targetValue = '> -10%';
        } else if (currentOpMargin >= 15) {
          // 높은 영업이익률(15% 이상)
          console.log('영업이익률 15% 이상 기업 - 영업이익 성장률 기준 조정 적용');
          if (stockData.opIncomeGrowthRate >= 0) {
            item.score = 8;
          } else if (stockData.opIncomeGrowthRate >= -5) {
            item.score = 6;
          } else if (stockData.opIncomeGrowthRate >= -15) {
            item.score = 4;
          } else {
            item.score = 2;
          }
          // 영업이익률 15% 이상 기업은 -5%까지 통과 인정
          item.isPassed = stockData.opIncomeGrowthRate >= -5;
          // 표시 기준값 변경
          item.targetValue = '> -5%';
        } else if (currentOpMargin >= 10) {
          // 양호한 영업이익률(10% 이상)
          console.log('영업이익률 10% 이상 기업 - 영업이익 성장률 기준 조정 적용');
          if (stockData.opIncomeGrowthRate >= 5) {
            item.score = 8;
          } else if (stockData.opIncomeGrowthRate >= 0) {
            item.score = 6;
          } else if (stockData.opIncomeGrowthRate >= -10) {
            item.score = 4;
          } else {
            item.score = 2;
          }
          // 영업이익률 10% 이상 기업은 0%까지 통과 인정
          item.isPassed = stockData.opIncomeGrowthRate >= 0;
          // 표시 기준값 변경
          item.targetValue = '> 0%';
        } else {
          // 기존 로직 (영업이익률이 10% 미만인 일반 기업)
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

          item.isPassed =
            stockData.opIncomeGrowthRate >= 10 || stockData.opIncomeGrowthRate === 100;
          // 표시 기준값 유지
          item.targetValue = '> 10%';
        }

        // 흑자전환이면 미달에서 제외 (공통)
        item.isFailCriteria = item.score === 0 && stockData.opIncomeGrowthRate !== 100;
        break;

      case 'EPS 성장률':
        item.actualValue = stockData.epsGrowthRate;

        // 영업이익률에 따른 조정된 기준 적용
        if (currentOpMargin >= 20) {
          // 매우 높은 영업이익률(20% 이상)
          console.log('영업이익률 20% 이상 기업 - EPS 성장률 기준 조정 적용');
          if (stockData.epsGrowthRate >= 0) {
            item.score = 8;
          } else if (stockData.epsGrowthRate >= -10) {
            item.score = 6;
          } else if (stockData.epsGrowthRate >= -20) {
            item.score = 4;
          } else {
            item.score = 2;
          }
          // 영업이익률 20% 이상 기업은 -10%까지 통과 인정
          item.isPassed = stockData.epsGrowthRate >= -10;
          // 표시 기준값 변경
          item.targetValue = '> -10%';
        } else if (currentOpMargin >= 15) {
          // 높은 영업이익률(15% 이상)
          console.log('영업이익률 15% 이상 기업 - EPS 성장률 기준 조정 적용');
          if (stockData.epsGrowthRate >= 0) {
            item.score = 8;
          } else if (stockData.epsGrowthRate >= -5) {
            item.score = 6;
          } else if (stockData.epsGrowthRate >= -15) {
            item.score = 4;
          } else {
            item.score = 2;
          }
          // 영업이익률 15% 이상 기업은 -5%까지 통과 인정
          item.isPassed = stockData.epsGrowthRate >= -5;
          // 표시 기준값 변경
          item.targetValue = '> -5%';
        } else if (currentOpMargin >= 10) {
          // 양호한 영업이익률(10% 이상)
          console.log('영업이익률 10% 이상 기업 - EPS 성장률 기준 조정 적용');
          if (stockData.epsGrowthRate >= 5) {
            item.score = 8;
          } else if (stockData.epsGrowthRate >= 0) {
            item.score = 6;
          } else if (stockData.epsGrowthRate >= -10) {
            item.score = 4;
          } else {
            item.score = 2;
          }
          // 영업이익률 10% 이상 기업은 0%까지 통과 인정
          item.isPassed = stockData.epsGrowthRate >= 0;
          // 표시 기준값 변경
          item.targetValue = '> 0%';
        } else {
          // 기존 로직 (영업이익률이 10% 미만인 일반 기업)
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
          // 표시 기준값 유지
          item.targetValue = '> 10%';
        }

        // 흑자전환이면 미달에서 제외 (공통)
        item.isFailCriteria = item.score === 0 && stockData.epsGrowthRate !== 100;
        break;

      case '순이익 증가율':
        item.actualValue = stockData.netIncomeGrowthRate;

        // 영업이익률에 따른 조정된 기준 적용
        if (currentOpMargin >= 20) {
          // 매우 높은 영업이익률(20% 이상)
          console.log('영업이익률 20% 이상 기업 - 순이익 증가율 기준 조정 적용');
          if (stockData.netIncomeGrowthRate >= 0) {
            item.score = 8;
          } else if (stockData.netIncomeGrowthRate >= -10) {
            item.score = 6;
          } else if (stockData.netIncomeGrowthRate >= -20) {
            item.score = 4;
          } else {
            item.score = 2;
          }
          // 영업이익률 20% 이상 기업은 -10%까지 통과 인정
          item.isPassed = stockData.netIncomeGrowthRate >= -10;
          // 표시 기준값 변경
          item.targetValue = '> -10%';
        } else if (currentOpMargin >= 15) {
          // 높은 영업이익률(15% 이상)
          console.log('영업이익률 15% 이상 기업 - 순이익 증가율 기준 조정 적용');
          if (stockData.netIncomeGrowthRate >= 0) {
            item.score = 8;
          } else if (stockData.netIncomeGrowthRate >= -5) {
            item.score = 6;
          } else if (stockData.netIncomeGrowthRate >= -15) {
            item.score = 4;
          } else {
            item.score = 2;
          }
          // 영업이익률 15% 이상 기업은 -5%까지 통과 인정
          item.isPassed = stockData.netIncomeGrowthRate >= -5;
          // 표시 기준값 변경
          item.targetValue = '> -5%';
        } else if (currentOpMargin >= 10) {
          // 양호한 영업이익률(10% 이상)
          console.log('영업이익률 10% 이상 기업 - 순이익 증가율 기준 조정 적용');
          if (stockData.netIncomeGrowthRate >= 5) {
            item.score = 8;
          } else if (stockData.netIncomeGrowthRate >= 0) {
            item.score = 6;
          } else if (stockData.netIncomeGrowthRate >= -10) {
            item.score = 4;
          } else {
            item.score = 2;
          }
          // 영업이익률 10% 이상 기업은 0%까지 통과 인정
          item.isPassed = stockData.netIncomeGrowthRate >= 0;
          // 표시 기준값 변경
          item.targetValue = '> 0%';
        } else {
          // 기존 로직 (영업이익률이 10% 미만인 일반 기업)
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
          // 표시 기준값 유지
          item.targetValue = '20% ~ 50%';
        }

        // 흑자전환이면 미달에서 제외 (공통)
        item.isFailCriteria = item.score === 0 && stockData.netIncomeGrowthRate !== 100;
        break;

      // 수익성 및 효율성 지표
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

      case 'ROA(%)':
        item.actualValue = stockData.avgRoa;

        // ROA 점수 계산
        if (stockData.avgRoa < 0) {
          item.score = 0; // 음수 ROA는 0점
          item.isPassed = false;
          item.isFailCriteria = true;
        } else {
          if (isFinancialCompany) {
            // 금융회사용 ROA 기준 (낮은 기준 적용)
            item.score =
              stockData.avgRoa > 2
                ? 10
                : stockData.avgRoa > 1.5
                ? 9
                : stockData.avgRoa > 1
                ? 8
                : stockData.avgRoa > 0.7
                ? 6
                : stockData.avgRoa > 0.4
                ? 4
                : stockData.avgRoa > 0
                ? 2
                : 0;

            // 금융회사는 ROA 1% 이상이면 통과
            item.isPassed = stockData.avgRoa > 1;
            item.targetValue = '> 1%'; // 금융회사용 기준값
          } else {
            // 일반 기업 ROA 기준 (기존 로직)
            item.score =
              stockData.avgRoa > 15
                ? 10
                : stockData.avgRoa > 10
                ? 8
                : stockData.avgRoa > 7
                ? 6
                : stockData.avgRoa > 4
                ? 4
                : stockData.avgRoa > 0
                ? 2
                : 0;

            // ROA 7% 이상이면 통과 (일반 기업)
            item.isPassed = stockData.avgRoa > 7;
            item.targetValue = '> 7%'; // 일반 기업용 기준값
          }
        }

        break;

      case '자산회전율':
        item.actualValue = stockData.assetTurnover;

        // 자산회전율 점수 계산
        item.score =
          stockData.assetTurnover > 2
            ? 10
            : stockData.assetTurnover > 1.5
            ? 8
            : stockData.assetTurnover > 1
            ? 6
            : stockData.assetTurnover > 0.7
            ? 4
            : stockData.assetTurnover > 0.4
            ? 2
            : 0;

        // 자산회전율 1 이상이면 통과
        item.isPassed = stockData.assetTurnover > 1;
        item.targetValue = '> 1.0';
        break;

      case '자기자본회전율':
        item.actualValue = stockData.equityTurnover;

        // 자기자본회전율 점수 계산
        item.score =
          stockData.equityTurnover > 3
            ? 10
            : stockData.equityTurnover > 2
            ? 8
            : stockData.equityTurnover > 1.5
            ? 6
            : stockData.equityTurnover > 1
            ? 4
            : stockData.equityTurnover > 0.5
            ? 2
            : 0;

        // 자기자본회전율 1.5 이상이면 통과
        item.isPassed = stockData.equityTurnover > 1.5;
        item.targetValue = '> 1.5';
        break;

      // 자산 가치 지표
      case 'PBR (주가순자산비율)':
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

      // 재무 건전성 지표
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

      case '이자발생부채비율':
        item.actualValue = stockData.interestBearingDebtRatio;

        // 이자발생부채비율 점수 계산
        item.score =
          stockData.interestBearingDebtRatio < 10
            ? 10
            : stockData.interestBearingDebtRatio < 20
            ? 8
            : stockData.interestBearingDebtRatio < 30
            ? 6
            : stockData.interestBearingDebtRatio < 40
            ? 4
            : stockData.interestBearingDebtRatio < 50
            ? 2
            : 0;

        // 이자발생부채비율 30% 이하면 통과
        item.isPassed = stockData.interestBearingDebtRatio < 30;
        item.targetValue = '< 30%';
        break;

      case '자기자본비율':
        item.actualValue = stockData.equityRatio;

        // 자기자본비율 점수 계산
        item.score =
          stockData.equityRatio > 70
            ? 10
            : stockData.equityRatio > 60
            ? 8
            : stockData.equityRatio > 50
            ? 6
            : stockData.equityRatio > 40
            ? 4
            : stockData.equityRatio > 30
            ? 2
            : 0;

        // 자기자본비율 50% 이상이면 통과
        item.isPassed = stockData.equityRatio > 50;
        item.targetValue = '> 50%';
        break;

      // 현금흐름 및 경쟁력 지표
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

      case '영업현금흐름 대 매출액 비율':
        item.actualValue = stockData.opCashFlowToRevenueRatio;

        // 영업현금흐름 대 매출액 비율 점수 계산
        item.score =
          stockData.opCashFlowToRevenueRatio > 15
            ? 10
            : stockData.opCashFlowToRevenueRatio > 10
            ? 8
            : stockData.opCashFlowToRevenueRatio > 7
            ? 6
            : stockData.opCashFlowToRevenueRatio > 4
            ? 4
            : stockData.opCashFlowToRevenueRatio > 0
            ? 2
            : 0;

        // 영업현금흐름 대 매출액 비율 7% 이상이면 통과
        item.isPassed = stockData.opCashFlowToRevenueRatio > 7;
        item.targetValue = '> 7%';
        break;

      case 'FCF 마진':
        item.actualValue = stockData.fcfMargin;

        // FCF 마진 점수 계산
        item.score =
          stockData.fcfMargin > 12
            ? 10
            : stockData.fcfMargin > 9
            ? 8
            : stockData.fcfMargin > 6
            ? 6
            : stockData.fcfMargin > 3
            ? 4
            : stockData.fcfMargin > 0
            ? 2
            : 0;

        // FCF 마진 6% 이상이면 통과
        item.isPassed = stockData.fcfMargin > 6;
        item.targetValue = '> 6%';
        break;

      case '배당수익률':
        item.actualValue = stockData.dividendYield;

        // 배당수익률 점수 계산
        item.score =
          stockData.dividendYield > 4
            ? 10
            : stockData.dividendYield > 3
            ? 8
            : stockData.dividendYield > 2
            ? 6
            : stockData.dividendYield > 1
            ? 4
            : stockData.dividendYield > 0
            ? 2
            : 0;

        // 배당수익률 2% 이상이면 통과
        item.isPassed = stockData.dividendYield > 2;
        item.targetValue = '> 2%';
        break;

      // PER 관련 지표
      case '현재 PER < 3년 최고 PER * 0.4':
        const maxPerTimes04 = stockData.maxPerTimes04;
        item.actualValue = per;

        if (per <= 0) {
          item.score = 0;
          item.isPassed = false;
          item.isFailCriteria = true;
        } else {
          if (isFinancialCompany) {
            // 금융주는 PER 변동성이 작아 기준 완화
            const maxPer = stockData.maxPer;
            const maxPerRatio = maxPer > 0 ? per / maxPer : 0;
            item.score =
              maxPerRatio < 0.6 ? 10 : maxPerRatio < 0.75 ? 8 : maxPerRatio < 0.9 ? 6 : 4;
            item.isPassed = per < maxPer * 0.7;
            item.targetValue = '< 3년 최고 PER * 0.7'; // 금융주용 기준 수정
          } else {
            // 기존 일반 기업 기준
            const maxPer = stockData.maxPer;
            item.score =
              per < maxPerTimes04 ? 10 : per < maxPer * 0.6 ? 7 : per < maxPer * 0.8 ? 4 : 2;
            item.isPassed = per < maxPerTimes04;
          }
        }
        break;

      case 'PER < 3년 평균 PER':
        if (per <= 0) {
          item.actualValue = per;
          item.score = 0;
          item.isPassed = false;
          item.isFailCriteria = true;
        } else {
          item.actualValue = per;
          const avgPer = stockData.avgPer;

          if (isFinancialCompany) {
            // 금융주는 PER 등락이 작아 기준 조정
            const avgPerRatio = avgPer > 0 ? per / avgPer : 0;
            item.score =
              avgPerRatio < 0.95 ? 10 : avgPerRatio < 1.1 ? 8 : avgPerRatio < 1.2 ? 6 : 4;
            item.isPassed = per < avgPer * 1.1; // 10% 이내면 양호로 간주
            item.targetValue = '< 3년 평균 PER * 1.1'; // 금융주용 기준 수정
          } else {
            // 기존 일반 기업 기준
            const avgPerRatio = avgPer > 0 ? per / avgPer : 0;
            item.score = avgPerRatio < 0.8 ? 10 : avgPerRatio < 1 ? 8 : avgPerRatio < 1.2 ? 5 : 2;
            item.isPassed = per < avgPer;
          }
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
export const calculateInvestmentRating = (
  checklistResults: ScoredChecklistItem[],
  stockCode?: string,
  industry: string = 'etc'
): InvestmentRating => {
  // 금융회사 여부 확인
  const isFinancialCompany = stockCode ? FINANCIAL_COMPANIES.includes(stockCode) : false;

  // 산업군별 핵심 지표 목록
  const coreItemTitles = isFinancialCompany
    ? ['PER', 'EPS 성장률', '순이익 증가율']
    : getCoreItemTitles(industry);

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
      riskPenalty: 0,
      baseScore: 0,
      riskFlags: {
        has_consecutive_operating_losses: false,
        operating_to_net_income_discrepancy: false,
        operating_margin_critical: false,
        insufficient_profitable_years: false,
      },
    };
  }

  // 핵심 지표와 세부 지표 분리
  const coreItems = checklistResults.filter((item) => coreItemTitles.includes(item.title));
  const detailedItems = checklistResults.filter((item) => !coreItemTitles.includes(item.title));

  // 핵심 지표 점수 계산 (핵심 지표의 평균)
  const coreItemsTotalScore = coreItems.reduce((sum, item) => sum + item.score, 0);
  const coreItemsScore = coreItemsTotalScore / coreItems.length;

  // 세부 지표 점수 계산
  const detailedItemsTotalScore = detailedItems.reduce((sum, item) => sum + item.score, 0);
  const detailedItemsScore =
    detailedItems.length > 0 ? detailedItemsTotalScore / detailedItems.length : 0;

  // 기본 점수 계산 (핵심 지표 70%, 세부 지표 30%)
  const baseScore = coreItemsScore * 0.7 + detailedItemsScore * 0.3;

  // Supabase에서 가져온 위험 플래그 데이터
  const stockData = (window as any).tempStockData?.[stockCode!];
  const riskFlags = {
    has_consecutive_operating_losses: stockData?.has_consecutive_operating_losses || false,
    operating_to_net_income_discrepancy: stockData?.operating_to_net_income_discrepancy || false,
    operating_margin_critical: stockData?.operating_margin_critical || false,
    insufficient_profitable_years: stockData?.insufficient_profitable_years || false,
  };

  // 위험 페널티 계산
  let riskPenalty = 0;
  if (riskFlags.has_consecutive_operating_losses) {
    riskPenalty += 2.0; // 2년 연속 영업적자 페널티
  }
  if (riskFlags.operating_to_net_income_discrepancy) {
    riskPenalty += 1.5; // 영업외수익 의존 페널티
  }
  if (riskFlags.operating_margin_critical) {
    riskPenalty += 2.0; // 영업이익률 위험 페널티
  }
  if (riskFlags.insufficient_profitable_years) {
    riskPenalty += 1.5; // 불충분한 수익성 페널티
  }

  // 최종 점수 계산 (페널티 적용, 최소 0점)
  const totalScore = Math.max(0, baseScore - riskPenalty);
  const maxPossibleScore = 10; // 최대 점수는 10점

  // 미달인 핵심 지표 개수
  const failedCoreItemsCount = coreItems.filter((item) => item.isFailCriteria).length;

  // 금융회사면 1개라도 미달이면 D, 아니면 2개 이상 미달이면 D
  const hasCriticalFailure = isFinancialCompany
    ? failedCoreItemsCount >= 1
    : failedCoreItemsCount >= 2;

  // 핵심 지표 중 통과된 항목 수
  const coreItemsPassCount = coreItems.filter((item) => item.score >= 6).length;

  // 등급 산정
  // 등급 산정
  let grade;
  const percentage = (totalScore / maxPossibleScore) * 100;

  if (hasCriticalFailure) {
    // 미달이 있으면 최대 D등급까지만 가능
    grade = percentage >= 40 ? 'D' : 'F';
  } else if (coreItemsPassCount < Math.ceil(coreItems.length * 0.5) && !isFinancialCompany) {
    // 핵심 지표의 50% 이상 통과 필요 (반올림)
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
    riskPenalty: Math.round(riskPenalty * 10) / 10,
    baseScore: Math.round(baseScore * 10) / 10,
    riskFlags,
  };
};

// 하위 호환성을 위한 함수 별칭
export const calculateJsonInvestmentRating = calculateInvestmentRating;
