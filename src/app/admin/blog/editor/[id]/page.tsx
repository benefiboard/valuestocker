'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import BlogEditor from '@/components/admin/BlogEditor';
import { Loader2, AlertCircle } from 'lucide-react';

interface EditBlogPageProps {
  params: {
    id: string;
  };
}

export default function EditBlogPage({ params }: EditBlogPageProps) {
  const { id } = params;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [postData, setPostData] = useState<{
    id: string;
    title: string;
    content: string;
    image: string | null;
    slug: string;
    status: 'draft' | 'published';
  } | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const authStatus = sessionStorage.getItem('blog_admin_auth');
      if (authStatus !== 'authenticated') {
        router.push('/admin/blog');
      } else {
        fetchPost();
      }
    };

    checkAuth();
  }, [id, router]);

  const fetchPost = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.from('blog_posts').select('*').eq('id', id).single();

      if (error) throw error;

      if (!data) {
        throw new Error('게시물을 찾을 수 없습니다');
      }

      setPostData(data);
    } catch (err: any) {
      setError(err.message || '게시물을 불러오는 중 오류가 발생했습니다');
      console.error('블로그 게시물 로딩 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">게시물을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !postData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
          <div className="flex items-start text-red-600 mb-4">
            <AlertCircle className="h-6 w-6 mr-2 flex-shrink-0" />
            <div>
              <h2 className="font-bold text-lg">오류가 발생했습니다</h2>
              <p className="text-red-500 mt-1">{error || '게시물을 찾을 수 없습니다'}</p>
            </div>
          </div>

          <button
            onClick={() => router.push('/admin/blog')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-md transition-colors"
          >
            관리 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <header className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">게시물 수정</h1>
          <p className="text-gray-600 mt-2">블로그 게시물을 수정하고 업데이트하세요.</p>
        </header>

        <BlogEditor
          initialData={{
            id: postData.id,
            title: postData.title,
            content: postData.content,
            image: postData.image || '',
            slug: postData.slug,
            status: postData.status,
          }}
          mode="edit"
        />
      </div>
    </main>
  );
}
