// scripts/migrate-data-to-supabase.js
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// JSON 파일 경로
const stockDataJsonPath = path.join(process.cwd(), 'src/lib/finance/stock_data_2025.json');

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 빈 문자열("") 또는 undefined를 null로 변환하는 도우미 함수
function toNumericOrNull(value) {
  if (value === '' || value === undefined) {
    return null;
  }
  return value;
}

async function migrateStockData() {
  try {
    console.log('주식 데이터 마이그레이션 시작...');

    // JSON 파일 읽기
    const stockData = JSON.parse(fs.readFileSync(stockDataJsonPath, 'utf8'));

    // stock_raw_data 데이터 마이그레이션
    console.log(`stock_raw_data 테이블에 ${Object.keys(stockData).length}개의 항목 삽입 중...`);

    // 데이터 변환 및 삽입할 배열 생성
    const stockItems = Object.values(stockData).map((item) => ({
      stock_code: item.stock_code,
      dart_code: item.dart_code,
      company_name: item.company_name,
      industry: item.industry,
      subindustry: item.subIndustry,
      last_updated: item.last_updated,
      shares_outstanding: item.shares_outstanding,
      market_cap: toNumericOrNull(item.market_cap),
      market_category: item.market_category,

      // 2024년 데이터 (data_ 접두사 제거)
      '2024_currency': item['2024_currency'],
      '2024_eps': toNumericOrNull(item['2024_eps']),
      '2024_revenue': toNumericOrNull(item['2024_revenue']),
      '2024_operating_income': toNumericOrNull(item['2024_operating_income']),
      '2024_net_income': toNumericOrNull(item['2024_net_income']),
      '2024_cost_of_sales': toNumericOrNull(item['2024_cost_of_sales']),
      '2024_gross_profit': toNumericOrNull(item['2024_gross_profit']),
      '2024_interest_expense': toNumericOrNull(item['2024_interest_expense']),
      '2024_assets': toNumericOrNull(item['2024_assets']),
      '2024_equity': toNumericOrNull(item['2024_equity']),
      '2024_equity_attributable_to_owners': toNumericOrNull(
        item['2024_equity_attributable_to_owners']
      ),
      '2024_current_assets': toNumericOrNull(item['2024_current_assets']),
      '2024_current_liabilities': toNumericOrNull(item['2024_current_liabilities']),
      '2024_non_current_liabilities': toNumericOrNull(item['2024_non_current_liabilities']),
      '2024_inventories': toNumericOrNull(item['2024_inventories']),
      '2024_retained_earnings': toNumericOrNull(item['2024_retained_earnings']),
      '2024_trade_receivables': toNumericOrNull(item['2024_trade_receivables']),
      '2024_trade_payables': toNumericOrNull(item['2024_trade_payables']),
      '2024_investment_assets': toNumericOrNull(item['2024_investment_assets']),
      '2024_operating_cash_flow': toNumericOrNull(item['2024_operating_cash_flow']),
      '2024_capex': toNumericOrNull(item['2024_capex']),
      '2024_free_cash_flow': toNumericOrNull(item['2024_free_cash_flow']),
      '2024_price': toNumericOrNull(item['2024_price']),
      '2024_dividend': toNumericOrNull(item['2024_dividend']),
      '2024_payout_ratio': toNumericOrNull(item['2024_payout_ratio']),
      '2024_dps': toNumericOrNull(item['2024_dps']),
      '2024_dividend_yield': toNumericOrNull(item['2024_dividend_yield']),

      // 2023년 데이터 (data_ 접두사 제거)
      '2023_currency': item['2023_currency'],
      '2023_eps': toNumericOrNull(item['2023_eps']),
      '2023_revenue': toNumericOrNull(item['2023_revenue']),
      '2023_operating_income': toNumericOrNull(item['2023_operating_income']),
      '2023_net_income': toNumericOrNull(item['2023_net_income']),
      '2023_cost_of_sales': toNumericOrNull(item['2023_cost_of_sales']),
      '2023_gross_profit': toNumericOrNull(item['2023_gross_profit']),
      '2023_interest_expense': toNumericOrNull(item['2023_interest_expense']),
      '2023_assets': toNumericOrNull(item['2023_assets']),
      '2023_equity': toNumericOrNull(item['2023_equity']),
      '2023_equity_attributable_to_owners': toNumericOrNull(
        item['2023_equity_attributable_to_owners']
      ),
      '2023_current_assets': toNumericOrNull(item['2023_current_assets']),
      '2023_current_liabilities': toNumericOrNull(item['2023_current_liabilities']),
      '2023_non_current_liabilities': toNumericOrNull(item['2023_non_current_liabilities']),
      '2023_inventories': toNumericOrNull(item['2023_inventories']),
      '2023_retained_earnings': toNumericOrNull(item['2023_retained_earnings']),
      '2023_trade_receivables': toNumericOrNull(item['2023_trade_receivables']),
      '2023_trade_payables': toNumericOrNull(item['2023_trade_payables']),
      '2023_investment_assets': toNumericOrNull(item['2023_investment_assets']),
      '2023_operating_cash_flow': toNumericOrNull(item['2023_operating_cash_flow']),
      '2023_capex': toNumericOrNull(item['2023_capex']),
      '2023_free_cash_flow': toNumericOrNull(item['2023_free_cash_flow']),
      '2023_price': toNumericOrNull(item['2023_price']),
      '2023_dividend': toNumericOrNull(item['2023_dividend']),
      '2023_payout_ratio': toNumericOrNull(item['2023_payout_ratio']),
      '2023_dps': toNumericOrNull(item['2023_dps']),
      '2023_dividend_yield': toNumericOrNull(item['2023_dividend_yield']),

      // 2022년 데이터 (data_ 접두사 제거)
      '2022_currency': item['2022_currency'],
      '2022_eps': toNumericOrNull(item['2022_eps']),
      '2022_revenue': toNumericOrNull(item['2022_revenue']),
      '2022_operating_income': toNumericOrNull(item['2022_operating_income']),
      '2022_net_income': toNumericOrNull(item['2022_net_income']),
      '2022_cost_of_sales': toNumericOrNull(item['2022_cost_of_sales']),
      '2022_gross_profit': toNumericOrNull(item['2022_gross_profit']),
      '2022_interest_expense': toNumericOrNull(item['2022_interest_expense']),
      '2022_assets': toNumericOrNull(item['2022_assets']),
      '2022_equity': toNumericOrNull(item['2022_equity']),
      '2022_equity_attributable_to_owners': toNumericOrNull(
        item['2022_equity_attributable_to_owners']
      ),
      '2022_current_assets': toNumericOrNull(item['2022_current_assets']),
      '2022_current_liabilities': toNumericOrNull(item['2022_current_liabilities']),
      '2022_non_current_liabilities': toNumericOrNull(item['2022_non_current_liabilities']),
      '2022_inventories': toNumericOrNull(item['2022_inventories']),
      '2022_retained_earnings': toNumericOrNull(item['2022_retained_earnings']),
      '2022_trade_receivables': toNumericOrNull(item['2022_trade_receivables']),
      '2022_trade_payables': toNumericOrNull(item['2022_trade_payables']),
      '2022_investment_assets': toNumericOrNull(item['2022_investment_assets']),
      '2022_operating_cash_flow': toNumericOrNull(item['2022_operating_cash_flow']),
      '2022_capex': toNumericOrNull(item['2022_capex']),
      '2022_free_cash_flow': toNumericOrNull(item['2022_free_cash_flow']),
      '2022_price': toNumericOrNull(item['2022_price']),
      '2022_dividend': toNumericOrNull(item['2022_dividend']),
      '2022_payout_ratio': toNumericOrNull(item['2022_payout_ratio']),
      '2022_dps': toNumericOrNull(item['2022_dps']),
      '2022_dividend_yield': toNumericOrNull(item['2022_dividend_yield']),
    }));

    // 배치 크기 정의
    const BATCH_SIZE = 100;

    // 배치 처리
    for (let i = 0; i < stockItems.length; i += BATCH_SIZE) {
      const batch = stockItems.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('stock_raw_data').upsert(batch, {
        onConflict: 'stock_code',
      });

      if (error) {
        console.error(`배치 처리 중 오류 발생 (${i}~${i + batch.length}):`, error);
      } else {
        console.log(`${i}~${i + batch.length} 항목 처리 완료`);
      }
    }

    console.log('주식 데이터 마이그레이션 완료!');
  } catch (error) {
    console.error('마이그레이션 중 오류 발생:', error);
  }
}

// 스크립트 실행
migrateStockData();
