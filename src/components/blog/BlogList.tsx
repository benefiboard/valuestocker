'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { ArrowRight, Calendar, Clock, Tag } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  image: string | null;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export default function BlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setPosts(data || []);
      } catch (err: any) {
        setError(err.message || '게시물을 불러오는 중 오류가 발생했습니다');
        console.error('블로그 게시물 로딩 오류:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // 게시물 내용에서 요약 추출 (첫 100자)
  const getExcerpt = (content: string) => {
    // HTML 태그 제거
    const textOnly = content.replace(/<[^>]*>/g, '');
    return textOnly.substring(0, 150) + (textOnly.length > 150 ? '...' : '');
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 읽는 시간 계산 (평균 읽기 속도: 분당 300단어)
  const getReadingTime = (content: string) => {
    const textOnly = content.replace(/<[^>]*>/g, '');
    const wordCount = textOnly.trim().split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 300);
    return readingTime;
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4">
        <div className="animate-pulse space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-64 bg-gray-200"></div>
              <div className="p-6">
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4">
        <div className="bg-red-50 p-4 rounded-md text-red-700">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">아직 게시된 글이 없습니다</h2>
        <p className="text-gray-600 mb-8">곧 새로운 글로 찾아뵙겠습니다!</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {posts.map((post) => (
          <article
            key={post.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            {post.image && (
              <Link href={`/blog/${post.slug}`}>
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </Link>
            )}
            <div className="p-6">
              <div className="flex items-center text-xs text-gray-500 mb-3">
                <Calendar className="h-3 w-3 mr-1" />
                <span>{formatDate(post.created_at)}</span>
                <span className="mx-2">•</span>
                <Clock className="h-3 w-3 mr-1" />
                <span>{getReadingTime(post.content)}분 읽기</span>
              </div>

              <Link href={`/blog/${post.slug}`}>
                <h2 className="text-xl font-bold text-gray-800 mb-3 hover:text-emerald-700 transition-colors">
                  {post.title}
                </h2>
              </Link>

              <p className="text-gray-600 mb-4">{getExcerpt(post.content)}</p>

              <Link
                href={`/blog/${post.slug}`}
                className="inline-flex items-center text-emerald-600 hover:text-emerald-800 font-medium"
              >
                계속 읽기
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
