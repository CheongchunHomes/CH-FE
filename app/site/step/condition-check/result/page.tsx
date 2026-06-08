"use client";

import { post, get } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { Check, AlertTriangle, RotateCcw, History, ChevronRight, MapPin, Lightbulb, ClipboardList } from "lucide-react";
import { DiagnosisForm, DiagnosisResult, RecommendationResponse, sanitizeDiagnosisForm, formatAsset } from "@/lib/diagnosisUtils";
import React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

// ─────────────────────────────────────────────────────────
// 라벨 상수
// ─────────────────────────────────────────────────────────
const EMPLOYMENT_STATUS_LABEL: Record<string, string> = {
  STUDENT: "학생", JOB_SEEKER: "구직중", NEWCOMER: "사회초년생", EMPLOYED: "재직중", OTHER: "기타",
};
const EMPLOYMENT_PERIOD_LABEL: Record<string, string> = {
  UNDER_1: "1년 미만", YEAR_1_3: "1~3년", YEAR_3_5: "3~5년", OVER_5: "5년 이상",
};
const MARRIAGE_PERIOD_LABEL: Record<string, string> = {
  WITHIN_7: "7년 이내", OVER_7: "7년 초과",
};

// ─────────────────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────────────────

// 만 39세까지 남은 기간 계산
const calcDday = (birthDate: string): { years: number; months: number } => {
  const today = new Date();
  const birth = new Date(birthDate);
  const age39 = new Date(birth.getFullYear() + 39, birth.getMonth(), birth.getDate());
  if (today > age39) return { years: 0, months: 0 };
  const years = age39.getFullYear() - today.getFullYear();
  const months = age39.getMonth() - today.getMonth();
  return { years, months: months < 0 ? months + 12 : months };
};

// 조건 기반 핵심 키워드 생성
const getKeywords = (form: DiagnosisForm, result: DiagnosisResult): string[] => {
  const tags: string[] = [];
  if (form.householdSep)                              tags.push("세대분리완료");
  if (form.houseless)                                 tags.push("무주택완성");
  if (result.incomeStatus === "충족")                 tags.push("소득기준충족");
  if (form.employmentStatus === "NEWCOMER")           tags.push("사회초년생우대");
  if (form.disabilityYn)                              tags.push("장애인특공");
  if (form.hasSubscription && form.subscriptionMonths >= 24) tags.push("청약1순위");
  if (form.desiredCity)                               tags.push(`${form.desiredCity}타겟`);
  if (form.married)                                   tags.push("신혼부부특공");
  if (form.hasYoungChild)                             tags.push("영유아자녀");
  if (form.singleParent)                              tags.push("한부모우선");
  return tags;
};

// 상태값 → 아이콘 매핑
const getStatusIcon = (status: string) => {
  const configs: Record<string, { bg: string; icon: React.ReactNode; label: string }> = {
    "충족":     { bg: "bg-blue-600",   icon: <Check className="w-3 h-3 text-white stroke-[3]" />, label: "충족" },
    "일부제한": { bg: "bg-amber-100",  icon: <span className="text-amber-600 text-xs font-bold">!</span>, label: "일부제한" },
    "보완필요": { bg: "bg-orange-100", icon: <span className="text-orange-600 text-xs font-bold">!</span>, label: "보완필요" },
  };
  const cfg = configs[status] ?? { bg: "bg-red-100", icon: <span className="text-red-600 text-xs font-bold">✕</span>, label: "미충족" };
  return (
    <span className="flex items-center gap-1.5 justify-end">
      <span className="text-xs font-bold text-gray-600">{cfg.label}</span>
      <span className={`flex items-center justify-center w-7 h-7 rounded-full shrink-0 ${cfg.bg}`}>
        {cfg.icon}
      </span>
    </span>
  );
};

// 점수 → 등급
const getGrade = (score: number) => {
  if (score >= 70) return { label: "높음", color: "text-green-600", bg: "bg-green-100" };
  if (score >= 40) return { label: "보통", color: "text-blue-600", bg: "bg-blue-100" };
  return { label: "낮음", color: "text-purple-600", bg: "bg-purple-100" };
};

// 섹션 번호 컴포넌트
const SectionNumber = ({ num }: { num: number }) => (
  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-bold shrink-0">
    {num}
  </span>
);

// 도넛 차트 컴포넌트
const DonutChart = ({ score, label, comment, color }: { score: number; label: string; comment: string; color: string }) => {
  const grade = getGrade(score);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
      <p className="text-sm font-bold text-gray-700 text-center">{label}</p>
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="10" />
          <circle cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-gray-900">{score}</span>
          <span className="text-xs text-gray-500">점</span>
        </div>
      </div>
      <span className={`text-xs font-bold px-3 py-1 rounded-full ${grade.bg} ${grade.color}`}>{grade.label}</span>
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
  const [isLoading, setIsLoading] = useState(true);

  // 제도추천 상태
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [recLoading, setRecLoading] = useState(false);

  /**
   * 제도추천 채점 API 호출
   * - 프로필 기반으로 채점 (세션 저장 제거)
   * - 추천 파트 페이지는 GET /recommendation/calculate/profile 사용
   */
  const loadRecommendation = async (formData: DiagnosisForm) => {
    setRecLoading(true);
    try {
      const data = await post<RecommendationResponse>(
        "/api/recommendation/calculate",
        sanitizeDiagnosisForm(formData)
      );
      setRecommendation(data);
    } catch {
      // 추천 실패해도 진단 결과는 정상 표시
    } finally {
      setRecLoading(false);
    }
  };

  /**
   * 페이지 진입 시 DB에서 프로필 + 진단 결과 조회
   * - 세션 의존 제거, DB가 source of truth
   * - 프로필 없으면 진단 폼으로 리다이렉트
   */
  useEffect(() => {
    window.scrollTo(0, 0)
    const load = async () => {
      try {
        // 저장된 프로필 조회
        const profile = await get<DiagnosisForm>("/api/diagnosis/profile");

        if (!profile) {
          router.push("/site/step/condition-check");
          return;
        }
        // 원 → 만원 변환 후 세팅
        setForm({
          ...profile,
          annualIncome: profile.annualIncome ? Math.floor(profile.annualIncome / 10000) : 0,
          totalAsset:   profile.totalAsset   ? Math.floor(profile.totalAsset   / 10000) : 0,
          cashAsset:    profile.cashAsset    ? Math.floor(profile.cashAsset    / 10000) : 0,
        });

        // 진단 결과 계산
        const diagnosisResult = await post<DiagnosisResult>(
          "/api/diagnosis/simulate",
          sanitizeDiagnosisForm(profile)
        );
        setResult(diagnosisResult);

        // 추천 채점
        loadRecommendation(profile);
      } catch {
        // 프로필 없으면 진단 폼으로 이동
        router.push("/site/step/condition-check");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [router]);

  // 다시 진단하기 - 폼으로 이동 (DB 프로필은 유지, 폼에서 덮어쓰기)
  const handleReset = () => {
    router.push("/site/step/condition-check");
  };

  // 이전 진단 불러오기 - 진단 폼으로 이동 (DB에서 자동 복원)
  const handleRestoreDiagnosis = () => {
    router.push("/site/step/condition-check");
  };

// 로딩 중이거나 결과/프로필 없으면 스피너 표시
  if (isLoading || !result || !form || recLoading) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500 font-medium">진단 결과를 불러오는 중입니다...</p>
    </div>
  );

  const getScoreComment = (label: string, score: number): string => {
    if (label === "청약 준비도") {
      if (score >= 70) return "청약통장 조건이 잘 갖춰져 있어요"
      if (score >= 40) return "청약통장 가입기간을 늘려보세요"
      return "청약통장 개설이 필요해요"
    }
    if (label === "공공임대 적합도") {
      if (score >= 70) return "공공임대 신청 조건을 잘 충족해요"
      if (score >= 40) return "일부 조건 보완이 필요해요"
      return "소득·무주택 조건을 확인해보세요"
    }
    if (label === "전세대출 가능성") {
      if (score >= 70) return "전세대출 가능성이 높아요"
      if (score >= 40) return "소득 대비 부채 비율을 확인해보세요"
      return "전세대출 조건이 부족해요"
    }
    if (label === "분양형 당첨 가능성") {
      if (score >= 70) return "청약 가점이 잘 쌓여있어요"
      if (score >= 40) return "가점 항목을 더 채워보세요"
      return "청약통장과 가점 준비가 필요해요"
    }
    return ""
  }

  // ─────────────────────────────────────────────────────────
  // 렌더링 데이터 준비
  // ─────────────────────────────────────────────────────────

  const statusItems = [
    { label: "무주택 상태",   status: result.houselessStatus,    desc: form?.houseless ? "세대 구성원 모두 무주택으로 확인됩니다." : "주택을 보유하고 있습니다." },
    { label: "연령 조건",     status: result.ageStatus,          desc: form?.birthDate ? "생년월일 기준, 청년 기준(만 19~39세) 조건입니다." : "연령 조건을 확인해주세요." },
    { label: "소득 기준",     status: result.incomeStatus,       desc: form?.annualIncome ? `연소득 ${formatAsset(form.annualIncome)}으로, 소득 기준을 확인했습니다.` : "소득 정보를 확인해주세요." },
    { label: "자산 기준",     status: result.assetStatus,        desc: form?.totalAsset ? `총 자산 ${formatAsset(form.totalAsset)}으로, 자산 기준을 확인했습니다.` : "자산 정보를 확인해주세요." },
    { label: "부양가족",      status: result.dependentStatus,    desc: `부양가족 ${form?.dependentCount ?? 0}명으로, 가점 항목에서 확인됩니다.` },
    { label: "청약통장 상태", status: result.subscriptionStatus, desc: form?.hasSubscription ? `가입 기간 ${form.subscriptionMonths}개월로, 청약 조건을 확인했습니다.` : "청약통장 미보유 상태입니다." },
  ];

  const scores = [
    { label: "청약 준비도",       score: result.subscriptionScore, color: "#3b82f6", comment: getScoreComment("청약 준비도",       result.subscriptionScore) },
    { label: "공공임대 적합도",   score: result.publicRentalScore,  color: "#22c55e", comment: getScoreComment("공공임대 적합도",   result.publicRentalScore)  },
    { label: "전세대출 가능성",   score: result.jeonseScore,        color: "#06b6d4", comment: getScoreComment("전세대출 가능성",   result.jeonseScore)        },
    { label: "분양형 당첨 가능성", score: result.saleScore,         color: "#a855f7", comment: getScoreComment("분양형 당첨 가능성", result.saleScore)          },
  ]

  const dday = form?.birthDate ? calcDday(form.birthDate) : null;
  const keywords = form ? getKeywords(form, result) : [];
  const metItems = statusItems.filter(item => item.status === "충족");
  const unmetItems = statusItems.filter(item => item.status !== "충족");

  // 개인화 전략 필드 정의
  const STRATEGY_FIELDS = [
    { key: "desiredDistrict" as const, deps: ["desiredCity"] as const, format: () => `${form?.desiredDistrict}(${form?.desiredCity})` },
    { key: "desiredArea" as const,     deps: [] as const,              format: () => `${form?.desiredArea}㎡` },
    { key: "annualIncome" as const,    deps: [] as const,              format: () => `연소득 ${formatAsset(form?.annualIncome ?? 0)}` },
  ];

  const strategyText = (() => {
    if (!form) return result.recommendComment;
    const parts = STRATEGY_FIELDS
      .filter(({ key, deps }) => form[key] != null && form[key] !== 0 && deps.every((d) => !!form[d]))
      .map(({ format }) => format());
    if (parts.length === 0) return result.recommendComment;
    return `${parts.join(" · ")} 조건으로 진단했습니다. ${result.recommendComment}`;
  })();

  const summaryItems = [
    { label: "주거 형태",   value: form?.currentResidence || "" },
    { label: "총 자산",     value: form?.totalAsset ? formatAsset(form.totalAsset) + " 이하" : "" },
    { label: "현금성 자산", value: form?.cashAsset ? formatAsset(form.cashAsset) : "" },
    { label: "연소득",      value: form?.annualIncome ? formatAsset(form.annualIncome) : "" },
    { label: "무주택",      value: form?.houseless ? "무주택" : "" },
    { label: "무주택 기간", value: form.houseless === true && form.houselessYears > 0 ? `${form.houselessYears}년` : "" },
    { label: "세대 분리",   value: form?.householdSep ? "분리됨" : "" },
    { label: "생년월일",    value: form?.birthDate || "" },
    { label: "혼인 여부",   value: form?.married ? "기혼" : "" },
    { label: "장애 여부",   value: form?.disabilityYn ? "있음" : "" },
    { label: "부양가족",    value: form?.dependentCount ? `${form.dependentCount}명` : "" },
    { label: "청약통장",    value: form?.hasSubscription ? `${form.subscriptionMonths}개월` : "" },
    { label: "희망 도시",   value: form?.desiredCity || "" },
    { label: "희망 지역구", value: form?.desiredDistrict || "" },
    { label: "희망 면적",   value: form?.desiredArea ? `${form.desiredArea}㎡` : "" },
    { label: "취업 상태",   value: form?.employmentStatus ? (EMPLOYMENT_STATUS_LABEL[form.employmentStatus] ?? "") : "" },
    { label: "재직 기간",   value: form?.employmentPeriod ? (EMPLOYMENT_PERIOD_LABEL[form.employmentPeriod] ?? "") : "" },
    { label: "결혼 계획",   value: form?.marriagePlan ? "있음" : "" },
    { label: "혼인 기간",   value: form?.marriagePeriod ? (MARRIAGE_PERIOD_LABEL[form.marriagePeriod] ?? "") : "" },
    { label: "영유아 자녀", value: form?.hasYoungChild ? "있음" : "" },
    { label: "한부모 가족", value: form?.singleParent ? "해당" : "" },
    { label: "희망 유형",   value: form?.desiredType || "" },
  ].filter((item) => item.value !== "");

  return (
    <TooltipProvider>
      <main className="bg-gray-50 min-h-screen">

        {/* 헤더 */}
        <div className="bg-white border-b py-6">
          <div className="max-w-7xl mx-auto px-4 md:px-8 flex justify-between items-start">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">주거 자격 진단 결과</h1>
              <p className="text-sm text-gray-500 mt-1">입력하신 정보를 바탕으로 주거 자격 상태와 준비도를 진단했습니다.</p>
            </div>
            <Button variant="outline" onClick={handleReset} className="flex items-center gap-2 text-sm">
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">다시 진단하기</span>
            </Button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">

          {/* 모바일: 체크리스트 */}
          <details className="md:hidden mb-4 bg-white border rounded-xl overflow-hidden shadow-sm">
            <summary className="px-4 py-3 font-semibold text-sm text-gray-700 cursor-pointer flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-gray-500" />
              나의 체크리스트 ({summaryItems.length}개)
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

          <div className="flex flex-col md:grid md:grid-cols-[1fr_260px] gap-6">

            {/* 좌측: 결과 섹션 */}
            <div className="space-y-6 min-w-0">
              <Card className="shadow-sm">
                <CardContent className="p-5 md:p-8 space-y-6">

                  {/* 1. 기본 자격 상태 */}
                  <div>
                    <h2 className="flex items-center gap-2 text-base md:text-lg font-bold text-gray-900 mb-4">
                      <SectionNumber num={1} /> 기본 자격 상태
                    </h2>
                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full text-sm">
                        <tbody>
                          {statusItems.map((item, i) => {
                            const isMet = item.status === "충족";
                            return (
                              <tr key={i} className={`border-b last:border-0 transition-colors ${isMet ? "bg-blue-100" : i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                                <td className="px-4 py-3 w-8">
                                  <span className="flex items-center justify-center w-2 h-2 rounded-sm bg-blue-200 shrink-0 mx-auto" />
                                </td>
                                <td className="px-2 py-3 font-medium text-gray-800">{item.label}</td>
                                <td className="px-2 py-3 text-xs hidden sm:table-cell text-gray-500">{item.desc}</td>
                                <td className="px-4 py-4 text-right">{getStatusIcon(item.status)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 준비도 점수 */}
                  <div className="rounded-lg border px-4 py-4">
                    <p className="text-sm font-bold text-gray-700 mb-3">주거 준비도 점수</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {scores.map((s, i) => (
                        <DonutChart key={i} score={s.score} label={s.label} comment={s.comment} color={s.color} />
                      ))}
                    </div>
                  </div>

                  <div className="border-t" />

                  {/* 2. 진단 코멘트 */}
                  <div>
                    <h2 className="flex items-center gap-2 text-base md:text-lg font-bold text-gray-900 mb-4">
                      <SectionNumber num={2} /> 진단 코멘트
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      {/* 레이더 차트 */}
                      <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                        <p className="text-xs font-bold text-gray-500 mb-2 text-center">나의 주거 준비 현황</p>
                        <ResponsiveContainer width="100%" height={220}>
                          <RadarChart data={[
                            { subject: "무주택", value: result.houselessStatus === "충족" ? 100 : result.houselessStatus === "일부제한" ? 60 : 20 },
                            { subject: "연령",   value: result.ageStatus === "충족" ? 100 : result.ageStatus === "일부제한" ? 60 : 20 },
                            { subject: "소득",   value: result.incomeStatus === "충족" ? 100 : result.incomeStatus === "일부제한" ? 60 : 20 },
                            { subject: "자산",   value: result.assetStatus === "충족" ? 100 : result.assetStatus === "일부제한" ? 60 : 20 },
                            { subject: "부양",   value: result.dependentStatus === "충족" ? 100 : result.dependentStatus === "일부제한" ? 60 : 20 },
                            { subject: "청약",   value: result.subscriptionStatus === "충족" ? 100 : result.subscriptionStatus === "일부제한" ? 60 : 20 },
                          ]}>
                            <PolarGrid stroke="#f3f4f6" />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* 키워드 + D-Day + 충족/미충족 */}
                      <div className="flex flex-col gap-3">
                        <div className="p-3 rounded-xl border border-gray-100 bg-white shadow-sm">
                          <p className="text-xs text-gray-400 mb-2">나의 키워드</p>
                          <div className="flex flex-wrap gap-1.5">
                            {keywords.map((tag, i) => (
                              <span key={i} className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">#{tag}</span>
                            ))}
                          </div>
                        </div>

                        {dday && (dday.years > 0 || dday.months > 0) && (
                          <div className="p-3 rounded-xl border border-gray-100 bg-white shadow-sm">
                            <p className="text-xs text-gray-400">청년 혜택 종료까지</p>
                            <p className="text-lg font-bold text-blue-600 mt-0.5">
                              {dday.years > 0 ? `${dday.years}년 ` : ""}{dday.months}개월 남음
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 flex-1">
                          <div className="p-3 rounded-xl bg-white border border-gray-100 shadow-sm">
                            <p className="text-xs font-bold text-blue-700 mb-1.5 flex items-center gap-1">
                              <Check className="w-3 h-3" /> 충족
                            </p>
                            {metItems.map((item, i) => (
                              <p key={i} className="text-xs text-gray-600 leading-relaxed">{item.label}</p>
                            ))}
                          </div>
                          <div className="p-3 rounded-xl bg-white border border-gray-100 shadow-sm">
                            <p className="text-xs font-bold text-amber-700 mb-1.5 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> 보완
                            </p>
                            {unmetItems.length > 0 ? unmetItems.map((item, i) => (
                              <p key={i} className="text-xs text-gray-600 leading-relaxed">{item.label}</p>
                            )) : (
                              <p className="text-xs text-gray-400">모두 충족!</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 개인화 전략 */}
                    <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
                      <p className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-blue-500" /> 나의 맞춤 전략
                      </p>
                      <p className="text-sm text-gray-600 leading-relaxed">{strategyText}</p>
                      {result.improveComment && (
                        <p className="text-xs text-gray-500 mt-2 leading-relaxed flex items-start gap-1.5">
                          <Lightbulb className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                          {result.improveComment}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="border-t" />

                  {/* 3. 맞춤 제도 */}
                  <div>
                    <h2 className="flex items-center gap-2 text-base md:text-lg font-bold text-gray-900 mb-4">
                      <SectionNumber num={3} /> 나에게 맞는 맞춤 제도
                    </h2>
                    {recLoading ? (
                      <div className="space-y-2">
                        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <ClipboardList className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">
                              {recommendation
                                ? `${recommendation.results.filter(r => r.grade === "적극추천" || r.grade === "추천가능").length}개 제도 추천 가능`
                                : "제도 추천 결과"}
                            </p>
                            <p className="text-sm text-gray-500 mt-0.5">진단 결과를 바탕으로 맞춤 제도를 확인해보세요.</p>
                          </div>
                        </div>
                        <Button
                          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 w-full sm:w-auto font-bold shrink-0"
                          onClick={() => router.push("/site/step/recommend")}
                        >
                          제도 상세 보러가기
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                </CardContent>
              </Card>
            </div>

            {/* 우측: 체크리스트 (데스크탑만) */}
            <aside className="hidden md:block">
              <Card className="sticky top-8 shadow-lg border-none">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4 border-b pb-3">
                    <h3 className="font-bold text-sm text-gray-800">나의 체크리스트</h3>
                    <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">{summaryItems.length}개</span>
                  </div>
                  <ul className="space-y-2.5">
                    {summaryItems.map((item, i) => (
                      <li key={i} className="flex justify-between gap-2 text-xs">
                        <span className="text-gray-400 shrink-0">{item.label}</span>
                        <span className="font-semibold text-gray-700 text-right">{item.value}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant="outline"
                    onClick={handleRestoreDiagnosis}
                    className="mt-5 w-full flex items-center justify-center gap-2 text-sm"
                  >
                    <History className="w-4 h-4" />
                    이전 진단 불러오기
                  </Button>
                </CardContent>
              </Card>
            </aside>

          </div>
        </div>
      </main>
    </TooltipProvider>
  );
}
