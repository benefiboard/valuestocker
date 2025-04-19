// src/lib/finance/dataProcessor_api.ts

import { ApiResponse, FinancialData, FinancialDataCheckList, FinancialItem } from './types';

// 연도 데이터 확인
export function checkYearHasData(data: ApiResponse, year: string): boolean {
  const currentYear = new Date().getFullYear();
  const baseYear = currentYear - 1;
  const yearDiff = baseYear - parseInt(year);

  const fieldName =
    yearDiff === 0
      ? 'thstrm_amount'
      : yearDiff === 1
      ? 'frmtrm_amount'
      : yearDiff === 2
      ? 'bfefrmtrm_amount'
      : null;

  if (!fieldName) return false;

  // EPS 데이터로 확인
  const epsItem = data.list?.find(
    (item) =>
      (item.account_id === 'ifrs-full_BasicEarningsLossPerShare' ||
        item.account_id === 'ifrs-full_BasicEarningsLossPerShareFromContinuingOperations') &&
      (item.sj_div === 'IS' || item.sj_div === 'CIS')
  );

  // 당기순이익으로도 확인
  const netIncomeItem = data.list?.find(
    (item) =>
      (item.account_id === 'ifrs-full_ProfitLoss' ||
        item.account_id === 'ifrs-full_ProfitLossAttributableToOwnersOfParent') &&
      (item.sj_div === 'IS' || item.sj_div === 'CIS')
  );

  return (!!epsItem && !!epsItem[fieldName]) || (!!netIncomeItem && !!netIncomeItem[fieldName]);
}

// 공통 데이터 추출 함수 (두 타입 모두 포함하는 상세 데이터)
export function extractFinancialData(data: ApiResponse): any {
  console.log('데이터 추출 시작');

  // 통화 단위 확인 및 변환 환율
  const currency = data.list && data.list.length > 0 ? data.list[0].currency : 'KRW';
  const usdToKrwRate = 1450;

  // 금액 파싱 및 변환 함수
  const parseAndConvertAmount = (value: string | undefined): number => {
    if (!value) return 0;
    const parsedValue = parseFloat(value);
    if (isNaN(parsedValue)) return 0;
    return currency === 'USD' ? parsedValue * usdToKrwRate : parsedValue;
  };

  // 연도 정보 추출
  const years: string[] = [];
  const currentYear = new Date().getFullYear();
  const baseYear = currentYear - 1;

  for (let i = 0; i < 3; i++) {
    const year = (baseYear - i).toString();
    const hasData = checkYearHasData(data, year);
    if (hasData) {
      years.push(year);
    }
  }

  if (years.length === 0) {
    console.log('연도 추출 실패, 기본 연도 설정');
    years.push(baseYear.toString());
    years.push((baseYear - 1).toString());
    years.push((baseYear - 2).toString());
  }

  // 직접 금액 추출 헬퍼 함수
  const findDirectAmount = (accountIds: string | string[], fieldName: string): number => {
    if (!Array.isArray(accountIds)) accountIds = [accountIds];

    for (const accountId of accountIds) {
      const item = data.list?.find((item) => item.account_id === accountId);
      if (item && item[fieldName]) {
        return parseAndConvertAmount(item[fieldName]);
      }
    }
    return 0;
  };

  // 항목 검색 함수
  const findMetric = (
    accountIds: string | string[],
    divisions: string | string[] = ['BS', 'IS', 'CIS']
  ): number => {
    if (!Array.isArray(accountIds)) accountIds = [accountIds];
    if (!Array.isArray(divisions)) divisions = [divisions];

    for (const accountId of accountIds) {
      for (const div of divisions) {
        const item = data.list?.find(
          (item) => item.account_id === accountId && item.sj_div === div
        );
        if (item && item.thstrm_amount) {
          return parseAndConvertAmount(item.thstrm_amount);
        }
      }
    }
    return 0;
  };

  // BS 항목 찾기
  const findAccount = (accountId: string | string[]): number => {
    return findMetric(accountId, ['BS']);
  };

  // IS/CIS 항목 찾기
  const findIncomeAccount = (accountId: string | string[]): number => {
    return findMetric(accountId, ['IS', 'CIS']);
  };

  // 연도별 데이터 검색
  const findYearlyMetric = (
    accountIds: string | string[],
    divisions: string | string[] = ['IS', 'CIS']
  ): Record<string, number> => {
    if (!Array.isArray(accountIds)) accountIds = [accountIds];
    if (!Array.isArray(divisions)) divisions = [divisions];

    const items: FinancialItem[] = [];
    for (const accountId of accountIds) {
      for (const div of divisions) {
        const foundItems =
          data.list?.filter((item) => item.account_id === accountId && item.sj_div === div) || [];
        items.push(...foundItems);
      }
    }

    if (items.length === 0) return {};

    const result: Record<string, number> = {};

    // 기본 연도별 매핑
    years.forEach((year, index) => {
      const fieldName =
        index === 0 ? 'thstrm_amount' : index === 1 ? 'frmtrm_amount' : 'bfefrmtrm_amount';

      for (const item of items) {
        if (item[fieldName]) {
          result[year] = parseAndConvertAmount(item[fieldName]);
          break;
        }
      }
    });

    // 데이터 누락 시 직접 필드 접근
    if (Object.keys(result).length === 0 && items.length > 0) {
      const item = items[0];
      const fields = ['thstrm_amount', 'frmtrm_amount', 'bfefrmtrm_amount'];

      for (let i = 0; i < Math.min(years.length, fields.length); i++) {
        if (item[fields[i]]) {
          result[years[i]] = parseAndConvertAmount(item[fields[i]]);
        }
      }
    }

    return result;
  };

  // 모든 필요한 데이터 추출

  // EPS 데이터
  let epsByYear = findYearlyMetric('ifrs-full_BasicEarningsLossPerShare', ['IS', 'CIS']);
  if (Object.keys(epsByYear).length === 0) {
    epsByYear = findYearlyMetric('ifrs-full_BasicEarningsLossPerShareFromContinuingOperations', [
      'IS',
      'CIS',
    ]);

    // 직접 필드 접근으로 추출 시도
    if (Object.keys(epsByYear).length === 0) {
      const fields = ['thstrm_amount', 'frmtrm_amount', 'bfefrmtrm_amount'];
      for (let i = 0; i < Math.min(years.length, fields.length); i++) {
        const eps = findDirectAmount(
          'ifrs-full_BasicEarningsLossPerShareFromContinuingOperations',
          fields[i]
        );
        if (eps > 0) {
          epsByYear[years[i]] = eps;
        }
      }
    }
  }

  // 영업이익 데이터
  let operatingIncomes = findYearlyMetric(
    ['dart_OperatingIncomeLoss', 'ifrs-full_ProfitLossFromOperatingActivities'],
    ['IS', 'CIS']
  );

  // 영업이익 데이터 보완
  if (Object.keys(operatingIncomes).length === 0) {
    const fields = ['thstrm_amount', 'frmtrm_amount', 'bfefrmtrm_amount'];
    for (let i = 0; i < Math.min(years.length, fields.length); i++) {
      const opIncome = findDirectAmount('dart_OperatingIncomeLoss', fields[i]);
      if (opIncome > 0) {
        operatingIncomes[years[i]] = opIncome;
      }
    }
  }

  // 매출액 데이터
  let revenueByYear = findYearlyMetric(['ifrs-full_Revenue'], ['IS', 'CIS']);

  // 매출액 데이터 보완
  if (Object.keys(revenueByYear).length === 0) {
    const fields = ['thstrm_amount', 'frmtrm_amount', 'bfefrmtrm_amount'];
    for (let i = 0; i < Math.min(years.length, fields.length); i++) {
      const revenue = findDirectAmount('ifrs-full_Revenue', fields[i]);
      if (revenue > 0) {
        revenueByYear[years[i]] = revenue;
      }
    }
  }

  // 투자자산 관련 계정 합산
  const investmentAccounts = [
    'ifrs-full_InvestmentAccountedForUsingEquityMethod',
    'ifrs-full_NoncurrentFinancialAssetsAtFairValueThroughProfitOrLoss',
    'ifrs-full_NoncurrentFinancialAssetsMeasuredAtFairValueThroughOtherComprehensiveIncome',
    'ifrs-full_InvestmentsInAssociates',
    'ifrs-full_InvestmentsInJointVentures',
  ];

  let totalInvestmentAssets = 0;
  investmentAccounts.forEach((accountId) => {
    totalInvestmentAssets += findAccount(accountId) || 0;
  });

  // 당기순이익 및 재무상태표 주요 항목
  const netIncomeAccounts = [
    'ifrs-full_ProfitLossAttributableToOwnersOfParent',
    'ifrs-full_ProfitLoss',
  ];
  const netIncome = findIncomeAccount(netIncomeAccounts);

  const assets = findAccount('ifrs-full_Assets');
  const equity = findAccount('ifrs-full_Equity');

  // 지배기업 소유주지분
  let equityAttributableToOwners = findAccount([
    'ifrs-full_EquityAttributableToOwnersOfParent',
    'dart_EquityOwnersOfParent',
  ]);

  if (equityAttributableToOwners === 0) {
    equityAttributableToOwners = equity;
  }

  const currentAssets = findAccount('ifrs-full_CurrentAssets');
  const currentLiabilities = findAccount('ifrs-full_CurrentLiabilities');
  const nonCurrentLiabilities = findAccount('ifrs-full_NoncurrentLiabilities');
  const inventories = findAccount('ifrs-full_Inventories');

  // 연도별 당기순이익
  let netIncomeByYear = findYearlyMetric(
    ['ifrs-full_ProfitLossAttributableToOwnersOfParent', 'ifrs-full_ProfitLoss'],
    ['IS', 'CIS']
  );

  // 당기순이익 데이터 보완
  if (Object.keys(netIncomeByYear).length === 0) {
    const fields = ['thstrm_amount', 'frmtrm_amount', 'bfefrmtrm_amount'];
    for (let i = 0; i < Math.min(years.length, fields.length); i++) {
      const netIncome = findDirectAmount('ifrs-full_ProfitLoss', fields[i]);
      if (netIncome > 0) {
        netIncomeByYear[years[i]] = netIncome;
      }
    }
  }

  // 연도별 자기자본
  let equityByYear = findYearlyMetric('ifrs-full_EquityAttributableToOwnersOfParent', ['BS']);

  // 자기자본 데이터 보완
  if (Object.keys(equityByYear).length === 0) {
    const fields = ['thstrm_amount', 'frmtrm_amount', 'bfefrmtrm_amount'];
    for (let i = 0; i < Math.min(years.length, fields.length); i++) {
      const equity = findDirectAmount('ifrs-full_EquityAttributableToOwnersOfParent', fields[i]);
      if (equity > 0) {
        equityByYear[years[i]] = equity;
      }
    }
  }

  // 이익잉여금 관련 데이터
  const retainedEarnings = findAccount('ifrs-full_RetainedEarnings');
  let retainedEarningsByYear = findYearlyMetric('ifrs-full_RetainedEarnings', ['BS']);

  // 이익잉여금 데이터 보완
  if (Object.keys(retainedEarningsByYear).length === 0) {
    const fields = ['thstrm_amount', 'frmtrm_amount', 'bfefrmtrm_amount'];
    for (let i = 0; i < Math.min(years.length, fields.length); i++) {
      const retainedEarnings = findDirectAmount('ifrs-full_RetainedEarnings', fields[i]);
      if (retainedEarnings > 0) {
        retainedEarningsByYear[years[i]] = retainedEarnings;
      }
    }
  }

  // 손익계산서 관련 항목
  const revenue = findIncomeAccount('ifrs-full_Revenue');
  const costOfSales = findIncomeAccount('ifrs-full_CostOfSales');
  const grossProfit = revenue - costOfSales;
  const operatingIncome = findIncomeAccount([
    'dart_OperatingIncomeLoss',
    'ifrs-full_ProfitLossFromOperatingActivities',
  ]);
  const interestExpense = findIncomeAccount([
    'dart_InterestExpenseFinanceExpense',
    'ifrs-full_FinanceCosts',
  ]);

  // 매출채권, 매입채무
  const tradeReceivables = findAccount('ifrs-full_TradeAndOtherCurrentReceivables');
  const tradePayables = findAccount('ifrs-full_TradeAndOtherCurrentPayables');

  // 현금흐름표 관련 항목
  const operatingCashFlow = findMetric('ifrs-full_CashFlowsFromUsedInOperatingActivities', ['CF']);
  const capexBased = findMetric(
    'ifrs-full_PurchaseOfPropertyPlantAndEquipmentClassifiedAsInvestingActivities',
    ['CF']
  );
  const freeCashFlow = operatingCashFlow - capexBased;

  // 당좌자산 계산
  const quickAssets = currentAssets - inventories;

  // 모든 추출 데이터 리턴 (타입 변환은 호출 측에서 필요에 따라 처리)
  return {
    assets,
    equity,
    equityAttributableToOwners,
    currentAssets,
    currentLiabilities,
    investmentAssets: totalInvestmentAssets,
    nonCurrentLiabilities,
    inventories,
    quickAssets,
    netIncome,
    revenue,
    costOfSales,
    grossProfit,
    operatingIncome,
    interestExpense,
    operatingCashFlow,
    capexBased,
    freeCashFlow,
    tradeReceivables,
    tradePayables,
    retainedEarnings,
    operatingIncomes,
    epsByYear,
    netIncomeByYear,
    equityByYear,
    revenueByYear,
    retainedEarningsByYear,
    years,
  };
}

// 체크리스트용 데이터 변환
export function convertToChecklistData(data: any): FinancialDataCheckList {
  return data as FinancialDataCheckList;
}

// 가격계산용 데이터 변환
export function convertToPriceData(data: any): FinancialData {
  return data as FinancialData;
}
