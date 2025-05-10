import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';
import Navigation from '@/components/Navigation';

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
        <Navigation />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
