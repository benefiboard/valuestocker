import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';
import { Suspense } from 'react';
import Navigation from '@/components/Navigation';
import GlobalAnalytics from '@/components/GlobalAnalytics'; // 🔥 추가
import Script from 'next/script'; // 🔥 Meta Pixel을 위해 추가

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

export const metadata: Metadata = {
  title: '주식 적정가 계산기',
  description: '다양한 모델을 활용한 주식 적정가 분석 도구',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKr.className} antialiased tracking-tighter`}>
        {/* 🔥 Meta Pixel Code 시작 */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '2495195013999469');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=2495195013999469&ev=PageView&noscript=1"
          />
        </noscript>
        {/* 🔥 Meta Pixel Code 끝 */}

        <Suspense
          fallback={
            <nav className="bg-white shadow-sm border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                  <div className="flex items-center">
                    <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </nav>
          }
        >
          <Navigation />
        </Suspense>

        {/* 🔥 전역 Analytics 추가 - 모든 페이지 자동 추적 */}
        <Suspense fallback={null}>
          <GlobalAnalytics />
        </Suspense>

        {children}
        <Analytics />
      </body>
    </html>
  );
}
