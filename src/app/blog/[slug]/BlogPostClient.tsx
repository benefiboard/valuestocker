'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { BlogMedia } from '../admin/components/SimpleBlogEditor';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  published_at: string;
  media_items?: string; // JSON 문자열
}

export default function BlogPostClient({ post, error }: { post: BlogPost | null; error: any }) {
  const [mediaItems, setMediaItems] = useState<BlogMedia[]>([]);
  const [processedContent, setProcessedContent] = useState('');

  // 미디어 아이템 및 콘텐츠 처리
  useEffect(() => {
    if (!post) return;

    // 미디어 아이템 파싱
    let parsedMedia: BlogMedia[] = [];
    if (post.media_items) {
      try {
        parsedMedia = JSON.parse(post.media_items);
        setMediaItems(Array.isArray(parsedMedia) ? parsedMedia : []);
      } catch (err) {
        console.error('미디어 정보 파싱 오류:', err);
      }
    }

    // 콘텐츠 내 미디어 태그 처리
    let content = post.content;

    // 이미지 태그 치환
    content = content.replace(/\[이미지: (.*?)\]/g, (match, url) => {
      return `<img src="${url}" alt="블로그 이미지" class="w-full max-w-full rounded-lg my-4" />`;
    });

    // 유튜브 태그 치환 - 개선된 버전
    content = content.replace(/\[유튜브: (.*?)\]/g, (match, url) => {
      const videoId = getYoutubeId(url);
      console.log('추출된 유튜브 ID:', videoId, '원본 URL:', url);

      if (!videoId) return match;

      // 유튜브 임베드 코드 개선
      return `
        <div class="youtube-embed" style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; margin:20px 0; border-radius:8px; background-color:#f0f0f0;">
          <iframe 
            style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;"
            src="https://www.youtube.com/embed/${videoId}" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
          </iframe>
        </div>
      `;
    });

    // URL 태그 치환
    content = content.replace(/\[링크: (.*?)\]/g, (match, url) => {
      let hostname = '';
      try {
        hostname = new URL(url).hostname;
      } catch (e) {
        hostname = url;
      }

      return `
        <div class="url-card" style="border:1px solid #e5e7eb; border-radius:8px; margin:16px 0; overflow:hidden;">
          <a href="${url}" target="_blank" rel="noopener noreferrer" style="display:block; padding:16px; text-decoration:none; color:inherit;">
            <div style="font-weight:500;">${hostname}</div>
            <div style="font-size:0.875rem; color:#3b82f6; margin-top:4px;">${url}</div>
          </a>
        </div>
      `;
    });

    // 줄바꿈 처리
    content = content.replace(/\n/g, '<br />');

    console.log('처리된 콘텐츠 길이:', content.length);
    setProcessedContent(content);
  }, [post]);

  // 유튜브 URL에서 비디오 ID 추출 - 향상된 버전
  const getYoutubeId = (url: string): string | null => {
    if (!url) return null;

    // 일반 유튜브 URL 패턴
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    if (match && match[2].length === 11) {
      return match[2];
    }

    // URL에서 v 파라미터 직접 추출 시도
    try {
      const urlObj = new URL(url);
      const videoId = urlObj.searchParams.get('v');
      if (videoId && videoId.length === 11) {
        return videoId;
      }
    } catch (e) {
      console.error('URL 파싱 에러:', e);
    }

    return null;
  };

  // 오류 또는 게시물 없음 처리
  if (error || !post) {
    return notFound();
  }

  console.log('content', post.content);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-6">
        <Link
          href="/blog"
          className="inline-flex items-center text-emerald-600 hover:text-emerald-700"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          블로그 목록으로 돌아가기
        </Link>
      </div>

      <article className="bg-white rounded-xl shadow-md p-6 md:p-8">
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">{post.title}</h1>

          <div className="flex items-center text-gray-500 text-sm md:text-base">
            <time dateTime={post.published_at}>
              {new Date(post.published_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </div>
        </header>

        {/* 디버그 정보 (개발 중에만 표시) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-3 bg-gray-100 text-xs rounded-lg">
            <details>
              <summary className="cursor-pointer font-medium">디버그 정보</summary>
              <div className="mt-2">
                <p>콘텐츠 길이: {post.content?.length || 0}자</p>
                <p>미디어 아이템: {mediaItems.length}개</p>
                <div className="mt-2">
                  <strong>미디어 아이템 목록:</strong>
                  <ul className="ml-4 list-disc">
                    {mediaItems.map((item, i) => (
                      <li key={i}>
                        {item.type}: {item.url.substring(0, 50)}...
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </details>
          </div>
        )}

        {/* 블로그 내용 - 처리된 HTML 사용 */}
        <div className="blog-content" dangerouslySetInnerHTML={{ __html: processedContent }} />

        <div>{post.content}</div>
        <div>{mediaItems.length}</div>

        {/* 미디어 아이템이 있고 내용이 짧으면 미디어 요약 표시 */}
        {mediaItems.length > 0 && post.content && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="font-medium text-lg mb-3">이 포스트의 미디어</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mediaItems.map((item, idx) => (
                <div key={idx} className="border rounded-lg p-3 bg-gray-50">
                  {item.type === 'youtube' && (
                    <>
                      <div className="font-medium mb-1">📺 유튜브 비디오</div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm block truncate"
                      >
                        {item.url}
                      </a>
                    </>
                  )}
                  {item.type === 'image' && (
                    <>
                      <div className="font-medium mb-1">🖼️ 이미지</div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm block truncate"
                      >
                        {item.title || item.url}
                      </a>
                    </>
                  )}
                  {item.type === 'url' && (
                    <>
                      <div className="font-medium mb-1">🔗 링크</div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm block truncate"
                      >
                        {item.title || item.url}
                      </a>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
