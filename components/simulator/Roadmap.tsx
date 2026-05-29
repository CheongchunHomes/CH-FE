"use client"

import { useState, useEffect, useMemo } from "react"
import { get, post }  from "@/lib/api"
import { useRouter }  from "next/navigation"
import { DiagnosisForm } from "@/lib/diagnosisUtils"
import { Skeleton }   from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Sparkles, ChevronRight, RotateCcw, Zap, Home, ChevronDown, MapPin } from "lucide-react"
import { RoadmapParsed } from "@/app/api/simulator/roadmap/route"
import {
  formatManwon,
  parseSession,
  HousingSnapshot,
  FinanceSnapshot,
  AssetPlanSummary,
} from "@/lib/simulatorUtils"

// ── 타입 ────────────────────────────────────────────────────────────

interface CheckItem    { label: string; status: "pass" | "fail" | "warn" }
interface InsightItem  { item: string; metaphor: string; action: string }
interface ActionItem   { title: string; reason: string; priority: "high" | "medium" | "low"; link: string | null }
interface TimelineItem { period: string; title: string; why: string; action: string }

// ── 상수 ────────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  high:   { label: "지금 바로",    color: "bg-blue-100 text-blue-700",    border: "border-gray-100" },
  medium: { label: "이번 달 안에", color: "bg-yellow-100 text-yellow-700", border: "border-gray-100" },
  low:    { label: "준비해두기",   color: "bg-gray-100 text-gray-600",    border: "border-gray-100" },
}

const FIXED_ACTIONS: ActionItem[] = [
  { title: "맞춤 제도 확인하기", reason: "진단 결과를 바탕으로 신청 가능한 제도를 확인해보세요.", priority: "high", link: "/site/step/recommend"  },
  { title: "공고 확인하기",      reason: "현재 모집 중인 청년 주거 공고를 확인해보세요.",         priority: "high", link: "/site/announcements"  },
  { title: "대출 상품 보기",     reason: "청년 버팀목 전세대출 등 활용 가능한 대출을 알아보세요.", priority: "high", link: "/site/loan"           },
]

const SIZE_IMAGE: Record<number, string> = {
  20: "/images/simulator/housing/oneroom.png",
  33: "/images/simulator/housing/tworoom.png",
  59: "/images/simulator/housing/villa.png",
  84: "/images/simulator/housing/apartment.png",
}

const SIZE_LABEL: Record<number, string> = { 20: "원룸", 33: "투룸", 59: "빌라", 84: "아파트" }

const SIZE_SLOGAN: Record<number, string> = {
  20: "첫 독립, 시작이 반이야!",
  33: "공간의 여유가 마음의 여유로!",
  59: "작은 빌라에서 꾸는 다른 꿈!",
  84: "내 집 마련, 결국 해낸다!",
}

// ── 유틸 ────────────────────────────────────────────────────────────

function makeProfileKey(p: DiagnosisForm | null): string | null {
  if (!p) return null
  return `${p.birthDate}_${p.annualIncome}_${p.employmentStatus}`
}

// ── numbers 카드 계산 ────────────────────────────────────────────────

interface NumberCard { label: string; value: string; sub: string }

function calcNumberCards(
  housing: HousingSnapshot | null,
  finance: FinanceSnapshot | null,
  asset:   AssetPlanSummary | null,
): NumberCard[] {
  const cards: NumberCard[] = []

  // cards[0]: 자산 플랜 달성률 (플랜 있을 때) | 10년 월세 소멸액 (없을 때)
  if (asset && (asset.activePlans + asset.completedPlans) > 0) {
    const total = asset.activePlans + asset.completedPlans
    const rate  = Math.round((asset.completedPlans / total) * 100)
    cards.push({ label: "자산 플랜 달성률", value: `${rate}%`, sub: `${total}개 중 ${asset.completedPlans}개 완료` })
  } else if (housing) {
    cards.push({ label: "10년 월세 소멸액", value: formatManwon(housing.tenYearWaste), sub: `월 ${housing.currentRent}만원 기준` })
  } else {
    cards.push({ label: "10년 월세 소멸액", value: "정보 없음", sub: "주거비 탭을 입력해보세요" })
  }

  // cards[1]: DSR
  if (finance) {
    cards.push({ label: "DSR", value: `${finance.dsr}%`, sub: `월 납입 ${Math.round(finance.monthlyPayment / 10000)}만원` })
  } else {
    cards.push({ label: "DSR", value: "정보 없음", sub: "금융 체감 탭을 입력해보세요" })
  }

  // [FIX] cards[2]: 목표 전세까지 기간
  // 기존 버그: housing 있을 때 fmt만원(tenYearWaste * 10000)으로 cards[0]과 중복 + 단위 오류(만원 * 10000)
  if (housing) {
    cards.push({
      label: "목표 전세까지",
      value: housing.yearsToGoal > 0 ? `${housing.yearsToGoal}년` : "–",
      sub: housing.loanCoversAll ? "대출로 바로 가능" : `저축 ${housing.savingAmount}만원/월 기준`,
    })
  } else {
    cards.push({ label: "목표 전세까지", value: "정보 없음", sub: "주거 비교 탭을 입력해보세요" })
  }

  return cards
}

function hasAnyInput(h: HousingSnapshot | null, f: FinanceSnapshot | null, a: AssetPlanSummary | null) {
  return !!(h || f || (a && a.activePlans + a.completedPlans > 0))
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────

export default function Roadmap() {
  const router = useRouter()

  const [result,       setResult]       = useState<RoadmapParsed | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [profile,      setProfile]      = useState<DiagnosisForm | null>(null)
  const [housingSnap,  setHousingSnap]  = useState<HousingSnapshot | null>(null)
  const [financeSnap,  setFinanceSnap]  = useState<FinanceSnapshot | null>(null)
  const [assetSummary, setAssetSummary] = useState<AssetPlanSummary | null>(null)
  const [isStale,      setIsStale]      = useState(false)
  const [cooldown,     setCooldown]     = useState(0)

  const numberCards = useMemo(
    () => calcNumberCards(housingSnap, financeSnap, assetSummary),
    [housingSnap, financeSnap, assetSummary],
  )

  useEffect(() => {
    setHousingSnap(parseSession<HousingSnapshot>("housingSnapshot"))
    setFinanceSnap(parseSession<FinanceSnapshot>("financeSnapshot"))
    const saved = sessionStorage.getItem("roadmapCooldownEnd")
    if (saved) {
      const remaining = Math.ceil((Number(saved) - Date.now()) / 1000)
      if (remaining > 0) setCooldown(remaining)
    }
    fetchRoadmap()
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function fetchRoadmap(forceRefresh = false) {
    if (forceRefresh && cooldown > 0) return
    if (forceRefresh) {
      const endTime = Date.now() + 60 * 1000
      sessionStorage.setItem("roadmapCooldownEnd", String(endTime))
      setCooldown(60)
    }
    setLoading(true)
    setError(null)

    try {
      const housingSnapshot = parseSession<HousingSnapshot>("housingSnapshot")
      const financeSnapshot = parseSession<FinanceSnapshot>("financeSnapshot")

      if (!forceRefresh) {
        const cached = sessionStorage.getItem("roadmapResult")
        if (cached) {
          const freshProfile    = await get<DiagnosisForm>("/api/diagnosis/profile").catch(() => null)
          setProfile(freshProfile)
          const cachedSnapshot  = parseSession<object>("roadmapSnapshot")
          const currentSnapshot = { housingSnapshot, financeSnapshot, profileKey: makeProfileKey(freshProfile) }
          setResult(JSON.parse(cached) as RoadmapParsed)
          setIsStale(JSON.stringify(cachedSnapshot) !== JSON.stringify(currentSnapshot))
          await loadSideData()
          setLoading(false)
          return
        }
      }

      setIsStale(false)
      const profileData    = await get<DiagnosisForm>("/api/diagnosis/profile").catch(() => null)
      setProfile(profileData)

      const recommendation = await get<{ results: Array<{ policyName: string; grade: string; score: number }> }>(
        "/api/recommendation/calculate/profile", { cache: "no-store" },
      ).catch(() => null)

      const assetPlansRaw = await get<Array<{
        planName: string; goalAmount: number; baseAsset: number; isCompleted: boolean
      }>>("/api/simulator/asset-plans", { cache: "no-store" }).catch(() => [])

      if (assetPlansRaw?.length) {
        setAssetSummary({
          totalSaved:     assetPlansRaw.reduce((s, p) => s + (p.baseAsset  ?? 0), 0),
          totalGoal:      assetPlansRaw.reduce((s, p) => s + (p.goalAmount ?? 0), 0),
          activePlans:    assetPlansRaw.filter((p) => !p.isCompleted).length,
          completedPlans: assetPlansRaw.filter((p) =>  p.isCompleted).length,
        })
      }

      const data = await post<RoadmapParsed>("/api/simulator/roadmap", {
        profile: profileData, recommendation, assetPlans: assetPlansRaw,
        housingSnapshot, financeSnapshot,
      })

      sessionStorage.setItem("roadmapResult",   JSON.stringify(data))
      sessionStorage.setItem("roadmapSnapshot", JSON.stringify({ housingSnapshot, financeSnapshot, profileKey: makeProfileKey(profileData) }))
      setResult(data)

      // simulator_reports 저장 — 실패해도 UI에 영향 없음
      await post("/api/simulator/reports", {
        assetSnapshot: assetPlansRaw, housingSnapshot, loanSnapshot: financeSnapshot,
        scoreSnapshot: recommendation?.results ?? null, aiResult: data, aiPrompt: null,
      }).catch(() => {})

    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했어요")
    } finally {
      setLoading(false)
    }
  }

  async function loadSideData() {
    const assetPlansRaw = await get<Array<{
      planName: string; goalAmount: number; baseAsset: number; isCompleted: boolean
    }>>("/api/simulator/asset-plans", { cache: "no-store" }).catch(() => [])
    if (assetPlansRaw?.length) {
      setAssetSummary({
        totalSaved:     assetPlansRaw.reduce((s, p) => s + (p.baseAsset  ?? 0), 0),
        totalGoal:      assetPlansRaw.reduce((s, p) => s + (p.goalAmount ?? 0), 0),
        activePlans:    assetPlansRaw.filter((p) => !p.isCompleted).length,
        completedPlans: assetPlansRaw.filter((p) =>  p.isCompleted).length,
      })
    }
  }

  if (loading) return <LoadingSkeleton />
  if (error)   return <ErrorScreen message={error} onRetry={() => fetchRoadmap(true)} />
  if (!hasAnyInput(housingSnap, financeSnap, assetSummary)) return <EmptyState router={router} />

  return (
    <div className="space-y-4 pt-6">

      {/* ── 헤더 ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-blue-600" />
            <p className="text-sm font-bold text-gray-900">청춘 플래너</p>
          </div>
          <div className="flex items-center gap-2">
            {isStale && (
              <span className="text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                조건이 변경됐어요
              </span>
            )}
            <button
              onClick={() => fetchRoadmap(true)}
              disabled={cooldown > 0}
              className={`flex items-center gap-1 text-xs transition-colors disabled:opacity-40 ${
                isStale ? "text-blue-600 hover:text-blue-700 font-medium" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <RotateCcw size={12} />
              {cooldown > 0 ? `${cooldown}초 후 가능` : isStale ? "다시 분석하기" : "다시 분석"}
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {profile
            ? `${profile.desiredCity ?? ""} ${profile.desiredDistrict ?? ""} 기준으로 맞춤 전략을 분석했어요`.trim()
            : "시뮬레이터 데이터를 바탕으로 분석했어요"}
        </p>
      </div>

      {/* ── 숫자 카드 3개 ── */}
      <div className="grid grid-cols-3 gap-3">
        {numberCards.map((n, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center space-y-1">
            <p className="text-[11px] text-gray-400">{n.label}</p>
            <p className="text-lg font-bold text-gray-900">{n.value}</p>
            <p className="text-[10px] text-gray-400">{n.sub}</p>
          </div>
        ))}
      </div>

      {/* ── 집 이미지(좌) + AI 인사이트+조건체크(우) ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          <div className="flex flex-col items-center justify-center py-10 px-6">
            {housingSnap ? (
              <>
                <p className="text-5xl font-extralight text-gray-900 text-center -mb-6" style={{ fontFamily: "'Nanum Pen Script', cursive" }}>
                  "{SIZE_SLOGAN[housingSnap.targetSize]}"
                </p>
                <div className="w-[300px]">
                  <AspectRatio ratio={1}>
                    <img
                      src={SIZE_IMAGE[housingSnap.targetSize] ?? SIZE_IMAGE[84]}
                      alt={SIZE_LABEL[housingSnap.targetSize] ?? "목표 주거"}
                      className="object-contain w-full h-full"
                    />
                  </AspectRatio>
                </div>
                {/* [FIX] targetDeposit은 만원 단위 → formatManwon 직접 사용 (기존엔 * 10000으로 억 단위 오류) */}
                <p className="text-[10px] font-semibold text-gray-400 mt-1 text-center">
                  {housingSnap.region} · {SIZE_LABEL[housingSnap.targetSize]} · 전세 {formatManwon(housingSnap.targetDeposit)}
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center">
                  <Home size={32} className="text-gray-200" />
                </div>
                <p className="text-xs text-gray-400 text-center">주거비 탭에서<br/>목표 주거를 설정해보세요</p>
              </div>
            )}
          </div>
          <div className="flex flex-col divide-y divide-gray-200">
            {result?.insights && result.insights.length > 0 && <InsightAccordion insights={result.insights} />}
            {profile && <CheckListAccordion profile={profile} />}
          </div>
        </div>
      </div>

      {/* ── 주거 전략 타임라인 ── */}
      {result?.timeline && result.timeline.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-1.5 mb-8">
            <MapPin size={14} className="text-blue-600" />
            <p className="text-sm font-bold text-gray-900">주거 전략 타임라인</p>
          </div>
          <div className="hidden md:block"><HorizontalTimeline items={result.timeline} /></div>
          <div className="md:hidden"><VerticalTimeline items={result.timeline} /></div>
        </div>
      )}

      {/* ── 지금 당장 할 것 3가지 ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-1.5 mb-4">
          <Zap size={14} className="text-blue-600" />
          <p className="text-sm font-bold text-gray-900">지금 당장 할 것 3가지</p>
        </div>
        <div className="space-y-3">
          {FIXED_ACTIONS.map((action, i) => {
            const config = PRIORITY_CONFIG[action.priority] ?? PRIORITY_CONFIG.low
            return (
              <Card
                key={i}
                className={`border ${config.border} ${action.link ? "cursor-pointer hover:shadow-md" : ""} transition-all`}
                onClick={() => action.link && router.push(action.link)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-sm font-bold text-gray-900">{action.title}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${config.color}`}>{config.label}</span>
                        </div>
                        <p className="text-xs text-gray-500">{action.reason}</p>
                      </div>
                    </div>
                    {action.link && <ChevronRight size={16} className="text-gray-300 flex-shrink-0 mt-1" />}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── AI 인사이트 아코디언 ─────────────────────────────────────────────

function stripMetaphorPrefix(text: string): string {
  return text.replace(/^[가-힣a-zA-Z\s]{1,6}:\s*/, "")
}

function InsightAccordion({ insights }: { insights: InsightItem[] }) {
  const [open, setOpen] = useState(true)
  return (
    <div>
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-1.5">
          <Sparkles size={12} className="text-blue-500" />
          <p className="text-xs font-bold text-blue-600">AI청춘 플래너의 한마디</p>
        </div>
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-6 pb-5 space-y-3">
          {insights.map((ins, i) => (
            <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex gap-2">
                <span className="text-xs font-bold text-gray-800 shrink-0">ㆍ</span>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-800">{ins.item}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{stripMetaphorPrefix(ins.metaphor)}</p>
                  <p className="text-xs font-semibold text-blue-600">→ {ins.action}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── 조건 체크 아코디언 ────────────────────────────────────────────────

function CheckListAccordion({ profile }: { profile: DiagnosisForm }) {
  const today = new Date()
  const birth = new Date(profile.birthDate)
  const age   = today.getFullYear() - birth.getFullYear()
    - (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0)

  const items: CheckItem[] = [
    { label: "무주택 여부",                                                                            status: profile.houseless ? "pass" : "fail" },
    { label: `연령 조건 (만 ${age}세)`,                                                                status: age >= 19 && age <= 39 ? "pass" : "fail" },
    { label: "소득 기준",                                                                              status: (profile.annualIncome ?? 0) <= 81_600_000 ? "pass" : "fail" },
    { label: "자산 기준",                                                                              status: (profile.totalAsset  ?? 0) <= 337_000_000 ? "pass" : "fail" },
    { label: `청약통장 (${profile.hasSubscription ? `${profile.subscriptionMonths}개월` : "미보유"})`,  status: profile.hasSubscription && profile.subscriptionMonths >= 24 ? "pass" : "warn" },
    { label: `부양가족 (${profile.dependentCount ?? 0}명)`,                                            status: (profile.dependentCount ?? 0) > 0 ? "pass" : "warn" },
  ]

  const passCount = items.filter((i) => i.status === "pass").length
  const failCount = items.filter((i) => i.status === "fail").length
  const warnCount = items.filter((i) => i.status === "warn").length
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs font-bold text-gray-700">내 조건 체크</p>
          <div className="flex items-center gap-1.5">
            {passCount > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">충족 {passCount}</span>}
            {failCount > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-500 font-medium">미충족 {failCount}</span>}
            {warnCount > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-600 font-medium">확인 필요 {warnCount}</span>}
          </div>
        </div>
        <ChevronDown size={14} className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-6 pb-5 space-y-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.status === "pass" ? "bg-blue-400" : item.status === "fail" ? "bg-red-400" : "bg-yellow-400"}`} />
              <p className="text-xs text-gray-700 flex-1">{item.label}</p>
              <span className={`text-[10px] font-medium flex-shrink-0 ${item.status === "pass" ? "text-blue-500" : item.status === "fail" ? "text-red-400" : "text-yellow-500"}`}>
                {item.status === "pass" ? "충족" : item.status === "fail" ? "미충족" : "확인 필요"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── 가로 타임라인 (데스크탑) ─────────────────────────────────────────

function HorizontalTimeline({ items }: { items: TimelineItem[] }) {
  const [activeIdx, setActiveIdx] = useState<number | null>(0)
  return (
    <div className="relative">
      <div className="grid grid-cols-4 mb-2">
        {items.map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            {i === 0 ? (
              <div className="flex flex-col items-center gap-1">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shadow-sm">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                </div>
                <div className="w-px h-3 bg-blue-300" />
              </div>
            ) : (
              <div className="h-12 flex items-end justify-center"><div className="w-2 h-2 rounded-full bg-gray-200" /></div>
            )}
          </div>
        ))}
      </div>
      <div className="relative flex items-center mb-4">
        <div className="absolute top-1/2 left-[12.5%] right-[12.5%] h-px bg-gray-200 -translate-y-1/2" />
        {items.map((_, i) => {
          const isFirst = i === 0; const isActive = activeIdx === i
          return (
            <div key={i} className="flex-1 flex flex-col items-center cursor-pointer" onClick={() => setActiveIdx(isActive ? null : i)}>
              <div className={`relative z-10 flex items-center justify-center rounded-full border-2 transition-all duration-200 ${
                isFirst ? "w-4 h-4 bg-blue-600 border-blue-600 ring-4 ring-blue-100"
                  : isActive ? "w-4 h-4 bg-blue-400 border-blue-400 ring-4 ring-blue-50"
                    : "w-4 h-4 bg-white border-gray-300 hover:border-blue-300"
              }`} />
            </div>
          )
        })}
      </div>
      <div className="grid grid-cols-4 mb-3">
        {items.map((item, i) => (
          <div key={i} className="flex justify-center cursor-pointer" onClick={() => setActiveIdx(activeIdx === i ? null : i)}>
            <span className={`text-[11px] font-medium transition-colors ${i === 0 ? "text-blue-600" : activeIdx === i ? "text-blue-500" : "text-gray-400"}`}>
              {item.period}
            </span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-3 items-start">
        {items.map((item, i) => {
          const isFirst = i === 0; const isActive = activeIdx === i
          return (
            <div key={i} onClick={() => setActiveIdx(isActive ? null : i)}
                 className={`rounded-xl border p-3 cursor-pointer transition-all duration-200 min-h-[80px]${
                   isFirst && !isActive ? "border-blue-100 bg-blue-50/60"
                     : isActive ? "border-blue-200 bg-blue-50 shadow-sm"
                       : "border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-gray-100"
                 }`}
            >
              <div className="flex items-center gap-1 mb-1">
                <Home size={11} className="text-blue-700 shrink-0" />
                <p className={`text-xs font-bold leading-snug ${isFirst || isActive ? "text-blue-700" : "text-gray-600"}`}>{item.title}</p>
              </div>
              {!isActive && <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-2">{item.action}</p>}
              {isActive && (
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-blue-700">{item.action}</p>
                  <p className="text-[10px] text-gray-400 leading-relaxed">ㆍ{item.why}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── 세로 타임라인 (모바일) ──────────────────────────────────────────

function VerticalTimeline({ items }: { items: TimelineItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0)
  return (
    <div className="relative">
      <div className="absolute left-[5px] top-3 bottom-3 w-0.5 bg-gray-100" />
      <div className="space-y-2">
        {items.map((item, i) => {
          const isFirst = i === 0
          return (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center flex-shrink-0 mt-3.5">
                <div className={`w-3 h-3 rounded-full z-10 ${isFirst ? "bg-blue-600 ring-4 ring-blue-100" : openIdx === i ? "bg-blue-400 ring-4 ring-blue-50" : "bg-gray-300 ring-4 ring-gray-50"}`} />
              </div>
              <div className="flex-1 mb-2">
                <div className={`border rounded-xl overflow-hidden cursor-pointer transition-all ${openIdx === i ? "border-blue-200 shadow-sm" : "border-gray-100"}`}
                     onClick={() => setOpenIdx(openIdx === i ? null : i)}>
                  <div className={`flex items-center justify-between px-4 py-3 ${openIdx === i ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${isFirst ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                        {item.period}
                      </span>
                      <p className="text-sm font-bold text-gray-900">{item.title}</p>
                    </div>
                    <ChevronRight size={14} className={`text-gray-400 transition-transform ${openIdx === i ? "rotate-90" : ""}`} />
                  </div>
                  {openIdx === i && (
                    <div className="px-4 py-3 border-t border-gray-100 space-y-2 bg-white">
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-bold text-gray-400 mt-0.5 w-8 flex-shrink-0">Why</span>
                        <p className="text-xs text-gray-600 leading-relaxed">{item.why}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-bold text-blue-500 mt-0.5 w-8 flex-shrink-0">할 일</span>
                        <p className="text-xs font-medium text-gray-800 leading-relaxed">{item.action}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── 빈 상태 / 로딩 / 에러 ───────────────────────────────────────────

function EmptyState({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <div className="pt-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
            <Home size={28} className="text-blue-300" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-gray-900">아직 입력된 데이터가 없어요</p>
          <p className="text-xs text-gray-500">탭 1~3을 입력하면 AI가 맞춤 주거 전략을 분석해드려요</p>
        </div>
        <div className="flex flex-col gap-2 max-w-xs mx-auto">
          <button onClick={() => router.push("/site/simulator?tab=assetPlan")}
                  className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-all">
            자산 플랜 입력하기
          </button>
          <button onClick={() => router.push("/site/simulator?tab=housingCompare")}
                  className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-all">
            주거비 비교하기
          </button>
        </div>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 pt-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-blue-600 animate-pulse" />
          <p className="text-sm font-bold text-gray-900">청춘 플래너가 분석 중이에요...</p>
        </div>
        <p className="text-xs text-gray-400 mt-1">잠시만 기다려주세요.</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
      </div>
      <Skeleton className="h-96 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  )
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="pt-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-3">
        <p className="text-2xl">😢</p>
        <p className="text-sm font-bold text-gray-900">분석에 실패했어요</p>
        <p className="text-xs text-gray-500">{message}</p>
        <button onClick={onRetry} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-all">
          다시 시도하기
        </button>
      </div>
    </div>
  )
}
