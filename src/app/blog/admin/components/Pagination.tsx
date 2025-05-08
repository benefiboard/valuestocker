'use client';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (pageNumber: number) => void;
}

export default function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  // 총 페이지 수 계산
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // 표시할 페이지 범위 계산 (현재 페이지 주변 5개)
  const getPageRange = () => {
    const range: number[] = [];
    const rangeSize = 5; // 한 번에 표시할 페이지 버튼 개수

    let startPage = Math.max(1, currentPage - Math.floor(rangeSize / 2));
    let endPage = startPage + rangeSize - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - rangeSize + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      range.push(i);
    }

    return range;
  };

  // 페이지 이동 함수
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div className="flex justify-center mt-8">
      <nav className="flex items-center">
        {/* 이전 페이지 버튼 */}
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded-lg border border-gray-300 mr-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          이전
        </button>

        {/* 페이지 번호 버튼 */}
        <div className="flex space-x-1">
          {getPageRange().map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => goToPage(pageNum)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg ${
                pageNum === currentPage
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white border border-gray-300 hover:bg-gray-100'
              }`}
            >
              {pageNum}
            </button>
          ))}
        </div>

        {/* 다음 페이지 버튼 */}
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded-lg border border-gray-300 ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          다음
        </button>
      </nav>
    </div>
  );
}
