'use client'; // 클라이언트 컴포넌트로 지정

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation'; // 경로 확인을 위한 hook
import Link from 'next/link';
import { BarChart4, CheckSquare, ChevronDown } from 'lucide-react';

// 타입 정의
interface NavItem {
  label: string;
  href: string;
}

interface DropdownProps {
  title: string;
  items: NavItem[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

// 드롭다운 컴포넌트
const Dropdown = ({ title, items, isOpen, setIsOpen }: DropdownProps) => {
  return (
    <div className="relative">
      <button
        className="flex items-center text-gray-600 hover:text-emerald-700 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {title}
        <ChevronDown className="ml-1 h-4 w-4" />
      </button>
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          {items.map((item: NavItem, index: number) => (
            <Link
              key={index}
              href={item.href}
              className="block px-4 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
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
  const [toolsDropdown, setToolsDropdown] = useState(false);

  // 현재 경로 확인
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  // 투자 전략 드롭다운 아이템
  const strategyItems: NavItem[] = [
    { label: '적정가 계산', href: '/fairprice' },
    { label: '체크리스트', href: '/checklist' },
  ];

  // 분석 도구 드롭다운 아이템
  const toolsItems: NavItem[] = [
    { label: '벤자민 그레이엄 전략', href: '/graham' },
    { label: '고배당 가치주 전략', href: '/flavor' },
    { label: 'S-RIM 내재가치 전략', href: '/s-rim' },
    { label: '비즈니스 퀄리티 전략', href: '/quality' },
    { label: '피터 린치 PEG 전략', href: '/lynch' },
    { label: '하워드 막스 내재가치', href: '/howard' },
  ];

  return (
    <nav className="py-5 px-6 md:px-16 border-b border-gray-100 flex items-center justify-between sticky top-0 z-50 bg-white/90 backdrop-blur-md">
      <div className="font-bold text-2xl text-emerald-700">ValueTargeter</div>
      <div className="hidden md:flex items-center space-x-10">
        <div
          onMouseEnter={() => setStrategyDropdown(true)}
          onMouseLeave={() => setStrategyDropdown(false)}
        >
          <Dropdown
            title="투자 전략"
            items={strategyItems}
            isOpen={strategyDropdown}
            setIsOpen={setStrategyDropdown}
          />
        </div>
        <div
          onMouseEnter={() => setToolsDropdown(true)}
          onMouseLeave={() => setToolsDropdown(false)}
        >
          <Dropdown
            title="분석 도구"
            items={toolsItems}
            isOpen={toolsDropdown}
            setIsOpen={setToolsDropdown}
          />
        </div>
        <Link href="/checklist" className="text-gray-600 hover:text-emerald-700 transition-colors">
          체크리스트
        </Link>
        <Link href="/fairprice" className="text-gray-600 hover:text-emerald-700 transition-colors">
          적정가 계산
        </Link>
      </div>

      {/* 시작하기 버튼 - 메인 페이지(/)에서만 표시 */}
      {isHomePage && (
        <Link href="/fairprice">
          <button className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm hover:shadow">
            시작하기
          </button>
        </Link>
      )}
    </nav>
  );
};

export default Navigation;
