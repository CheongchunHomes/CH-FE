"use client"

import { useState, useEffect } from "react"
import { get }        from "@/lib/api"
import { useRouter }  from "next/navigation"
import { DiagnosisForm } from "@/lib/diagnosisUtils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { MapPin, Home, Target, Lightbulb, TrendingDown, ArrowLeftRight } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { formatManwon, HousingSnapshot, manwonToWon } from "@/lib/simulatorUtils"
import { Badge } from "@/components/ui/badge"

interface PolicyListDTO {
  policyId: number; title: string; summary: string
  mainCategory: string; subCategory: string; status: string
  applyPeriod: string; supervisingInstitution: string
}

const SIZES = [
  { value: 20, label: "원룸",   sqm: "20㎡", img: "/images/simulator/housing/oneroom.png"   },
  { value: 33, label: "투룸",   sqm: "33㎡", img: "/images/simulator/housing/tworoom.png"   },
  { value: 59, label: "빌라",   sqm: "59㎡", img: "/images/simulator/housing/villa.png"     },
  { value: 84, label: "아파트", sqm: "84㎡", img: "/images/simulator/housing/apartment.png" },
]

type Region = "서울" | "경기" | "광역시" | "기타"

const MONTHLY_RENT_BY_REGION: Record<Region, Record<number, number>> = {
  서울:   { 20: 60,  33: 80,  59: 110, 84: 150 },
  경기:   { 20: 45,  33: 60,  59: 80,  84: 110 },
  광역시: { 20: 35,  33: 48,  59: 65,  84: 90  },
  기타:   { 20: 25,  33: 35,  59: 50,  84: 70  },
}

const JEONSE_DEPOSIT_BY_REGION: Record<Region, Record<number, number>> = {
  서울:   { 20: 15000, 33: 25000, 59: 40000, 84: 60000 },
  경기:   { 20: 10000, 33: 16000, 59: 28000, 84: 42000 },
  광역시: { 20: 7000,  33: 12000, 59: 20000, 84: 32000 },
  기타:   { 20: 5000,  33: 8000,  59: 14000, 84: 22000 },
}

const SIZE_COPY: Record<number, { title: string; sub: string }> = {
  20: { title: "지금은 베이스캠프",      sub: "좁아도 괜찮아. 여기서 시작하는 거야"         },
  33: { title: "드디어 거실이 생겼다",   sub: "침실과 공간이 분리되는 순간 삶이 달라져요"   },
  59: { title: "이제 초대할 수 있는 집", sub: "내 힘으로 일궈낸 공간, 당당해도 돼요"       },
  84: { title: "도시를 내려다보는 저녁", sub: "언젠가 반드시. 그날을 위해 지금 시작해요"   },
}

interface HousingCompareProps {
  userProfile: DiagnosisForm | null
}

export default function HousingCompare({ userProfile }: HousingCompareProps) {
  // 이전 탭 입력값을 복원하되, SSR에서는 브라우저 저장소에 접근하지 않는다.
  const saved = (() => {
    if (typeof window === "undefined") return null
    try { return JSON.parse(window.sessionStorage.getItem("housingSnapshot") ?? "null") as HousingSnapshot | null }
    catch { return null }
  })()

  const [region, setRegion]                     = useState<Region>(saved?.region as Region ?? "서울")
  const [currentSize, setCurrentSize]           = useState(saved?.currentSize ?? 20)
  const [currentRentInput, setCurrentRentInput] = useState(
    saved?.currentRent ? String(saved.currentRent) : String(MONTHLY_RENT_BY_REGION["서울"][20])
  )
  const currentRent = Math.max(Number(currentRentInput) || 0, 0)
  const [targetSize, setTargetSize]   = useState(saved?.targetSize ?? 84)
  const [imgVisible, setImgVisible]   = useState(true)
  const [tipPolicies, setTipPolicies] = useState<PolicyListDTO[]>([])
  const [loanAmount, setLoanAmount]   = useState(saved?.loanAmount ?? 0)
  const [savingAmount, setSavingAmount] = useState(
    saved?.savingAmount ?? 50
  )

  const router = useRouter()

  function handleCurrentSizeChange(size: number) {
    setCurrentSize(size)
    setCurrentRentInput(String(MONTHLY_RENT_BY_REGION[region][size]))
  }

  // 월 저축액은 월세와 별개 입력값이므로 지역 변경 시 월세만 갱신한다.
  function handleRegionChange(r: Region) {
    setRegion(r)
    setCurrentRentInput(String(MONTHLY_RENT_BY_REGION[r][currentSize]))
  }

  function handleTargetSizeChange(size: number) {
    setImgVisible(false)
    setTimeout(() => { setTargetSize(size); setImgVisible(true) }, 180)
  }

  useEffect(() => {
    get<{ content: PolicyListDTO[] }>("/api/policies", {
      query: { subCategory: "월세지원", size: 100, region: userProfile?.desiredCity ?? undefined },
    })
      .then((res) =>
        setTipPolicies(
          (res.content ?? [])
            .filter((p) =>
              (p.title.includes("월세") || p.title.includes("전세") || p.title.includes("보증금") ||
                p.summary?.includes("월세") || p.summary?.includes("전세")) &&
              (p.title.includes("청년") || p.summary?.includes("청년"))
            )
            .slice(0, 3)
        )
      )
      .catch(() => {})
  }, [userProfile])

  // 월세 체감 영역: 현재 월세가 장기적으로 누적되는 금액만 계산한다.
  const targetDeposit  = JEONSE_DEPOSIT_BY_REGION[region][targetSize]
  const targetRent     = MONTHLY_RENT_BY_REGION[region][targetSize]
  const oneYearRent    = currentRent * 12
  const tenYearWaste   = currentRent * 12 * 10
  const monthlyGap     = targetRent - currentRent
  const monthlyGapLabel = monthlyGap >= 0
    ? `월 ${monthlyGap}만원 gap`
    : `월 ${Math.abs(monthlyGap)}만원 감소`
  const rentToDepositPercent = targetDeposit > 0
    ? Math.min(Math.round((tenYearWaste / targetDeposit) * 100), 100)
    : 0

  // 보증금 준비 영역: 목표 보증금에서 대출을 뺀 금액을 월 저축액으로 나눠 개월 수를 구한다.
  const safeSaving         = Math.max(savingAmount, 0)
  const cashNeededNoLoan   = targetDeposit
  const cashNeededWithLoan = Math.max(targetDeposit - loanAmount, 0)
  const monthsToGoal       = safeSaving > 0 ? Math.ceil(cashNeededNoLoan / safeSaving) : 0
  const monthsWithLoan     = safeSaving > 0 ? Math.ceil(cashNeededWithLoan / safeSaving) : 0
  const monthsSaved        = Math.max(monthsToGoal - monthsWithLoan, 0)
  const loanCoversAll      = cashNeededWithLoan === 0
  // 청춘플랜/기존 HousingSnapshot 호환을 위해 연 단위 값도 계속 저장한다.
  const yearsToGoal        = monthsToGoal > 0 ? Math.ceil(monthsToGoal / 12) : 0
  const yearsWithLoan      = monthsWithLoan > 0 ? Math.ceil(monthsWithLoan / 12) : 0
  const yearsSaved         = monthsSaved > 0 ? Math.ceil(monthsSaved / 12) : 0

  function formatPeriod(months: number, canCalculate = safeSaving > 0) {
    if (!canCalculate) return "–"
    if (months <= 0) return "바로 가능"
    const years = Math.floor(months / 12)
    const restMonths = months % 12
    if (years === 0) return `${restMonths}개월`
    if (restMonths === 0) return `${years}년`
    return `${years}년 ${restMonths}개월`
  }

  // 청춘플랜 탭에서 재사용할 주거 시뮬레이션 스냅샷을 저장한다.
  useEffect(() => {
    if (typeof window === "undefined") return
    const snapshot: HousingSnapshot = {
      region, currentSize, currentRent, targetSize,
      targetDeposit, targetRent, tenYearWaste, monthlyGap,
      savingAmount: safeSaving, loanAmount,
      yearsToGoal, yearsWithLoan, yearsSaved, loanCoversAll,
    }
    window.sessionStorage.setItem("housingSnapshot", JSON.stringify(snapshot))
  }, [region, currentSize, currentRent, targetSize, targetDeposit, targetRent,
    tenYearWaste, monthlyGap, safeSaving, loanAmount, yearsToGoal, yearsWithLoan,
    yearsSaved, loanCoversAll])

  return (
    <TooltipProvider>
      <div className="space-y-3 pt-6">

        {/* ── 상단: 지금 사는 곳 / 원하는 집 ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">

            {/* 세로 구분선 */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gray-100" />

            {/* 좌: 지금 사는 곳 */}
            <div className="flex flex-col gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-blue-500" />
                  <p className="text-sm font-bold text-gray-900">지금 사는 곳</p>
                </div>
                <p className="text-xs font-medium text-gray-500 mt-0.5">현재 평수와 월세를 알려줘요</p>
              </div>

              {/* 현재 평수 */}
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {SIZES.map((s) => (
                  <Tooltip key={s.value}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleCurrentSizeChange(s.value)}
                        className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                          currentSize === s.value
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {s.label}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={6}>
                      <p className="text-xs">{s.sqm}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>

              {/* 현재 월세 입력 */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">현재 월세</label>
                <div className="relative">
                  <input
                    type="number"
                    value={currentRentInput}
                    // [FIX] 음수 방어
                    onChange={(e) => setCurrentRentInput(String(Math.max(0, Number(e.target.value) || 0)))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-200 pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500">만원</span>
                </div>
                <div className="flex items-center gap-1">
                  <p className="text-xs font-medium text-gray-500">{currentSize}㎡ 기준 자동입력 · 직접 수정 가능</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-gray-300 cursor-default text-xs">ⓘ</span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">전세라면 보증금 × 3.5% ÷ 12 로<br/>월 기회비용을 입력해보세요</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* 현재 상태 요약 */}
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <div className="flex justify-between items-baseline pb-2 border-b border-gray-200 mb-2">
                  <p className="text-xs font-medium text-gray-500">월세는 얼마나 쌓일까?</p>
                  <p className="text-xl font-bold text-gray-900">{currentRent}만원</p>
                </div>
                <div className="flex justify-between items-center py-1">
                  <p className="text-xs font-medium text-gray-500">1년이면</p>
                  <p className="text-base font-bold text-red-500">{formatManwon(oneYearRent)}</p>
                </div>
                <div className="flex justify-between items-center py-1">
                  <p className="text-xs font-medium text-gray-500">10년이면</p>
                  <p className="text-xs font-bold text-gray-900">{formatManwon(tenYearWaste)}</p>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-100">
                  <p className="text-xs font-medium text-gray-500">하루로 나누면</p>
                  <p className="text-xs font-bold text-gray-900">{Math.round(manwonToWon(currentRent) / 30).toLocaleString()}원</p>
                </div>

              </div>

              {/* 전환 제안 */}
              <div className="flex items-center gap-1.5">
                <TrendingDown size={14} className="text-blue-500" />
                <p className="text-sm font-bold text-gray-900">월세는 얼마나 쌓일까?</p>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-gray-500">매달 나가는 월세를 장기 금액으로 환산해봐요</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-xl px-3 py-3 text-center">
                    <p className="text-[10px] font-medium text-gray-400">지금처럼 월세로</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">10년 후 0원</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">전부 소멸</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl px-3 py-3 text-center">
                    <p className="text-[10px] font-medium text-gray-400">10년 월세 총액</p>
                    <p className="text-sm font-bold text-blue-600 mt-1">{formatManwon(tenYearWaste)}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      목표 보증금의 {rentToDepositPercent}%
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push("/site/simulator?tab=assetPlan")}
                  className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-all"
                >
                  자산 플랜 세우기 →
                </button>
              </div>
            </div>

            {/* 우: 원하는 집 */}
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Home size={14} className="text-blue-500" />
                    <p className="text-sm font-bold text-gray-900">어디에 살고 싶나요?</p>
                  </div>
                  <p className="text-xs font-medium text-gray-500 mt-0.5">지역 기준으로 시세 차이가 있어요</p>
                </div>
                {/* [FIX] 지역 선택 — 우측 상단 배치 유지, 변경 시 currentRent 갱신 */}
                <div className="flex items-center gap-1">
                  {(["서울", "경기", "광역시", "기타"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => handleRegionChange(r)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        region === r
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-gray-300 cursor-default text-xs ml-0.5">ⓘ</span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">한국부동산원 2025년 기준 평균값이에요</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* 목표 이미지 */}
              <div
                className="flex flex-col bg-gray-50 rounded-xl overflow-hidden"
                style={{ height: 320 }}
              >
                <div
                  className={`flex-1 flex justify-center items-center transition-opacity duration-200 overflow-hidden ${imgVisible ? "opacity-100" : "opacity-0"}`}
                >
                  <img
                    src={SIZES.find((s) => s.value === targetSize)?.img}
                    alt={SIZES.find((s) => s.value === targetSize)?.label}
                    className="object-contain"
                    style={{
                      width:  targetSize === 84 ? 280 : targetSize === 59 ? 270 : 240,
                      height: targetSize === 84 ? 280 : targetSize === 59 ? 270 : 240,
                    }}
                  />
                </div>
              </div>

              {/* 목표 평수 버튼 */}
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {SIZES.map((s) => (
                  <Tooltip key={s.value}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleTargetSizeChange(s.value)}
                        className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                          targetSize === s.value
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {s.label}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={6}>
                      <p className="text-xs">{s.sqm}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>

              {/* 감성 카피 */}
              <div className={`transition-opacity duration-200 ${imgVisible ? "opacity-100" : "opacity-0"}`}>
                <p className="text-sm font-bold text-gray-900">{SIZE_COPY[targetSize].title}</p>
                <p className="text-xs font-medium text-gray-500 mt-0.5">{SIZE_COPY[targetSize].sub}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs font-medium text-gray-400">전세</span>
                  <span className="text-xs font-bold text-blue-600">{formatManwon(targetDeposit)}</span>
                  <span className="text-gray-200">·</span>
                  <span className="text-xs font-medium text-gray-400">월세</span>
                  <span className="text-xs font-bold text-gray-700">{targetRent}만원</span>
                </div>
              </div>

              {/* 갭 요약 */}
              <div className="pt-3 border-t border-gray-100 mt-auto">
                {currentSize >= targetSize ? (
                  <p className="text-sm font-bold text-green-600 text-center">
                    이미 목표 평수 이상에 살고 있어요 👏
                  </p>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">지금 월세</span>
                      <span className="text-sm font-bold text-gray-900">{currentRent}만원</span>
                      <ArrowLeftRight size={12} className="text-gray-300" />
                      <span className="text-xs font-medium text-gray-500">목표 월세</span>
                      <span className="text-sm font-bold text-blue-600">{targetRent}만원</span>
                    </div>
                    <Badge variant="destructive">{monthlyGapLabel}</Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── 대출 시나리오 ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Target size={14} className="text-blue-500" />
            <p className="text-sm font-bold text-gray-900">대출을 활용하면 얼마나 빨라질까?</p>
          </div>
          <p className="text-xs font-medium text-gray-500 mb-5">목표 보증금에서 대출 가능 금액을 제외하고, 내가 모아야 할 금액과 기간을 계산해요</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 좌: 시나리오 2-카드 */}
            <div className="flex flex-col gap-3">
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-xs font-medium text-gray-500">
                  목표 {formatManwon(targetDeposit)} 중 대출 {formatManwon(loanAmount)}을 제외하면
                </p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">
                  내가 모아야 할 돈은 {formatManwon(cashNeededWithLoan)}이에요
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-4 text-center flex flex-col items-center justify-center gap-0.5 h-full">
                  <p className="text-xs font-medium text-gray-400">대출 없이 준비하면</p>
                  <p className="text-xs font-medium text-gray-400">내가 모아야 할 돈 {formatManwon(targetDeposit)}</p>
                  <p className="text-2xl font-bold text-gray-900 my-0.5">
                    {formatPeriod(monthsToGoal)}
                  </p>
                  <p className="text-xs font-medium text-gray-400">월 {safeSaving}만원씩 기준</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center flex flex-col items-center justify-center gap-0.5 h-full">
                  <p className="text-xs font-medium text-gray-400">대출 활용 시</p>
                  <p className="text-xs font-medium text-gray-400">내가 모아야 할 돈 {formatManwon(cashNeededWithLoan)}</p>
                  <p className="text-2xl font-bold text-blue-600 my-0.5">
                    {formatPeriod(monthsWithLoan, safeSaving > 0 || loanCoversAll)}
                  </p>
                  {monthsSaved > 0 && (
                    <p className="text-xs font-bold text-blue-500">↓ {formatPeriod(monthsSaved)} 단축</p>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500">대출을 활용하면</p>
                <p className="text-sm font-bold text-gray-900">
                  {loanAmount === 0 ? "대출 금액을 설정해보세요"
                    : loanCoversAll
                      ? safeSaving > 0 && monthsSaved > 0
                        ? `${formatPeriod(monthsSaved)} 단축 · 바로 준비 가능`
                        : "바로 준비 가능"
                      : monthsSaved > 0 ? `${formatPeriod(monthsSaved)} 단축`
                        : "대출 효과가 크지 않아요"}
                </p>
              </div>

              <button
                onClick={() => router.push("/site/simulator?tab=financeFeel")}
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-all"
              >
                이자 부담 확인하기 →
              </button>
            </div>


            {/* 우: 입력 */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
                  <p className="text-xs font-medium text-gray-500">목표 전세 보증금</p>
                  <p className="text-sm font-bold text-gray-900">{formatManwon(targetDeposit)}</p>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-medium text-gray-500">월 실제 저축 가능액</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-gray-300 cursor-default text-xs">ⓘ</span>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-xs">월세와 별개로 실제로 모을 수 있는 금액이에요</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="relative w-28">
                    <input
                      type="number"
                      value={savingAmount}
                      // [FIX] 음수 방어
                      onChange={(e) => setSavingAmount(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-200 pr-8 text-right"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500">만원</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-500">전세대출</p>
                  <p className="text-sm font-bold text-gray-900">{formatManwon(loanAmount)}</p>
                </div>
                <Slider
                  min={0}
                  max={Math.min(targetDeposit, 50000)}
                  step={1000}
                  value={[loanAmount]}
                  onValueChange={([v]) => setLoanAmount(v)}
                  className="w-full"
                />
                <div className="flex justify-between">
                  <span className="text-[10px] text-gray-400">0원</span>
                  <span className="text-[10px] text-gray-400">{formatManwon(Math.min(targetDeposit, 50000))}</span>
                </div>

                {/* 계산식 요약 — 슬라이더 아래 */}
                <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
                  <p className="text-xs text-gray-500">
                    내 몫 <span className="font-bold text-gray-900">{formatManwon(cashNeededWithLoan)}</span>
                    {" + "}
                    대출 <span className="font-bold text-gray-900">{formatManwon(loanAmount)}</span>
                    {" = "}
                    목표 <span className="font-bold text-blue-600">{formatManwon(targetDeposit)}</span>
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {loanCoversAll
                      ? "대출로 목표 보증금을 모두 채워 바로 가능"
                      : safeSaving > 0
                        ? `월 ${safeSaving}만원씩 모으면 ${formatPeriod(monthsWithLoan, true)}`
                        : "월 저축 가능액을 입력하면 기간을 계산해요"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 제도 팁 ── */}
        {tipPolicies.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-1.5 mb-3">
              <Lightbulb size={13} className="text-blue-500" />
              <p className="text-xs font-bold text-gray-900">이런 제도도 있어요</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {tipPolicies.map((p, i) => (
                <div
                  key={p.policyId}
                  onClick={() => router.push(`/site/policies/${p.policyId}`)}
                  className="rounded-xl p-3 border border-gray-100 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium inline-block mb-1 ${
                    i === 0 ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500"
                  }`}>
                    {i === 0 ? "추천" : "참고"}
                  </span>
                  <p className="text-xs font-bold text-gray-900 line-clamp-1">{p.title}</p>
                  <p className="text-[11px] font-medium text-gray-500 line-clamp-1 mt-0.5">{p.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </TooltipProvider>
  )
}
