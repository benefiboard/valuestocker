'use client';

import Link from 'next/link';
import { BlogPost } from '../page1';

interface PostListProps {
  posts: BlogPost[];
  selectedPostIds: string[];
  onSelectionChange: (postIds: string[]) => void;
  onTogglePublish: (postId: string, currentStatus: boolean) => void;
  onDelete: (postId: string) => void;
}

export default function PostList({
  posts,
  selectedPostIds,
  onSelectionChange,
  onTogglePublish,
  onDelete,
}: PostListProps) {
  // 모든 포스트 선택/선택 해제
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // 모든 포스트 ID 선택
      onSelectionChange(posts.map((post) => post.id));
    } else {
      // 선택 해제
      onSelectionChange([]);
    }
  };

  // 단일 포스트 선택/선택 해제
  const handleSelectPost = (e: React.ChangeEvent<HTMLInputElement>, postId: string) => {
    if (e.target.checked) {
      // 포스트 추가
      onSelectionChange([...selectedPostIds, postId]);
    } else {
      // 포스트 제거
      onSelectionChange(selectedPostIds.filter((id) => id !== postId));
    }
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 현재 모든 포스트가 선택되었는지 확인
  const allSelected = posts.length > 0 && selectedPostIds.length === posts.length;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
        <thead className="bg-gray-100">
          <tr>
            <th className="w-12 px-4 py-3 text-left">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAll}
                className="h-4 w-4 rounded border-gray-300"
              />
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">제목</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">작성일</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">수정일</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">상태</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">발행일</th>
            <th className="px-4 py-3 text-right font-medium text-gray-700">작업</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {posts.map((post) => (
            <tr key={post.id} className="hover:bg-gray-50">
              <td className="px-4 py-4">
                <input
                  type="checkbox"
                  checked={selectedPostIds.includes(post.id)}
                  onChange={(e) => handleSelectPost(e, post.id)}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </td>
              <td className="px-4 py-4">
                <div className="font-medium">{post.title}</div>
                <div className="text-xs text-gray-500 truncate">{post.slug}</div>
              </td>
              <td className="px-4 py-4 text-sm text-gray-600">{formatDate(post.created_at)}</td>
              <td className="px-4 py-4 text-sm text-gray-600">{formatDate(post.updated_at)}</td>
              <td className="px-4 py-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    post.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {post.is_published ? '발행됨' : '임시저장'}
                </span>
              </td>
              <td className="px-4 py-4 text-sm text-gray-600">{formatDate(post.published_at)}</td>
              <td className="px-4 py-4 text-right space-x-2 whitespace-nowrap">
                {/* 보기 버튼 */}
                <Link
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  보기
                </Link>

                {/* 수정 버튼 */}
                <Link
                  href={`/blog/admin/editor?id=${post.id}`}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  수정
                </Link>

                {/* 발행/임시저장 토글 버튼 */}
                <button
                  onClick={() => onTogglePublish(post.id, post.is_published)}
                  className={`px-2 py-1 text-xs rounded ${
                    post.is_published
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {post.is_published ? '임시저장' : '발행'}
                </button>

                {/* 삭제 버튼 */}
                <button
                  onClick={() => onDelete(post.id)}
                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
