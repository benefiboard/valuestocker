import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: '블로그 관리',
  description: '블로그 게시물을 관리합니다.',
  robots: 'noindex, nofollow',
};

export default function AdminBlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-blog-layout">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-emerald-700 mr-6"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            홈으로
          </Link>

          <h1 className="text-2xl font-bold text-gray-800">블로그 관리자</h1>
        </div>
      </div>

      {children}
    </div>
  );
}
