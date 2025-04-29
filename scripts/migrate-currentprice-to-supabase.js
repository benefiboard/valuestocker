// scripts/migrate-currentprice-to-supabase.js
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// JSON 파일 경로
const stockPriceJsonPath = path.join(process.cwd(), 'src/lib/finance/stock_price_2025.json');

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateStockPriceData() {
  try {
    console.log('Stock Price 데이터 마이그레이션 시작...');

    // JSON 파일 읽기
    const stockPriceData = JSON.parse(fs.readFileSync(stockPriceJsonPath, 'utf8'));

    // stock_price 데이터 마이그레이션
    console.log(`stock_price 테이블에 ${Object.keys(stockPriceData).length}개의 항목 삽입 중...`);

    const stockPriceItems = Object.values(stockPriceData).map((item) => ({
      stock_code: item.stock_code,
      dart_code: item.dart_code,
      company_name: item.company_name,
      current_price: parseFloat(item.current_price),
      last_updated: item.last_updated,
    }));

    // 배치 크기 정의
    const BATCH_SIZE = 100;

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

    console.log('Stock Price 데이터 마이그레이션 완료!');
  } catch (error) {
    console.error('마이그레이션 중 오류 발생:', error);
  }
}

// 스크립트 실행
migrateStockPriceData();
