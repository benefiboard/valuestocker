//src/app/checklist/constants/industryThresholds.ts

// 금융회사 종목코드 목록
export const FINANCIAL_COMPANIES = [
  // 증권사
  '001270',
  '001290',
  '001500',
  '001510',
  '001720',
  '001750',
  '003460',
  '003470',
  '003530',
  '003540',
  '005940',
  '006800',
  '008560',
  '016360',
  '016610',
  '030210',
  '039490',
  '078020',
  '190650',
  // 보험사
  '000370',
  '000400',
  '000540',
  '001450',
  '003690',
  '005830',
  '031210',
  '032830',
  '088350',
  '082640',
  '085620',
  '000810',
  // 금융지주사
  '071050',
  '086790',
  '105560',
  '138040',
  '138930',
  '139130',
  '175330',
  '316140',
  '055550',
  // 은행 관련
  '006220',
  '024110',
  '323410',
];

// 산업군 그룹 정의
export const INDUSTRY_GROUPS = {
  HIGH_GROWTH: ['IT/소프트웨어', '바이오/제약', '인터넷/플랫폼'],
  STABLE: ['유틸리티', '통신', '식음료', '생활소비재'],
  CYCLICAL: ['반도체', '자동차', '철강/조선', '화학/소재', '건설', '운송/물류'],
  CONSUMER: ['유통/소매', '기타서비스'],
};

// 금융회사 평가에서 제외할 지표 목록
export const EXCLUDED_ITEMS_FOR_FINANCIALS = [
  '매출액 성장률',
  '영업이익률',
  '영업이익 성장률',
  '부채비율',
  '유동비율',
  '이자보상배율',
  '장기부채 대비 순이익',
  '현금회전일수',
  '이익잉여금 vs 당좌자산 증가율',
  'FCF 비율',
  '매출총이익률',
];

// 산업군별 제외 항목 정의
export const EXCLUDED_ITEMS_BY_INDUSTRY: { [key: string]: string[] } = {
  금융: EXCLUDED_ITEMS_FOR_FINANCIALS,
  유틸리티: ['매출총이익률', '현금회전일수'],
  통신: ['매출총이익률'],
};

// 산업군별 핵심 지표 정의
export const getCoreItemTitles = (industry: string): string[] => {
  if (INDUSTRY_GROUPS.HIGH_GROWTH.includes(industry)) {
    return ['PER', '매출액 성장률', '영업이익률', 'EPS 성장률', '순이익 증가율'];
  } else if (INDUSTRY_GROUPS.STABLE.includes(industry)) {
    return ['PER', 'ROE (자기자본이익률)', '부채비율', 'FCF 비율', '순이익 증가율'];
  } else if (INDUSTRY_GROUPS.CYCLICAL.includes(industry)) {
    return ['PER', 'PBR (주가순자산비율)', '영업이익 성장률', '현금회전일수', '순이익 증가율'];
  } else if (INDUSTRY_GROUPS.CONSUMER.includes(industry)) {
    return ['PER', '매출총이익률', '매출액 성장률', '현금회전일수', '순이익 증가율'];
  } else {
    // 기본 핵심 지표
    return ['PER', '매출액 성장률', '영업이익률', '영업이익 성장률', 'EPS 성장률', '순이익 증가율'];
  }
};

// 산업군별 임계값 정의
export const INDUSTRY_THRESHOLDS: { [key: string]: any } = {
  // 기본값
  default: {
    per: 15, // PER 기준
    revenueGrowth: 10, // 매출 성장률 기준 (%)
    operatingMargin: 10, // 영업이익률 기준 (%)
    epsGrowth: 10, // EPS 성장률 기준 (%)
    netIncomeGrowth: 20, // 순이익 증가율 기준 하한 (%)
    netIncomeGrowthMax: 50, // 순이익 증가율 기준 상한 (%)
    debtRatio: 100, // 부채비율 기준 (%)
    currentRatio: 150, // 유동비율 기준 (%)
    interestCoverageRatio: 2, // 이자보상배율 기준
    roe: 15, // ROE 기준 (%)
    pbr: 1.2, // PBR 기준
    grossProfitMargin: 40, // 매출총이익률 기준 (%)
    bpsGrowth: 7.2, // BPS 성장률 기준 (%)
    fcfRatio: 7, // FCF 비율 기준 (%)
    cashCycleDays: 120, // 현금회전일수 기준 (일)
  },

  // 산업군별 특화 기준
  'IT/소프트웨어': {
    per: 16,
    revenueGrowth: 15,
    operatingMargin: 15,
    epsGrowth: 15,
    interestCoverageRatio: 1.5,
  },

  '바이오/제약': {
    per: 18.5,
    revenueGrowth: 15,
    operatingMargin: 15,
    epsGrowth: 15,
    debtRatio: 120,
  },

  유틸리티: {
    per: 5,
    revenueGrowth: 5,
    operatingMargin: 8,
    debtRatio: 140,
    roe: 10,
  },

  통신: {
    per: 6,
    revenueGrowth: 5,
    operatingMargin: 8,
    debtRatio: 140,
    roe: 10,
  },

  자동차: {
    per: 4,
    revenueGrowth: 7,
    operatingMargin: 7,
    interestCoverageRatio: 3,
    debtRatio: 120,
  },

  '철강/조선': {
    per: 5,
    revenueGrowth: 7,
    operatingMargin: 7,
    interestCoverageRatio: 3,
    debtRatio: 120,
  },

  '화학/소재': {
    per: 7,
    revenueGrowth: 7,
    operatingMargin: 7,
    interestCoverageRatio: 3,
    debtRatio: 120,
  },

  '유통/소매': {
    per: 9.5,
    grossProfitMargin: 30,
    cashCycleDays: 90,
  },

  금융: {
    per: 5,
    roe: 8,
    pbr: 1.0,
    debtRatio: 160,
  },
};

// 산업군별 임계값 가져오는 함수
export const getIndustryThresholds = (industry: string) => {
  // 기본값 가져오기
  const defaultThresholds = { ...INDUSTRY_THRESHOLDS.default };

  // 해당 산업군이 있으면 기본값에 덮어쓰기
  if (INDUSTRY_THRESHOLDS[industry]) {
    return { ...defaultThresholds, ...INDUSTRY_THRESHOLDS[industry] };
  }

  return defaultThresholds;
};

export const DEFAULT_THRESHOLDS = {
  per: 15, // PER 기준
  revenueGrowth: 10, // 매출 성장률 기준 (%)
  operatingMargin: 10, // 영업이익률 기준 (%)
  epsGrowth: 10, // EPS 성장률 기준 (%)
  netIncomeGrowth: 20, // 순이익 증가율 기준 하한 (%)
  netIncomeGrowthMax: 50, // 순이익 증가율 기준 상한 (%)
  debtRatio: 100, // 부채비율 기준 (%)
  currentRatio: 150, // 유동비율 기준 (%)
  interestCoverageRatio: 2, // 이자보상배율 기준
  roe: 15, // ROE 기준 (%)
  pbr: 1.2, // PBR 기준
  grossProfitMargin: 40, // 매출총이익률 기준 (%)
  bpsGrowth: 7.2, // BPS 성장률 기준 (%)
  fcfRatio: 7, // FCF 비율 기준 (%)
  cashCycleDays: 120, // 현금회전일수 기준 (일)
};
