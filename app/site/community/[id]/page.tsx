'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Eye,
  MapPin,
  User,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

interface CommunityPost {
  postId: number;
  userId: number;
  region: string;
  title: string;
  content: string;
  viewCount: number;
  createdAt: string;
}

interface PostDetailProps {
  params: Promise<{ id: string }>;
}

export default function PostDetailPage({ params }: PostDetailProps) {
  const router = useRouter();
  const { id } = React.use(params);

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const postId = Number(id);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/community/list', {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`게시글 조회 실패: ${response.status}`);
      }

      const data = await response.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError('게시글을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const sortedPosts = useMemo(() => {
    return [...posts].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [posts]);

  const currentIndex = sortedPosts.findIndex(
    (post) => Number(post.postId) === postId
  );

  const post = currentIndex >= 0 ? sortedPosts[currentIndex] : null;
  const prevPost = currentIndex > 0 ? sortedPosts[currentIndex - 1] : null;
  const nextPost =
    currentIndex >= 0 && currentIndex < sortedPosts.length - 1
      ? sortedPosts[currentIndex + 1]
      : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] p-6 font-sans">
        <div className="mx-auto max-w-4xl">
          <Skeleton className="mb-6 h-8 w-40" />

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <Skeleton className="mb-4 h-6 w-24" />
            <Skeleton className="mb-6 h-10 w-3/4" />
            <Separator className="mb-8 bg-slate-100" />
            <Skeleton className="mb-4 h-5 w-full" />
            <Skeleton className="mb-4 h-5 w-full" />
            <Skeleton className="mb-4 h-5 w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f4f7fb]">
        <AlertCircle size={36} className="text-red-500" />
        <p className="text-slate-500">
          {error || '해당 게시글을 찾을 수 없습니다.'}
        </p>

        <Button
          onClick={() => router.push('/site/community')}
          className="bg-[#2196F3] hover:bg-[#1976D2]"
        >
          목록으로 이동
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] p-6 font-sans">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <button
            onClick={() => router.push('/site/community')}
            className="flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-[#2196F3]"
          >
            <ArrowLeft size={18} />
            목록으로 돌아가기
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="p-8 pb-6">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Badge className="bg-[#E3F2FD] text-[#2196F3] hover:bg-[#E3F2FD]">
                동네 커뮤니티
              </Badge>

              <span className="flex items-center gap-1 text-sm text-slate-400">
                <MapPin size={14} />
                {post.region}
              </span>

              <span className="flex items-center gap-1 text-sm text-slate-400">
                <Calendar size={14} />
                {post.createdAt?.slice(0, 10)}
              </span>

              <span className="flex items-center gap-1 text-sm text-slate-400">
                <Eye size={14} />
                {Number(post.viewCount || 0).toLocaleString()}
              </span>
            </div>

            <h1 className="text-2xl font-bold leading-tight text-slate-900 md:text-3xl">
              {post.title}
            </h1>

            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <User size={15} />
              작성자: 사용자 {post.userId}
            </div>
          </div>

          <Separator className="bg-slate-100" />

          <div className="min-h-[360px] p-8">
            <div className="whitespace-pre-wrap text-lg leading-relaxed text-slate-700">
              {post.content}
            </div>
          </div>

          <div className="border-t border-slate-100 bg-slate-50/50">
            <div className="grid grid-cols-2 divide-x divide-slate-200">
              <button
                disabled={!prevPost}
                onClick={() =>
                  prevPost &&
                  router.push(`/site/community/${prevPost.postId}`)
                }
                className="group flex flex-col gap-1 p-6 text-left transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <ChevronLeft size={14} />
                  이전글
                </span>

                <span className="truncate text-sm font-medium text-slate-600 group-hover:text-[#2196F3]">
                  {prevPost ? prevPost.title : '이전글이 없습니다.'}
                </span>
              </button>

              <button
                disabled={!nextPost}
                onClick={() =>
                  nextPost &&
                  router.push(`/site/community/${nextPost.postId}`)
                }
                className="group flex flex-col gap-1 p-6 text-right transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="flex items-center justify-end gap-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                  다음글
                  <ChevronRight size={14} />
                </span>

                <span className="truncate text-sm font-medium text-slate-600 group-hover:text-[#2196F3]">
                  {nextPost ? nextPost.title : '다음글이 없습니다.'}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            className="rounded-full border-slate-200 px-12 py-6 shadow-sm transition-all hover:border-[#2196F3] hover:bg-white hover:text-[#2196F3]"
            onClick={() => router.push('/site/community')}
          >
            목록보기
          </Button>
        </div>
      </div>
    </div>
  );
}