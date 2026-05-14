'use client';

import { useEffect, useState } from 'react';
import PolicyCard from './components/PolicyCard';
import {get, ApiError} from '@/lib/api'
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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

const API_BASE = '/api/recommend/summary';

const CAT_DESCRIPTION: Record<string, string> = {
  '행복주택': '청년, 대학생, 사회초년생 등을 대상으로 공급되는 공공임대주택입니다. 시세 대비 저렴한 임대료로 거주할 수 있으며, 교통과 생활 환경을 고려한 지역에 공급됩니다. 주거비 부담을 줄이고 안정적인 주거 환경을 지원합니다.',
  '공공임대': '무주택 청년 및 서민을 위해 공급되는 임대주택입니다. 일정 소득 및 자산 기준 충족 시 신청 가능하며, 비교적 낮은 임대료와 안정적인 거주 기간을 제공합니다. 다양한 유형의 공공주택 정보를 확인할 수 있습니다.',
};


export interface Recoentity {
  id: number;
  name: string;
  category: string;
  minAge: number;
  maxAge: number;
  maxIncome: number;
  region: string;
  description: string;
  applyUrl: string;
  active: boolean;
}

export interface UserProfile {
  profileId: number;
  userId: number;
  birthDate: string;
  isMarried: boolean;
  isHouseless: boolean;
  currentResidence: string;
  annualIncome: number;
  subscriptionMonths: number;
  desiredCity: string;
  desiredDistrict: string;
}

export interface DiagnosisResult {
  diagnosisResultId: number;
  userId: number;
  homelessStatus: string;
  ageStatus: string;
  incomeStatus: string;
  subscriptionReadinessScore: number;
  publicRentalFitScore: number;
  jeonseloanScore: number;
  saleSubscriptionScore: number;
  subscriptionReadinessGrade: string;
  publicRentalFitGrade: string;
  jeonseloanGrade: string;
  saleSubscriptionGrade: string;
}

interface Summary {
  profile: UserProfile | null;
  diagnosis: DiagnosisResult | null;
  policies: Recoentity[];
}

// 카테고리별 Badge variant 매핑
// const CAT_COLOR: Record<string, string> = {
//   '행복주택': 'border border-blue-200 bg-blue-50 text-blue-600',
//   '공공임대': 'border border-blue-200 bg-blue-50 text-blue-600',
//   '대출':     'border border-blue-200 bg-blue-50 text-blue-600',
// };

const GRADE_COLOR: Record<string, string> = {
  A: 'text-green-600',
  B: 'text-blue-600',
  C: 'text-pink-600',
  D: 'text-red-600',
};

const GRADE_PROGRESS_COLOR: Record<string, string> = {
  A: '#16A34A',
  B: '#1976D2',
  C: '#db287c',
  D: '#E53935',
};

const CATEGORIES = ['행복주택', '공공임대', '대출'];

const STEPS = [
  { label: 'step1. 내 조건 진단', active: false },
  { label: 'step2. 제도 추천', active: true },
  { label: 'step3. 대출 계산', active: false },
  { label: 'step4. 집·공고 확인', active: false },
  { label: 'step5. 계약', active: false },
];

export default function RecommendPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalPolicy, setModalPolicy] = useState<Recoentity | null>(null);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  useEffect(() => {
    get<Summary>(API_BASE, {cache: 'no-store'})
    .then((data) => {setSummary(data); setLoading(false);})
    .catch(() => {setError('서버에 연결할 수 없습니다.'); setLoading(false);});
  }, []);

  if (loading) return <LoadingScreen />;
  if (error || !summary) return <ErrorScreen message={error ?? '알 수 없는 오류'} />;

  const { policies, diagnosis } = summary;

  const scores = diagnosis ? [
    { label: '청약준비도',      score: diagnosis.subscriptionReadinessScore, grade: diagnosis.subscriptionReadinessGrade },
    { label: '공공임대 적합도', score: diagnosis.publicRentalFitScore,       grade: diagnosis.publicRentalFitGrade },
    { label: '전세대출 가능성', score: diagnosis.jeonseloanScore,            grade: diagnosis.jeonseloanGrade },
    { label: '분양청약 가능성', score: diagnosis.saleSubscriptionScore,      grade: diagnosis.saleSubscriptionGrade },
  ] : null;

  const activeCats = CATEGORIES.filter(c => policies.some(p => p.category === c));

  return (
    <div className="min-h-screen bg-gray-100 font-sans">

          {/* 스텝 바 */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-5 py-4">
          <div className="flex items-center justify-center">
            {STEPS.map((step, i) => (
              <div key={step.label} className="flex items-center">
                {/* 스텝 아이템 */}
                <div className="flex flex-col items-center gap-1.5">
                  {/* 원형 아이콘 */}
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                      step.active
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-300 bg-white text-gray-400'
                    }`}
                  >
                    {/* 체크 아이콘 */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-2.5 w-2.5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>

                  {/* 텍스트 */}
                  <div className="flex flex-col items-center">
                    <span className={`text-[10px] ${step.active ? 'text-blue-600' : 'text-gray-400'}`}>
                      Step {i + 1}
                    </span>
                    <span
                      className={`text-xs ${
                        step.active ? 'font-bold text-gray-900' : 'font-normal text-gray-400'
                      }`}
                    >
                      {step.label.replace(/step\d+\. /i, '')}
                    </span>
                  </div>
                </div>

                {/* 연결선 */}
                {i < STEPS.length - 1 && (
                  <div className="mx-2 mb-6 h-[2px] w-12 bg-gray-200" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-5 py-5">

        {/* 점수 카드 */}
        {scores && (
          <div className="mb-4 grid grid-cols-4 gap-2.5">
            {scores.map(s => (
              <Card key={s.label}>
                <CardContent className="p-3.5">
                  <p className="mb-2 text-xs text-muted-foreground">{s.label}</p>
                  <div className="mb-2.5 flex items-baseline gap-1">
                    <span className={`text-2xl font-medium ${GRADE_COLOR[s.grade] ?? 'text-gray-700'}`}>
                      {s.score}
                    </span>
                    <span className="text-xs text-muted-foreground">점</span>
                    <span className={`ml-auto text-base font-medium ${GRADE_COLOR[s.grade] ?? 'text-gray-700'}`}>
                      {s.grade}
                    </span>
                  </div>
                  {/* Progress는 색상을 CSS변수로 직접 제어 */}
                  <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${s.score}%`,
                        background: GRADE_PROGRESS_COLOR[s.grade] ?? '#1976D2',
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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

        {/* 카테고리 Accordion */}
        <Accordion type="single" collapsible className="space-y-2.5">
          {CATEGORIES
          .filter(cat => !selectedCat || cat === selectedCat)
          .map(cat => {
            const list = policies.filter(p => p.category === cat);
            if (!list.length) return null;

            return (
              <AccordionItem
                key={cat}
                value={cat}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white"
              >
                <AccordionTrigger className="px-4 py-3.5 hover:no-underline">
                  <div className="flex items-center gap-2.5">
                    {/* // Accordion 트리거 안 span */}
                    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
                      {cat}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {cat} 신청 가능 ({list.length}건)
                    </span>
                    {cat === '대출' && (
                      <a
                      href="/site/loan"
                      onClick={(e) => e.stopPropagation()}
                      className="ml-auto mr-2 inline-flex items-center rounded-md border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                       >
                       신청하기 
                       </a>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="border-t border-gray-100">
                    {list.map((policy, i) => (
                      <PolicyCard
                        key={`${policy.name}-${i}`}
                        policy={policy}
                        isLast={i === list.length -1}
                        onDetail={() => setModalPolicy(policy)}
                        />
                    ))}
                    {/* 전체보기 버튼  : 대출 제외 */}
                    {cat !== '대출' && (
                      <div className="flex justify-center border-t border-gray-100 py-3">
                        <a
                          href="/site/announcements"
                          className="text-sm font-medium text-blue-600 hover:underline">
                          전체 공고 보러가기
                          </a>
                        </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      {/* 상세보기 Dialog */}
      <Dialog open={!!modalPolicy} onOpenChange={open => { if (!open) setModalPolicy(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{modalPolicy?.name}</DialogTitle>
          </DialogHeader>

          
           {modalPolicy && (
              <div className="space-y-0 divide-y divide-gray-100">
                <div className="flex gap-3 py-2.5 text-sm">
                  <span className="w-16 shrink-0 font-medium text-muted-foreground">카테고리</span>
                  <span className="flex-1 leading-relaxed text-gray-700">
                    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
                      {modalPolicy.category}
                    </span>
                  </span>
                </div>
                <div className="flex gap-3 py-2.5 text-sm">
                  <span className="w-16 shrink-0 font-medium text-muted-foreground">소개</span>
                  <span className="flex-1 leading-relaxed text-gray-700">
                    {CAT_DESCRIPTION[modalPolicy.category] ?? modalPolicy.description}
                  </span>
                </div>
              </div>
            )}

          <div className="flex gap-2 pt-2">
            {modalPolicy?.applyUrl && (
              <Button asChild className="flex-1">
                <a href="/site/map">
                  지도에서 매물 보기 →
                </a>
              </Button>
            )}
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setModalPolicy(null)}
            >
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <div className="mb-4 grid grid-cols-4 gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3.5 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-1 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-100">
      <span className="text-4xl">⚠️</span>
      <p className="max-w-sm text-center text-sm font-medium text-red-600">{message}</p>
      <Button onClick={() => window.location.reload()}>다시 시도</Button>
    </div>
  );
}