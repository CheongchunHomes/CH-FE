'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { ElementType } from 'react';
import {
  Search,
  Eye,
  Megaphone,
  Wrench,
  RefreshCcw,
  FileText,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

import { get } from '@/lib/api';

type DisplayNoticeCategory =
  | '운영자 안내'
  | '정책 변경'
  | '점검'
  | '업데이트'
  | '약관 변경';

type NoticeCategory = '전체' | DisplayNoticeCategory;

type ApiNoticeCategory = DisplayNoticeCategory | '커뮤니티' | string;

interface ApiNoticeItem {
  noticeId: number;
  category: ApiNoticeCategory;
  title: string;
  summary: string;
  content: string;
  important: boolean;
  viewCount?: number;
  createdAt: string;
}

interface NoticeItem {
  noticeId: number;
  category: DisplayNoticeCategory;
  title: string;
  summary: string;
  content: string;
  important: boolean;
  viewCount: number;
  createdAt: string;
}

const categories: NoticeCategory[] = [
  '전체',
  '운영자 안내',
  '정책 변경',
  '점검',
  '업데이트',
  '약관 변경',
];

const categoryStyle: Record<
  DisplayNoticeCategory,
  {
    icon: ElementType;
    className: string;
  }
> = {
  '운영자 안내': {
    icon: Megaphone,
    className: 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20',
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

const ITEMS_PER_PAGE = 5;

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

function normalizeCategory(category: string): DisplayNoticeCategory {
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

export default function NoticePage() {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<NoticeCategory>('전체');
  const [searchType, setSearchType] = useState<'title' | 'content'>('title');
  const [keyword, setKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const data = await get<ApiNoticeItem[]>('/api/notice', {
          cache: 'no-store',
        });

        setNotices(
          data
            .filter((notice) => notice.category !== '커뮤니티')
            .map((notice) => ({
              noticeId: notice.noticeId,
              category: normalizeCategory(notice.category),
              title: notice.title,
              summary: notice.summary,
              content: notice.content,
              important: notice.important,
              viewCount: notice.viewCount ?? 0,
              createdAt: notice.createdAt,
            })),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchType, keyword]);

  const filteredNotices = useMemo(() => {
    const trimmedKeyword = keyword.trim().toLowerCase();

    return notices.filter((notice) => {
      const matchesCategory =
        selectedCategory === '전체' || notice.category === selectedCategory;

      const searchTarget =
        searchType === 'title'
          ? notice.title
          : `${notice.summary} ${notice.content}`;

      const matchesKeyword =
        trimmedKeyword.length === 0 ||
        searchTarget.toLowerCase().includes(trimmedKeyword);

      return matchesCategory && matchesKeyword;
    });
  }, [notices, selectedCategory, searchType, keyword]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredNotices.length / ITEMS_PER_PAGE),
  );

  const pagedNotices = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredNotices.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredNotices, currentPage]);

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }, [totalPages]);

  return (
    <main className="bg-[#f8fafc] px-6 py-8">
      <section className="mx-auto max-w-5xl">
        <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-[#2563EB]/10 px-4 py-2 text-sm font-semibold text-[#2563EB]">
              청춘홈즈 소식
            </span>

            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
              공지사항
            </h1>

            <p className="mt-4 text-base text-slate-500">
              청춘홈즈의 새로운 소식과 중요한 안내를 확인하세요.
            </p>
          </div>

          <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <select
              value={searchType}
              onChange={(event) =>
                setSearchType(event.target.value as 'title' | 'content')
              }
              className="h-14 border-r border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 outline-none"
            >
              <option value="title">제목</option>
              <option value="content">내용</option>
            </select>

            <div className="flex h-14 items-center gap-3 px-4">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="검색어를 입력하세요"
                className="w-64 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
        </header>

        <div className="mb-7 flex flex-wrap gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          {categories.map((category) => {
            const isActive = selectedCategory === category;

            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-2xl px-6 py-3 text-sm font-bold transition ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-[#2563EB]/10 hover:text-[#2563EB]'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
            <p className="text-sm font-medium text-slate-500">
              총{' '}
              <span className="font-bold text-[#2563EB]">
                {filteredNotices.length}
              </span>
              개의 공지사항이 있습니다.
            </p>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center">
              <p className="text-base font-semibold text-slate-700">
                공지사항을 불러오는 중입니다.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pagedNotices.length > 0 ? (
                pagedNotices.map((notice) => {
                  const style = categoryStyle[notice.category];
                  const Icon = style.icon;

                  return (
                    <Link
                      key={notice.noticeId}
                      href={`/site/notice/${notice.noticeId}`}
                      className="group block px-6 py-5 transition hover:bg-[#2563EB]/10"
                    >
                      <div className="flex items-start justify-between gap-5">
                        <div className="min-w-0 flex-1">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
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

                          <h2 className="truncate text-lg font-semibold text-slate-900 group-hover:text-[#2563EB]">
                            {notice.title}
                          </h2>

                          <p className="mt-2 line-clamp-1 text-sm text-slate-500">
                            {notice.summary}
                          </p>

                          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                            <span className="inline-flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {notice.viewCount}
                            </span>
                            <span>{formatDate(notice.createdAt)}</span>
                          </div>
                        </div>

                        <ChevronRight className="mt-9 h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#2563EB]" />
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="px-6 py-16 text-center">
                  <p className="text-base font-semibold text-slate-700">
                    검색 결과가 없습니다.
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    다른 검색어를 입력하거나 카테고리를 변경해 주세요.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {!loading && totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {pageNumbers.map((page) => {
              const isActive = currentPage === page;

              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`h-10 w-10 rounded-full text-sm font-bold transition ${
                    isActive
                      ? 'bg-[#2563EB] text-white shadow-sm'
                      : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-[#2563EB]/10 hover:text-[#2563EB]'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}