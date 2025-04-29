// scripts/migrate-checklist-to-supabase.js
require('dotenv').config({ path: '.env.local' }); // 환경 변수 로드

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// JSON 파일 경로
const checklistJsonPath = path.join(process.cwd(), 'src/lib/finance/stock_checklist_2025.json');

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
    console.log('체크리스트 데이터 마이그레이션 시작...');

    // JSON 파일 읽기
    const checklistData = JSON.parse(fs.readFileSync(checklistJsonPath, 'utf8'));

    // stock_checklist 데이터 마이그레이션
    console.log(
      `stock_checklist 테이블에 ${Object.keys(checklistData).length}개의 항목 삽입 중...`
    );

    // 데이터 변환 및 삽입할 배열 생성 - 모든 필드명을 소문자로 변환
    const checklistItems = Object.values(checklistData).map((item) => ({
      stock_code: item.stock_code,
      dart_code: item.dart_code,
      company_name: item.company_name,
      industry: item.industry,
      subindustry: item.subIndustry, // 소문자로 변환
      last_updated: item.last_updated,

      // 성장률 지표
      revenuegrowthrate: item.revenueGrowthRate,
      opincomegrowthrate: item.opIncomeGrowthRate,
      epsgrowthrate: item.epsGrowthRate,
      netincomegrowthrate: item.netIncomeGrowthRate,
      bpsgrowthrate: item.bpsGrowthRate,
      retainedearningsgrowthrate: item.retainedEarningsGrowthRate,

      // 수익성 및 효율성 지표
      avgopmargin: item.avgOpMargin,
      avgroe: item.avgRoe,

      // 재무 안정성 지표
      debtratio: item.debtRatio,
      currentratio: item.currentRatio,
      interestcoverageratio: item.interestCoverageRatio,
      noncurrentliabilitiestonetincome: item.nonCurrentLiabilitiesToNetIncome,

      // 현금 흐름 지표
      cashcycledays: item.cashCycleDays,
      fcfratio: item.fcfRatio,
      grossprofitmargin: item.grossProfitMargin,

      // 밸류에이션 지표
      avgper: item.avgPer,
      maxper: item.maxPer,
      maxpertimes04: item.maxPerTimes04,

      // BPS 관련 지표
      currentbps: item.currentBps,
      previousbps: item.previousBps,
      twoyearsagobps: item.twoYearsAgoBps,

      // PER 관련 지표
      currentyearper: item.currentYearPer,
      previousyearper: item.previousYearPer,
      twoyearsagoper: item.twoYearsAgoPer,

      // EPS 지표
      currentyeareps: item.currentYearEps,
    }));

    // 배치 크기 정의
    const BATCH_SIZE = 100;

    // 배치 처리
    for (let i = 0; i < checklistItems.length; i += BATCH_SIZE) {
      const batch = checklistItems.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('stock_checklist').upsert(batch, {
        onConflict: 'stock_code',
      });

      if (error) {
        console.error(`배치 처리 중 오류 발생 (${i}~${i + batch.length}):`, error);
      } else {
        console.log(`${i}~${i + batch.length} 항목 처리 완료`);
      }
    }

    console.log('체크리스트 데이터 마이그레이션 완료!');
  } catch (error) {
    console.error('마이그레이션 중 오류 발생:', error);
  }
}

// 스크립트 실행
migrateData();
