import { NextRequest, NextResponse } from 'next/server';

// API 응답 인터페이스 정의
interface StockDataItem {
  itmsNm: string;
  srtnCd: string;
  isinCd: string;
  mrktCtg: string;
  clpr: string;
  vs: string;
  fltRt: string;
  mkp: string;
  hipr: string;
  lopr: string;
  trqu: string;
  trPrc: string;
  mrktTotAmt: string;
  lstgStCnt: string;
  basDt?: string; // 기준일자 추가
}

export async function GET(request: NextRequest) {
  // URL에서 쿼리 파라미터 추출
  const url = new URL(request.url);
  const year = url.searchParams.get('year');
  const stockCode = url.searchParams.get('stockCode');
  const useLatest = url.searchParams.get('useLatest') === 'true';

  if (!stockCode) {
    return NextResponse.json({ error: '종목코드 매개변수가 필요합니다' }, { status: 400 });
  }

  if (!useLatest && !year) {
    return NextResponse.json(
      { error: '연도 매개변수가 필요하거나 useLatest가 true여야 합니다' },
      { status: 400 }
    );
  }

  // 환경변수에서 API 키 가져오기
  const apiKey = process.env.DART_PRICE_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API 키가 설정되지 않았습니다' }, { status: 500 });
  }
  const encodedApiKey = encodeURIComponent(apiKey);

  try {
    let stockData: StockDataItem | null = null;
    let foundDate: string | null = null;

    if (useLatest) {
      // 최신 데이터 요청 (날짜 파라미터 없이)
      const apiUrl = `https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo?serviceKey=${encodedApiKey}&numOfRows=10&pageNo=1&resultType=json&likeSrtnCd=${stockCode}`;

      console.log(`Requesting latest data for stockCode: ${stockCode}`);
      const response = await fetch(apiUrl);

      if (response.ok) {
        const result = await response.json();
        console.log(`Response for latest data:`, JSON.stringify(result, null, 2).substring(0, 300));

        // 유효한 데이터(종가 있음) 확인
        if (result.response?.body?.items?.item) {
          const items = Array.isArray(result.response.body.items.item)
            ? result.response.body.items.item
            : [result.response.body.items.item];

          // 정확한 종목코드 매치 또는 첫 번째 항목
          const matchedItem =
            items.find((item: StockDataItem) => item.srtnCd === stockCode) || items[0];

          if (matchedItem && matchedItem.clpr) {
            stockData = matchedItem;
            foundDate =
              matchedItem.basDt || new Date().toISOString().split('T')[0].replace(/-/g, '');
            console.log(`Found valid latest data for stockCode ${stockCode}`);
          }
        }
      }
    } else {
      // 연말 날짜 배열 생성 (12월 30일부터 26일까지)
      const endOfYearDates = [
        `${year}1230`,
        `${year}1229`,
        `${year}1228`,
        `${year}1227`,
        `${year}1226`,
      ];

      // 유효한 데이터를 찾을 때까지 각 날짜 시도
      for (const date of endOfYearDates) {
        // 종목코드로 API 요청 - itmsNm 대신 likeSrtnCd 사용
        const apiUrl = `https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo?serviceKey=${encodedApiKey}&numOfRows=10&pageNo=1&resultType=json&basDt=${date}&likeSrtnCd=${stockCode}`;

        console.log(`Trying date: ${date} for stockCode: ${stockCode}`);
        const response = await fetch(apiUrl);

        if (response.ok) {
          const result = await response.json();
          console.log(`Response for ${date}:`, JSON.stringify(result, null, 2).substring(0, 300));

          // 유효한 데이터(종가 있음) 확인
          if (result.response?.body?.items?.item) {
            const items = Array.isArray(result.response.body.items.item)
              ? result.response.body.items.item
              : [result.response.body.items.item];

            // 정확한 종목코드 매치 또는 첫 번째 항목
            const matchedItem =
              items.find((item: StockDataItem) => item.srtnCd === stockCode) || items[0];

            if (matchedItem && matchedItem.clpr) {
              stockData = matchedItem;
              foundDate = date;
              console.log(`Found valid data for stockCode ${stockCode} on ${date}`);
              break;
            }
          }
        }

        console.log(`No valid data found for ${date}`);
      }
    }

    // 어떤 방식으로도 데이터를 찾지 못한 경우
    if (!stockData || !foundDate) {
      return NextResponse.json(
        { error: `종목코드 ${stockCode}의 주가 데이터를 찾을 수 없습니다` },
        { status: 404 }
      );
    }

    // 표시용 날짜 형식 지정
    const formattedDate = `${foundDate.slice(0, 4)}-${foundDate.slice(4, 6)}-${foundDate.slice(
      6,
      8
    )}`;

    // 안전하게 숫자 값 변환하는 함수들
    const safeParseInt = (value: string | number | undefined): number => {
      const parsed = parseInt(String(value));
      return isNaN(parsed) ? 0 : parsed;
    };

    const safeParseFloat = (value: string | number | undefined): number => {
      const parsed = parseFloat(String(value));
      return isNaN(parsed) ? 0 : parsed;
    };

    // 필수 데이터만 포함한 간소화된 응답 반환
    return NextResponse.json({
      success: true,
      data: {
        year: foundDate.slice(0, 4),
        company: stockData.itmsNm,
        code: stockData.srtnCd,
        isin: stockData.isinCd,
        market: stockData.mrktCtg,
        date: foundDate,
        formattedDate,
        price: safeParseInt(stockData.clpr),
        change: safeParseInt(stockData.vs),
        changePercent: safeParseFloat(stockData.fltRt),
        open: safeParseInt(stockData.mkp),
        high: safeParseInt(stockData.hipr),
        low: safeParseInt(stockData.lopr),
        volume: safeParseInt(stockData.trqu),
        value: safeParseInt(stockData.trPrc),
        marketCap: safeParseInt(stockData.mrktTotAmt),
        sharesOutstanding: safeParseInt(stockData.lstgStCnt),
        isLatest: useLatest,
      },
    });
  } catch (error) {
    console.error('API 요청 오류:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
