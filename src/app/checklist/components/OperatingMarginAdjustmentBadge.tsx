// src/app/checklist/constants/checklistItems.ts

import { ChecklistItem } from '../types';

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
    importance: 5,
  },
  {
    category: '핵심 지표',
    title: '매출액 성장률',
    description: '3년간 매출액의 평균 성장률. 회사의 성장성을 나타내는 중요한 지표입니다.',
    targetValue: '매출액 평균 성장률 10% 이상',
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
    targetValue: '영업이익율 10% 이상',
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
    targetValue: '영업이익 성장률 10% 이상',
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
    targetValue: 'EPS 성장률 10% 이상',
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
    targetValue: '현재 PER가 3년 최고 PER * 0.4 이하',
    actualValue: null,
    isPassed: null,
    formula: '현재 PER vs 3년 최고 PER × 0.4',
    importance: 3,
  },
  {
    category: '세부 지표 - PER 관련',
    title: 'PER < 3년 평균 PER',
    description: '현재 PER이 과거 3년 평균보다 낮은지 확인하여 저평가 여부를 판단합니다.',
    targetValue: '현재 PER가 3년 평균 PER 이하',
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
    targetValue: 'PBR 1.2 이하',
    actualValue: null,
    isPassed: null,
    formula: '주가 ÷ BPS',
    importance: 3,
  },
  {
    category: '세부 지표 - 자산 가치',
    title: 'BPS 성장률',
    description: '3년간 주당순자산가치(BPS)의 성장률. 기업의 순자산 증가 속도를 평가합니다.',
    targetValue: 'BPS 성장률 7.2% 이상',
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
    targetValue: '부채비율 100% 이하',
    actualValue: null,
    isPassed: null,
    formula: '부채총계 ÷ 자본총계 × 100%',
    importance: 4,
  },
  {
    category: '세부 지표 - 재무 건전성',
    title: '이자발생부채비율',
    description: '자기자본 대비 이자가 발생하는 부채의 비율. 낮을수록 재무적으로 안정적입니다.',
    targetValue: '이자발생부채비율 30% 이하',
    actualValue: null,
    isPassed: null,
    formula: '이자발생부채 ÷ 자기자본 × 100%',
    importance: 3,
  },
  {
    category: '세부 지표 - 재무 건전성',
    title: '자기자본비율',
    description: '총자산 중 자기자본이 차지하는 비율. 높을수록 재무적으로 안정적입니다.',
    targetValue: '자기자본비율 50% 이상',
    actualValue: null,
    isPassed: null,
    formula: '자기자본 ÷ 총자산 × 100%',
    importance: 3,
  },

  // 세부 지표 - 수익성 및 효율성
  {
    category: '세부 지표 - 수익성 및 효율성',
    title: 'ROE (자기자본이익률)',
    description:
      '자기자본 대비 당기순이익의 비율. 투자된 자본으로 얼마나 효율적으로 이익을 창출하는지 보여줍니다.',
    targetValue: 'ROE 15% 이상',
    actualValue: null,
    isPassed: null,
    formula: '당기순이익 ÷ 자기자본 × 100%',
    importance: 4,
  },
  {
    category: '세부 지표 - 수익성 및 효율성',
    title: 'ROA(%)',
    description:
      '총자산 대비 당기순이익의 비율. 기업이 자산을 얼마나 효율적으로 운용하는지 보여줍니다.',
    targetValue: 'ROA 7% 이상',
    actualValue: null,
    isPassed: null,
    formula: '당기순이익 ÷ 총자산 × 100%',
    importance: 3,
  },
  {
    category: '세부 지표 - 수익성 및 효율성',
    title: '자산회전율',
    description:
      '총자산 대비 매출액의 비율. 자산을 얼마나 효율적으로 활용하여 매출을 창출하는지 보여줍니다.',
    targetValue: '자산회전율 1.0 이상',
    actualValue: null,
    isPassed: null,
    formula: '매출액 ÷ 총자산',
    importance: 2,
  },
  {
    category: '세부 지표 - 수익성 및 효율성',
    title: '자기자본회전율',
    description:
      '자기자본 대비 매출액의 비율. 자기자본을 얼마나 효율적으로 활용하여 매출을 창출하는지 보여줍니다.',
    targetValue: '자기자본회전율 1.5 이상',
    actualValue: null,
    isPassed: null,
    formula: '매출액 ÷ 자기자본',
    importance: 2,
  },

  // 세부 지표 - 현금흐름 및 경쟁력
  {
    category: '세부 지표 - 현금흐름 및 경쟁력',
    title: 'FCF 비율',
    description: '매출액 대비 잉여현금흐름(FCF)의 비율. 실제 기업의 현금창출 능력을 평가합니다.',
    targetValue: 'FCF 7% 이상',
    actualValue: null,
    isPassed: null,
    formula: 'FCF ÷ 매출액 × 100%',
    importance: 3,
  },
  {
    category: '세부 지표 - 현금흐름 및 경쟁력',
    title: '영업현금흐름 대 매출액 비율',
    description:
      '매출액 대비 영업현금흐름의 비율. 매출이 실제 현금으로 얼마나 잘 전환되는지 보여줍니다.',
    targetValue: '영업현금흐름 대 매출액 비율 7% 이상',
    actualValue: null,
    isPassed: null,
    formula: '영업현금흐름 ÷ 매출액 × 100%',
    importance: 3,
  },
  {
    category: '세부 지표 - 현금흐름 및 경쟁력',
    title: 'FCF 마진',
    description: '영업이익 대비 FCF의 비율. 영업이익이 얼마나 실제 현금으로 전환되는지 보여줍니다.',
    targetValue: 'FCF 마진 6% 이상',
    actualValue: null,
    isPassed: null,
    formula: 'FCF ÷ 영업이익 × 100%',
    importance: 2,
  },
  {
    category: '세부 지표 - 현금흐름 및 경쟁력',
    title: '배당수익률',
    description: '주가 대비 주당 배당금의 비율. 주주에게 얼마나 많은 수익을 배당하는지 보여줍니다.',
    targetValue: '배당수익률 2% 이상',
    actualValue: null,
    isPassed: null,
    formula: '주당 배당금 ÷ 주가 × 100%',
    importance: 2,
  },
];

// 점수 계산 함수들에 대한 상수 값
export const SCORE_THRESHOLDS = {
  // PER 점수 임계값
  PER: {
    FINANCIAL: [6, 10, 12, 15, 20], // 금융사 임계값
    DEFAULT: [8, 15, 20, 30, 50], // 일반 기업 임계값
  },

  // 매출 성장률 점수 임계값
  REVENUE_GROWTH: [0, 5, 7, 10, 15, 20],

  // 영업이익률 점수 임계값
  OPERATING_MARGIN: [0, 5, 7, 10, 15, 20, 25],

  // 영업이익 성장률 점수 임계값
  OPERATING_INCOME_GROWTH: [-10, 0, 5, 10, 15, 20, 25],

  // EPS 성장률 점수 임계값
  EPS_GROWTH: [-10, 0, 5, 10, 15, 20, 25],

  // 순이익 증가율 점수 임계값
  NET_INCOME_GROWTH: [-10, 0, 5, 10, 20, 30, 40, 50],
};
