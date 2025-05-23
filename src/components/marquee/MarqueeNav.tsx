'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface MarqueeItem {
  href: string;
  text: string;
}

interface MarqueeNavProps {
  items: MarqueeItem[];
  speed?: number; // 애니메이션 지속 시간 (초)
  className?: string;
  pauseOnHover?: boolean;
  bgColor?: string;
}

export default function MarqueeNav({
  items,
  speed = 90,
  className = '',
  pauseOnHover = true,
  bgColor = 'bg-gray-50',
}: MarqueeNavProps) {
  // 클라이언트 사이드에서만 랜덤 ID 생성
  const [uniqueId, setUniqueId] = useState('');
  const [isClient, setIsClient] = useState(false);

  // 클라이언트 사이드에서만 실행
  useEffect(() => {
    setIsClient(true);
    setUniqueId(`marquee-${Math.random().toString(36).substr(2, 9)}`);
  }, []);

  // 동적으로 스타일 추가
  useEffect(() => {
    if (!uniqueId || !isClient) return;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes ${uniqueId}-scroll {
        0% { transform: translateX(0%); }
        100% { transform: translateX(-50%); }
      }
      
      .${uniqueId}-wrapper {
        animation: ${uniqueId}-scroll ${speed}s linear infinite;
      }
      
      ${
        pauseOnHover
          ? `.${uniqueId}-container:hover .${uniqueId}-wrapper { animation-play-state: paused; }`
          : ''
      }
    `;

    document.head.appendChild(style);

    // 클래스 추가
    const container = document.querySelector(`.marquee-nav-${uniqueId}`);
    if (container) {
      container.classList.add(`${uniqueId}-container`);
      const wrapper = container.querySelector('.marquee-wrapper');
      if (wrapper) {
        wrapper.classList.add(`${uniqueId}-wrapper`);
      }
    }

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [uniqueId, speed, pauseOnHover, isClient]);

  // 서버 사이드 렌더링 시에는 기본 스타일로 렌더링
  if (!isClient) {
    return (
      <div className={`${className}`}>
        <div className={`${bgColor} flex items-center justify-center h-10 overflow-hidden`}>
          <div className="flex items-center whitespace-nowrap">
            {items.map((item, index) => (
              <Link
                key={`ssr-${index}`}
                href={item.href}
                className="text-gray-400 text-xs px-4 transition-colors duration-300 hover:text-emerald-500"
              >
                {item.text}
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div
        className={`marquee-nav-${uniqueId} ${bgColor} flex items-center justify-center h-10 overflow-hidden`}
      >
        <div className="marquee-wrapper flex items-center whitespace-nowrap">
          {/* 첫 번째 세트 */}
          {items.map((item, index) => (
            <Link
              key={`first-${index}`}
              href={item.href}
              className="text-gray-400 text-xs px-4 transition-colors duration-300 hover:text-emerald-500"
            >
              {item.text}
            </Link>
          ))}

          {/* 두 번째 세트 (무한 스크롤을 위한 복제) */}
          {items.map((item, index) => (
            <Link
              key={`second-${index}`}
              href={item.href}
              className="text-gray-400 text-xs px-4 transition-colors duration-300 hover:text-emerald-500"
            >
              {item.text}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
