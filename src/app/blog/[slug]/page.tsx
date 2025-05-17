import { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';
import BlogContent from '@/components/blog/BlogContent';
import { notFound } from 'next/navigation';
import type { ResolvingMetadata } from 'next';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

// 동적 메타데이터 생성
export async function generateMetadata(
  { params }: BlogPostPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = params;

  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('title, content, image')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle(); // 결과가 없어도 오류를 발생시키지 않음

    if (error) {
      console.error('메타데이터 가져오기 오류:', error);
      return {
        title: 'Blog | ValueTargeter',
        description: '투자 정보 블로그',
      };
    }

    if (!data) {
      return {
        title: '게시물을 찾을 수 없습니다 | ValueTargeter 블로그',
        description: '요청하신 블로그 게시물을 찾을 수 없습니다.',
      };
    }

    // HTML 태그 제거
    const textContent = data.content.replace(/<[^>]*>/g, '');
    const description = textContent.substring(0, 160) + (textContent.length > 160 ? '...' : '');

    return {
      title: `${data.title} | ValueTargeter 블로그`,
      description: description,
      openGraph: {
        title: data.title,
        description: description,
        type: 'article',
        url: `https://valuetargeter.com/blog/${slug}`,
        images: data.image
          ? [{ url: data.image, width: 1200, height: 630, alt: data.title }]
          : undefined,
      },
    };
  } catch (error) {
    console.error('메타데이터 생성 오류:', error);
    return {
      title: 'ValueTargeter 블로그',
      description: '투자 전략과 금융 인사이트를 제공하는 블로그',
    };
  }
}

// 정적 경로 생성 (선택사항)
export async function generateStaticParams() {
  try {
    const { data } = await supabase.from('blog_posts').select('slug').eq('status', 'published');

    return (data || []).map((post) => ({
      slug: post.slug,
    }));
  } catch (error) {
    console.error('정적 경로 생성 오류:', error);
    return [];
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  // 게시물 존재 여부 확인
  const { slug } = params;

  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (error || !data) {
      notFound();
    }
  } catch (error) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <BlogContent slug={slug} />
    </main>
  );
}
