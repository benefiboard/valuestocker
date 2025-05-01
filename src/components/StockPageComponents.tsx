// src/components/StockPageComponents.tsx
'use client';

import { ReactNode } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// 공통 아코디언 컴포넌트
export function AccordionSection({
  title,
  isExpanded,
  toggleExpanded,
  children,
  rightContent,
}: {
  title: string | ReactNode;
  isExpanded: boolean;
  toggleExpanded: () => void;
  children: ReactNode;
  rightContent?: ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-md mb-6">
      <div className="flex items-center justify-between cursor-pointer" onClick={toggleExpanded}>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">{title}</h2>
        <div className="flex items-center">
          {rightContent}
          <div className="text-gray-500">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </div>
      {isExpanded && <div className="mt-4">{children}</div>}
    </div>
  );
}

// 페이지네이션 컴포넌트
export function Pagination({
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  totalItems,
  handlePageChange,
}: {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalItems: number;
  handlePageChange: (page: number) => void;
}) {
  return (
    <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            총 <span className="font-medium">{totalItems}</span> 개 중{' '}
            <span className="font-medium">{startIndex + 1}</span> -{' '}
            <span className="font-medium">{Math.min(endIndex, totalItems)}</span> 보기
          </p>
        </div>
        <div>
          <nav
            className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
            aria-label="Pagination"
          >
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                currentPage === 1
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="sr-only">이전</span>
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* 페이지 번호 버튼 */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === pageNum
                      ? 'z-10 bg-emerald-50 border-emerald-500 text-emerald-600'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                currentPage === totalPages
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="sr-only">다음</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </div>

      {/* 모바일 페이지네이션 */}
      <div className="flex items-center justify-between w-full sm:hidden">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
            currentPage === 1
              ? 'text-gray-300 bg-gray-50 cursor-not-allowed'
              : 'text-gray-700 bg-white hover:bg-gray-50'
          }`}
        >
          이전
        </button>
        <span className="text-sm text-gray-700">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
            currentPage === totalPages
              ? 'text-gray-300 bg-gray-50 cursor-not-allowed'
              : 'text-gray-700 bg-white hover:bg-gray-50'
          }`}
        >
          다음
        </button>
      </div>
    </div>
  );
}
