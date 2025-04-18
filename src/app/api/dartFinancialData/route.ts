//src/app/api/dartFinancialData/route.ts

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// App Router에서는 HTTP 메서드 이름의 함수를 export 해야 합니다
export async function GET(request: NextRequest) {
  // URL에서 파라미터 추출
  const searchParams = request.nextUrl.searchParams;
  const corpCode = searchParams.get('corpCode');
  const year = searchParams.get('year');
  const reportCode = searchParams.get('reportCode');
  const fsDiv = searchParams.get('fsDiv') || 'CFS';

  // 필수 파라미터 검증
  if (!corpCode || !year || !reportCode) {
    return NextResponse.json(
      { error: 'Missing required parameters. corpCode, year, and reportCode are required.' },
      { status: 400 }
    );
  }

  try {
    // API 키 가져오기
    const apiKey = process.env.DART_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'DART API key is not configured. Please add DART_API_KEY to your .env.local file.',
        },
        { status: 500 }
      );
    }

    // DART API URL 구성
    const apiUrl = 'https://opendart.fss.or.kr/api/fnlttSinglAcntAll.json';

    console.log('DART API 요청:', {
      crtfc_key: apiKey.substring(0, 5) + '...', // 보안을 위해 전체 키 출력 안함
      corp_code: corpCode,
      bsns_year: year,
      reprt_code: reportCode,
      fs_div: fsDiv,
    });

    // API 요청 보내기
    const response = await axios.get(apiUrl, {
      params: {
        crtfc_key: apiKey,
        corp_code: corpCode,
        bsns_year: year,
        reprt_code: reportCode,
        fs_div: fsDiv,
      },
    });

    // 응답 데이터 확인
    const data = response.data;

    // API 상태 확인
    if (data.status && data.status !== '000') {
      return NextResponse.json(
        { error: `DART API Error: ${data.status} - ${data.message}` },
        { status: 400 }
      );
    }

    // 성공적으로 데이터를 받아온 경우 클라이언트에게 전달
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching data from DART API:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch data from DART API',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
