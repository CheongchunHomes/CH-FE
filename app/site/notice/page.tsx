'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
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

type NoticeCategory =
  | '전체'
  | '운영자 안내'
  | '정책 변경'
  | '점검'
  | '업데이트'
  | '약관 변경';

interface NoticeItem {
  id: number;
  category: Exclude<NoticeCategory, '전체'>;
  title: string;
  summary: string;
  date: string;
  views: number;
  important?: boolean;
  isNew?: boolean;
}

const categories: NoticeCategory[] = [
  '전체',
  '운영자 안내',
  '정책 변경',
  '점검',
  '업데이트',
  '약관 변경',
];

const notices: NoticeItem[] = [
  {
    id: 1,
    category: '운영자 안내',
    title: '청년홈즈 서비스 정식 오픈 안내',
    summary:
      '청년 주거 준비를 한 번에 확인할 수 있는 청년홈즈 서비스가 정식 오픈되었습니다.',
    date: '2026.05.06',
    views: 128,
    important: true,
    isNew: true,
  },
  {
    id: 2,
    category: '정책 변경',
    title: '청년 주거 지원 정책 정보 업데이트 안내',
    summary:
      '최신 청년 주거 지원 정책과 신청 조건이 새롭게 반영되었습니다.',
    date: '2026.05.05',
    views: 96,
    important: true,
    isNew: true,
  },
  {
    id: 3,
    category: '점검',
    title: '시스템 점검 안내',
    summary:
      '더 안정적인 서비스 제공을 위해 청년홈즈 시스템 점검이 진행될 예정입니다.',
    date: '2026.05.04',
    views: 74,
    important: true,
    isNew: true,
  },
  {
    id: 4,
    category: '약관 변경',
    title: '개인정보 처리방침 개정 안내',
    summary:
      '개인정보 보호 기준 강화를 위해 개인정보 처리방침 일부 내용이 개정됩니다.',
    date: '2026.04.29',
    views: 65,
    important: true,
  },
  {
    id: 5,
    category: '업데이트',
    title: '공지사항 검색 기능 추가 안내',
    summary:
      '공지사항을 제목과 내용으로 더 빠르게 찾을 수 있도록 검색 기능이 추가되었습니다.',
    date: '2026.05.03',
    views: 112,
  },
  {
    id: 6,
    category: '운영자 안내',
    title: '청년홈즈 커뮤니티 이용 안내',
    summary:
      '청년홈즈 커뮤니티를 안전하고 편리하게 이용하기 위한 기본 안내사항입니다.',
    date: '2026.05.02',
    views: 87,
  },
  {
    id: 7,
    category: '업데이트',
    title: '관심 지역 설정 기능 추가 안내',
    summary:
      '자주 확인하는 지역을 관심 지역으로 설정하고 맞춤 정보를 확인할 수 있습니다.',
    date: '2026.05.01',
    views: 134,
  },
  {
    id: 8,
    category: '정책 변경',
    title: '청년 주거 지원 기준 변경 안내',
    summary:
      '일부 청년 주거 지원 기준이 변경되어 신청 전 확인이 필요합니다.',
    date: '2026.04.30',
    views: 63,
  },
  {
    id: 9,
    category: '업데이트',
    title: '매물 검색 필터 기능 개선 안내',
    summary:
      '원하는 조건의 매물을 더 쉽게 찾을 수 있도록 검색 필터가 개선되었습니다.',
    date: '2026.04.28',
    views: 151,
  },
  {
    id: 10,
    category: '운영자 안내',
    title: '서비스 이용 중 오류 제보 안내',
    summary:
      '서비스 이용 중 오류를 발견하신 경우 제보 방법을 확인해 주세요.',
    date: '2026.04.27',
    views: 58,
  },
  {
    id: 11,
    category: '점검',
    title: '야간 서버 안정화 작업 안내',
    summary:
      '서비스 품질 개선을 위해 야간 서버 안정화 작업이 진행됩니다.',
    date: '2026.04.26',
    views: 41,
  },
  {
    id: 12,
    category: '업데이트',
    title: 'QnA 기능 개선 안내',
    summary:
      '자주 묻는 질문을 더 쉽게 확인할 수 있도록 QnA 화면이 개선되었습니다.',
    date: '2026.04.25',
    views: 77,
  },
];

const ITEMS_PER_PAGE = 10;

const categoryStyle: Record<
  Exclude<NoticeCategory, '전체'>,
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

export default function NoticePage() {
  const [selectedCategory, setSelectedCategory] =
    useState<NoticeCategory>('전체');
  const [searchType, setSearchType] = useState<'title' | 'content'>('title');
  const [keyword, setKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredNotices = useMemo(() => {
    return notices.filter((notice) => {
      const categoryMatched =
        selectedCategory === '전체' || notice.category === selectedCategory;

      const trimmedKeyword = keyword.trim().toLowerCase();

      if (!trimmedKeyword) {
        return categoryMatched;
      }

      const searchTarget =
        searchType === 'title'
          ? notice.title.toLowerCase()
          : `${notice.title} ${notice.summary}`.toLowerCase();

      return categoryMatched && searchTarget.includes(trimmedKeyword);
    });
  }, [selectedCategory, searchType, keyword]);

  const totalPages = Math.ceil(filteredNotices.length / ITEMS_PER_PAGE);

  const pagedNotices = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return filteredNotices.slice(startIndex, endIndex);
  }, [filteredNotices, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchType, keyword]);

  return (
    <main className="min-h-screen bg-[#f8fafc] px-6 py-12">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700">
              청년홈즈 소식
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              공지사항
            </h1>
            <p className="mt-3 text-base text-slate-500">
              청년홈즈의 새로운 소식과 중요한 안내를 확인하세요.
            </p>
          </div>

          <div className="flex w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:w-[360px]">
            <select
              value={searchType}
              onChange={(event) =>
                setSearchType(event.target.value as 'title' | 'content')
              }
              className="border-r border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none"
            >
              <option value="title">제목</option>
              <option value="content">제목+내용</option>
            </select>

            <div className="relative flex-1">
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="검색어를 입력해주세요."
                className="h-12 w-full px-4 pr-11 text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
              <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const isActive = selectedCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-2xl px-5 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-600 hover:bg-sky-50 hover:text-sky-700'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
            <p className="text-sm font-medium text-slate-500">
              총{' '}
              <span className="font-bold text-sky-700">
                {filteredNotices.length}
              </span>
              개의 공지사항이 있습니다.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {pagedNotices.length > 0 ? (
              pagedNotices.map((notice) => {
                const style = categoryStyle[notice.category];
                const Icon = style.icon;

                return (
                  <Link
                    key={notice.id}
                    href={`/site/notice/${notice.id}`}
                    className="group block px-6 py-5 transition hover:bg-sky-50/60"
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

                          {notice.isNew && (
                            <span className="rounded-full bg-pink-500 px-2 py-0.5 text-[11px] font-bold text-white">
                              N
                            </span>
                          )}
                        </div>

                        <h2 className="truncate text-lg font-semibold text-slate-900 group-hover:text-sky-700">
                          {notice.title}
                        </h2>

                        <p className="mt-2 line-clamp-1 text-sm text-slate-500">
                          {notice.summary}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {notice.views}
                          </span>
                          <span>{notice.date}</span>
                        </div>
                      </div>

                      <ChevronRight className="mt-9 h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-sky-600" />
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 border-t border-slate-100 px-6 py-5">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                이전
              </button>

              {Array.from({ length: totalPages }, (_, index) => {
                const pageNumber = index + 1;
                const isActive = currentPage === pageNumber;

                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`h-10 w-10 rounded-xl text-sm font-bold transition ${
                      isActive
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) => Math.min(page + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                다음
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}