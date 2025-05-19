// scripts/migrate-naver-data-to-supabase.js
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// JSON 파일 경로
const stockDataJsonPath = path.join(process.cwd(), 'src/lib/finance/stock_data_naver_2025.json');

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

async function migrateNaverStockData() {
  try {
    console.log('네이버 주식 데이터 마이그레이션 시작...');

    // JSON 파일 읽기
    const stockData = JSON.parse(fs.readFileSync(stockDataJsonPath, 'utf8'));

    // stock_naver_data 테이블에 데이터 마이그레이션
    console.log(`stock_naver_data 테이블에 ${Object.keys(stockData).length}개의 항목 삽입 중...`);

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

      // 2024년 데이터
      '2024_revenue': toNumericOrNull(item['2024_revenue']),
      '2024_operating_income': toNumericOrNull(item['2024_operating_income']),
      '2024_income_before_tax': toNumericOrNull(item['2024_income_before_tax']),
      '2024_net_income': toNumericOrNull(item['2024_net_income']),
      '2024_net_income_controlling': toNumericOrNull(item['2024_net_income_controlling']),
      '2024_net_income_noncontrolling': toNumericOrNull(item['2024_net_income_noncontrolling']),
      '2024_assets': toNumericOrNull(item['2024_assets']),
      '2024_liabilities': toNumericOrNull(item['2024_liabilities']),
      '2024_equity': toNumericOrNull(item['2024_equity']),
      '2024_equity_attributable_to_owners': toNumericOrNull(
        item['2024_equity_attributable_to_owners']
      ),
      '2024_equity_attributable_to_noncontrolling': toNumericOrNull(
        item['2024_equity_attributable_to_noncontrolling']
      ),
      '2024_capital': toNumericOrNull(item['2024_capital']),
      '2024_operating_cash_flow': toNumericOrNull(item['2024_operating_cash_flow']),
      '2024_investing_cash_flow': toNumericOrNull(item['2024_investing_cash_flow']),
      '2024_financing_cash_flow': toNumericOrNull(item['2024_financing_cash_flow']),
      '2024_capex': toNumericOrNull(item['2024_capex']),
      '2024_free_cash_flow': toNumericOrNull(item['2024_free_cash_flow']),
      '2024_interest_bearing_debt': toNumericOrNull(item['2024_interest_bearing_debt']),
      '2024_operating_margin': toNumericOrNull(item['2024_operating_margin']),
      '2024_net_margin': toNumericOrNull(item['2024_net_margin']),
      '2024_roe': toNumericOrNull(item['2024_roe']),
      '2024_roa': toNumericOrNull(item['2024_roa']),
      '2024_debt_ratio': toNumericOrNull(item['2024_debt_ratio']),
      '2024_capital_retention_ratio': toNumericOrNull(item['2024_capital_retention_ratio']),
      '2024_eps': toNumericOrNull(item['2024_eps']),
      '2024_per': toNumericOrNull(item['2024_per']),
      '2024_bps': toNumericOrNull(item['2024_bps']),
      '2024_pbr': toNumericOrNull(item['2024_pbr']),
      '2024_dps': toNumericOrNull(item['2024_dps']),
      '2024_dividend_yield': toNumericOrNull(item['2024_dividend_yield']),
      '2024_payout_ratio': toNumericOrNull(item['2024_payout_ratio']),
      '2024_shares_outstanding': item['2024_shares_outstanding'],
      '2024_dividend': toNumericOrNull(item['2024_dividend']),

      // 2023년 데이터
      '2023_revenue': toNumericOrNull(item['2023_revenue']),
      '2023_operating_income': toNumericOrNull(item['2023_operating_income']),
      '2023_income_before_tax': toNumericOrNull(item['2023_income_before_tax']),
      '2023_net_income': toNumericOrNull(item['2023_net_income']),
      '2023_net_income_controlling': toNumericOrNull(item['2023_net_income_controlling']),
      '2023_net_income_noncontrolling': toNumericOrNull(item['2023_net_income_noncontrolling']),
      '2023_assets': toNumericOrNull(item['2023_assets']),
      '2023_liabilities': toNumericOrNull(item['2023_liabilities']),
      '2023_equity': toNumericOrNull(item['2023_equity']),
      '2023_equity_attributable_to_owners': toNumericOrNull(
        item['2023_equity_attributable_to_owners']
      ),
      '2023_equity_attributable_to_noncontrolling': toNumericOrNull(
        item['2023_equity_attributable_to_noncontrolling']
      ),
      '2023_capital': toNumericOrNull(item['2023_capital']),
      '2023_operating_cash_flow': toNumericOrNull(item['2023_operating_cash_flow']),
      '2023_investing_cash_flow': toNumericOrNull(item['2023_investing_cash_flow']),
      '2023_financing_cash_flow': toNumericOrNull(item['2023_financing_cash_flow']),
      '2023_capex': toNumericOrNull(item['2023_capex']),
      '2023_free_cash_flow': toNumericOrNull(item['2023_free_cash_flow']),
      '2023_interest_bearing_debt': toNumericOrNull(item['2023_interest_bearing_debt']),
      '2023_operating_margin': toNumericOrNull(item['2023_operating_margin']),
      '2023_net_margin': toNumericOrNull(item['2023_net_margin']),
      '2023_roe': toNumericOrNull(item['2023_roe']),
      '2023_roa': toNumericOrNull(item['2023_roa']),
      '2023_debt_ratio': toNumericOrNull(item['2023_debt_ratio']),
      '2023_capital_retention_ratio': toNumericOrNull(item['2023_capital_retention_ratio']),
      '2023_eps': toNumericOrNull(item['2023_eps']),
      '2023_per': toNumericOrNull(item['2023_per']),
      '2023_bps': toNumericOrNull(item['2023_bps']),
      '2023_pbr': toNumericOrNull(item['2023_pbr']),
      '2023_dps': toNumericOrNull(item['2023_dps']),
      '2023_dividend_yield': toNumericOrNull(item['2023_dividend_yield']),
      '2023_payout_ratio': toNumericOrNull(item['2023_payout_ratio']),
      '2023_shares_outstanding': item['2023_shares_outstanding'],
      '2023_dividend': toNumericOrNull(item['2023_dividend']),

      // 2022년 데이터
      '2022_revenue': toNumericOrNull(item['2022_revenue']),
      '2022_operating_income': toNumericOrNull(item['2022_operating_income']),
      '2022_income_before_tax': toNumericOrNull(item['2022_income_before_tax']),
      '2022_net_income': toNumericOrNull(item['2022_net_income']),
      '2022_net_income_controlling': toNumericOrNull(item['2022_net_income_controlling']),
      '2022_net_income_noncontrolling': toNumericOrNull(item['2022_net_income_noncontrolling']),
      '2022_assets': toNumericOrNull(item['2022_assets']),
      '2022_liabilities': toNumericOrNull(item['2022_liabilities']),
      '2022_equity': toNumericOrNull(item['2022_equity']),
      '2022_equity_attributable_to_owners': toNumericOrNull(
        item['2022_equity_attributable_to_owners']
      ),
      '2022_equity_attributable_to_noncontrolling': toNumericOrNull(
        item['2022_equity_attributable_to_noncontrolling']
      ),
      '2022_capital': toNumericOrNull(item['2022_capital']),
      '2022_operating_cash_flow': toNumericOrNull(item['2022_operating_cash_flow']),
      '2022_investing_cash_flow': toNumericOrNull(item['2022_investing_cash_flow']),
      '2022_financing_cash_flow': toNumericOrNull(item['2022_financing_cash_flow']),
      '2022_capex': toNumericOrNull(item['2022_capex']),
      '2022_free_cash_flow': toNumericOrNull(item['2022_free_cash_flow']),
      '2022_interest_bearing_debt': toNumericOrNull(item['2022_interest_bearing_debt']),
      '2022_operating_margin': toNumericOrNull(item['2022_operating_margin']),
      '2022_net_margin': toNumericOrNull(item['2022_net_margin']),
      '2022_roe': toNumericOrNull(item['2022_roe']),
      '2022_roa': toNumericOrNull(item['2022_roa']),
      '2022_debt_ratio': toNumericOrNull(item['2022_debt_ratio']),
      '2022_capital_retention_ratio': toNumericOrNull(item['2022_capital_retention_ratio']),
      '2022_eps': toNumericOrNull(item['2022_eps']),
      '2022_per': toNumericOrNull(item['2022_per']),
      '2022_bps': toNumericOrNull(item['2022_bps']),
      '2022_pbr': toNumericOrNull(item['2022_pbr']),
      '2022_dps': toNumericOrNull(item['2022_dps']),
      '2022_dividend_yield': toNumericOrNull(item['2022_dividend_yield']),
      '2022_payout_ratio': toNumericOrNull(item['2022_payout_ratio']),
      '2022_shares_outstanding': item['2022_shares_outstanding'],
      '2022_dividend': toNumericOrNull(item['2022_dividend']),

      // 2021년 데이터
      '2021_revenue': toNumericOrNull(item['2021_revenue']),
      '2021_operating_income': toNumericOrNull(item['2021_operating_income']),
      '2021_income_before_tax': toNumericOrNull(item['2021_income_before_tax']),
      '2021_net_income': toNumericOrNull(item['2021_net_income']),
      '2021_net_income_controlling': toNumericOrNull(item['2021_net_income_controlling']),
      '2021_net_income_noncontrolling': toNumericOrNull(item['2021_net_income_noncontrolling']),
      '2021_assets': toNumericOrNull(item['2021_assets']),
      '2021_liabilities': toNumericOrNull(item['2021_liabilities']),
      '2021_equity': toNumericOrNull(item['2021_equity']),
      '2021_equity_attributable_to_owners': toNumericOrNull(
        item['2021_equity_attributable_to_owners']
      ),
      '2021_equity_attributable_to_noncontrolling': toNumericOrNull(
        item['2021_equity_attributable_to_noncontrolling']
      ),
      '2021_capital': toNumericOrNull(item['2021_capital']),
      '2021_operating_cash_flow': toNumericOrNull(item['2021_operating_cash_flow']),
      '2021_investing_cash_flow': toNumericOrNull(item['2021_investing_cash_flow']),
      '2021_financing_cash_flow': toNumericOrNull(item['2021_financing_cash_flow']),
      '2021_capex': toNumericOrNull(item['2021_capex']),
      '2021_free_cash_flow': toNumericOrNull(item['2021_free_cash_flow']),
      '2021_interest_bearing_debt': toNumericOrNull(item['2021_interest_bearing_debt']),
      '2021_operating_margin': toNumericOrNull(item['2021_operating_margin']),
      '2021_net_margin': toNumericOrNull(item['2021_net_margin']),
      '2021_roe': toNumericOrNull(item['2021_roe']),
      '2021_roa': toNumericOrNull(item['2021_roa']),
      '2021_debt_ratio': toNumericOrNull(item['2021_debt_ratio']),
      '2021_capital_retention_ratio': toNumericOrNull(item['2021_capital_retention_ratio']),
      '2021_eps': toNumericOrNull(item['2021_eps']),
      '2021_per': toNumericOrNull(item['2021_per']),
      '2021_bps': toNumericOrNull(item['2021_bps']),
      '2021_pbr': toNumericOrNull(item['2021_pbr']),
      '2021_dps': toNumericOrNull(item['2021_dps']),
      '2021_dividend_yield': toNumericOrNull(item['2021_dividend_yield']),
      '2021_payout_ratio': toNumericOrNull(item['2021_payout_ratio']),
      '2021_shares_outstanding': item['2021_shares_outstanding'],
      '2021_dividend': toNumericOrNull(item['2021_dividend']),

      // 2020년 데이터
      '2020_revenue': toNumericOrNull(item['2020_revenue']),
      '2020_operating_income': toNumericOrNull(item['2020_operating_income']),
      '2020_income_before_tax': toNumericOrNull(item['2020_income_before_tax']),
      '2020_net_income': toNumericOrNull(item['2020_net_income']),
      '2020_net_income_controlling': toNumericOrNull(item['2020_net_income_controlling']),
      '2020_net_income_noncontrolling': toNumericOrNull(item['2020_net_income_noncontrolling']),
      '2020_assets': toNumericOrNull(item['2020_assets']),
      '2020_liabilities': toNumericOrNull(item['2020_liabilities']),
      '2020_equity': toNumericOrNull(item['2020_equity']),
      '2020_equity_attributable_to_owners': toNumericOrNull(
        item['2020_equity_attributable_to_owners']
      ),
      '2020_equity_attributable_to_noncontrolling': toNumericOrNull(
        item['2020_equity_attributable_to_noncontrolling']
      ),
      '2020_capital': toNumericOrNull(item['2020_capital']),
      '2020_operating_cash_flow': toNumericOrNull(item['2020_operating_cash_flow']),
      '2020_investing_cash_flow': toNumericOrNull(item['2020_investing_cash_flow']),
      '2020_financing_cash_flow': toNumericOrNull(item['2020_financing_cash_flow']),
      '2020_capex': toNumericOrNull(item['2020_capex']),
      '2020_free_cash_flow': toNumericOrNull(item['2020_free_cash_flow']),
      '2020_interest_bearing_debt': toNumericOrNull(item['2020_interest_bearing_debt']),
      '2020_operating_margin': toNumericOrNull(item['2020_operating_margin']),
      '2020_net_margin': toNumericOrNull(item['2020_net_margin']),
      '2020_roe': toNumericOrNull(item['2020_roe']),
      '2020_roa': toNumericOrNull(item['2020_roa']),
      '2020_debt_ratio': toNumericOrNull(item['2020_debt_ratio']),
      '2020_capital_retention_ratio': toNumericOrNull(item['2020_capital_retention_ratio']),
      '2020_eps': toNumericOrNull(item['2020_eps']),
      '2020_per': toNumericOrNull(item['2020_per']),
      '2020_bps': toNumericOrNull(item['2020_bps']),
      '2020_pbr': toNumericOrNull(item['2020_pbr']),
      '2020_dps': toNumericOrNull(item['2020_dps']),
      '2020_dividend_yield': toNumericOrNull(item['2020_dividend_yield']),
      '2020_payout_ratio': toNumericOrNull(item['2020_payout_ratio']),
      '2020_shares_outstanding': item['2020_shares_outstanding'],
      '2020_dividend': toNumericOrNull(item['2020_dividend']),
    }));

    // 배치 크기 정의
    const BATCH_SIZE = 100;

    // 배치 처리
    for (let i = 0; i < stockItems.length; i += BATCH_SIZE) {
      const batch = stockItems.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('stock_naver_data').upsert(batch, {
        onConflict: 'stock_code',
      });

      if (error) {
        console.error(`배치 처리 중 오류 발생 (${i}~${i + batch.length}):`, error);
      } else {
        console.log(`${i}~${i + batch.length} 항목 처리 완료`);
      }
    }

    console.log('네이버 주식 데이터 마이그레이션 완료!');
  } catch (error) {
    console.error('마이그레이션 중 오류 발생:', error);
  }
}

// 스크립트 실행
migrateNaverStockData();
