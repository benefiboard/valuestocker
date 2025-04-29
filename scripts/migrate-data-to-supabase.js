// scripts/migrate-data-to-supabase.js (JavaScript 파일로 이름 변경)
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// JSON 파일 경로
const fairPriceJsonPath = path.join(process.cwd(), 'src/lib/finance/stock_fairprice_2025.json');
const stockPriceJsonPath = path.join(process.cwd(), 'src/lib/finance/stock_price_2025.json');

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateData() {
  try {
    console.log('데이터 마이그레이션 시작...');

    // JSON 파일 읽기
    const fairPriceData = JSON.parse(fs.readFileSync(fairPriceJsonPath, 'utf8'));
    const stockPriceData = JSON.parse(fs.readFileSync(stockPriceJsonPath, 'utf8'));

    // 1. stock_fairprice 데이터 마이그레이션
    console.log(
      `stock_fairprice 테이블에 ${Object.keys(fairPriceData).length}개의 항목 삽입 중...`
    );

    // 데이터 변환 및 삽입할 배열 생성 - 모든 필드명을 소문자로 변환
    const fairPriceItems = Object.values(fairPriceData).map((item) => ({
      stock_code: item.stock_code,
      dart_code: item.dart_code,
      company_name: item.company_name,
      industry: item.industry,
      subindustry: item.subIndustry, // 소문자로 변경
      last_updated: item.last_updated,
      shares_outstanding: item.shares_outstanding,
      epsper: item.epsPer, // 소문자로 변경
      controllingshareholder: item.controllingShareHolder, // 소문자로 변경
      threeindicatorsbps: item.threeIndicatorsBps, // 소문자로 변경
      threeindicatorseps: item.threeIndicatorsEps, // 소문자로 변경
      threeindicatorsroeeps: item.threeIndicatorsRoeEps, // 소문자로 변경
      yamaguchi: item.yamaguchi,
      srimbase: item.sRimBase, // 소문자로 변경
      pegbased: item.pegBased, // 소문자로 변경
      srimdecline10pct: item.sRimDecline10pct, // 소문자로 변경
      srimdecline20pct: item.sRimDecline20pct, // 소문자로 변경
      averageeps: item.averageEps, // 소문자로 변경
      averageper: item.averagePER, // 소문자로 변경
      growthrate: item.growthRate, // 소문자로 변경
      pegbasedper: item.pegBasedPER, // 소문자로 변경
      latestroe: item.latestRoe, // 소문자로 변경
      pricerange_lowrange: item.priceRange_lowRange, // 소문자로 변경
      pricerange_midrange: item.priceRange_midRange, // 소문자로 변경
      pricerange_highrange: item.priceRange_highRange, // 소문자로 변경
      trustscore: item.trustScore, // 소문자로 변경
      riskscore: item.riskScore, // 소문자로 변경
    }));

    // 배치 크기 정의
    const BATCH_SIZE = 100;

    // 배치 처리
    for (let i = 0; i < fairPriceItems.length; i += BATCH_SIZE) {
      const batch = fairPriceItems.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('stock_fairprice').upsert(batch, {
        onConflict: 'stock_code',
      });

      if (error) {
        console.error(`배치 처리 중 오류 발생 (${i}~${i + batch.length}):`, error);
      } else {
        console.log(`${i}~${i + batch.length} 항목 처리 완료`);
      }
    }

    // 2. stock_price 데이터 마이그레이션
    console.log(`stock_price 테이블에 ${Object.keys(stockPriceData).length}개의 항목 삽입 중...`);

    const stockPriceItems = Object.values(stockPriceData).map((item) => ({
      stock_code: item.stock_code,
      dart_code: item.dart_code,
      company_name: item.company_name,
      current_price: parseFloat(item.current_price),
      last_updated: item.last_updated,
    }));

    // 배치 처리
    for (let i = 0; i < stockPriceItems.length; i += BATCH_SIZE) {
      const batch = stockPriceItems.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('stock_price').upsert(batch, {
        onConflict: 'stock_code',
      });

      if (error) {
        console.error(`배치 처리 중 오류 발생 (${i}~${i + batch.length}):`, error);
      } else {
        console.log(`${i}~${i + batch.length} 항목 처리 완료`);
      }
    }

    console.log('데이터 마이그레이션 완료!');
  } catch (error) {
    console.error('마이그레이션 중 오류 발생:', error);
  }
}

// 스크립트 실행
migrateData();
