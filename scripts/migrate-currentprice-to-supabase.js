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

    // 문제가 될 수 있는 데이터 먼저 검사
    console.log('\n데이터 사전 검사 중...');
    const problematicItems = [];
    const MAX_PRICE = 99999999.99;
    const MIN_PRICE = -99999999.99;

    Object.values(stockPriceData).forEach((item) => {
      const price = parseFloat(item.current_price);

      if (isNaN(price)) {
        problematicItems.push({
          stock_code: item.stock_code,
          company_name: item.company_name,
          current_price: item.current_price,
          issue: 'Invalid price format (NaN)',
        });
      } else if (price > MAX_PRICE) {
        problematicItems.push({
          stock_code: item.stock_code,
          company_name: item.company_name,
          current_price: item.current_price,
          numeric_price: price,
          issue: `Price exceeds maximum (${price} > ${MAX_PRICE})`,
        });
      } else if (price < MIN_PRICE) {
        problematicItems.push({
          stock_code: item.stock_code,
          company_name: item.company_name,
          current_price: item.current_price,
          numeric_price: price,
          issue: `Price below minimum (${price} < ${MIN_PRICE})`,
        });
      }
    });

    if (problematicItems.length > 0) {
      console.log(`\n⚠️  문제가 있는 종목 발견: ${problematicItems.length}개\n`);
      problematicItems.forEach((item) => {
        console.log(`종목코드: ${item.stock_code}`);
        console.log(`회사명: ${item.company_name}`);
        console.log(`현재가격: ${item.current_price}`);
        if (item.numeric_price) {
          console.log(`숫자값: ${item.numeric_price.toLocaleString()}`);
        }
        console.log(`문제: ${item.issue}`);
        console.log('---');
      });

      // 문제 데이터를 파일로 저장
      fs.writeFileSync('problematic_stocks.json', JSON.stringify(problematicItems, null, 2));
      console.log('\n문제 종목 목록이 problematic_stocks.json 파일에 저장되었습니다.');

      console.log('\n마이그레이션을 계속하시겠습니까? 이 종목들은 에러가 발생할 것입니다.');
      console.log('계속하려면 "CONTINUE_WITH_ERRORS=true" 환경변수를 설정하고 다시 실행하세요.');

      if (process.env.CONTINUE_WITH_ERRORS !== 'true') {
        console.log('\n마이그레이션을 중단합니다.');
        process.exit(1);
      }
    }

    // stock_price 데이터 마이그레이션
    console.log(`\nstock_price 테이블에 ${Object.keys(stockPriceData).length}개의 항목 삽입 중...`);

    const stockPriceItems = Object.values(stockPriceData).map((item) => ({
      stock_code: item.stock_code,
      dart_code: item.dart_code,
      company_name: item.company_name,
      current_price: item.current_price === '' ? null : parseFloat(item.current_price),
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
        console.error(`\n배치 처리 중 오류 발생 (${i}~${i + batch.length}):`, error);

        // 어떤 종목이 문제인지 개별적으로 확인
        console.log('\n문제가 된 종목 찾는 중...');
        for (const item of batch) {
          const { error: individualError } = await supabase
            .from('stock_price')
            .upsert(item, { onConflict: 'stock_code' });

          if (individualError) {
            console.error(`\n❌ 에러 발생 종목:`);
            console.error(`종목코드: ${item.stock_code}`);
            console.error(`회사명: ${item.company_name}`);
            console.error(`현재가격: ${item.current_price}`);
            console.error(`에러: ${individualError.message}`);
            if (individualError.details) {
              console.error(`상세: ${JSON.stringify(individualError.details)}`);
            }
          }
        }
      } else {
        console.log(`${i}~${i + batch.length} 항목 처리 완료`);
      }
    }

    console.log('\nStock Price 데이터 마이그레이션 완료!');
  } catch (error) {
    console.error('마이그레이션 중 오류 발생:', error);
  }
}

// 스크립트 실행
migrateStockPriceData();
