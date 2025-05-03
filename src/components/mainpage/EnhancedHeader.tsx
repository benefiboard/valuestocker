'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart4,
  CheckSquare,
  Menu,
  X,
  Home,
  Info,
  ChevronDown,
  DollarSign,
  Settings,
} from 'lucide-react';

// Define interfaces for our navigation items
interface NavSubItem {
  name: string;
  href: string;
  icon?: React.ReactNode;
}

interface NavItem {
  name: string;
  href?: string;
  dropdown?: string;
  icon?: React.ReactNode;
  items?: NavSubItem[];
}

const EnhancedHeader: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleDropdown = (dropdown: string) => {
    if (activeDropdown === dropdown) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(dropdown);
    }
  };

  const closeDropdowns = () => {
    setActiveDropdown(null);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const navigations: NavItem[] = [
    { name: '홈', href: '/', icon: <Home className="w-5 h-5" /> },
    {
      name: '가치투자 도구',
      dropdown: 'tools',
      icon: <BarChart4 className="w-5 h-5" />,
      items: [
        { name: '체크리스트', href: '/checklist', icon: <CheckSquare className="w-4 h-4" /> },
        { name: '적정가 계산기', href: '/fairprice', icon: <DollarSign className="w-4 h-4" /> },
      ],
    },
    {
      name: '투자 전략',
      dropdown: 'strategies',
      icon: <Settings className="w-5 h-5" />,
      items: [
        { name: '벤자민 그레이엄 전략', href: '/graham' },
        { name: '고배당 가치주 전략', href: '/flavor' },
        { name: '비즈니스 퀄리티 종목', href: '/quality' },
      ],
    },
    { name: '정보', href: '/about', icon: <Info className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* 모바일 메뉴 오버레이 */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* 헤더 */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white bg-opacity-80 backdrop-blur-md shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center py-4 md:py-6">
            {/* 로고 */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <div
                  className={`font-bold text-2xl transition-colors duration-300 ${
                    isScrolled ? 'text-gray-900' : 'text-gray-900'
                  }`}
                >
                  ValueTargeter
                </div>
              </Link>
            </div>

            {/* 데스크탑 네비게이션 */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigations.map((item) => (
                <div key={item.name} className="relative">
                  {item.dropdown ? (
                    <div className="relative">
                      <button
                        className={`flex items-center text-sm font-medium transition-colors duration-200 ${
                          isScrolled
                            ? 'text-gray-700 hover:text-gray-900'
                            : 'text-gray-800 hover:text-black'
                        }`}
                        onClick={() => item.dropdown && toggleDropdown(item.dropdown)}
                      >
                        {item.icon && <span className="mr-1.5">{item.icon}</span>}
                        {item.name}
                        <ChevronDown
                          className={`ml-1 w-4 h-4 transition-transform duration-200 ${
                            activeDropdown === item.dropdown ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {activeDropdown === item.dropdown && item.items && (
                        <div
                          className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg py-2 border border-gray-100 z-50"
                          onMouseLeave={closeDropdowns}
                        >
                          {item.items.map((subItem) => (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              {subItem.icon && <span className="mr-2.5">{subItem.icon}</span>}
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href || '/'}
                      className={`flex items-center text-sm font-medium transition-colors duration-200 ${
                        isScrolled
                          ? 'text-gray-700 hover:text-gray-900'
                          : 'text-gray-800 hover:text-black'
                      }`}
                    >
                      {item.icon && <span className="mr-1.5">{item.icon}</span>}
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            {/* CTA 버튼 - 데스크탑 */}
            <div className="hidden md:flex items-center">
              <Link
                href="/checklist"
                className={`px-4 py-2 rounded-lg text-sm font-medium mr-2 transition-colors duration-200 ${
                  isScrolled
                    ? 'text-gray-700 hover:text-gray-900 border border-gray-300 hover:border-gray-400'
                    : 'text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-400'
                }`}
              >
                체크리스트
              </Link>
              <Link
                href="/fairprice"
                className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors duration-200"
              >
                적정가 계산하기
              </Link>
            </div>

            {/* 모바일 메뉴 버튼 */}
            <div className="md:hidden">
              <button
                className={`p-2 rounded-md transition-colors ${
                  isScrolled
                    ? 'text-gray-700 hover:text-gray-900'
                    : 'text-gray-800 hover:text-black'
                }`}
                onClick={toggleMobileMenu}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 모바일 사이드 메뉴 */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-xl z-50 transition-transform duration-300 ease-in-out transform ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="font-bold text-lg">ValueTargeter</div>
              <button
                className="p-1.5 rounded-md text-gray-700 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            {navigations.map((item) => (
              <div key={item.name} className="px-4">
                {item.dropdown ? (
                  <div>
                    <button
                      className="flex items-center w-full py-3 text-sm font-medium text-gray-700 hover:text-gray-900"
                      onClick={() => item.dropdown && toggleDropdown(item.dropdown)}
                    >
                      {item.icon && <span className="mr-3">{item.icon}</span>}
                      {item.name}
                      <ChevronDown
                        className={`ml-auto w-4 h-4 transition-transform duration-200 ${
                          activeDropdown === item.dropdown ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {activeDropdown === item.dropdown && item.items && (
                      <div className="pl-8 py-2 space-y-2">
                        {item.items.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className="flex items-center py-2 text-sm text-gray-600 hover:text-gray-900"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {subItem.icon && <span className="mr-2">{subItem.icon}</span>}
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href || '/'}
                    className="flex items-center py-3 text-sm font-medium text-gray-700 hover:text-gray-900"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.icon && <span className="mr-3">{item.icon}</span>}
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <Link
              href="/fairprice"
              className="block w-full py-2.5 bg-black text-white rounded-lg text-sm font-medium text-center hover:bg-gray-800 transition-colors duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              적정가 계산하기
            </Link>
          </div>
        </div>
      </div>

      {/* 헤더 공간 확보 */}
      <div className="h-16 md:h-20"></div>
    </>
  );
};

export default EnhancedHeader;
