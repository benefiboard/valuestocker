// scripts/migrate-new-fairprice-to-supabase.js
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// JSON 파일 경로
const fairPriceJsonPath = path.join(process.cwd(), 'src/lib/finance/new_stock_fairprice_2025.json');

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateNewFairPriceData() {
  try {
    console.log('New Fair Price 데이터 마이그레이션 시작...');

    // JSON 파일 읽기
    const fairPriceData = JSON.parse(fs.readFileSync(fairPriceJsonPath, 'utf8'));

    // new_stock_fairprice 데이터 마이그레이션
    console.log(
      `new_stock_fairprice 테이블에 ${Object.keys(fairPriceData).length}개의 항목 삽입 중...`
    );

    // 데이터 변환 및 삽입할 배열 생성 - 모든 필드명을 소문자로 변환
    const fairPriceItems = Object.values(fairPriceData).map((item) => ({
      stock_code: item.stock_code,
      dart_code: item.dart_code,
      company_name: item.company_name,
      industry: item.industry,
      subindustry: item.subIndustry, // 소문자로 변경된 필드명
      last_updated: item.last_updated,
      shares_outstanding: item.shares_outstanding,
      weightedroe: item.weightedRoe, // 소문자로 변경된 필드명
      bps: item.bps,
      srimbase: item.sRimBase, // 소문자로 변경된 필드명
      srimdecline10pct: item.sRimDecline10pct, // 소문자로 변경된 필드명
      srimdecline20pct: item.sRimDecline20pct, // 소문자로 변경된 필드명
      profitbasedprice: item.profitBasedPrice, // 소문자로 변경된 필드명
      pricerange_lowrange: item.priceRange_lowRange, // 소문자로 변경된 필드명
      pricerange_midrange: item.priceRange_midRange, // 소문자로 변경된 필드명
      pricerange_highrange: item.priceRange_highRange, // 소문자로 변경된 필드명
      trustscore: item.trustScore, // 소문자로 변경된 필드명
      riskscore: item.riskScore, // 소문자로 변경된 필드명
    }));

    // 배치 크기 정의
    const BATCH_SIZE = 100;

    // 배치 처리
    for (let i = 0; i < fairPriceItems.length; i += BATCH_SIZE) {
      const batch = fairPriceItems.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('new_stock_fairprice').upsert(batch, {
        onConflict: 'stock_code',
      });

      if (error) {
        console.error(`배치 처리 중 오류 발생 (${i}~${i + batch.length}):`, error);
      } else {
        console.log(`${i}~${i + batch.length} 항목 처리 완료`);
      }
    }

    console.log('New Fair Price 데이터 마이그레이션 완료!');
  } catch (error) {
    console.error('마이그레이션 중 오류 발생:', error);
    console.error(error.stack);
  }
}

// 스크립트 실행
migrateNewFairPriceData();
