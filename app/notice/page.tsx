'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Search,
  Calendar,
  Eye,
  Megaphone,
  AlertCircle,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

interface Notice {
  notice_id: number;
  category: string;
  title: string;
  content: string;
  is_fixed: number;
  status: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export default function NoticePage() {
  const MAIN_COLOR = '#2196F3';

  const NOTICE_CATEGORIES = [
    '전체',
    '운영자 안내',
    '정책 변경',
    '점검',
    '업데이트',
    '약관 변경',
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotices = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/notice/list', {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`공지사항 조회 실패: ${response.status}`);
      }

      const data = await response.json();

      setNotices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError('공지사항을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const isNewNotice = (createdAt: string) => {
    if (!createdAt) return false;

    const createdDate = new Date(createdAt);
    const today = new Date();

    const diffTime = today.getTime() - createdDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    return diffDays <= 3;
  };

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case '운영자 안내':
        return '서비스 이용과 관련된 운영자 공지입니다.';
      case '정책 변경':
        return '청년 주거 정책, 지원 기준, 정보 제공 기준 변경 안내입니다.';
      case '점검':
        return '서버 점검, 서비스 일시 중단, 시스템 안정화 안내입니다.';
      case '업데이트':
        return '새로운 기능 추가, 화면 개선, 서비스 개선 안내입니다.';
      case '약관 변경':
        return '이용약관, 개인정보 처리방침 등 중요한 문서 변경 안내입니다.';
      default:
        return '청년홈즈의 주요 소식과 안내를 확인하세요.';
    }
  };

  const filteredAndSortedNotices = useMemo(() => {
    return notices
      .filter((notice) => {
        const keyword = searchTerm.toLowerCase();

        const matchesKeyword =
          notice.title?.toLowerCase().includes(keyword) ||
          notice.content?.toLowerCase().includes(keyword) ||
          notice.category?.toLowerCase().includes(keyword);

        const matchesCategory =
          selectedCategory === '전체' || notice.category === selectedCategory;

        return matchesKeyword && matchesCategory;
      })
      .sort((a, b) => {
        if (b.is_fixed !== a.is_fixed) {
          return b.is_fixed - a.is_fixed;
        }

        return (
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
        );
      });
  }, [notices, searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#f4f7fb] p-6 font-sans">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#E3F2FD] px-4 py-2 text-sm font-semibold text-[#2196F3]">
            <Megaphone size={16} />
            청년홈즈 공지
          </div>

          <h1 className="text-3xl font-bold text-slate-900">공지사항</h1>

          <p className="mt-2 text-slate-500">
            운영자 안내, 정책 변경, 점검, 업데이트, 약관 변경 등 서비스의 중요한 소식을 확인하세요.
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-[#BBDEFB] bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">
            공지사항 안내
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            청년홈즈는 사용자에게 필요한 서비스 운영 정보와 청년 주거 관련 변경 사항을 빠르게 전달합니다.
            서비스 점검, 기능 업데이트, 개인정보 처리방침 및 이용약관 변경처럼 중요한 내용은 고정 공지로 표시될 수 있습니다.
          </p>
        </div>

        <div className="relative mb-4">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />

          <Input
            type="text"
            placeholder="예: 서비스 점검, 정책 변경, 개인정보 처리방침"
            className="h-14 rounded-2xl border-slate-200 bg-white pl-12 pr-4 shadow-sm outline-none transition-all focus-visible:ring-[#2196F3]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {NOTICE_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                selectedCategory === category
                  ? 'bg-[#2196F3] text-white shadow-sm'
                  : 'bg-white text-slate-500 hover:bg-[#E3F2FD] hover:text-[#2196F3]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mb-6 rounded-2xl bg-[#E3F2FD]/70 px-5 py-4 text-sm text-[#0D47A1]">
          {getCategoryDescription(selectedCategory)}
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <Card key={item} className="rounded-2xl border-slate-200 bg-white">
                <CardContent className="p-5">
                  <Skeleton className="mb-3 h-5 w-24" />
                  <Skeleton className="mb-3 h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-100 bg-white p-10 text-center text-red-500">
            <AlertCircle className="mx-auto mb-3" size={32} />
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-3">
            {filteredAndSortedNotices.length > 0 ? (
              filteredAndSortedNotices.map((notice) => (
                <Link
                  href={`/site/notice/${notice.notice_id}`}
                  key={notice.notice_id}
                  className="block"
                >
                  <Card
                    className={`overflow-hidden rounded-2xl border-slate-200/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] ${
                      notice.is_fixed
                        ? 'border-[#BBDEFB] bg-[#E3F2FD]/60'
                        : 'bg-white'
                    }`}
                  >
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between gap-4 p-5">
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              className={
                                notice.is_fixed
                                  ? 'bg-[#2196F3] text-white hover:bg-[#2196F3]'
                                  : 'bg-[#E3F2FD] text-[#2196F3] hover:bg-[#E3F2FD]'
                              }
                            >
                              {notice.category || '공지'}
                            </Badge>

                            {notice.is_fixed === 1 && (
                              <Badge className="bg-white text-[#2196F3] hover:bg-white">
                                중요 공지
                              </Badge>
                            )}

                            {isNewNotice(notice.created_at) && (
                              <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-red-500">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                                New
                              </span>
                            )}
                          </div>

                          <h3
                            className={`text-lg font-semibold leading-tight ${
                              notice.is_fixed
                                ? 'text-[#0D47A1]'
                                : 'text-slate-900'
                            }`}
                          >
                            {notice.title}
                          </h3>

                          <p className="line-clamp-1 text-sm text-slate-500">
                            {notice.content}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {notice.created_at?.slice(0, 10)}
                            </span>

                            <span className="flex items-center gap-1">
                              <Eye size={14} />
                              {Number(notice.view_count || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <ChevronRight
                          className="shrink-0 text-slate-300"
                          size={24}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed bg-white px-6 py-20 text-center text-slate-400">
                <p className="font-medium">등록된 공지사항이 없습니다.</p>
                <p className="mt-2 text-sm leading-6">
                  예: “청년홈즈 서비스 점검 안내”, “청년 주거 지원 정책 업데이트”,
                  “개인정보 처리방침 변경 안내” 같은 공지를 등록해보세요.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}