// src/components/StockLinkButtons.tsx
'use client';

import Link from 'next/link';
import { ExternalLink, TrendingUp, BarChart3, CheckSquare } from 'lucide-react';

// 링크 타입 - 카드형 또는 테이블형
type LinkStyle = 'card' | 'table' | 'mobileTable';

interface StockLinkButtonsProps {
  stockCode: string;
  style?: LinkStyle;
}

/**
 * 주식 상세 링크 버튼 컴포넌트
 * @param stockCode 주식 코드
 * @param style 링크 스타일 ('card' 또는 'table', 기본값은 'card')
 */
export function StockLinkButtons({ stockCode, style = 'card' }: StockLinkButtonsProps) {
  // 표준 형식의 주식 코드로 변환 (숫자 6자리로 맞추기)
  const formattedStockCode = stockCode.padStart(6, '0');

  // 네이버 증권 URL 생성
  const naverFinanceUrl = `https://finance.naver.com/item/main.naver?code=${formattedStockCode}`;

  if (style === 'mobileTable') {
    return (
      <div className="flex flex-col items-end gap-[6px]">
        <Link
          href={`/fairprice?stockCode=${stockCode}`}
          className="text-emerald-600 font-bold hover:text-emerald-900 cursor-pointer flex items-center text-xs "
        >
          <TrendingUp size={12} className="mr-1" />
          적정가확인
        </Link>
        <Link
          href={`/checklist?stockCode=${stockCode}`}
          className="text-emerald-600 font-bold hover:text-emerald-900 cursor-pointer flex items-center text-xs "
        >
          <CheckSquare size={12} className="mr-1" />
          체크리스트
        </Link>

        <a
          href={naverFinanceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 font-bold hover:text-gray-900 cursor-pointer flex items-center text-xs"
        >
          <BarChart3 size={12} className="mr-1" />
          네이버증권
        </a>
      </div>
    );
  }

  // 카드형 버튼 스타일
  if (style === 'card') {
    return (
      <div className="flex flex-col gap-2 mt-auto w-full">
        <Link
          href={`/fairprice?stockCode=${stockCode}`}
          className="text-center py-2 px-3 bg-gray-600 hover:bg-gray-800 text-gray-100 rounded-lg transition-colors text-sm font-medium flex items-center justify-center"
        >
          <TrendingUp size={16} className="mr-1.5" />
          적정가 확인
          <ExternalLink size={14} className="ml-1" />
        </Link>

        <a
          href={naverFinanceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-center py-2 px-3 bg-gray-200 hover:bg-gray-400 text-gray-600 rounded-lg transition-colors text-sm font-medium flex items-center justify-center"
        >
          <BarChart3 size={16} className="mr-1.5" />
          네이버 증권
          <ExternalLink size={14} className="ml-1" />
        </a>
      </div>
    );
  }

  // 테이블형 텍스트 링크 스타일
  return (
    <div className="flex flex-col items-end  gap-2">
      <Link
        href={`/fairprice?stockCode=${stockCode}`}
        className="text-emerald-600 font-bold hover:text-emerald-900 cursor-pointer flex items-center text-sm "
      >
        <TrendingUp size={14} className="mr-1" />
        적정가확인
      </Link>

      <Link
        href={`/checklist?stockCode=${stockCode}`}
        className="text-emerald-600 font-bold hover:text-emerald-900 cursor-pointer flex items-center text-sm "
      >
        <CheckSquare size={14} className="mr-1" />
        체크리스트
      </Link>

      <a
        href={naverFinanceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-600 font-bold hover:text-gray-900 cursor-pointer flex items-center text-sm"
      >
        <BarChart3 size={14} className="mr-1" />
        네이버증권
      </a>
    </div>
  );
}
