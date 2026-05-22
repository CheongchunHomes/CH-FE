'use client';

import { useEffect, useState } from 'react';
import { useStepBar } from '@/app/site/step/components/StepLayoutShell';
import { get } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

// PolicyResultDTO
export interface PolicyResult {
  policyName: string;
  recoId: number;
  score: number;
  grade: string;
  reason: string;
  description: string;
  applyUrl: string;
}

// AnnouncementListDTO
export interface Announcement {
  announcementId: number;
  title: string;
  region: string;
  status: string;
  category: string;
  targetType: string;
  applyStartDate: string;
  applyEndDate: string;
  sourceUrl: string;
  sourceType: string;
}

// UserProfileResponseDTO
export interface UserProfile {
  birthDate: string;
  married: boolean;
  houseless: boolean;
  annualIncome: number;
  totalAsset: number;
  desiredCity: string;
  desiredDistrict: string;
  subscriptionMonths: number;
  dependentCount: number;
}

export interface RecoItem {
  name: string;
  category: string;
  description: string;
  matchScore: number;
  applyUrl: string;
  announcementId: number | null;
}

const GRADE_COLOR: Record<string, string> = {
  '적극추천':   'text-green-600',
  '추천가능':   'text-blue-600',
  '조건부추천': 'text-yellow-600',
  '추천어려움': 'text-red-500',
};

const GRADE_BG: Record<string, string> = {
  '적극추천':   'border-green-200 bg-green-50 text-green-700',
  '추천가능':   'border-blue-200 bg-blue-50 text-blue-700',
  '조건부추천': 'border-yellow-200 bg-yellow-50 text-yellow-700',
  '추천어려움': 'border-red-200 bg-red-50 text-red-600',
};

const LOAN_KEYWORDS = ['대출', '버팀목', '전세자금', '보증부월세', '신생아특례'];
const isLoan = (name: string) => LOAN_KEYWORDS.some(k => name.includes(k));

// 공고 카테고리 분류
const HAPPY_KEYWORDS = ['행복주택'];
const PUBLIC_KEYWORDS = ['매입임대', '전세임대', '국민임대', '영구임대', '든든주택', '신혼', '다자녀'];

const classifyAnnouncement = (a: Announcement): string => {
  const title = a.title ?? '';
  if (HAPPY_KEYWORDS.some(k => title.includes(k))) return '행복주택';
  if (PUBLIC_KEYWORDS.some(k => title.includes(k))) return '공공임대';
  return '공공임대';
};

// 고정 대출 목록
const FIXED_LOANS = [
  { name: '신생아 특례 버팀목대출', desc: '신생아 가구 대상, 최대 3억원, 금리 1%대' },
  { name: '청년전용 버팀목전세자금대출', desc: '만 19~34세 청년, 최대 2억원, 금리 2%대' },
  { name: '중소기업취업청년 전월세보증금대출', desc: '중소기업 재직 청년, 최대 1억원, 금리 1%대' },
  { name: '신혼부부전용 전세자금대출', desc: '신혼부부 대상, 최대 2억원' },
  { name: '청년전용 보증부월세대출', desc: '보증금 최대 3500만원, 월세 최대 40만원' },
  { name: '일반 버팀목 전세자금대출', desc: '무주택 세대주 대상 전세자금 지원' },
];

export default function RecommendPage() {
  useStepBar(2);

  const [results, setResults] = useState<PolicyResult[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalAnnouncement, setModalAnnouncement] = useState<Announcement | null>(null);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

useEffect(() => {
  Promise.all([
    get<{ results: PolicyResult[] }>('/api/recommendation/calculate/profile', { cache: 'no-store' }),
    get<{ policies: RecoItem[]; diagnosis: any; desiredCity: string }>('/api/recommend/summary', { cache: 'no-store' }).catch(() => null),
  ])
    .then(async ([rec, summary]) => {
      setResults(rec.results ?? []);

      const region = summary?.desiredCity ?? '';
      if (region) {
        try {
          const annData = await get<{ content: Announcement[] }>(
            '/api/announcements',
            { query: { region, status: '접수중', size: 20 }, cache: 'no-store' }
          );
      const seen = new Set<string>();
      const unique = (annData.content ?? []).filter(a => {
        if(seen.has(a.title)) return false;
        seen.add(a.title);
        return true;
      });
      setAnnouncements(unique);
        } catch {}
      }
      setLoading(false);
    })
    .catch((err) => {
      if (err?.status === 401) {
        setError('자가진단을 먼저 완료해주세요.');
      } else {
        setError('서버에 연결할 수 없습니다.');
      }
      setLoading(false);
    });
}, []);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} />;

  const loanResults = results.filter(r => isLoan(r.policyName));
  const policyResults = results.filter(r => !isLoan(r.policyName));

  const happyAnnouncements = announcements.filter(a => classifyAnnouncement(a) === '행복주택');
  const publicAnnouncements = announcements.filter(a => classifyAnnouncement(a) === '공공임대');

  const categories = ['주거지원제도', '행복주택', '공공임대', '대출'];
  const activeCats = categories.filter(c => {
    if (c === '주거지원제도') return policyResults.length > 0;
    if (c === '행복주택') return happyAnnouncements.length > 0;
    if (c === '공공임대') return publicAnnouncements.length > 0;
    if (c === '대출') return true;
    return false;
  });

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <div className="mx-auto max-w-4xl px-5 py-5">

        {/* 프로필 요약 */}
        {profile && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <p className="mb-2 text-xs font-semibold text-blue-600">● 내 프로필 기반 진단</p>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-700">
                <span>희망지역 <strong>{profile.desiredCity ?? '-'}{profile.desiredDistrict ? ' ' + profile.desiredDistrict : ''}</strong></span>
                <span>연소득 <strong>{profile.annualIncome ? (profile.annualIncome / 10000).toFixed(0) + '만원' : '-'}</strong></span>
                <span>무주택 <strong>{profile.houseless ? '✓' : '✗'}</strong></span>
                <span>청약통장 <strong>{profile.subscriptionMonths ?? 0}개월</strong></span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 진단결과 헤더 */}
        <div className="mb-3.5 flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium text-blue-600">● 진단결과</span>
          {activeCats.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCat(selectedCat === cat ? null : cat)}
              className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold transition-colors ${
                selectedCat === cat
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-blue-200 bg-blue-50 text-blue-600 hover:border-blue-400'
              }`}
            >
              {cat}
            </button>
          ))}
          <span className="text-sm text-gray-500">신청이 가능할 것으로 예상됩니다.</span>
        </div>

        <Accordion type="single" collapsible className="space-y-2.5">

          {/* 주거지원제도 */}
          {(!selectedCat || selectedCat === '주거지원제도') && policyResults.length > 0 && (
            <AccordionItem value="주거지원제도" className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <AccordionTrigger className="px-4 py-3.5 hover:no-underline">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">주거지원제도</span>
                  <span className="text-sm font-medium text-gray-900">추천 제도 ({policyResults.length}건) · 당첨확률 높은 순
                   <span className="ml-1 text-xs text-gray-400 font-normal">· 우선순위 순으로 노출됩니다</span>
                </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-0">
                <div className="border-t border-gray-100">
                  {policyResults.map((p, i) => (
                    <div key={i} className={`flex items-center justify-between px-4 py-3 text-sm ${i < policyResults.length - 1 ? 'border-b border-gray-100' : ''}`}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{p.policyName}</p>
                          <p className="text-xs text-gray-500 truncate">{p.reason}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${GRADE_BG[p.grade] ?? ''}`}>{p.grade}</span>
                        <span className="text-xs text-gray-400">{p.score}점</span>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* 행복주택 공고 */}
          {(!selectedCat || selectedCat === '행복주택') && happyAnnouncements.length > 0 && (
            <AccordionItem value="행복주택" className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <AccordionTrigger className="px-4 py-3.5 hover:no-underline">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">행복주택</span>
                  <span className="text-sm font-medium text-gray-900">행복주택 공고 ({happyAnnouncements.length}건)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-0">
                <div className="border-t border-gray-100">
                  {happyAnnouncements.map((a, i) => (
                    <div key={a.announcementId} className={`flex items-center justify-between px-4 py-3 text-sm ${i < happyAnnouncements.length - 1 ? 'border-b border-gray-100' : ''}`}>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">{a.title}</p>
                        <p className="text-xs text-gray-500">{a.region} · {a.status} · {a.applyEndDate ? a.applyEndDate + ' 마감' : ''}</p>
                      </div>
                      <button type="button" onClick={() => setModalAnnouncement(a)} className="ml-2 shrink-0 text-xs text-blue-600 hover:underline">상세보기</button>
                    </div>
                  ))}
                  <div className="flex justify-center border-t border-gray-100 py-3">
                    <a href="/site/announcements" className="text-sm font-medium text-blue-600 hover:underline">전체 공고 보러가기</a>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* 공공임대 공고 */}
          {(!selectedCat || selectedCat === '공공임대') && publicAnnouncements.length > 0 && (
            <AccordionItem value="공공임대" className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <AccordionTrigger className="px-4 py-3.5 hover:no-underline">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">공공임대</span>
                  <span className="text-sm font-medium text-gray-900">공공임대 공고 ({publicAnnouncements.length}건)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-0">
                <div className="border-t border-gray-100">
                  {publicAnnouncements.map((a, i) => (
                    <div key={a.announcementId} className={`flex items-center justify-between px-4 py-3 text-sm ${i < publicAnnouncements.length - 1 ? 'border-b border-gray-100' : ''}`}>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">{a.title}</p>
                        <p className="text-xs text-gray-500">{a.region} · {a.status} · {a.applyEndDate ? a.applyEndDate + ' 마감' : ''}</p>
                      </div>
                      <button type="button" onClick={() => setModalAnnouncement(a)} className="ml-2 shrink-0 text-xs text-blue-600 hover:underline">상세</button>
                    </div>
                  ))}
                  <div className="flex justify-center border-t border-gray-100 py-3">
                    <a href="/site/announcements" className="text-sm font-medium text-blue-600 hover:underline">전체 공고 보러가기</a>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* 대출 */}
          {(!selectedCat || selectedCat === '대출') && (
            <AccordionItem value="대출" className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <AccordionTrigger className="px-4 py-3.5 hover:no-underline">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">대출</span>
                  <span className="text-sm font-medium text-gray-900">추천 대출 ({FIXED_LOANS.length}건)</span>
                  <a href="/site/loan" onClick={e => e.stopPropagation()} className="ml-auto mr-2 inline-flex items-center rounded-md border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50">신청하기</a>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-0">
                <div className="border-t border-gray-100">
                  {FIXED_LOANS.map((loan, i) => (
                    <div key={i} className={`px-4 py-3 text-sm ${i < FIXED_LOANS.length - 1 ? 'border-b border-gray-100' : ''}`}>
                      <p className="font-medium text-gray-900">{loan.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{loan.desc}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

        </Accordion>
      </div>

      {/* 공고 상세 모달 */}
      <Dialog open={!!modalAnnouncement} onOpenChange={open => { if (!open) setModalAnnouncement(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{modalAnnouncement?.title}</DialogTitle>
          </DialogHeader>
          {modalAnnouncement && (
            <div className="space-y-0 divide-y divide-gray-100">
              <div className="flex gap-3 py-2.5 text-sm">
                <span className="w-16 shrink-0 font-medium text-muted-foreground">지역</span>
                <span className="flex-1 text-gray-700">{modalAnnouncement.region}</span>
              </div>
              <div className="flex gap-3 py-2.5 text-sm">
                <span className="w-16 shrink-0 font-medium text-muted-foreground">상태</span>
                <span className="flex-1 text-gray-700">{modalAnnouncement.status}</span>
              </div>
              <div className="flex gap-3 py-2.5 text-sm">
                <span className="w-16 shrink-0 font-medium text-muted-foreground">마감일</span>
                <span className="flex-1 text-gray-700">{modalAnnouncement.applyEndDate ?? '-'}</span>
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button asChild className="flex-1">
              <a href={`/site/announcements/${modalAnnouncement?.announcementId}`}>
                공고 상세보기 →
              </a>
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => setModalAnnouncement(null)}>닫기</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <Skeleton className="mb-4 h-20 w-full rounded-xl" />
      <div className="space-y-2.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  const isAuth = message.includes('자가진단');
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-100">
      <span className="text-4xl">{isAuth ? '📋' : '⚠️'}</span>
      <p className="max-w-sm text-center text-sm font-medium text-red-700">{message}</p>
      {isAuth ? (
        <Button onClick={() => window.location.href = '/site/step/condition-check'}>자가진단 하러 가기</Button>
      ) : (
        <Button onClick={() => window.location.reload()}>다시 시도</Button>
      )}
    </div>
  );
}