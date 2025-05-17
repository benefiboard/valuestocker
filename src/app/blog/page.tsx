import { Metadata } from 'next';
import BlogList from '@/components/blog/BlogList';

export const metadata: Metadata = {
  title: '블로그 | ValueTargeter',
  description: '투자 전략, 주식 분석, 금융 정보에 관한 인사이트를 제공하는 블로그입니다.',
  openGraph: {
    title: '블로그 | ValueTargeter',
    description: '투자 전략, 주식 분석, 금융 정보에 관한 인사이트를 제공하는 블로그입니다.',
    type: 'website',
    url: 'https://valuetargeter.com/blog',
  },
};

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <header className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            ValueTargeter 블로그
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            투자 전략, 주식 분석, 금융 시장 소식 및 다양한 인사이트를 확인하세요.
          </p>
        </header>

        <BlogList />
      </div>
    </main>
  );
}
