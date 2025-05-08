'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AdminLoginForm from './AdminLoginForm';
import PostFilters from './components/PostFilters';
import BulkActions from './components/BulkActions';
import PostList from './components/PostList';
import Pagination from './components/Pagination';

// 포스트 타입 정의
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

// 필터 타입 정의
export interface PostFilters {
  publishStatus: 'all' | 'published' | 'draft';
  searchQuery: string;
}

export default function AdminPage() {
  // 인증 상태
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // 포스트 및 필터 상태
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<PostFilters>({
    publishStatus: 'all',
    searchQuery: '',
  });

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPosts, setTotalPosts] = useState<number>(0);
  const [postsPerPage] = useState<number>(10);

  // 작업 상태 메시지
  const [actionMessage, setActionMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  // 초기 로드 및 인증 확인
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('blog_admin_token');
      if (token === 'valid_admin_token') {
        setIsAuthenticated(true);
      }
    };

    checkAuth();
  }, []);

  // 인증 성공 핸들러
  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    localStorage.removeItem('blog_admin_token');
    setIsAuthenticated(false);
  };

  // 포스트 로드 함수
  const loadPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      // 기본 쿼리
      let query = supabase.from('blog_posts').select('*', { count: 'exact' });

      // 발행 상태 필터 적용
      if (filters.publishStatus === 'published') {
        query = query.eq('is_published', true);
      } else if (filters.publishStatus === 'draft') {
        query = query.eq('is_published', false);
      }

      // 검색어 필터 적용
      if (filters.searchQuery) {
        query = query.ilike('title', `%${filters.searchQuery}%`);
      }

      // 페이지네이션 적용
      const from = (currentPage - 1) * postsPerPage;
      const to = from + postsPerPage - 1;

      // 정렬: 최신 수정일 순
      query = query.order('updated_at', { ascending: false }).range(from, to);

      // 쿼리 실행
      const { data, error, count } = await query;

      if (error) throw error;

      setPosts(data || []);
      setTotalPosts(count || 0);
    } catch (err: any) {
      console.error('포스트 로드 실패:', err);
      setError('포스트를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 필터 변경 시, 페이지 변경 시 포스트 로드
  useEffect(() => {
    if (isAuthenticated) {
      loadPosts();
    }
  }, [isAuthenticated, filters, currentPage]);

  // 포스트 상태 변경 핸들러
  const handleTogglePublish = async (postId: string, currentStatus: boolean) => {
    try {
      const now = new Date().toISOString();

      // 현재 상태의 반대로 변경
      const { error } = await supabase
        .from('blog_posts')
        .update({
          is_published: !currentStatus,
          published_at: !currentStatus ? now : null,
          updated_at: now,
        })
        .eq('id', postId);

      if (error) throw error;

      // 성공 메시지 표시
      setActionMessage({
        text: !currentStatus
          ? '게시물이 발행되었습니다.'
          : '게시물이 임시저장 상태로 변경되었습니다.',
        type: 'success',
      });

      // 포스트 목록 리로드
      loadPosts();
    } catch (err) {
      console.error('상태 변경 실패:', err);
      setActionMessage({
        text: '상태 변경에 실패했습니다.',
        type: 'error',
      });
    }
  };

  // 포스트 삭제 핸들러
  const handleDeletePost = async (postId: string) => {
    // 삭제 확인
    const confirmDelete = window.confirm(
      '정말로 이 게시물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
    );
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from('blog_posts').delete().eq('id', postId);

      if (error) throw error;

      // 성공 메시지 표시
      setActionMessage({
        text: '게시물이 삭제되었습니다.',
        type: 'success',
      });

      // 포스트 목록 리로드
      loadPosts();
    } catch (err) {
      console.error('삭제 실패:', err);
      setActionMessage({
        text: '삭제에 실패했습니다.',
        type: 'error',
      });
    }
  };

  // 선택된 포스트 일괄 발행/임시저장
  const handleBulkPublish = async (publish: boolean) => {
    if (selectedPostIds.length === 0) return;

    try {
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('blog_posts')
        .update({
          is_published: publish,
          published_at: publish ? now : null,
          updated_at: now,
        })
        .in('id', selectedPostIds);

      if (error) throw error;

      // 성공 메시지 표시
      setActionMessage({
        text: publish
          ? `${selectedPostIds.length}개의 게시물이 발행되었습니다.`
          : `${selectedPostIds.length}개의 게시물이 임시저장 상태로 변경되었습니다.`,
        type: 'success',
      });

      // 선택 초기화 및 포스트 목록 리로드
      setSelectedPostIds([]);
      loadPosts();
    } catch (err) {
      console.error('일괄 상태 변경 실패:', err);
      setActionMessage({
        text: '일괄 상태 변경에 실패했습니다.',
        type: 'error',
      });
    }
  };

  // 선택된 포스트 일괄 삭제
  const handleBulkDelete = async () => {
    if (selectedPostIds.length === 0) return;

    // 삭제 확인
    const confirmDelete = window.confirm(
      `정말로 선택한 ${selectedPostIds.length}개의 게시물을 모두 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
    );
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from('blog_posts').delete().in('id', selectedPostIds);

      if (error) throw error;

      // 성공 메시지 표시
      setActionMessage({
        text: `${selectedPostIds.length}개의 게시물이 삭제되었습니다.`,
        type: 'success',
      });

      // 선택 초기화 및 포스트 목록 리로드
      setSelectedPostIds([]);
      loadPosts();
    } catch (err) {
      console.error('일괄 삭제 실패:', err);
      setActionMessage({
        text: '일괄 삭제에 실패했습니다.',
        type: 'error',
      });
    }
  };

  // 선택 변경 핸들러
  const handleSelectionChange = (postIds: string[]) => {
    setSelectedPostIds(postIds);
  };

  // 필터 변경 핸들러
  const handleFilterChange = (newFilters: PostFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
  };

  // 페이지 변경 핸들러
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // 인증되지 않은 경우 로그인 폼 표시
  if (!isAuthenticated) {
    return <AdminLoginForm onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">블로그 관리</h1>

        <div className="flex gap-2">
          <a
            href="/blog/admin/editor"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            새 글 작성
          </a>

          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* 작업 메시지 표시 */}
      {actionMessage && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            actionMessage.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-600'
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      {/* 필터링 컴포넌트 */}
      <PostFilters filters={filters} onFilterChange={handleFilterChange} />

      {/* 선택된 항목이 있을 경우 일괄 작업 컴포넌트 */}
      {selectedPostIds.length > 0 && (
        <BulkActions
          selectedCount={selectedPostIds.length}
          onPublish={() => handleBulkPublish(true)}
          onUnpublish={() => handleBulkPublish(false)}
          onDelete={handleBulkDelete}
        />
      )}

      {/* 로딩 중 표시 */}
      {loading && (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent"></div>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg my-4">{error}</div>}

      {/* 포스트 목록 테이블 */}
      {!loading && posts.length > 0 && (
        <PostList
          posts={posts}
          selectedPostIds={selectedPostIds}
          onSelectionChange={handleSelectionChange}
          onTogglePublish={handleTogglePublish}
          onDelete={handleDeletePost}
        />
      )}

      {/* 포스트가 없을 경우 */}
      {!loading && posts.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">게시물이 없습니다.</p>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPosts > postsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalItems={totalPosts}
          itemsPerPage={postsPerPage}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
