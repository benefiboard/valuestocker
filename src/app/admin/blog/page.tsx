'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Edit2, Trash2, Eye, AlertCircle, Check, X, ExternalLink } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const router = useRouter();

  // 초기 인증 확인
  useEffect(() => {
    const checkAuth = () => {
      const authStatus = sessionStorage.getItem('blog_admin_auth');
      if (authStatus === 'authenticated') {
        setIsAuthenticated(true);
        fetchPosts();
      }
    };

    checkAuth();
  }, []);

  // 게시물 가져오기
  const fetchPosts = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, status, created_at, updated_at')
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

  // 인증 처리
  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();

    // 실제 환경에서는 서버 측에서 비밀번호 검증을 수행해야 합니다.
    // 여기서는 간단한 예시로 클라이언트 측 비밀번호를 사용합니다.
    // 참고: 실제 서비스에서는 이 방식은 안전하지 않습니다.
    const adminPassword = process.env.NEXT_PUBLIC_BLOG_ADMIN_PASSWORD;

    if (password === adminPassword) {
      sessionStorage.setItem('blog_admin_auth', 'authenticated');
      setIsAuthenticated(true);
      fetchPosts();
    } else {
      setPasswordError('비밀번호가 올바르지 않습니다');
    }
  };

  // 게시물 상태 변경 (발행/초안)
  const handleStatusChange = async (id: string, newStatus: 'draft' | 'published') => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // 성공 시 목록 새로고침
      fetchPosts();
    } catch (err: any) {
      setError(err.message || '상태 변경 중 오류가 발생했습니다');
    }
  };

  // 게시물 삭제
  const handleDelete = async (id: string) => {
    if (!window.confirm('정말로 이 게시물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);

      if (error) throw error;

      // 성공 시 목록 새로고침
      fetchPosts();
    } catch (err: any) {
      setError(err.message || '삭제 중 오류가 발생했습니다');
    }
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

  // 인증 화면
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-10 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">관리자 인증</h1>

        <form onSubmit={handleAuthenticate}>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="관리자 비밀번호를 입력하세요"
            />
          </div>

          {passwordError && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {passwordError}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2 px-4 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            인증하기
          </button>
        </form>
      </div>
    );
  }

  // 로딩 화면
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto my-10 p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">블로그 관리</h1>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-100"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-t border-gray-200 p-4">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 에러 화면
  if (error) {
    return (
      <div className="max-w-6xl mx-auto my-10 p-6">
        <div className="bg-red-50 p-4 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 font-medium">오류가 발생했습니다</p>
            <p className="text-red-600">{error}</p>
          </div>
        </div>

        <button
          onClick={fetchPosts}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto my-10 p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">블로그 관리</h1>

        <Link href="/admin/blog/editor">
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 flex items-center">
            <Plus className="mr-2 h-4 w-4" />새 글 작성
          </button>
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600 mb-4">아직 작성된 게시물이 없습니다.</p>
          <Link href="/admin/blog/editor">
            <button className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
              첫 게시물 작성하기
            </button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  제목
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작성일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  수정일
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {post.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        post.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {post.status === 'published' ? '발행됨' : '초안'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(post.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(post.updated_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {/* 상태 변경 버튼 */}
                      {post.status === 'draft' ? (
                        <button
                          onClick={() => handleStatusChange(post.id, 'published')}
                          className="text-emerald-600 hover:text-emerald-900 p-1 hover:bg-emerald-50 rounded"
                          title="발행하기"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(post.id, 'draft')}
                          className="text-yellow-600 hover:text-yellow-900 p-1 hover:bg-yellow-50 rounded"
                          title="초안으로 변경"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}

                      {/* 보기 버튼 */}
                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                        target="_blank"
                        title="보기"
                      >
                        <ExternalLink className="h-5 w-5" />
                      </Link>

                      {/* 수정 버튼 */}
                      <Link
                        href={`/admin/blog/editor/${post.id}`}
                        className="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded"
                        title="수정"
                      >
                        <Edit2 className="h-5 w-5" />
                      </Link>

                      {/* 삭제 버튼 */}
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                        title="삭제"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
