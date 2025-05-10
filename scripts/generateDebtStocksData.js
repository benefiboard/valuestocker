// scripts/generateDebtStocksData.js
const fs = require('fs');
const path = require('path');

// 원본 JSON 파일 경로
const sourceJsonPath = path.join(process.cwd(), 'src/lib/finance/stock_data_2025.json');

// 부채비율 확인 함수 (원래 isDebtRatioAcceptable 함수와 동일 로직)
function isDebtRatioAcceptable(subindustry, debtRatio) {
  // 데이터가 없는 경우 제외
  if (
    subindustry === undefined ||
    subindustry === null ||
    debtRatio === undefined ||
    debtRatio === null
  ) {
    return false;
  }

  // 산업군별 부채비율 기준 적용
  if (subindustry === '은행') {
    return debtRatio < 1500;
  } else if (subindustry === '손해보험' || subindustry === '생명보험') {
    return debtRatio < 1000;
  } else {
    return debtRatio < 150;
  }
}

// 부채비율 계산 함수
function calculateDebtRatio(assets, equity) {
  if (!assets || !equity || equity === 0) {
    return null;
  }
  // 부채비율 = 부채총계 / 자본총계 * 100
  // 부채총계 = 자산총계 - 자본총계
  return ((assets - equity) / equity) * 100;
}

async function generateDebtStocksData() {
  console.log('부채비율 기준 필터링된 주식 데이터 생성 시작...');

  try {
    // 원본 JSON 파일 읽기
    const stockData = JSON.parse(fs.readFileSync(sourceJsonPath, 'utf8'));
    console.log(`원본 데이터 로드 완료: ${Object.keys(stockData).length}개 종목`);

    // 부채비율 계산 및 필터링
    const acceptableStocks = [];
    let bankCount = 0;
    let insuranceCount = 0;
    let otherCount = 0;

    for (const stockCode in stockData) {
      const stock = stockData[stockCode];

      // 필요한 데이터 추출
      const assets = parseFloat(stock['2024_assets']);
      const equity = parseFloat(stock['2024_equity']);
      const subindustry = stock.subIndustry; // JSON에서는 subIndustry로 저장됨

      // 부채비율 계산
      const debtRatio = calculateDebtRatio(assets, equity);

      // 필터링 조건 확인
      if (debtRatio !== null && isDebtRatioAcceptable(subindustry, debtRatio)) {
        // 필요한 필드만 추출해서 저장
        acceptableStocks.push({
          stock_code: stock.stock_code,
          company_name: stock.company_name,
          industry: stock.industry,
          subindustry: subindustry, // 소문자로 변경하여 일관성 유지
          debtratio: debtRatio.toFixed(2),
        });

        // 산업군별 카운트
        if (subindustry === '은행') {
          bankCount++;
        } else if (subindustry === '손해보험' || subindustry === '생명보험') {
          insuranceCount++;
        } else {
          otherCount++;
        }
      }
    }

    // 결과 정렬 (코드순)
    acceptableStocks.sort((a, b) => a.stock_code.localeCompare(b.stock_code));

    console.log('==== 필터링 결과 ====');
    console.log(`은행 산업군: ${bankCount}개 종목`);
    console.log(`보험 산업군: ${insuranceCount}개 종목`);
    console.log(`기타 산업군: ${otherCount}개 종목`);
    console.log(`총: ${acceptableStocks.length}개 종목`);

    // 데이터 버전 정보 추가
    const version = new Date().toISOString().slice(0, 7);
    const dataWithMeta = {
      version,
      generatedAt: new Date().toISOString(),
      totalStocks: acceptableStocks.length,
      stocks: acceptableStocks,
    };

    // public 디렉토리에 JSON 파일 저장
    const publicDataDir = path.join(process.cwd(), 'public', 'data');

    // 디렉토리 확인 및 생성
    if (!fs.existsSync(publicDataDir)) {
      fs.mkdirSync(publicDataDir, { recursive: true });
    }

    const filePath = path.join(publicDataDir, 'acceptable_debt_stocks.json');
    fs.writeFileSync(filePath, JSON.stringify(dataWithMeta, null, 2));

    console.log(`데이터 생성 완료: 버전 ${version}`);
    console.log(`파일 저장 위치: ${filePath}`);
  } catch (err) {
    console.error('스크립트 실행 중 오류 발생:', err);
    process.exit(1);
  }
}

// 스크립트 실행
generateDebtStocksData();
