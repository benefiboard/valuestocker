'use client';

import { useEffect, useState } from 'react';
import { PostFilters as FilterType } from '../page1';

interface PostFiltersProps {
  filters: FilterType;
  onFilterChange: (filters: FilterType) => void;
}

export default function PostFilters({ filters, onFilterChange }: PostFiltersProps) {
  // 로컬 필터 상태
  const [localFilters, setLocalFilters] = useState<FilterType>(filters);

  // 검색어 디바운싱을 위한 타이머
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);

  // 상태 필터 변경 핸들러
  const handleStatusChange = (value: 'all' | 'published' | 'draft') => {
    const newFilters = { ...localFilters, publishStatus: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  // 검색어 변경 핸들러 (디바운싱 적용)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchQuery = e.target.value;

    // 로컬 상태는 즉시 업데이트
    setLocalFilters((prev) => ({ ...prev, searchQuery: newSearchQuery }));

    // 기존 타이머가 있으면 취소
    if (searchTimer) {
      clearTimeout(searchTimer);
    }

    // 300ms 후에 필터 적용
    const timer = setTimeout(() => {
      onFilterChange({ ...localFilters, searchQuery: newSearchQuery });
    }, 300);

    setSearchTimer(timer);
  };

  // 필터 초기화 핸들러
  const handleResetFilters = () => {
    // 타입 오류 수정: 명시적으로 FilterType 타입 지정
    const resetFilters: FilterType = {
      publishStatus: 'all',
      searchQuery: '',
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (searchTimer) {
        clearTimeout(searchTimer);
      }
    };
  }, [searchTimer]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <div className="flex flex-wrap items-center gap-4">
        {/* 발행 상태 필터 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">발행 상태</label>
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              className={`px-4 py-2 text-sm ${
                localFilters.publishStatus === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => handleStatusChange('all')}
            >
              전체
            </button>
            <button
              className={`px-4 py-2 text-sm ${
                localFilters.publishStatus === 'published'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => handleStatusChange('published')}
            >
              발행됨
            </button>
            <button
              className={`px-4 py-2 text-sm ${
                localFilters.publishStatus === 'draft'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => handleStatusChange('draft')}
            >
              임시저장
            </button>
          </div>
        </div>

        {/* 검색 필터 */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">검색</label>
          <input
            type="text"
            value={localFilters.searchQuery}
            onChange={handleSearchChange}
            placeholder="제목으로 검색..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* 필터 초기화 버튼 */}
        <div className="self-end mb-1">
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            초기화
          </button>
        </div>
      </div>
    </div>
  );
}
