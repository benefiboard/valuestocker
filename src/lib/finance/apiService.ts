// src/lib/finance/apiService.ts

import { ApiResponse, FinancialItem, StockPrice } from './types';
// JSON 파일 import 추가
import stockData from './stock_data_2025.json';

export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// 단일 연도 주가 데이터 가져오기
export async function fetchStockPrice(
  stockCode: string,
  useLatest: boolean = false
): Promise<StockPrice> {
  // 현재가만 API로 가져오기
  if (useLatest) {
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        const response = await fetch(
          `/api/dartPriceDataByCode?useLatest=true&stockCode=${encodeURIComponent(stockCode)}`
        );
        const result = await response.json();

        if (result.success) {
          return result.data;
        }

        retryCount++;
        if (retryCount < maxRetries) {
          await delay(1000 * retryCount);
        }
      } catch (error) {
        retryCount++;
        if (retryCount < maxRetries) {
          await delay(1000 * retryCount);
        }
      }
    }

    // API 호출 실패 시 JSON의 current_price로 대체
    const stockInfo = Object.values(stockData).find((stock: any) => stock.stock_code === stockCode);

    if (!stockInfo) {
      throw new Error(`${stockCode} 종목의 주가 데이터를 찾을 수 없습니다.`);
    }

    return {
      code: stockCode,
      name: stockInfo.company_name,
      price: stockInfo.current_price,
      sharesOutstanding: parseInt(stockInfo.shares_outstanding),
      formattedDate: stockInfo.last_updated,
    };
  }
  // 과거 데이터는 JSON에서 가져오기
  else {
    // JSON에서 해당 종목 찾기
    const stockInfo = Object.values(stockData).find((stock: any) => stock.stock_code === stockCode);

    if (!stockInfo) {
      throw new Error(`${stockCode} 종목의 주가 데이터를 찾을 수 없습니다.`);
    }

    // 현재 날짜에서 1년 전 연도 계산
    const currentYear = new Date().getFullYear();
    const baseYear = currentYear - 1;

    return {
      code: stockCode,
      name: stockInfo.company_name,
      price: stockInfo[`${baseYear}_price`] || stockInfo['2024_price'],
      sharesOutstanding: parseInt(stockInfo.shares_outstanding),
      formattedDate: `${baseYear}`,
    };
  }
}

// 여러 연도 주가 데이터 가져오기
export async function fetchStockPrices(
  stockCode: string,
  includeLatest: boolean = false
): Promise<{
  priceDataMap: Record<string, StockPrice>;
  baseYearData: StockPrice | null;
  latestPriceData?: StockPrice | null;
}> {
  // JSON에서 해당 종목 찾기
  const stockInfo = Object.values(stockData).find((stock: any) => stock.stock_code === stockCode);

  if (!stockInfo) {
    throw new Error(`${stockCode} 종목의 주가 데이터를 찾을 수 없습니다.`);
  }

  // 연도별 주가 데이터
  const priceDataMap: Record<string, StockPrice> = {
    '2022': {
      code: stockCode,
      name: stockInfo.company_name,
      price: stockInfo['2022_price'],
      sharesOutstanding: parseInt(stockInfo.shares_outstanding),
      formattedDate: '2022',
    },
    '2023': {
      code: stockCode,
      name: stockInfo.company_name,
      price: stockInfo['2023_price'],
      sharesOutstanding: parseInt(stockInfo.shares_outstanding),
      formattedDate: '2023',
    },
    '2024': {
      code: stockCode,
      name: stockInfo.company_name,
      price: stockInfo['2024_price'],
      sharesOutstanding: parseInt(stockInfo.shares_outstanding),
      formattedDate: '2024',
    },
  };

  // 기준 연도 데이터 - 항상 2024년 데이터를 사용
  const baseYearData = priceDataMap['2024'];

  // 최신 데이터만 API로 가져오기 (요청한 경우)
  let latestPriceData: StockPrice | null = null;
  if (includeLatest) {
    try {
      latestPriceData = await fetchStockPrice(stockCode, true);
    } catch (error) {
      console.error('최신 주가 데이터 가져오기 실패:', error);
      // API 실패 시 JSON의 current_price로 대체
      latestPriceData = {
        code: stockCode,
        name: stockInfo.company_name,
        price: stockInfo.current_price,
        sharesOutstanding: parseInt(stockInfo.shares_outstanding),
        formattedDate: new Date().toISOString().split('T')[0],
      };
    }
  }

  return includeLatest
    ? { priceDataMap, baseYearData, latestPriceData }
    : { priceDataMap, baseYearData };
}

// 재무 데이터 가져오기 - API와 동일한 형식으로 변환
export async function fetchFinancialData(dartCorpCode: string): Promise<ApiResponse> {
  // JSON에서 해당 종목 찾기
  const stockInfo = Object.values(stockData).find((stock: any) => stock.dart_code === dartCorpCode);

  if (!stockInfo) {
    throw new Error(`${dartCorpCode} 종목의 재무 데이터를 찾을 수 없습니다.`);
  }

  // 통화 변환 함수
  const convertCurrency = (year: string, value: any): string => {
    if (value === null || value === undefined) return '';

    // 통화 확인
    const currency = stockInfo[`${year}_currency`];
    const numValue = parseFloat(value);

    if (isNaN(numValue)) return value?.toString();

    // USD인 경우 KRW로 변환 (1400 곱하기)
    if (currency === 'USD') {
      return (numValue * 1400).toString();
    }

    return value.toString();
  };

  // API 형식으로 가상의 데이터 목록 생성
  const list: FinancialItem[] = [];

  // EPS 데이터 추가
  list.push({
    account_id: 'ifrs-full_BasicEarningsLossPerShare',
    sj_div: 'IS',
    account_nm: '기본주당이익',
    thstrm_amount: convertCurrency('2024', stockInfo['2024_eps']),
    frmtrm_amount: convertCurrency('2023', stockInfo['2023_eps']),
    bfefrmtrm_amount: convertCurrency('2022', stockInfo['2022_eps']),
    currency: 'KRW',
  });

  // 당기순이익 데이터 추가
  list.push({
    account_id: 'ifrs-full_ProfitLoss',
    sj_div: 'IS',
    account_nm: '당기순이익',
    thstrm_amount: convertCurrency('2024', stockInfo['2024_net_income']),
    frmtrm_amount: convertCurrency('2023', stockInfo['2023_net_income']),
    bfefrmtrm_amount: convertCurrency('2022', stockInfo['2022_net_income']),
    currency: 'KRW',
  });

  // 자산 데이터 추가
  list.push({
    account_id: 'ifrs-full_Assets',
    sj_div: 'BS',
    account_nm: '자산총계',
    thstrm_amount: convertCurrency('2024', stockInfo['2024_assets']),
    frmtrm_amount: convertCurrency('2023', stockInfo['2023_assets']),
    bfefrmtrm_amount: convertCurrency('2022', stockInfo['2022_assets']),
    currency: 'KRW',
  });

  // 자본 데이터 추가
  list.push({
    account_id: 'ifrs-full_Equity',
    sj_div: 'BS',
    account_nm: '자본총계',
    thstrm_amount: convertCurrency('2024', stockInfo['2024_equity']),
    frmtrm_amount: convertCurrency('2023', stockInfo['2023_equity']),
    bfefrmtrm_amount: convertCurrency('2022', stockInfo['2022_equity']),
    currency: 'KRW',
  });

  // 지배기업 소유주지분 데이터 추가
  list.push({
    account_id: 'ifrs-full_EquityAttributableToOwnersOfParent',
    sj_div: 'BS',
    account_nm: '지배기업 소유주지분',
    thstrm_amount: convertCurrency('2024', stockInfo['2024_equity_attributable_to_owners']),
    frmtrm_amount: convertCurrency('2023', stockInfo['2023_equity_attributable_to_owners']),
    bfefrmtrm_amount: convertCurrency('2022', stockInfo['2022_equity_attributable_to_owners']),
    currency: 'KRW',
  });

  // 유동자산 데이터 추가
  list.push({
    account_id: 'ifrs-full_CurrentAssets',
    sj_div: 'BS',
    account_nm: '유동자산',
    thstrm_amount: convertCurrency('2024', stockInfo['2024_current_assets']),
    frmtrm_amount: convertCurrency('2023', stockInfo['2023_current_assets']),
    bfefrmtrm_amount: convertCurrency('2022', stockInfo['2022_current_assets']),
    currency: 'KRW',
  });

  // 유동부채 데이터 추가
  list.push({
    account_id: 'ifrs-full_CurrentLiabilities',
    sj_div: 'BS',
    account_nm: '유동부채',
    thstrm_amount: convertCurrency('2024', stockInfo['2024_current_liabilities']),
    frmtrm_amount: convertCurrency('2023', stockInfo['2023_current_liabilities']),
    bfefrmtrm_amount: convertCurrency('2022', stockInfo['2022_current_liabilities']),
    currency: 'KRW',
  });

  // 비유동부채 데이터 추가
  list.push({
    account_id: 'ifrs-full_NoncurrentLiabilities',
    sj_div: 'BS',
    account_nm: '비유동부채',
    thstrm_amount: convertCurrency('2024', stockInfo['2024_non_current_liabilities']),
    frmtrm_amount: convertCurrency('2023', stockInfo['2023_non_current_liabilities']),
    bfefrmtrm_amount: convertCurrency('2022', stockInfo['2022_non_current_liabilities']),
    currency: 'KRW',
  });

  // 재고자산 데이터 추가
  list.push({
    account_id: 'ifrs-full_Inventories',
    sj_div: 'BS',
    account_nm: '재고자산',
    thstrm_amount: convertCurrency('2024', stockInfo['2024_inventories']),
    frmtrm_amount: convertCurrency('2023', stockInfo['2023_inventories']),
    bfefrmtrm_amount: convertCurrency('2022', stockInfo['2022_inventories']),
    currency: 'KRW',
  });

  // 매출액 데이터 추가
  list.push({
    account_id: 'ifrs-full_Revenue',
    sj_div: 'IS',
    account_nm: '매출액',
    thstrm_amount: convertCurrency('2024', stockInfo['2024_revenue']),
    frmtrm_amount: convertCurrency('2023', stockInfo['2023_revenue']),
    bfefrmtrm_amount: convertCurrency('2022', stockInfo['2022_revenue']),
    currency: 'KRW',
  });

  // 매출원가 데이터 추가
  list.push({
    account_id: 'ifrs-full_CostOfSales',
    sj_div: 'IS',
    account_nm: '매출원가',
    thstrm_amount: convertCurrency('2024', stockInfo['2024_cost_of_sales']),
    frmtrm_amount: convertCurrency('2023', stockInfo['2023_cost_of_sales']),
    bfefrmtrm_amount: convertCurrency('2022', stockInfo['2022_cost_of_sales']),
    currency: 'KRW',
  });

  // 영업이익 데이터 추가
  list.push({
    account_id: 'dart_OperatingIncomeLoss',
    sj_div: 'IS',
    account_nm: '영업이익',
    thstrm_amount: convertCurrency('2024', stockInfo['2024_operating_income']),
    frmtrm_amount: convertCurrency('2023', stockInfo['2023_operating_income']),
    bfefrmtrm_amount: convertCurrency('2022', stockInfo['2022_operating_income']),
    currency: 'KRW',
  });

  // 이자비용 데이터 추가
  list.push({
    account_id: 'dart_InterestExpenseFinanceExpense',
    sj_div: 'IS',
    account_nm: '이자비용',
    thstrm_amount: convertCurrency('2024', stockInfo['2024_interest_expense']),
    frmtrm_amount: convertCurrency('2023', stockInfo['2023_interest_expense']),
    bfefrmtrm_amount: convertCurrency('2022', stockInfo['2022_interest_expense']),
    currency: 'KRW',
  });

  // 매출채권 데이터 추가
  list.push({
    account_id: 'ifrs-full_TradeAndOtherCurrentReceivables',
    sj_div: 'BS',
    account_nm: '매출채권',
    thstrm_amount: convertCurrency('2024', stockInfo['2024_trade_receivables']),
    frmtrm_amount: convertCurrency('2023', stockInfo['2023_trade_receivables']),
    bfefrmtrm_amount: convertCurrency('2022', stockInfo['2022_trade_receivables']),
    currency: 'KRW',
  });

  // 매입채무 데이터 추가
  list.push({
    account_id: 'ifrs-full_TradeAndOtherCurrentPayables',
    sj_div: 'BS',
    account_nm: '매입채무',
    thstrm_amount: convertCurrency('2024', stockInfo['2024_trade_payables']),
    frmtrm_amount: convertCurrency('2023', stockInfo['2023_trade_payables']),
    bfefrmtrm_amount: convertCurrency('2022', stockInfo['2022_trade_payables']),
    currency: 'KRW',
  });

  // 이익잉여금 데이터 추가
  list.push({
    account_id: 'ifrs-full_RetainedEarnings',
    sj_div: 'BS',
    account_nm: '이익잉여금',
    thstrm_amount: convertCurrency('2024', stockInfo['2024_retained_earnings']),
    frmtrm_amount: convertCurrency('2023', stockInfo['2023_retained_earnings']),
    bfefrmtrm_amount: convertCurrency('2022', stockInfo['2022_retained_earnings']),
    currency: 'KRW',
  });

  // 영업현금흐름 데이터 추가
  list.push({
    account_id: 'ifrs-full_CashFlowsFromUsedInOperatingActivities',
    sj_div: 'CF',
    account_nm: '영업활동현금흐름',
    thstrm_amount: convertCurrency('2024', stockInfo['2024_operating_cash_flow']),
    frmtrm_amount: convertCurrency('2023', stockInfo['2023_operating_cash_flow']),
    bfefrmtrm_amount: convertCurrency('2022', stockInfo['2022_operating_cash_flow']),
    currency: 'KRW',
  });

  // 설비투자 데이터 추가
  list.push({
    account_id: 'ifrs-full_PurchaseOfPropertyPlantAndEquipmentClassifiedAsInvestingActivities',
    sj_div: 'CF',
    account_nm: '유형자산취득',
    thstrm_amount: convertCurrency('2024', stockInfo['2024_capex']),
    frmtrm_amount: convertCurrency('2023', stockInfo['2023_capex']),
    bfefrmtrm_amount: convertCurrency('2022', stockInfo['2022_capex']),
    currency: 'KRW',
  });

  // 투자자산 데이터 추가
  list.push({
    account_id: 'ifrs-full_InvestmentAccountedForUsingEquityMethod',
    sj_div: 'BS',
    account_nm: '투자자산',
    thstrm_amount: convertCurrency('2024', stockInfo['2024_investment_assets']),
    frmtrm_amount: convertCurrency('2023', stockInfo['2023_investment_assets']),
    bfefrmtrm_amount: convertCurrency('2022', stockInfo['2022_investment_assets']),
    currency: 'KRW',
  });

  // ApiResponse 형식으로 반환
  return {
    status: '000',
    message: '성공',
    list: list,
    years: ['2024', '2023', '2022'],
  };
}
