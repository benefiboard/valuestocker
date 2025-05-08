import { supabase } from '@/lib/supabaseClient';
import { BlogPost } from '../page1';

/**
 * 블로그 포스트 목록 조회 함수
 */
export async function fetchPostList(options: {
  page: number;
  perPage: number;
  publishStatus?: 'all' | 'published' | 'draft';
  searchQuery?: string;
}) {
  const { page, perPage, publishStatus = 'all', searchQuery = '' } = options;

  // 기본 쿼리
  let query = supabase.from('blog_posts').select('*', { count: 'exact' });

  // 발행 상태 필터 적용
  if (publishStatus === 'published') {
    query = query.eq('is_published', true);
  } else if (publishStatus === 'draft') {
    query = query.eq('is_published', false);
  }

  // 검색어 필터 적용
  if (searchQuery) {
    query = query.ilike('title', `%${searchQuery}%`);
  }

  // 페이지네이션 적용
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  // 정렬: 최신 수정일 순
  query = query.order('updated_at', { ascending: false }).range(from, to);

  // 쿼리 실행
  const { data, error, count } = await query;

  if (error) {
    throw new Error(`포스트 목록 조회 실패: ${error.message}`);
  }

  return {
    posts: data as BlogPost[],
    totalCount: count || 0,
  };
}

/**
 * 포스트 발행 상태 변경 함수
 */
export async function updatePostPublishStatus(postId: string, isPublished: boolean) {
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('blog_posts')
    .update({
      is_published: isPublished,
      published_at: isPublished ? now : null,
      updated_at: now,
    })
    .eq('id', postId);

  if (error) {
    throw new Error(`포스트 상태 변경 실패: ${error.message}`);
  }

  return true;
}

/**
 * 포스트 일괄 발행 상태 변경 함수
 */
export async function bulkUpdatePostsPublishStatus(postIds: string[], isPublished: boolean) {
  if (postIds.length === 0) {
    return true;
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from('blog_posts')
    .update({
      is_published: isPublished,
      published_at: isPublished ? now : null,
      updated_at: now,
    })
    .in('id', postIds);

  if (error) {
    throw new Error(`포스트 일괄 상태 변경 실패: ${error.message}`);
  }

  return true;
}

/**
 * 포스트 삭제 함수
 */
export async function deletePost(postId: string) {
  const { error } = await supabase.from('blog_posts').delete().eq('id', postId);

  if (error) {
    throw new Error(`포스트 삭제 실패: ${error.message}`);
  }

  return true;
}

/**
 * 포스트 일괄 삭제 함수
 */
export async function bulkDeletePosts(postIds: string[]) {
  if (postIds.length === 0) {
    return true;
  }

  const { error } = await supabase.from('blog_posts').delete().in('id', postIds);

  if (error) {
    throw new Error(`포스트 일괄 삭제 실패: ${error.message}`);
  }

  return true;
}

/**
 * 포스트 슬러그 중복 확인 함수
 */
export async function isSlugAvailable(slug: string, excludePostId?: string) {
  let query = supabase.from('blog_posts').select('id').eq('slug', slug);

  // 특정 포스트 ID 제외 (수정 시)
  if (excludePostId) {
    query = query.neq('id', excludePostId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`슬러그 확인 실패: ${error.message}`);
  }

  // 데이터가 없으면 사용 가능한 슬러그
  return data.length === 0;
}
