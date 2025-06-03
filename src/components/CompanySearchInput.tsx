//src/components/CompanySearchInput.tsx

'use client';

import { useState, useEffect, useRef, ChangeEvent, KeyboardEvent } from 'react';
import { CompanyInfo, stockCodeMap } from '@/lib/stockCodeData';
import { Search, X } from 'lucide-react';

interface CompanySearchInputProps {
  onCompanySelect: (company: CompanyInfo, autoSearch?: boolean) => void; // ⭐ autoSearch 플래그 추가
  placeholder?: string;
  initialValue?: string;
  className?: string;
}

const CompanySearchInput = ({
  onCompanySelect,
  placeholder = '회사명 또는 종목코드 입력',
  initialValue = '',
  className = '',
}: CompanySearchInputProps) => {
  // 상태 관리
  const [searchTerm, setSearchTerm] = useState<string>(initialValue);
  const [searchResults, setSearchResults] = useState<CompanyInfo[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 디바운싱을 위한 타이머 참조
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 컴포넌트 참조 (외부 클릭 감지용)
  const containerRef = useRef<HTMLDivElement>(null);

  // ⭐ 드롭다운 스크롤 컨테이너 참조 (자동 스크롤용)
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 검색어가 변경될 때마다 결과 업데이트
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // ⭐ 검색 시에는 focusedIndex를 리셋하지 않고, 검색 완료 후 첫 번째 항목으로 설정

    // 이전 타이머가 있으면 취소
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (value.trim() === '') {
      setSearchResults([]);
      setShowDropdown(false);
      setFocusedIndex(-1);
      return;
    }

    // 디바운싱 적용 (300ms)
    setIsLoading(true);
    searchTimerRef.current = setTimeout(() => {
      performSearch(value);
      setIsLoading(false);
    }, 300);
  };

  // 실제 검색 수행 함수
  const performSearch = (query: string) => {
    if (query.trim() === '') {
      setSearchResults([]);
      setShowDropdown(false);
      setFocusedIndex(-1);
      return;
    }

    const normalizedQuery = query.toLowerCase();

    // stockCodeMap에서 검색어와 일치하는 회사 찾기
    const matchingCompanies = Object.values(stockCodeMap)
      .filter(
        (company) =>
          company.companyName.toLowerCase().includes(normalizedQuery) ||
          company.stockCode.includes(normalizedQuery)
      )
      .slice(0, 10); // 최대 10개만 표시

    setSearchResults(matchingCompanies);
    setShowDropdown(matchingCompanies.length > 0);

    // ⭐ 검색 결과가 있으면 첫 번째 항목을 자동으로 포커스
    if (matchingCompanies.length > 0) {
      setFocusedIndex(0);
    } else {
      setFocusedIndex(-1);
    }
  };

  // 회사 선택 함수
  const handleSelectCompany = (company: CompanyInfo, autoSearch: boolean = false) => {
    console.log('🏢 회사 선택됨:', company.companyName, autoSearch ? '(자동분석)' : '(수동선택)');
    setSearchTerm(company.companyName);
    onCompanySelect(company, autoSearch); // ⭐ autoSearch 플래그 전달
    setShowDropdown(false);
    setFocusedIndex(-1);
  };

  // ⭐ 개선된 키보드 네비게이션 처리
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || searchResults.length === 0) return;

    console.log('🎹 키 입력:', e.key, '현재 focusedIndex:', focusedIndex);

    // 아래 화살표
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => {
        const nextIndex = prev < searchResults.length - 1 ? prev + 1 : 0; // ⭐ 순환 네비게이션
        console.log('⬇️ 아래로 이동:', prev, '→', nextIndex);
        return nextIndex;
      });
    }
    // 위 화살표
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => {
        const nextIndex = prev > 0 ? prev - 1 : searchResults.length - 1; // ⭐ 순환 네비게이션
        console.log('⬆️ 위로 이동:', prev, '→', nextIndex);
        return nextIndex;
      });
    }
    // 엔터
    else if (e.key === 'Enter') {
      e.preventDefault();
      console.log('⏎ 엔터 입력, focusedIndex:', focusedIndex);

      if (focusedIndex >= 0 && focusedIndex < searchResults.length) {
        const selectedCompany = searchResults[focusedIndex];
        console.log('✅ 회사 선택 (엔터키):', selectedCompany.companyName);
        handleSelectCompany(selectedCompany, true); // ⭐ 엔터키는 자동분석 true
      } else {
        console.log('❌ 선택할 수 있는 항목이 없음');
      }
    }
    // ESC
    else if (e.key === 'Escape') {
      console.log('🚪 ESC - 드롭다운 닫기');
      setShowDropdown(false);
      setFocusedIndex(-1);
    }
    // ⭐ Tab 키 지원 추가
    else if (e.key === 'Tab') {
      if (showDropdown && searchResults.length > 0) {
        e.preventDefault(); // Tab의 기본 동작 방지
        setFocusedIndex((prev) => {
          const nextIndex = prev < searchResults.length - 1 ? prev + 1 : 0;
          console.log('⭾ Tab으로 이동:', prev, '→', nextIndex);
          return nextIndex;
        });
      }
    }
  };

  // 외부 클릭 감지하여 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  // ⭐ focusedIndex 변화 로깅 (디버깅용)
  useEffect(() => {
    console.log('🎯 focusedIndex 변경:', focusedIndex);
  }, [focusedIndex]);

  // ⭐ 키보드 네비게이션 시 자동 스크롤 기능
  useEffect(() => {
    if (focusedIndex >= 0 && dropdownRef.current && searchResults.length > 0) {
      // 선택된 항목의 DOM 요소 찾기
      const focusedElement = dropdownRef.current.children[focusedIndex] as HTMLElement;

      if (focusedElement) {
        // 부드러운 스크롤로 해당 항목을 보이게 하기
        focusedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest', // 항목이 보이는 범위 내에서 최소한으로 스크롤
          inline: 'nearest',
        });

        console.log('📜 자동 스크롤:', focusedIndex, '번째 항목으로 이동');
      }
    }
  }, [focusedIndex, searchResults.length]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative group">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search
            size={18}
            className="text-gray-400 group-hover:text-emerald-500 transition-colors duration-300"
          />
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchTerm && searchResults.length > 0) {
              setShowDropdown(true);
              // ⭐ 포커스 시 첫 번째 항목 선택
              setFocusedIndex(0);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 shadow-sm focus:shadow-md bg-white"
          autoComplete="off"
        />

        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSearchResults([]);
              setShowDropdown(false);
              setFocusedIndex(-1);
            }}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-300"
          >
            <X size={18} className="hover:scale-110 transition-transform duration-200" />
          </button>
        )}

        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="h-5 w-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
          </div>
        )}
      </div>

      {showDropdown && searchResults.length > 0 && (
        <div
          ref={dropdownRef} // ⭐ 자동 스크롤을 위한 ref 추가
          className="absolute z-10 w-full bg-white border border-gray-200 rounded-xl mt-1 max-h-60 overflow-y-auto shadow-lg animate-fadeIn"
        >
          {searchResults.map((company, index) => (
            <div
              key={company.stockCode}
              className={`p-3 cursor-pointer transition-colors duration-200 ${
                focusedIndex === index
                  ? 'bg-emerald-50 border-l-4 border-emerald-500' // ⭐ 더 명확한 하이라이트
                  : 'hover:bg-gray-50 border-l-4 border-transparent'
              }`}
              onClick={() => handleSelectCompany(company)} // ⭐ 마우스 클릭은 자동분석 false (기본값)
              onMouseEnter={() => setFocusedIndex(index)} // ⭐ 마우스 호버 시에도 포커스 업데이트
            >
              <div className="font-medium text-slate-900 flex items-center">
                <span className="mr-2 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                  {company.stockCode}
                </span>
                {company.companyName}
                {/* ⭐ 포커스된 항목에 화살표 표시 */}
                {focusedIndex === index && (
                  <span className="ml-auto text-emerald-500">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                    </svg>
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {company.industry || '산업군 정보 없음'}
              </div>
            </div>
          ))}
        </div>
      )}

      {showDropdown && searchResults.length === 0 && !isLoading && (
        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-xl mt-1 p-4 shadow-lg text-center animate-fadeIn">
          <div className="text-gray-500 flex flex-col items-center">
            <Search size={24} className="text-gray-300 mb-2" />
            <p>검색 결과가 없습니다</p>
            <p className="text-xs text-gray-400 mt-1">다른 키워드로 검색해보세요</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySearchInput;
