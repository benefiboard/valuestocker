// src/lib/finance/apiService.ts

import { ApiResponse, FinancialItem, StockPrice } from './types';
// JSON 파일 import 추가
import stockData from './stock_data_2025.json';

export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// 타입 안전한 속성 접근을 위한 헬퍼 함수
function getPropertySafely<T>(obj: any, key: string, defaultValue: T): T {
  return key in obj ? (obj[key] as T) : defaultValue;
}

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

    // current_price를 안전하게 접근
    const currentPrice = getPropertySafely<string | number>(stockInfo, 'current_price', 0);

    return {
      code: stockCode,
      name: stockInfo.company_name,
      price: typeof currentPrice === 'string' ? parseFloat(currentPrice) : currentPrice,
      sharesOutstanding: parseInt(String(stockInfo.shares_outstanding)),
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

    // 안전하게 동적 속성 접근
    const yearPriceKey = `${baseYear}_price`;
    const fallbackPriceKey = '2024_price';

    const yearPrice = getPropertySafely<string | number>(stockInfo, yearPriceKey, 0);
    const fallbackPrice = getPropertySafely<string | number>(stockInfo, fallbackPriceKey, 0);

    // 값이 있으면 해당 연도 가격, 없으면 2024년 가격 사용
    const price = yearPrice || fallbackPrice;

    return {
      code: stockCode,
      name: stockInfo.company_name,
      price: typeof price === 'string' ? parseFloat(price) : Number(price),
      sharesOutstanding: parseInt(String(stockInfo.shares_outstanding)),
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

  // 연도별 주가 데이터를 안전하게 가져오기 위한 헬퍼 함수
  const getPriceForYear = (year: string): number => {
    const priceKey = `${year}_price`;
    const price = getPropertySafely<string | number>(stockInfo, priceKey, 0);
    return typeof price === 'string' ? parseFloat(price) : Number(price);
  };

  // 연도별 주가 데이터
  const priceDataMap: Record<string, StockPrice> = {
    '2022': {
      code: stockCode,
      name: stockInfo.company_name,
      price: getPriceForYear('2022'),
      sharesOutstanding: parseInt(String(stockInfo.shares_outstanding)),
      formattedDate: '2022',
    },
    '2023': {
      code: stockCode,
      name: stockInfo.company_name,
      price: getPriceForYear('2023'),
      sharesOutstanding: parseInt(String(stockInfo.shares_outstanding)),
      formattedDate: '2023',
    },
    '2024': {
      code: stockCode,
      name: stockInfo.company_name,
      price: getPriceForYear('2024'),
      sharesOutstanding: parseInt(String(stockInfo.shares_outstanding)),
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
      const currentPrice = getPropertySafely<string | number>(stockInfo, 'current_price', 0);

      latestPriceData = {
        code: stockCode,
        name: stockInfo.company_name,
        price: typeof currentPrice === 'string' ? parseFloat(currentPrice) : Number(currentPrice),
        sharesOutstanding: parseInt(String(stockInfo.shares_outstanding)),
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

    // 통화 확인 - 안전하게 접근
    const currencyKey = `${year}_currency`;
    const currency = getPropertySafely<string>(stockInfo, currencyKey, 'KRW');

    const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);

    if (isNaN(numValue)) return String(value || '');

    // USD인 경우 KRW로 변환 (1400 곱하기)
    if (currency === 'USD') {
      return (numValue * 1400).toString();
    }

    return numValue.toString();
  };

  // 안전한 연도별 데이터 가져오기 헬퍼 함수
  const getYearlyData = (prefix: string, year: string) => {
    const key = `${year}_${prefix}`;
    return getPropertySafely<any>(stockInfo, key, '');
  };

  // API 형식으로 가상의 데이터 목록 생성
  const list: FinancialItem[] = [];

  // EPS 데이터 추가
  list.push({
    account_id: 'ifrs-full_BasicEarningsLossPerShare',
    sj_div: 'IS',
    account_nm: '기본주당이익',
    thstrm_amount: convertCurrency('2024', getYearlyData('eps', '2024')),
    frmtrm_amount: convertCurrency('2023', getYearlyData('eps', '2023')),
    bfefrmtrm_amount: convertCurrency('2022', getYearlyData('eps', '2022')),
    currency: 'KRW',
  });

  // 당기순이익 데이터 추가
  list.push({
    account_id: 'ifrs-full_ProfitLoss',
    sj_div: 'IS',
    account_nm: '당기순이익',
    thstrm_amount: convertCurrency('2024', getYearlyData('net_income', '2024')),
    frmtrm_amount: convertCurrency('2023', getYearlyData('net_income', '2023')),
    bfefrmtrm_amount: convertCurrency('2022', getYearlyData('net_income', '2022')),
    currency: 'KRW',
  });

  // 자산 데이터 추가
  list.push({
    account_id: 'ifrs-full_Assets',
    sj_div: 'BS',
    account_nm: '자산총계',
    thstrm_amount: convertCurrency('2024', getYearlyData('assets', '2024')),
    frmtrm_amount: convertCurrency('2023', getYearlyData('assets', '2023')),
    bfefrmtrm_amount: convertCurrency('2022', getYearlyData('assets', '2022')),
    currency: 'KRW',
  });

  // 자본 데이터 추가
  list.push({
    account_id: 'ifrs-full_Equity',
    sj_div: 'BS',
    account_nm: '자본총계',
    thstrm_amount: convertCurrency('2024', getYearlyData('equity', '2024')),
    frmtrm_amount: convertCurrency('2023', getYearlyData('equity', '2023')),
    bfefrmtrm_amount: convertCurrency('2022', getYearlyData('equity', '2022')),
    currency: 'KRW',
  });

  // 지배기업 소유주지분 데이터 추가
  list.push({
    account_id: 'ifrs-full_EquityAttributableToOwnersOfParent',
    sj_div: 'BS',
    account_nm: '지배기업 소유주지분',
    thstrm_amount: convertCurrency('2024', getYearlyData('equity_attributable_to_owners', '2024')),
    frmtrm_amount: convertCurrency('2023', getYearlyData('equity_attributable_to_owners', '2023')),
    bfefrmtrm_amount: convertCurrency(
      '2022',
      getYearlyData('equity_attributable_to_owners', '2022')
    ),
    currency: 'KRW',
  });

  // 유동자산 데이터 추가
  list.push({
    account_id: 'ifrs-full_CurrentAssets',
    sj_div: 'BS',
    account_nm: '유동자산',
    thstrm_amount: convertCurrency('2024', getYearlyData('current_assets', '2024')),
    frmtrm_amount: convertCurrency('2023', getYearlyData('current_assets', '2023')),
    bfefrmtrm_amount: convertCurrency('2022', getYearlyData('current_assets', '2022')),
    currency: 'KRW',
  });

  // 유동부채 데이터 추가
  list.push({
    account_id: 'ifrs-full_CurrentLiabilities',
    sj_div: 'BS',
    account_nm: '유동부채',
    thstrm_amount: convertCurrency('2024', getYearlyData('current_liabilities', '2024')),
    frmtrm_amount: convertCurrency('2023', getYearlyData('current_liabilities', '2023')),
    bfefrmtrm_amount: convertCurrency('2022', getYearlyData('current_liabilities', '2022')),
    currency: 'KRW',
  });

  // 비유동부채 데이터 추가
  list.push({
    account_id: 'ifrs-full_NoncurrentLiabilities',
    sj_div: 'BS',
    account_nm: '비유동부채',
    thstrm_amount: convertCurrency('2024', getYearlyData('non_current_liabilities', '2024')),
    frmtrm_amount: convertCurrency('2023', getYearlyData('non_current_liabilities', '2023')),
    bfefrmtrm_amount: convertCurrency('2022', getYearlyData('non_current_liabilities', '2022')),
    currency: 'KRW',
  });

  // 재고자산 데이터 추가
  list.push({
    account_id: 'ifrs-full_Inventories',
    sj_div: 'BS',
    account_nm: '재고자산',
    thstrm_amount: convertCurrency('2024', getYearlyData('inventories', '2024')),
    frmtrm_amount: convertCurrency('2023', getYearlyData('inventories', '2023')),
    bfefrmtrm_amount: convertCurrency('2022', getYearlyData('inventories', '2022')),
    currency: 'KRW',
  });

  // 매출액 데이터 추가
  list.push({
    account_id: 'ifrs-full_Revenue',
    sj_div: 'IS',
    account_nm: '매출액',
    thstrm_amount: convertCurrency('2024', getYearlyData('revenue', '2024')),
    frmtrm_amount: convertCurrency('2023', getYearlyData('revenue', '2023')),
    bfefrmtrm_amount: convertCurrency('2022', getYearlyData('revenue', '2022')),
    currency: 'KRW',
  });

  // 매출원가 데이터 추가
  list.push({
    account_id: 'ifrs-full_CostOfSales',
    sj_div: 'IS',
    account_nm: '매출원가',
    thstrm_amount: convertCurrency('2024', getYearlyData('cost_of_sales', '2024')),
    frmtrm_amount: convertCurrency('2023', getYearlyData('cost_of_sales', '2023')),
    bfefrmtrm_amount: convertCurrency('2022', getYearlyData('cost_of_sales', '2022')),
    currency: 'KRW',
  });

  // 영업이익 데이터 추가
  list.push({
    account_id: 'dart_OperatingIncomeLoss',
    sj_div: 'IS',
    account_nm: '영업이익',
    thstrm_amount: convertCurrency('2024', getYearlyData('operating_income', '2024')),
    frmtrm_amount: convertCurrency('2023', getYearlyData('operating_income', '2023')),
    bfefrmtrm_amount: convertCurrency('2022', getYearlyData('operating_income', '2022')),
    currency: 'KRW',
  });

  // 이자비용 데이터 추가
  list.push({
    account_id: 'dart_InterestExpenseFinanceExpense',
    sj_div: 'IS',
    account_nm: '이자비용',
    thstrm_amount: convertCurrency('2024', getYearlyData('interest_expense', '2024')),
    frmtrm_amount: convertCurrency('2023', getYearlyData('interest_expense', '2023')),
    bfefrmtrm_amount: convertCurrency('2022', getYearlyData('interest_expense', '2022')),
    currency: 'KRW',
  });

  // 매출채권 데이터 추가
  list.push({
    account_id: 'ifrs-full_TradeAndOtherCurrentReceivables',
    sj_div: 'BS',
    account_nm: '매출채권',
    thstrm_amount: convertCurrency('2024', getYearlyData('trade_receivables', '2024')),
    frmtrm_amount: convertCurrency('2023', getYearlyData('trade_receivables', '2023')),
    bfefrmtrm_amount: convertCurrency('2022', getYearlyData('trade_receivables', '2022')),
    currency: 'KRW',
  });

  // 매입채무 데이터 추가
  list.push({
    account_id: 'ifrs-full_TradeAndOtherCurrentPayables',
    sj_div: 'BS',
    account_nm: '매입채무',
    thstrm_amount: convertCurrency('2024', getYearlyData('trade_payables', '2024')),
    frmtrm_amount: convertCurrency('2023', getYearlyData('trade_payables', '2023')),
    bfefrmtrm_amount: convertCurrency('2022', getYearlyData('trade_payables', '2022')),
    currency: 'KRW',
  });

  // 이익잉여금 데이터 추가
  list.push({
    account_id: 'ifrs-full_RetainedEarnings',
    sj_div: 'BS',
    account_nm: '이익잉여금',
    thstrm_amount: convertCurrency('2024', getYearlyData('retained_earnings', '2024')),
    frmtrm_amount: convertCurrency('2023', getYearlyData('retained_earnings', '2023')),
    bfefrmtrm_amount: convertCurrency('2022', getYearlyData('retained_earnings', '2022')),
    currency: 'KRW',
  });

  // 영업현금흐름 데이터 추가
  list.push({
    account_id: 'ifrs-full_CashFlowsFromUsedInOperatingActivities',
    sj_div: 'CF',
    account_nm: '영업활동현금흐름',
    thstrm_amount: convertCurrency('2024', getYearlyData('operating_cash_flow', '2024')),
    frmtrm_amount: convertCurrency('2023', getYearlyData('operating_cash_flow', '2023')),
    bfefrmtrm_amount: convertCurrency('2022', getYearlyData('operating_cash_flow', '2022')),
    currency: 'KRW',
  });

  // 설비투자 데이터 추가
  list.push({
    account_id: 'ifrs-full_PurchaseOfPropertyPlantAndEquipmentClassifiedAsInvestingActivities',
    sj_div: 'CF',
    account_nm: '유형자산취득',
    thstrm_amount: convertCurrency('2024', getYearlyData('capex', '2024')),
    frmtrm_amount: convertCurrency('2023', getYearlyData('capex', '2023')),
    bfefrmtrm_amount: convertCurrency('2022', getYearlyData('capex', '2022')),
    currency: 'KRW',
  });

  // 투자자산 데이터 추가
  list.push({
    account_id: 'ifrs-full_InvestmentAccountedForUsingEquityMethod',
    sj_div: 'BS',
    account_nm: '투자자산',
    thstrm_amount: convertCurrency('2024', getYearlyData('investment_assets', '2024')),
    frmtrm_amount: convertCurrency('2023', getYearlyData('investment_assets', '2023')),
    bfefrmtrm_amount: convertCurrency('2022', getYearlyData('investment_assets', '2022')),
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
