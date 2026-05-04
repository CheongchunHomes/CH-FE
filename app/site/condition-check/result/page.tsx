"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, AlertTriangle, AlertCircle, RotateCcw, ChevronRight } from "lucide-react";

// ─────────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────────
interface DiagnosisResult {
  houselessStatus: string;
  ageStatus: string;
  incomeStatus: string;
  assetStatus: string;
  subscriptionStatus: string;
  dependentStatus: string;
  subscriptionScore: number;
  publicRentalScore: number;
  jeonseScore: number;
  saleScore: number;
  strengthComment: string;
  weaknessComment: string;
  improveComment: string;
  recommendComment: string;
}

interface DiagnosisForm {
  birthDate: string;
  married: boolean;
  houseless: boolean;
  householdSep: boolean;
  disabilityYn: boolean;
  dependentCount: number;
  currentResidence: string;
  annualIncome: number;
  totalAsset: number;
  cashAsset: number;
  hasSubscription: boolean;
  subscriptionMonths: number;
  desiredCity: string;
  desiredDistrict: string;
  desiredArea: number;
  desiredType: string;
}

// ─────────────────────────────────────────────────────────
// 만원 → 억/만 단위 변환
// ─────────────────────────────────────────────────────────
const formatAsset = (value: number): string => {
  if (!value || value <= 0) return "-";
  // 백엔드에서 원 단위로 받으므로 만원 변환
  const uk = Math.floor(value / 10000);
  const man = value % 10000;
  if (uk > 0 && man > 0) return `${uk}억 ${man.toLocaleString()}만원`;
  if (uk > 0) return `${uk}억`;
  return `${value.toLocaleString()}만원`;
};

// ─────────────────────────────────────────────────────────
// 상태값 → 스타일/아이콘 매핑
// ─────────────────────────────────────────────────────────
const getStatusStyle = (status: string) => {
  switch (status) {
    case "충족":
      return {
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
        badge: "bg-green-100 text-green-700",
        icon: <Check className="w-4 h-4" />,
      };
    case "일부제한":
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        badge: "bg-amber-100 text-amber-700",
        icon: <AlertTriangle className="w-4 h-4" />,
      };
    case "보완필요":
      return {
        bg: "bg-orange-50",
        text: "text-orange-700",
        border: "border-orange-200",
        badge: "bg-orange-100 text-orange-700",
        icon: <AlertCircle className="w-4 h-4" />,
      };
    default: // 미충족
      return {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        badge: "bg-red-100 text-red-700",
        icon: <AlertCircle className="w-4 h-4" />,
      };
  }
};

// ─────────────────────────────────────────────────────────
// 점수 → 등급
// ─────────────────────────────────────────────────────────
const getGrade = (score: number) => {
  if (score >= 70) return { label: "높음", color: "text-green-600", bg: "bg-green-100" };
  if (score >= 40) return { label: "보통", color: "text-blue-600", bg: "bg-blue-100" };
  return { label: "낮음", color: "text-purple-600", bg: "bg-purple-100" };
};

// ─────────────────────────────────────────────────────────
// 도넛 차트 컴포넌트
// ─────────────────────────────────────────────────────────
const DonutChart = ({
  score,
  label,
  comment,
  color,
}: {
  score: number;
  label: string;
  comment: string;
  color: string;
}) => {
  const grade = getGrade(score);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
      <p className="text-sm font-bold text-gray-700 text-center">{label}</p>
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          {/* 배경 원 */}
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="10" />
          {/* 점수 원 */}
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000"
          />
        </svg>
        {/* 중앙 점수 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-gray-900">{score}</span>
          <span className="text-xs text-gray-500">점</span>
        </div>
      </div>
      {/* 등급 뱃지 */}
      <span className={`text-xs font-bold px-3 py-1 rounded-full ${grade.bg} ${grade.color}`}>
        {grade.label}
      </span>
      <p className="text-xs text-gray-500 text-center leading-relaxed">{comment}</p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// 메인 결과 페이지
// ─────────────────────────────────────────────────────────
export default function DiagnosisResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [form, setForm] = useState<DiagnosisForm | null>(null);

  useEffect(() => {
    // sessionStorage에서 결과 읽기
    const savedResult = sessionStorage.getItem("diagnosisResult");
    const savedForm = sessionStorage.getItem("diagnosisForm");
    if (!savedResult) {
      router.push("/site/condition-check");
      return;
    }
    setResult(JSON.parse(savedResult));
    if (savedForm) setForm(JSON.parse(savedForm));
  }, [router]);

  if (!result) return null;

  // 6개 자격 상태 목록
  const statusItems = [
    { icon: "🏠", label: "무주택 상태", status: result.houselessStatus, desc: form?.houseless ? "세대 구성원 모두 무주택으로 확인됩니다." : "주택을 보유하고 있습니다." },
    { icon: "👤", label: "연령 조건", status: result.ageStatus, desc: form?.birthDate ? `생년월일 기준, 청년 기준(만 19~39세) 조건입니다.` : "연령 조건을 확인해주세요." },
    { icon: "💰", label: "소득 기준", status: result.incomeStatus, desc: form?.annualIncome ? `연소득 ${formatAsset(form.annualIncome)}으로, 소득 기준을 확인했습니다.` : "소득 정보를 확인해주세요." },
    { icon: "🏦", label: "자산 기준", status: result.assetStatus, desc: form?.totalAsset ? `총 자산 ${formatAsset(form.totalAsset)}으로, 자산 기준을 확인했습니다.` : "자산 정보를 확인해주세요." },
    { icon: "👨‍👩‍👧", label: "부양가족 가점", status: result.dependentStatus, desc: `부양가족 ${form?.dependentCount ?? 0}명으로, 가점 항목에서 확인됩니다.` },
    { icon: "📋", label: "청약통장 상태", status: result.subscriptionStatus, desc: form?.hasSubscription ? `가입 기간 ${form.subscriptionMonths}개월로, 청약 조건을 확인했습니다.` : "청약통장 미보유 상태입니다." },
  ];

  // 4개 종합점수
  const scores = [
    { label: "청약 준비도", score: result.subscriptionScore, color: "#3b82f6", comment: "청약통장 가입기간이 짧아 준비도가 보통입니다." },
    { label: "공공임대 적합도", score: result.publicRentalScore, color: "#22c55e", comment: "소득 및 무주택 요건을 충족하여 적합도가 높습니다." },
    { label: "전세대출 가능성", score: result.jeonseScore, color: "#06b6d4", comment: "소득 대비 부채 부담이 적어 가능성이 높습니다." },
    { label: "분양형 당첨 가능성", score: result.saleScore, color: "#a855f7", comment: "청약통장 가입기간 및 가점 요소가 부족합니다." },
  ];

  // 코멘트 항목
  const comments = [
    { icon: "✅", label: "현재 강점", text: result.strengthComment, color: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
    { icon: "⚠️", label: "보완이 필요한 부분", text: result.weaknessComment, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
    { icon: "💡", label: "개선 제안", text: result.improveComment, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
    { icon: "🎯", label: "추천 방향", text: result.recommendComment, color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
  ];

  // 나의 체크리스트
  const summaryItems = [
    { label: "주거 형태",   value: form?.currentResidence || "" },
    { label: "총 자산",     value: form?.totalAsset ? formatAsset(form.totalAsset) : "" },
    { label: "현금성 자산", value: form?.cashAsset ? formatAsset(form.cashAsset) : "" },
    { label: "연소득",      value: form?.annualIncome ? formatAsset(form.annualIncome) : "" },
    { label: "무주택",      value: form?.houseless ? "무주택" : "" },
    { label: "세대 분리",   value: form?.householdSep ? "분리됨" : "" },
    { label: "생년월일",    value: form?.birthDate || "" },
    { label: "혼인 여부",   value: form?.married ? "기혼" : "" },
    { label: "장애 여부",   value: form?.disabilityYn ? "있음" : "" },
    { label: "부양가족",    value: form?.dependentCount ? `${form.dependentCount}명` : "" },
    { label: "청약통장",    value: form?.hasSubscription ? `${form.subscriptionMonths}개월` : "" },
    { label: "희망 도시",   value: form?.desiredCity || "" },
    { label: "희망 지역구", value: form?.desiredDistrict || "" },
    { label: "희망 면적",   value: form?.desiredArea ? `${form.desiredArea}㎡` : "" },
    { label: "희망 유형",   value: form?.desiredType || "" },
  ].filter((item) => item.value !== "");

  return (
    <main className="bg-gray-50 min-h-screen">

      {/* ── 헤더 ── */}
      <div className="bg-white border-b px-4 md:px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">주거 자격 진단 결과</h1>
            <p className="text-sm text-gray-500 mt-1">입력하신 정보를 바탕으로 주거 자격 상태와 준비도를 진단했습니다.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/site/condition-check")}
            className="flex items-center gap-2 text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">다시 진단하기</span>
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">

        {/* ── 모바일: 나의 체크리스트 확인 드롭다운 ── */}
        <details className="md:hidden mb-4 bg-white border rounded-xl overflow-hidden shadow-sm">
          <summary className="px-4 py-3 font-semibold text-sm text-gray-700 cursor-pointer">
            📋 나의 체크리스트 ({summaryItems.length}개)
          </summary>
          <div className="px-4 pb-4 grid grid-cols-2 gap-2">
            {summaryItems.map((item, i) => (
              <div key={i} className="text-xs">
                <span className="text-gray-400">{item.label}: </span>
                <span className="font-semibold text-gray-700">{item.value}</span>
              </div>
            ))}
          </div>
        </details>

        {/* ── 메인 레이아웃: 좌측 결과 / 우측 요약 ── */}
        <div className="flex flex-col md:grid md:grid-cols-[1fr_260px] gap-6">

          {/* ── 좌측: 결과 섹션 ── */}
          <div className="space-y-6 min-w-0">

            {/* 섹션 1: 기본 자격 상태 */}
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-5 md:p-6">
                <h2 className="text-base md:text-lg font-bold text-gray-900 mb-4">
                  1. 기본 자격 상태 요약
                </h2>
                <div className="space-y-3">
                  {statusItems.map((item, i) => {
                    const style = getStatusStyle(item.status);
                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-between p-3 md:p-4 rounded-xl border ${style.border} ${style.bg}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xl flex-shrink-0">{item.icon}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-800">{item.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5 truncate md:whitespace-normal">{item.desc}</p>
                          </div>
                        </div>
                        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ml-2 ${style.badge}`}>
                          {style.icon}
                          {item.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 섹션 2: 주거 준비도 및 가능성 요약 */}
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-5 md:p-6">
                <h2 className="text-base md:text-lg font-bold text-gray-900 mb-4">
                  2. 주거 준비도 및 가능성 요약
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {scores.map((s, i) => (
                    <DonutChart
                      key={i}
                      score={s.score}
                      label={s.label}
                      comment={s.comment}
                      color={s.color}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 섹션 3: 진단 코멘트 */}
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-5 md:p-6">
                <h2 className="text-base md:text-lg font-bold text-gray-900 mb-4">
                  3. 진단 코멘트 및 개선 포인트
                </h2>
                <div className="space-y-3">
                  {comments.map((c, i) => (
                    <div key={i} className={`flex gap-3 p-4 rounded-xl border ${c.border} ${c.bg}`}>
                      <span className="text-lg flex-shrink-0">{c.icon}</span>
                      <div>
                        <p className={`text-sm font-bold ${c.color}`}>{c.label}</p>
                        <p className="text-sm text-gray-600 mt-1">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 섹션 4: 다음 단계 배너 */}
            <Card className="border border-blue-200 bg-blue-50 shadow-sm">
              <CardContent className="p-5 md:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📋</span>
                    <div>
                      <p className="font-bold text-gray-900">다음 단계</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        진단 결과를 바탕으로 나에게 맞는 주거 지원 제도를 추천해드릴게요!
                      </p>
                    </div>
                  </div>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 w-full sm:w-auto"
                    onClick={() => router.push("/site/simulator")}
                  >
                    제도 추천 받기
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* ── 우측: 나의 체크리스트 (데스크탑만) ── */}
          <aside className="hidden md:block">
            <Card className="rounded-lg border bg-card text-card-foreground sticky top-8 shadow-lg border-none">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4 border-b pb-3">
                  <h3 className="font-bold text-sm text-gray-800">나의 체크리스트</h3>
                  <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                    {summaryItems.length}개
                  </span>
                </div>

                <ul className="space-y-2.5">
                  {summaryItems.map((item, i) => (
                    <li key={i} className="flex justify-between gap-2 text-xs">
                      <span className="text-gray-400 shrink-0">{item.label}</span>
                      <span className="font-semibold text-gray-700 text-right">{item.value}</span>
                    </li>
                  ))}
                </ul>

                {/* 다시하기 버튼 */}
                <button
                  onClick={() => router.push("/site/condition-check")}
                  className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  다시 진단하기
                </button>
              </CardContent>
            </Card>
          </aside>

        </div>
      </div>
    </main>
  );
}
