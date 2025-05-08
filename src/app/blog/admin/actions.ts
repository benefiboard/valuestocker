'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabaseClient';
import {
  fetchPostList,
  updatePostPublishStatus,
  bulkUpdatePostsPublishStatus,
  deletePost,
  bulkDeletePosts,
} from './lib/postHelpers';

// 반환 타입 정의
type PasswordVerificationResult =
  | { success: true; token: string }
  | { success: false; error: string };

type PostListResult =
  | { success: true; posts: any[]; totalCount: number }
  | { success: false; error: string };

type ActionResult = { success: true; message: string } | { success: false; error: string };

/**
 * 관리자 비밀번호 검증 액션
 */
export async function verifyPassword(formData: FormData): Promise<PasswordVerificationResult> {
  const password = formData.get('password') as string;
  const correctPassword = process.env.VALUETARGETER_PW;

  if (!correctPassword) {
    console.error('환경 변수에 비밀번호가 설정되지 않았습니다');
    return { success: false, error: '서버 구성 오류' };
  }

  if (password === correctPassword) {
    return { success: true, token: 'valid_admin_token' };
  }

  return { success: false, error: '비밀번호가 올바르지 않습니다' };
}

/**
 * 블로그 포스트 목록 조회 액션
 */
export async function getPostList(options: {
  page: number;
  perPage: number;
  publishStatus?: 'all' | 'published' | 'draft';
  searchQuery?: string;
}): Promise<PostListResult> {
  try {
    const { posts, totalCount } = await fetchPostList(options);
    return { success: true, posts, totalCount };
  } catch (error: any) {
    console.error('포스트 목록 조회 실패:', error);
    return { success: false, error: error.message || '포스트 목록을 불러오는 데 실패했습니다.' };
  }
}

/**
 * 포스트 발행 상태 변경 액션
 */
export async function updatePostStatus(
  postId: string,
  isPublished: boolean
): Promise<ActionResult> {
  try {
    await updatePostPublishStatus(postId, isPublished);

    // 블로그 페이지 데이터 재검증
    revalidatePath('/blog');
    revalidatePath(`/blog/admin`);

    return {
      success: true,
      message: isPublished
        ? '게시물이 발행되었습니다.'
        : '게시물이 임시저장 상태로 변경되었습니다.',
    };
  } catch (error: any) {
    console.error('포스트 상태 변경 실패:', error);
    return { success: false, error: error.message || '상태 변경에 실패했습니다.' };
  }
}

/**
 * 포스트 일괄 발행 상태 변경 액션
 */
export async function bulkUpdateStatus(
  postIds: string[],
  isPublished: boolean
): Promise<ActionResult> {
  try {
    await bulkUpdatePostsPublishStatus(postIds, isPublished);

    // 블로그 페이지 데이터 재검증
    revalidatePath('/blog');
    revalidatePath(`/blog/admin`);

    return {
      success: true,
      message: isPublished
        ? `${postIds.length}개의 게시물이 발행되었습니다.`
        : `${postIds.length}개의 게시물이 임시저장 상태로 변경되었습니다.`,
    };
  } catch (error: any) {
    console.error('포스트 일괄 상태 변경 실패:', error);
    return { success: false, error: error.message || '일괄 상태 변경에 실패했습니다.' };
  }
}

/**
 * 포스트 삭제 액션
 */
export async function deletePostAction(postId: string): Promise<ActionResult> {
  try {
    await deletePost(postId);

    // 블로그 페이지 데이터 재검증
    revalidatePath('/blog');
    revalidatePath(`/blog/admin`);

    return { success: true, message: '게시물이 삭제되었습니다.' };
  } catch (error: any) {
    console.error('포스트 삭제 실패:', error);
    return { success: false, error: error.message || '삭제에 실패했습니다.' };
  }
}

/**
 * 포스트 일괄 삭제 액션
 */
export async function bulkDeleteAction(postIds: string[]): Promise<ActionResult> {
  try {
    await bulkDeletePosts(postIds);

    // 블로그 페이지 데이터 재검증
    revalidatePath('/blog');
    revalidatePath(`/blog/admin`);

    return { success: true, message: `${postIds.length}개의 게시물이 삭제되었습니다.` };
  } catch (error: any) {
    console.error('포스트 일괄 삭제 실패:', error);
    return { success: false, error: error.message || '일괄 삭제에 실패했습니다.' };
  }
}
