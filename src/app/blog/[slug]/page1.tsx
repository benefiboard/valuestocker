import { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';
import BlogPostClient from './BlogPostClient';

// 동적 메타데이터
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { slug } = await params;

  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (!post) {
    return {
      title: '게시물을 찾을 수 없습니다',
      description: '요청하신 블로그 게시물이 존재하지 않습니다.',
    };
  }

  return {
    title: `${post.title} | ValueTargeter 블로그`,
    description: post.content ? post.content.replace(/<[^>]*>/g, ' ').substring(0, 160) : '',
  };
}

export const revalidate = 3600; // 1시간마다 재검증

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;

  // 명시적으로 필드 나열하여 content가 반드시 포함되도록 함
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select(
      'id, title, content, published_at, slug, is_published, cover_image, created_at, updated_at'
    )
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  // 서버 측에서 데이터 확인 로깅
  console.log('Server-side post fetch result:', {
    error: error?.message,
    post_exists: !!post,
    id: post?.id,
    title: post?.title,
    content_length: post?.content?.length || 0,
    has_content: !!post?.content,
  });

  // 데이터가 존재하는지 확인 및 데이터 안전하게 전달
  const serializedPost = post
    ? {
        ...post,
        // content 필드가 없거나 null인 경우 빈 문자열로 대체
        content: post.content || '',
        // 다른 필드들도 null 체크
        title: post.title || '',
        published_at: post.published_at || new Date().toISOString(),
      }
    : null;

  // 클라이언트 컴포넌트로 전달
  return <BlogPostClient post={serializedPost} error={error} />;
}
