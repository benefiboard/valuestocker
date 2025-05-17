'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Calendar, Clock, ArrowLeft, Share2, ExternalLink } from 'lucide-react';

interface BlogContentProps {
  slug: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  image: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function BlogContent({ slug }: BlogContentProps) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processedContent, setProcessedContent] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          router.push('/404');
          return;
        }

        setPost(data);

        // 콘텐츠 처리 (유튜브 임베드 등)
        const processed = processContent(data.content);
        setProcessedContent(processed);
      } catch (err: any) {
        console.error('블로그 게시물 로딩 오류:', err);
        setError(err.message || '게시물을 불러오는 중 오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPost();
    }
  }, [slug, router]);

  // 유튜브 URL에서 ID 추출 함수
  const extractYoutubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // 콘텐츠 처리 함수 (유튜브 임베드 및 Figure 태그 최적화)
  const processContent = (content: string): string => {
    if (!content) return '';

    // 임시 DOM을 생성하여 HTML 파싱
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    // 유튜브 URL 추출 및 처리
    const extractAndProcessYoutubeUrls = () => {
      // 먼저 텍스트 노드에서 유튜브 URL 찾기
      const findYoutubeUrlsInText = () => {
        const textNodes = [];
        const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT, null);

        let node;
        while ((node = walker.nextNode())) {
          if (node.textContent?.includes('youtube.com') || node.textContent?.includes('youtu.be')) {
            textNodes.push(node);
          }
        }

        textNodes.forEach((textNode) => {
          const text = textNode.textContent || '';
          const urlRegex =
            /(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;

          let lastIndex = 0;
          let match;
          const fragments = [];

          while ((match = urlRegex.exec(text)) !== null) {
            // URL 이전 텍스트 추가
            if (match.index > lastIndex) {
              fragments.push(document.createTextNode(text.substring(lastIndex, match.index)));
            }

            // URL 전체
            const fullUrl = match[0].startsWith('http') ? match[0] : `https://${match[0]}`;

            // 링크 엘리먼트 생성
            const link = document.createElement('a');
            link.href = fullUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.className = 'youtube-text-link';
            link.textContent = fullUrl;
            fragments.push(link);

            lastIndex = match.index + match[0].length;
          }

          // 나머지 텍스트
          if (lastIndex < text.length) {
            fragments.push(document.createTextNode(text.substring(lastIndex)));
          }

          // 원래 텍스트 노드를 복수의 노드로 교체
          if (fragments.length > 0) {
            const parent = textNode.parentNode;
            fragments.forEach((fragment) => {
              parent?.insertBefore(fragment, textNode);
            });
            parent?.removeChild(textNode);
          }
        });
      };

      // 유튜브 URL을 href 속성으로 가진 앵커 태그 처리
      const processYoutubeAnchors = () => {
        const anchors = tempDiv.querySelectorAll('a[href*="youtube.com"], a[href*="youtu.be"]');

        anchors.forEach((anchor) => {
          const url = anchor.getAttribute('href') || '';
          const videoId = extractYoutubeId(url);

          if (!videoId) return;

          // 이미 iframe 컨테이너 내부에 있는 앵커는 건너뛰기
          if (anchor.closest('.youtube-embed-fixed')) return;

          // 유튜브 URL인 경우에만 처리
          if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const isPlainLink = anchor.textContent === url;

            // URL만 있는 앵커인 경우 유튜브 임베드로 변환
            if (isPlainLink) {
              // 부모 요소 체크
              const parent = anchor.parentElement;

              // 새 컨테이너 요소 생성
              const container = document.createElement('div');
              container.className = 'youtube-container';

              // URL 링크 생성
              const linkContainer = document.createElement('div');
              linkContainer.className = 'youtube-link';
              linkContainer.style.cssText = 'margin-bottom: 5px; font-size: 0.9em;';

              const linkElement = document.createElement('a');
              linkElement.href = url;
              linkElement.target = '_blank';
              linkElement.rel = 'noopener noreferrer';
              linkElement.className = 'external-link';
              linkElement.style.cssText =
                'display: inline-flex; align-items: center; color: #0366d6; text-decoration: none;';
              linkElement.textContent = url;

              const icon = document.createElement('span');
              icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 5px;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;
              linkElement.appendChild(icon);

              linkContainer.appendChild(linkElement);
              container.appendChild(linkContainer);

              // 임베드 컨테이너 생성
              const embedContainer = document.createElement('div');
              embedContainer.className = 'youtube-embed-fixed';
              embedContainer.style.cssText = 'width: 500px; max-width: 100%; margin: 0 auto;';

              const aspectRatioBox = document.createElement('div');
              aspectRatioBox.style.cssText =
                'position: relative; padding-bottom: 62%; height: 0; overflow: hidden; border-radius: 8px;';

              const iframe = document.createElement('iframe');
              iframe.src = `https://www.youtube.com/embed/${videoId}`;
              iframe.frameBorder = '0';
              iframe.allowFullscreen = true;
              iframe.style.cssText =
                'position: absolute; top: 0; left: 0; width: 100%; height: 100%;';
              iframe.allow =
                'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';

              aspectRatioBox.appendChild(iframe);
              embedContainer.appendChild(aspectRatioBox);
              container.appendChild(embedContainer);

              // 앵커 태그를 새 컨테이너로 교체
              parent?.replaceChild(container, anchor);
            }
          }
        });
      };

      // iframe 직접 처리
      const processIframes = () => {
        const iframes = tempDiv.querySelectorAll(
          'iframe[src*="youtube.com"], iframe[src*="youtu.be"]'
        );

        iframes.forEach((iframe) => {
          // 이미 처리된 iframe 건너뛰기
          if (iframe.closest('.youtube-embed-fixed')) return;

          const src = iframe.getAttribute('src') || '';
          const videoId = extractYoutubeId(src);

          if (!videoId) return;

          // 유튜브 URL 구성
          const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

          // 부모 요소 체크
          const parent = iframe.parentElement;
          if (!parent) return;

          // 부모가 Figure인지 체크
          const isInsideFigure = parent.tagName.toLowerCase() === 'figure';

          // Figure 태그 수정
          if (isInsideFigure) {
            // 스타일 속성이 있는지 확인
            if (parent.hasAttribute('style')) {
              // padding-bottom 및 height 제거
              const style = parent.getAttribute('style') || '';
              const newStyle = style
                .replace(/padding-bottom:\s*\d+%/g, 'padding-bottom: 0')
                .replace(/height:\s*100%/g, 'height: auto');
              parent.setAttribute('style', newStyle);
            }

            // Figure 태그 초기화
            parent.innerHTML = '';

            // URL 링크 생성
            const linkContainer = document.createElement('div');
            linkContainer.className = 'youtube-link';
            linkContainer.style.cssText = 'margin-bottom: 5px; font-size: 0.9em;';

            const linkElement = document.createElement('a');
            linkElement.href = youtubeUrl;
            linkElement.target = '_blank';
            linkElement.rel = 'noopener noreferrer';
            linkElement.className = 'external-link';
            linkElement.style.cssText =
              'display: inline-flex; align-items: center; color: #0366d6; text-decoration: none;';
            linkElement.textContent = youtubeUrl;

            const icon = document.createElement('span');
            icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 5px;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;
            linkElement.appendChild(icon);

            linkContainer.appendChild(linkElement);
            parent.appendChild(linkContainer);

            // 임베드 컨테이너 생성
            const embedContainer = document.createElement('div');
            embedContainer.className = 'youtube-embed-fixed';
            embedContainer.style.cssText = 'width: 500px; max-width: 100%; margin: 0 auto;';

            const aspectRatioBox = document.createElement('div');
            aspectRatioBox.style.cssText =
              'position: relative; padding-bottom: 62%; height: 0; overflow: hidden; border-radius: 8px;';

            const newIframe = document.createElement('iframe');
            newIframe.src = `https://www.youtube.com/embed/${videoId}`;
            newIframe.frameBorder = '0';
            newIframe.allowFullscreen = true;
            newIframe.style.cssText =
              'position: absolute; top: 0; left: 0; width: 100%; height: 100%;';
            newIframe.allow =
              'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';

            aspectRatioBox.appendChild(newIframe);
            embedContainer.appendChild(aspectRatioBox);
            parent.appendChild(embedContainer);
          }
          // 일반 컨테이너인 경우
          else {
            // 전체 컨테이너 생성
            const container = document.createElement('div');
            container.className = 'youtube-container';

            // URL 링크 생성
            const linkContainer = document.createElement('div');
            linkContainer.className = 'youtube-link';
            linkContainer.style.cssText = 'margin-bottom: 5px; font-size: 0.9em;';

            const linkElement = document.createElement('a');
            linkElement.href = youtubeUrl;
            linkElement.target = '_blank';
            linkElement.rel = 'noopener noreferrer';
            linkElement.className = 'external-link';
            linkElement.style.cssText =
              'display: inline-flex; align-items: center; color: #0366d6; text-decoration: none;';
            linkElement.textContent = youtubeUrl;

            const icon = document.createElement('span');
            icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 5px;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;
            linkElement.appendChild(icon);

            linkContainer.appendChild(linkElement);
            container.appendChild(linkContainer);

            // 임베드 컨테이너 생성
            const embedContainer = document.createElement('div');
            embedContainer.className = 'youtube-embed-fixed';
            embedContainer.style.cssText = 'width: 500px; max-width: 100%; margin: 0 auto;';

            const aspectRatioBox = document.createElement('div');
            aspectRatioBox.style.cssText =
              'position: relative; padding-bottom: 62%; height: 0; overflow: hidden; border-radius: 8px;';

            const originalIframe = iframe as HTMLIFrameElement;

            const newIframe = document.createElement('iframe');
            newIframe.src = originalIframe.src;
            newIframe.frameBorder = '0';
            newIframe.allowFullscreen = true;
            newIframe.style.cssText =
              'position: absolute; top: 0; left: 0; width: 100%; height: 100%;';
            newIframe.allow = originalIframe.allow;

            aspectRatioBox.appendChild(newIframe);
            embedContainer.appendChild(aspectRatioBox);
            container.appendChild(embedContainer);

            // iframe을 새 컨테이너로 교체
            parent.replaceChild(container, iframe);
          }
        });
      };

      // 모든 처리 실행
      findYoutubeUrlsInText();
      processYoutubeAnchors();
      processIframes();
    };

    // figure 태그 수정 - 과도한 padding-bottom 제거
    const fixFigureTags = () => {
      const figures = tempDiv.querySelectorAll('figure');

      figures.forEach((figure) => {
        // 스타일 속성이 있는지 확인
        const style = figure.getAttribute('style');
        if (style) {
          // padding-bottom 제거
          const newStyle = style
            .replace(/padding-bottom:\s*\d+%/g, 'padding-bottom: 0')
            .replace(/height:\s*100%/g, 'height: auto');
          figure.setAttribute('style', newStyle);
        }

        // 추가 데이터 속성 제거
        figure.removeAttribute('data-percentage');
        figure.removeAttribute('data-size');
        figure.removeAttribute('data-align');
        figure.removeAttribute('data-origin');
      });
    };

    // 불필요한 공백 제거 함수
    const cleanupEmptyParagraphs = () => {
      // 비어있는 p 태그 제거
      const emptyParagraphs = tempDiv.querySelectorAll('p:empty');
      emptyParagraphs.forEach((p) => p.remove());

      // 공백이나 줄바꿈만 있는 p 태그 제거
      const paragraphs = tempDiv.querySelectorAll('p');
      paragraphs.forEach((p) => {
        if (
          p.innerHTML.trim() === '&nbsp;' ||
          p.innerHTML.trim() === '<br>' ||
          p.innerHTML.trim() === ''
        ) {
          p.remove();
        }
      });

      // 연속된 br 태그 하나로 통합
      let html = tempDiv.innerHTML;
      html = html.replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '<br>');
      tempDiv.innerHTML = html;
    };

    // 처리 순서
    fixFigureTags();
    extractAndProcessYoutubeUrls();
    cleanupEmptyParagraphs();

    // 처리된 HTML 반환
    return tempDiv.innerHTML;
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

  // 공유 기능
  const handleShare = async () => {
    if (!post) return;

    const url = window.location.href;
    const title = post.title;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
      } catch (err) {
        console.error('공유 실패:', err);
      }
    } else {
      // 공유 API가 지원되지 않는 경우 URL 복사
      navigator.clipboard.writeText(url);
      alert('URL이 클립보드에 복사되었습니다.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-3/4 mb-6"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded mb-8"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="bg-red-50 p-6 rounded-lg text-center">
          <h2 className="text-xl font-bold text-red-700 mb-2">
            {error || '게시물을 찾을 수 없습니다'}
          </h2>
          <p className="text-red-600 mb-4">요청하신 블로그 글을 불러올 수 없습니다.</p>
          <Link
            href="/blog"
            className="inline-flex items-center text-emerald-600 hover:text-emerald-800"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            블로그 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto py-10 px-4">
      {/* 헤더 */}
      <header className="mb-10">
        <Link
          href="/blog"
          className="inline-flex items-center text-gray-600 hover:text-emerald-700 mb-6"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          블로그 목록으로 돌아가기
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-1" />
            <span className="mr-4">{formatDate(post.created_at)}</span>
            <Clock className="h-4 w-4 mr-1" />
            <span>{getReadingTime(post.content)}분 읽기</span>
          </div>

          <button
            onClick={handleShare}
            className="p-2 text-gray-600 hover:text-emerald-700 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="공유하기"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* 대표 이미지 */}
      {post.image && (
        <figure className="mb-10" style={{ padding: 0, height: 'auto' }}>
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-auto rounded-lg shadow-md object-cover max-h-96"
          />
        </figure>
      )}

      {/* 본문 내용 - 처리된 콘텐츠 사용 */}
      <div
        className="prose prose-emerald max-w-none blog-content"
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />

      {/* 하단 내비게이션 */}
      <div className="mt-12 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <Link
            href="/blog"
            className="inline-flex items-center text-gray-600 hover:text-emerald-700"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            블로그 목록으로
          </Link>

          <button
            onClick={handleShare}
            className="inline-flex items-center text-gray-600 hover:text-emerald-700 px-4 py-2 rounded-md hover:bg-gray-100"
          >
            <Share2 className="mr-2 h-5 w-5" />
            공유하기
          </button>
        </div>
      </div>

      {/* 추가 스타일 */}
      <style jsx global>{`
        /* figure 태그 강제 오버라이드 */
        .blog-content figure {
          padding-bottom: 0 !important;
          height: auto !important;
          margin: 20px 0 !important;
        }

        /* 유튜브 임베드 스타일 */
        .youtube-embed-fixed {
          width: 500px !important;
          max-width: 100% !important;
          margin: 10px auto !important;
        }

        /* 유튜브 링크 스타일 */
        .youtube-link {
          width: 500px !important;
          max-width: 100% !important;
          margin: 0 auto !important;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* 유튜브 링크 호버 효과 */
        .youtube-link a:hover {
          text-decoration: underline;
        }

        /* 외부 링크 스타일 */
        .external-link {
          color: #0366d6 !important;
          font-size: 0.9em !important;
        }

        /* 빈 p 태그 제거 */
        .blog-content p:empty,
        .blog-content p:has(br:only-child) {
          display: none !important;
        }
      `}</style>
    </article>
  );
}
