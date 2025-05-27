'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function GlobalAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const entryTimeRef = useRef<Date | undefined>(undefined);
  const currentRecordIdRef = useRef<string | undefined>(undefined);
  const isInitialLoadRef = useRef(true);

  // 익명 사용자 ID 생성/가져오기
  const getVisitorId = (): string => {
    if (typeof window === 'undefined') return '';

    let visitorId = localStorage.getItem('visitor_id');
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem('visitor_id', visitorId);
    }
    return visitorId;
  };

  // Referrer 도메인 추출
  const getReferrerDomain = (referrer: string): string => {
    if (!referrer) return 'direct';
    try {
      const url = new URL(referrer);
      return url.hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  };

  // 회사명 추출 함수 (URL이나 localStorage에서)
  const getCompanyInfo = () => {
    const stockCode = searchParams.get('stockCode');
    let companyName = null;

    // localStorage에서 최근 검색한 회사 정보 가져오기 (옵션)
    if (stockCode && typeof window !== 'undefined') {
      try {
        const recentSearch = localStorage.getItem(`company_${stockCode}`);
        if (recentSearch) {
          companyName = JSON.parse(recentSearch).companyName;
        }
      } catch {
        // localStorage 에러는 무시
      }
    }

    return { stockCode, companyName };
  };

  // 페이지 이탈 기록
  const trackPageExit = async () => {
    if (!currentRecordIdRef.current || !entryTimeRef.current) return;

    const exitTime = new Date();
    const duration = Math.round((exitTime.getTime() - entryTimeRef.current.getTime()) / 1000);

    try {
      await supabase
        .from('page_analytics')
        .update({
          exited_at: exitTime.toISOString(),
          session_duration: duration,
        })
        .eq('id', currentRecordIdRef.current);
    } catch (error) {
      console.warn('Analytics exit tracking failed:', error);
    }
  };

  // 페이지 진입 기록
  const trackPageEntry = async () => {
    if (typeof window === 'undefined') return;

    // 이전 페이지 이탈 처리
    if (currentRecordIdRef.current) {
      await trackPageExit();
    }

    const visitorId = getVisitorId();
    const referrer = isInitialLoadRef.current ? document.referrer || '' : 'internal';
    const referrerDomain = getReferrerDomain(referrer);
    const { stockCode, companyName } = getCompanyInfo();

    // 전체 URL 경로 생성
    const fullPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');

    entryTimeRef.current = new Date();
    isInitialLoadRef.current = false;

    try {
      const { data: record, error } = await supabase
        .from('page_analytics')
        .insert({
          visitor_id: visitorId,
          page_path: fullPath,
          company_name: companyName || null,
          stock_code: stockCode || null,
          referrer: referrer || null,
          referrer_domain: referrerDomain,
        })
        .select('id')
        .single();

      if (record && !error) {
        currentRecordIdRef.current = record.id;
      }
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  };

  // pathname이나 searchParams가 변경될 때마다 추적
  useEffect(() => {
    trackPageEntry();
  }, [pathname, searchParams]);

  // 컴포넌트 마운트시 이벤트 리스너 등록
  useEffect(() => {
    const handleBeforeUnload = () => {
      trackPageExit();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        trackPageExit();
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 클린업
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      trackPageExit();
    };
  }, []);

  return null; // UI 렌더링 없음
}
