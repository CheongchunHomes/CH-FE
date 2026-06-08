'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, AlertCircle, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { get, request, ApiError } from '@/lib/api';

interface CommunityPost {
  postId: number;
  userId: number;
  region: string;
  title: string;
  content: string;
  viewCount?: number;
  createdAt?: string;
}

export default function CommunityEditPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <CommunityEditContent />
    </Suspense>
  );
}

function CommunityEditContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const postId = Number(params.id);
  const isAdminMode = searchParams.get('admin') === '1';

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [title, setTitle] = useState('');
  const [region, setRegion] = useState('');
  const [content, setContent] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!postId || Number.isNaN(postId)) return;

    const fetchPost = async () => {
      try {
        setLoading(true);

        const data = await get<CommunityPost>(`/api/community/${postId}`, {
          cache: 'no-store',
        });

        setPost(data);
        setTitle(data.title ?? '');
        setRegion(data.region ?? '');
        setContent(data.content ?? '');
      } catch (error) {
        if (error instanceof ApiError) {
          console.error('게시글 조회 실패:', error.message);
        } else {
          console.error(error);
        }

        alert('게시글을 불러오지 못했습니다.');
        router.push('/site/community');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    if (!region.trim()) {
      alert('지역을 입력해주세요.');
      return;
    }

    if (!content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    const apiPath = isAdminMode
      ? `/api/community/admin/${postId}`
      : `/api/community/${postId}`;

    try {
      setSaving(true);

    await request('PUT', apiPath, {
     body: {
      title,
      region,
      content,
    },
  });

      alert('게시글이 수정되었습니다.');
      router.push(isAdminMode ? '/site/community?admin=1' : `/site/community/${postId}`);
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('게시글 수정 실패:', error.message);
      } else {
        console.error(error);
      }

      alert('게시글 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <p className="text-sm text-gray-500">게시글을 불러오는 중입니다...</p>
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle size={18} />
            <p className="text-sm">게시글을 찾을 수 없습니다.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6">
        <Button
          type="button"
          variant="ghost"
          className="gap-2"
          onClick={() => router.push(isAdminMode ? '/site/community?admin=1' : `/site/community/${postId}`)}
        >
          <ArrowLeft size={18} />
          {isAdminMode ? '관리 목록으로' : '뒤로가기'}
        </Button>
      </div>

      <section className="rounded-2xl border bg-white p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-sm font-medium text-blue-600">
            {isAdminMode ? '관리자 커뮤니티 관리' : '동네별 커뮤니티'}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">게시글 수정</h1>
          <p className="mt-2 text-sm text-gray-500">
            제목, 지역, 내용을 수정한 뒤 저장해주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              제목
            </label>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="제목을 입력해주세요."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              지역
            </label>
            <Input
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              placeholder="예: 서울특별시 강남구"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              내용
            </label>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="내용을 입력해주세요."
              className="min-h-[260px] w-full resize-none rounded-md border border-input bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="flex justify-end gap-3 border-t pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(isAdminMode ? '/site/community?admin=1' : `/site/community/${postId}`)}
            >
              취소
            </Button>

            <Button type="submit" disabled={saving} className="gap-2">
              <Save size={18} />
              {saving ? '저장 중...' : '수정 완료'}
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
