// scripts/update-dividend-yield.js
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// JSON 파일 경로
const dividendYieldJsonPath = path.join(process.cwd(), 'src/lib/finance/dividend_yield_2024.json');

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

async function updateDividendYield() {
  try {
    console.log('배당 수익률 데이터 업데이트 시작...');

    // JSON 파일 읽기
    const dividendData = JSON.parse(fs.readFileSync(dividendYieldJsonPath, 'utf8'));

    // 배당 수익률 데이터 업데이트
    console.log(
      `stock_current 테이블에 ${Object.keys(dividendData).length}개의 항목 업데이트 중...`
    );

    // 데이터 변환 및 업데이트할 배열 생성
    const updateItems = Object.values(dividendData).map((item) => ({
      stock_code: item.stock_code,
      '2024_dividend_yield': toNumericOrNull(item.dividend_yield),
    }));

    // 배치 크기 정의
    const BATCH_SIZE = 100;

    // 배치 처리
    for (let i = 0; i < updateItems.length; i += BATCH_SIZE) {
      const batch = updateItems.slice(i, i + BATCH_SIZE);

      // batch 내 각 항목에 대해 개별적으로 업데이트
      for (const item of batch) {
        const { error } = await supabase
          .from('stock_current')
          .update({ '2024_dividend_yield': item['2024_dividend_yield'] })
          .eq('stock_code', item.stock_code);

        if (error) {
          console.error(`항목 업데이트 중 오류 발생 (stock_code: ${item.stock_code}):`, error);
        }
      }

      console.log(`${i}~${i + batch.length} 항목 처리 완료`);
    }

    console.log('배당 수익률 데이터 업데이트 완료!');
  } catch (error) {
    console.error('업데이트 중 오류 발생:', error);
  }
}

// 스크립트 실행
updateDividendYield();
