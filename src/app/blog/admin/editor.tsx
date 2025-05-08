'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabaseClient';
import BlogEditor from './components/BlogEditor';

// 슬러그 생성 함수
function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]/g, ' ') // 특수문자 제거
      .trim()
      .replace(/\s+/g, '-') // 공백을 하이픈으로
      .replace(/[^a-z0-9-]/g, '') // 영문, 숫자, 하이픈만 남김
      .substring(0, 50) + // 최대 50자
    '-' +
    uuidv4().substring(0, 8)
  ); // 고유성 보장
}

export default function BlogPostEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams.get('id');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!postId);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // 기존 게시물 로드 (편집 모드)
  useEffect(() => {
    async function loadPost() {
      if (!postId) return;

      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('id', postId)
          .single();

        if (error) throw error;

        if (data) {
          setTitle(data.title);
          setContent(data.content);
          setIsPublished(data.is_published);
        }
      } catch (error) {
        console.error('게시물 로드 오류:', error);
        setMessage({ text: '게시물을 불러오지 못했습니다', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    }

    loadPost();
  }, [postId]);

  // 게시물 저장 함수
  const savePost = async (publish: boolean = false) => {
    if (!title.trim()) {
      setMessage({ text: '제목을 입력해주세요', type: 'error' });
      return;
    }

    setIsSaving(true);

    try {
      const now = new Date().toISOString();
      const slug = postId ? undefined : generateSlug(title);

      const postData = {
        title,
        content,
        updated_at: now,
        ...(!postId && { slug }), // 신규 글인 경우에만 슬러그 생성
        ...(publish && {
          is_published: true,
          published_at: now,
        }),
      };

      let result;

      if (postId) {
        // 기존 게시물 업데이트
        result = await supabase.from('blog_posts').update(postData).eq('id', postId);
      } else {
        // 새 게시물 생성
        result = await supabase.from('blog_posts').insert([postData]);
      }

      if (result.error) throw result.error;

      setMessage({
        text: publish ? '게시물이 발행되었습니다' : '게시물이 저장되었습니다',
        type: 'success',
      });

      // 게시물 목록으로 리다이렉트 (딜레이 추가)
      setTimeout(() => {
        router.push('/blog/admin');
      }, 1500);
    } catch (error) {
      console.error('저장 오류:', error);
      setMessage({ text: '저장 중 오류가 발생했습니다', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // 취소 핸들러
  const handleCancel = () => {
    const confirmCancel = window.confirm('변경 사항이 저장되지 않습니다. 정말 취소하시겠습니까?');
    if (confirmCancel) {
      router.back();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-60">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-6 p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-6">{postId ? '게시물 수정' : '새 게시물 작성'}</h1>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        {/* 제목 입력 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            placeholder="게시물 제목을 입력하세요"
          />
        </div>

        {/* TipTap 에디터 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
          <BlogEditor initialContent={content} onChange={setContent} />
        </div>

        {/* 버튼 영역 */}
        <div className="flex justify-end gap-2 pt-4">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            취소
          </button>

          <button
            onClick={() => savePost(false)}
            disabled={isSaving}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-400"
          >
            {isSaving ? '저장 중...' : '임시 저장'}
          </button>

          <button
            onClick={() => savePost(true)}
            disabled={isSaving}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-emerald-400"
          >
            {isSaving ? '발행 중...' : '발행하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
