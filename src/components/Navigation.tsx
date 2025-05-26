'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, ChevronLeft, Home, Menu, X } from 'lucide-react';

// 타입 정의
interface NavItem {
  label: string;
  href: string;
}

interface DropdownProps {
  title: string;
  items: NavItem[];
  isOpen: boolean;
  toggle: () => void;
  closeMenu: () => void;
}

// 데스크탑용 드롭다운 컴포넌트 - 클릭 방식으로 수정
const Dropdown = ({ title, items, isOpen, toggle, closeMenu }: DropdownProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && isOpen) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeMenu]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center text-gray-600 hover:text-emerald-700 transition-colors py-2"
        onClick={toggle}
        aria-expanded={isOpen}
      >
        {title}
        <ChevronDown
          className={`ml-1 h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
          {items.map((item: NavItem, index: number) => (
            <Link
              key={index}
              href={item.href}
              className="block px-4 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              onClick={closeMenu}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

// 네비게이션 컴포넌트
const Navigation = () => {
  // 드롭다운 상태 관리
  const [strategyDropdown, setStrategyDropdown] = useState(false);
  const [mastersStrategyDropdown, setMastersStrategyDropdown] = useState(false);
  const [practicalStrategyDropdown, setPracticalStrategyDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 현재 경로 확인
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === '/';
  const searchParams = useSearchParams();

  // 모든 드롭다운 닫기
  const closeAllDropdowns = () => {
    setStrategyDropdown(false);
    setMastersStrategyDropdown(false);
    setPracticalStrategyDropdown(false);
  };

  // 전략 드롭다운 토글
  const toggleStrategyDropdown = () => {
    setMastersStrategyDropdown(false);
    setPracticalStrategyDropdown(false);
    setStrategyDropdown(!strategyDropdown);
  };

  // 대가들의 전략 드롭다운 토글
  const toggleMastersStrategyDropdown = () => {
    setStrategyDropdown(false);
    setPracticalStrategyDropdown(false);
    setMastersStrategyDropdown(!mastersStrategyDropdown);
  };

  // 실용투자 전략 드롭다운 토글
  const togglePracticalStrategyDropdown = () => {
    setStrategyDropdown(false);
    setMastersStrategyDropdown(false);
    setPracticalStrategyDropdown(!practicalStrategyDropdown);
  };

  // 경로 변경 시 모든 메뉴 닫기
  useEffect(() => {
    setMobileMenuOpen(false);
    closeAllDropdowns();
  }, [pathname]);

  // 투자 전략 드롭다운 아이템
  const strategyItems: NavItem[] = [
    { label: '적정가 계산', href: '/fairprice' },
    { label: '체크리스트', href: '/checklist' },
    { label: '수익가치 계산', href: '/profit-calculator' },
  ];

  // 대가들의 전략 드롭다운 아이템
  const mastersStrategyItems: NavItem[] = [
    { label: '벤자민 그레이엄 전략', href: '/graham' },
    { label: '피터 린치 PEG 전략', href: '/lynch' },
    { label: '하워드 막스 내재가치', href: '/howard' },
  ];

  // 실용투자 전략 드롭다운 아이템
  const practicalStrategyItems: NavItem[] = [
    { label: '고배당 가치주 전략', href: '/flavor' },
    { label: '비즈니스 퀄리티 전략', href: '/quality' },
    { label: 'S-RIM 내재가치 전략', href: '/s-rim' },
    { label: '수익가치 전략', href: '/profit' },
  ];

  // 모든 네비게이션 아이템 합치기
  const allNavigationItems = [...strategyItems, ...mastersStrategyItems, ...practicalStrategyItems];

  // 현재 페이지에 해당하는 label 찾기
  const currentPageLabel =
    allNavigationItems.find((item) => item.href === pathname)?.label || 'ValueTargeter';

  // 이전 페이지로 이동
  const handleGoBack = () => {
    router.back();
  };

  return (
    <>
      <nav className="p-4  border-b border-gray-100 flex items-center justify-between sticky top-0 z-50 bg-white/90 backdrop-blur-md">
        {/* 로고 - 클릭 시 홈으로 이동 */}
        {/* <Link
          href="/"
          className=" font-bold text-2xl text-emerald-700 hover:text-emerald-800 transition-colors"
        >
          ValueTargeter
        </Link> */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleGoBack}
            className="hover:bg-gray-100 rounded-md p-1 transition-colors"
          >
            <ChevronLeft />
          </button>
          <p className=" sm:text-xl font-semibold text-gray-600">{currentPageLabel}</p>
        </div>

        {/* 데스크탑 메뉴 */}
        <div className="hidden xl:flex items-center space-x-4">
          <Dropdown
            title="투자 지표"
            items={strategyItems}
            isOpen={strategyDropdown}
            toggle={toggleStrategyDropdown}
            closeMenu={closeAllDropdowns}
          />
          <Dropdown
            title="대가들의 전략"
            items={mastersStrategyItems}
            isOpen={mastersStrategyDropdown}
            toggle={toggleMastersStrategyDropdown}
            closeMenu={closeAllDropdowns}
          />
          <Dropdown
            title="실용투자 전략"
            items={practicalStrategyItems}
            isOpen={practicalStrategyDropdown}
            toggle={togglePracticalStrategyDropdown}
            closeMenu={closeAllDropdowns}
          />
          <Link
            href="/info"
            className="text-gray-600 hover:text-emerald-700 transition-colors py-2"
          >
            서비스 소개
          </Link>
          {/* <Link
            href="/fairprice"
            className="text-gray-600 hover:text-emerald-700 transition-colors py-2"
          >
            적정가 계산
          </Link> */}
          <p>|</p>
          <Link href="/" className="text-gray-300 hover:text-emerald-700 transition-colors py-2">
            메인페이지
            {/* <Home /> */}
          </Link>
        </div>

        {/* 모바일 햄버거 메뉴 버튼 */}
        <div className="flex items-center gap-2 xl:hidden">
          {/* 메인 페이지에서만 시작하기 버튼 표시 */}

          <Link href="/">
            <Home />
          </Link>

          {/* 햄버거 메뉴 아이콘 */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-gray-600 hover:text-emerald-700 transition-colors"
            aria-label={mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* 데스크탑에서 메인 페이지일 때만 시작하기 버튼 표시 */}
        {/* {isHomePage && (
          <div className="hidden xl:block">
            <Link href="/fairprice">
              <button className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm hover:shadow">
                시작하기
              </button>
            </Link>
          </div>
        )} */}
      </nav>

      {/* 모바일 드롭다운 메뉴 - 네비게이션 바 아래에 표시 */}
      {mobileMenuOpen && (
        <div
          className={`${
            mobileMenuOpen ? 'block' : 'hidden'
          } xl:hidden bg-white border-b border-gray-200 shadow-md`}
        >
          {/* 투자 전략 메뉴 그룹 */}
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-medium text-gray-800 mb-3">투자 지표</h3>
            <div className="space-y-3 pl-3">
              {strategyItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="block text-gray-600 hover:text-emerald-700 py-1 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* 대가들의 전략 메뉴 그룹 */}
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-medium text-gray-800 mb-3">대가들의 전략</h3>
            <div className="grid grid-cols-1 gap-2 pl-3">
              {mastersStrategyItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="block text-gray-600 hover:text-emerald-700 py-1 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* 실용투자 전략 메뉴 그룹 */}
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-medium text-gray-800 mb-3">실용투자 전략</h3>
            <div className="grid grid-cols-1 gap-2 pl-3">
              {practicalStrategyItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="block text-gray-600 hover:text-emerald-700 py-1 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* 기타 메뉴 항목 */}
          <div className="px-6 py-4 flex flex-col space-y-3">
            <Link
              href="/info"
              className="text-gray-800 hover:text-emerald-700 font-medium transition-colors"
            >
              서비스 소개
            </Link>

            {/* <Link
              href="/fairprice"
              className="text-gray-800 hover:text-emerald-700 font-medium transition-colors"
            >
              적정가 계산
            </Link> */}
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation;
