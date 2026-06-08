'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  MapPin,
  Trash2,
  User,
} from 'lucide-react';

import { get, request, ApiError } from '@/lib/api';

interface CommunityPost {
  postId: number;
  userId: number;
  region: string;
  title: string;
  content: string;
  viewCount: number;
}

interface CommunityDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CommunityDetailPage({ params }: CommunityDetailPageProps) {
  const router = useRouter();
  const { id } = React.use(params);

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const result = await get<CommunityPost>(`/api/community/${id}`);
      setPost(result);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('커뮤니티 글을 불러오지 못했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleDelete = async () => {
    if (!post) return;

    const confirmed = window.confirm('정말 이 커뮤니티 글을 삭제하시겠습니까?');
    if (!confirmed) return;

    try {
      setDeleting(true);
      setErrorMessage('');

await request('DELETE', `/api/community/${id}`);

      router.push('/site/community');
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('커뮤니티 글 삭제에 실패했습니다.');
      }
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <section className="mx-auto max-w-4xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push('/site/community')}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            목록으로
          </button>

          {post && !loading && !errorMessage && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? '삭제 중...' : '삭제'}
            </button>
          )}
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            커뮤니티 글을 불러오는 중입니다.
          </div>
        ) : errorMessage ? (
          <div className="flex items-center gap-2 rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {errorMessage}
          </div>
        ) : post ? (
          <article className="rounded-3xl bg-white p-8 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                <MapPin className="h-3 w-3" />
                {post.region}
              </span>

              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                <Eye className="h-3 w-3" />
                조회수 {post.viewCount}
              </span>

              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                <User className="h-3 w-3" />
                작성자 {post.userId}
              </span>
            </div>

            <h1 className="text-3xl font-bold leading-tight text-slate-900">
              {post.title}
            </h1>

            <div className="my-8 h-px bg-slate-100" />

            <p className="whitespace-pre-wrap text-base leading-8 text-slate-700">
              {post.content}
            </p>
          </article>
        ) : (
          <div className="rounded-3xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            커뮤니티 글이 없습니다.
          </div>
        )}
      </section>
    </main>
  );
}
