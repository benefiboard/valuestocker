import { Metadata } from 'next';
import BlogEditor from '@/components/admin/BlogEditor';

export const metadata: Metadata = {
  title: '새 글 작성 | 블로그 관리',
  description: '새로운 블로그 게시물을 작성합니다.',
};

export default function NewBlogPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <header className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">새 글 작성</h1>
          <p className="text-gray-600 mt-2">새로운 블로그 게시물을 작성하고 발행하세요.</p>
        </header>

        <BlogEditor mode="create" />
      </div>
    </main>
  );
}
