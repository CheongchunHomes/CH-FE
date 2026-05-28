'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  Eye,
  FileText,
  Megaphone,
  RefreshCcw,
  ShieldCheck,
  Wrench,
} from 'lucide-react';

import { get } from '@/lib/api';

type NoticeCategory =
  | '운영자 안내'
  | '정책 변경'
  | '점검'
  | '업데이트'
  | '약관 변경';

interface NoticeDetail {
  noticeId: number;
  category: NoticeCategory;
  sourceCategory: string;
  title: string;
  summary: string;
  content: string;
  important: boolean;
  viewCount: number;
  createdAt: string;
}

interface NoticeDetailResponse {
  noticeId: number;
  category: string;
  title: string;
  summary: string;
  content: string;
  important: boolean;
  viewCount: number;
  createdAt: string;
}

const categoryStyle: Record<
  NoticeCategory,
  {
    icon: React.ElementType;
    className: string;
  }
> = {
  '운영자 안내': {
    icon: Megaphone,
    className: 'bg-sky-50 text-sky-700 border-sky-100',
  },
  '정책 변경': {
    icon: ShieldCheck,
    className: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  },
  점검: {
    icon: Wrench,
    className: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  업데이트: {
    icon: RefreshCcw,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  '약관 변경': {
    icon: FileText,
    className: 'bg-rose-50 text-rose-700 border-rose-100',
  },
};

function normalizeCategory(category: string): NoticeCategory {
  if (
    category === '운영자 안내' ||
    category === '정책 변경' ||
    category === '점검' ||
    category === '업데이트' ||
    category === '약관 변경'
  ) {
    return category;
  }

  return '운영자 안내';
}

function formatDate(value: string) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date
    .toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    .replace(/\. /g, '.')
    .replace(/\.$/, '');
}

function isNewNotice(value: string) {
  if (!value) {
    return false;
  }

  const created = new Date(value).getTime();

  if (Number.isNaN(created)) {
    return false;
  }

  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  return now - created <= sevenDays;
}

export default function NoticeDetailPage() {
  const params = useParams<{ id: string }>();
  const noticeId = Number(params.id);

  const [notice, setNotice] = useState<NoticeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchNotice = async () => {
      if (Number.isNaN(noticeId)) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const data = await get<NoticeDetailResponse>(`/api/notice/${noticeId}`, {
          cache: 'no-store',
        });

        setNotice({
          ...data,
          category: normalizeCategory(data.category),
          sourceCategory: data.category,
          viewCount: data.viewCount ?? 0,
        });
      } catch (error) {
        console.error('공지사항 상세 조회 실패:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchNotice();
  }, [noticeId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8fafc] px-6 py-12">
        <section className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-slate-200 bg-white px-8 py-16 text-center shadow-sm">
            <p className="text-base font-semibold text-slate-700">
              공지사항을 불러오는 중입니다.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (notFound || !notice) {
    return (
      <main className="min-h-screen bg-[#f8fafc] px-6 py-12">
        <section className="mx-auto max-w-4xl">
          <Link
            href="/site/notice"
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
          >
            <ArrowLeft className="h-4 w-4" />
            목록으로 돌아가기
          </Link>

          <div className="rounded-3xl border border-slate-200 bg-white px-8 py-16 text-center shadow-sm">
            <p className="text-lg font-bold text-slate-900">
              공지사항을 찾을 수 없습니다.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              삭제되었거나 존재하지 않는 공지사항입니다.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const style = categoryStyle[notice.category];
  const Icon = style.icon;
  const listHref =
    notice.sourceCategory === '커뮤니티' ? '/site/community' : '/site/notice';

  const paragraphs = notice.content
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <main className="min-h-screen bg-[#f8fafc] px-6 py-12">
      <section className="mx-auto max-w-4xl">
        <Link
          href={listHref}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로 돌아가기
        </Link>

        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-br from-sky-50 via-white to-white px-8 py-8">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${style.className}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {notice.category}
              </span>

              {notice.important && (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                  중요
                </span>
              )}

              {isNewNotice(notice.createdAt) && (
                <span className="rounded-full bg-pink-500 px-2 py-0.5 text-[11px] font-bold text-white">
                  N
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl">
              {notice.title}
            </h1>

            <p className="mt-4 text-base leading-7 text-slate-500">
              {notice.summary}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                {formatDate(notice.createdAt)}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                {notice.viewCount}
              </span>
            </div>
          </div>

          <div className="space-y-5 px-8 py-10 text-base leading-8 text-slate-600">
            {paragraphs.length > 0 ? (
              paragraphs.map((paragraph, index) => (
                <p key={`${notice.noticeId}-${index}`}>{paragraph}</p>
              ))
            ) : (
              <p>{notice.content}</p>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
