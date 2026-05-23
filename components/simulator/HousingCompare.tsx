"use client"

import { useState, useEffect } from "react"
import { get } from "@/lib/api"
import { useRouter } from "next/navigation"
import { DiagnosisForm } from "@/lib/diagnosisUtils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { MapPin, Home, Target, Lightbulb, ArrowLeftRight, TrendingDown } from "lucide-react";
import { Slider } from "@/components/ui/slider"

interface PolicyListDTO {
  policyId: number
  title: string
  summary: string
  mainCategory: string
  subCategory: string
  status: string
  applyPeriod: string
  supervisingInstitution: string
}

const SIZES = [
  { value: 20, label: "원룸",   sqm: "20㎡", img: "/images/simulator/housing/oneroom.png" },
  { value: 33, label: "투룸",   sqm: "33㎡", img: "/images/simulator/housing/tworoom.png" },
  { value: 59, label: "빌라",   sqm: "59㎡", img: "/images/simulator/housing/villa.png" },
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
  20: { title: "지금은 베이스캠프",      sub: "좁아도 괜찮아. 여기서 시작하는 거야" },
  33: { title: "드디어 거실이 생겼다",   sub: "침실과 공간이 분리되는 순간 삶이 달라져요" },
  59: { title: "이제 초대할 수 있는 집", sub: "내 힘으로 일궈낸 공간, 당당해도 돼요" },
  84: { title: "도시를 내려다보는 저녁", sub: "언젠가 반드시. 그날을 위해 지금 시작해요" },
}

function fmt(value: number): string {
  if (!value) return "0원"
  const eok = Math.floor(value / 10000)
  const man = value % 10000
  if (eok > 0 && man > 0) return `${eok}억 ${man}만원`
  if (eok > 0) return `${eok}억원`
  return `${value}만원`
}

interface HousingCompareProps {
  userProfile: DiagnosisForm | null
}

export default function HousingCompare({ userProfile }: HousingCompareProps) {
  const [region, setRegion]                     = useState<Region>("서울")
  const [currentSize, setCurrentSize]           = useState(20)
  const [currentRentInput, setCurrentRentInput] = useState(String(MONTHLY_RENT_BY_REGION["서울"][20]))
  const currentRent = Number(currentRentInput) || 0
  const [targetSize, setTargetSize]             = useState(84)
  const [imgVisible, setImgVisible]             = useState(true)
  const [tipPolicies, setTipPolicies]           = useState<PolicyListDTO[]>([])
  const [loanAmount, setLoanAmount]             = useState(0)
  const [savingAmount, setSavingAmount]         = useState(MONTHLY_RENT_BY_REGION["서울"][20])

  const router = useRouter()

  function handleCurrentSizeChange(size: number) {
    setCurrentSize(size)
    setCurrentRentInput(String(MONTHLY_RENT_BY_REGION[region][size]))
    setSavingAmount(MONTHLY_RENT_BY_REGION[region][size])
  }

  function handleRegionChange(r: Region) {
    setRegion(r)
  }

  function handleTargetSizeChange(size: number) {
    setImgVisible(false)
    setTimeout(() => { setTargetSize(size); setImgVisible(true) }, 180)
  }

  useEffect(() => {
    get<{ content: PolicyListDTO[] }>("/api/policies", {
      query: { subCategory: "월세지원", size: 100, region: userProfile?.desiredCity ?? undefined }
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

  // 계산
  const targetDeposit = JEONSE_DEPOSIT_BY_REGION[region][targetSize]
  const targetRent    = MONTHLY_RENT_BY_REGION[region][targetSize]
  const tenYearWaste  = currentRent * 12 * 10
  const monthlyGap    = targetRent - currentRent
  const savingSwitch10 = currentRent * 12 * 10

  const yearsToGoal   = savingAmount > 0 ? Math.ceil(targetDeposit / (savingAmount * 12)) : 0
  const yearsWithLoan = savingAmount > 0
    ? Math.ceil(Math.max(targetDeposit - loanAmount, 0) / (savingAmount * 12))
    : 0
  const loanCoversAll = targetDeposit <= loanAmount
  const yearsSaved    = yearsToGoal - yearsWithLoan

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
                    <TooltipContent side="top" sideOffset={6}><p className="text-xs">{s.sqm}</p></TooltipContent>
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
                    onChange={(e) => setCurrentRentInput(e.target.value)}
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
                  <p className="text-xs font-medium text-gray-500">매달 나가는 돈</p>
                  <p className="text-xl font-bold text-gray-900">{currentRent}만원</p>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-100">
                  <p className="text-xs font-medium text-gray-500">1년이면</p>
                  <p className="text-xs font-bold text-gray-900">{(currentRent * 12).toLocaleString()}만원 소멸</p>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-100">
                  <p className="text-xs font-medium text-gray-500">하루로 나누면</p>
                  <p className="text-xs font-bold text-gray-900">{Math.round((currentRent * 10000) / 30).toLocaleString()}원/일</p>
                </div>
                <div className="flex justify-between items-center py-1">
                  <p className="text-xs font-medium text-gray-500">10년이면</p>
                  <p className="text-base font-bold text-red-500">{tenYearWaste.toLocaleString()}만원 소멸</p>
                </div>
              </div>

              {/* 전환 제안  */}
              <div className="flex items-center gap-1.5">
                <TrendingDown size={14} className="text-blue-500" />
                <p className="text-sm font-bold text-gray-900">지금 새고 있는 돈</p>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-gray-500">이 돈을 저축으로 돌린다면?</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-xl px-3 py-3 text-center">
                    <p className="text-[10px] font-medium text-gray-400">지금처럼 월세로</p>
                    <p className="text-sm font-bold text-gray-500 mt-1">10년 후 0원</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">전부 소멸</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl px-3 py-3 text-center">
                    <p className="text-[10px] font-medium text-blue-400">저축으로 전환하면</p>
                    <p className="text-sm font-bold text-blue-600 mt-1">{fmt(savingSwitch10)}</p>
                    <p className="text-[10px] text-blue-500 mt-0.5">
                      목표 보증금의 {Math.min(Math.round((savingSwitch10 / targetDeposit) * 100), 100)}%
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push("/site/simulator?tab=assetPlan")}
                  className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-all"
                >
                  저축 속도 올려볼까요? → 자산 플랜 세우기
                </button>
              </div>
            </div>

            {/* 우: 원하는 집 */}
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Home size={14} className="text-blue-500" />
                    <p className="text-sm font-bold text-gray-900">원하는 집</p>
                  </div>
                  <p className="text-xs font-medium text-gray-500 mt-0.5">어느 지역 기준으로 볼까요?</p>
                </div>
                {/* 지역 선택 */}
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

              {/* 목표 이미지 + 하단 숫자 인라인 */}
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

              {/* 감성 카피 — title 단독, 숫자 별도 줄 */}
              <div className={`transition-opacity duration-200 ${imgVisible ? "opacity-100" : "opacity-0"}`}>
                <p className="text-sm font-bold text-gray-900">{SIZE_COPY[targetSize].title}</p>
                <p className="text-xs font-medium text-gray-500 mt-0.5">{SIZE_COPY[targetSize].sub}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs font-medium text-gray-400">전세</span>
                  <span className="text-xs font-bold text-blue-600">{fmt(targetDeposit)}</span>
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
                    <span className="inline-flex items-center text-[11px] font-medium text-red-500 bg-red-50 rounded-full px-2 py-0.5">
                      월 {monthlyGap}만원 gap
                    </span>
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
            <p className="text-sm font-bold text-gray-900">대출 끼면 얼마나 달라져?</p>
          </div>
          <p className="text-xs font-medium text-gray-500 mb-5">저축 금액과 전세대출을 조정해봐요</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 좌: 입력 */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
                  <p className="text-xs font-medium text-gray-500">목표 전세 보증금</p>
                  <p className="text-sm font-bold text-gray-900">{fmt(targetDeposit)}</p>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-medium text-gray-500">매달 저축 가능한 금액</p>
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
                      onChange={(e) => setSavingAmount(Number(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-200 pr-8 text-right"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500">만원</span>
                  </div>
                </div>
              </div>

              {/* 대출 슬라이더 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-500">전세대출</p>
                  <p className="text-sm font-bold text-gray-900">{fmt(loanAmount)}</p>
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
                  <span className="text-[10px] text-gray-400">{fmt(Math.min(targetDeposit, 50000))}</span>
                </div>
              </div>
            </div>

            {/* 우: 시나리오 2-카드 */}
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                {/* 순수 저축 */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">순수 저축만</p>
                  <p className="text-2xl font-bold text-gray-400">
                    {savingAmount > 0 ? `${yearsToGoal}년` : "–"}
                  </p>
                  <p className="text-[11px] font-medium text-gray-400 mt-1.5">
                    {savingAmount > 0
                      ? `${savingAmount}만원 × 12 = ${(savingAmount * 12).toLocaleString()}만원/년`
                      : "저축 금액을 입력해주세요"}
                  </p>
                </div>

                {/* 대출 시나리오 */}
                <div className="bg-white border border-blue-200 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    대출 {loanAmount > 0 ? fmt(loanAmount) : "0원"} 끼면
                  </p>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <p className="text-2xl font-bold text-blue-600">
                      {loanCoversAll ? "바로 가능" : savingAmount > 0 ? `${yearsWithLoan}년` : "–"}
                    </p>
                    {loanAmount > 0 && savingAmount > 0 && !loanCoversAll && yearsSaved > 0 && (
                      <span className="inline-flex items-center text-[11px] font-medium text-blue-600 bg-blue-50 rounded-full px-2 py-0.5">
                        ↓ {yearsSaved}년 단축
                      </span>
                    )}
                    {loanCoversAll && (
                      <span className="inline-flex items-center text-[11px] font-medium text-blue-600 bg-blue-50 rounded-full px-2 py-0.5">
                        ↓ {yearsToGoal}년 단축
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-medium text-blue-400 mt-1.5">
                    {loanAmount === 0
                      ? "슬라이더를 움직여봐요"
                      : loanCoversAll
                        ? `목표 보증금 ${fmt(targetDeposit)} 충당 가능`
                        : `(${fmt(targetDeposit)} - ${fmt(loanAmount)}) ÷ ${(savingAmount * 12).toLocaleString()}만원/년`}
                  </p>
                </div>
              </div>

              {/* 단축 요약 */}
              <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500">대출을 활용하면</p>
                <p className="text-sm font-bold text-gray-900">
                  {loanAmount === 0
                    ? "대출 금액을 설정해보세요"
                    : loanCoversAll
                      ? `${yearsToGoal}년 단축 · 바로 이사 가능`
                      : yearsSaved > 0
                        ? `${yearsSaved}년 단축`
                        : "대출 효과가 크지 않아요"}
                </p>
              </div>

              {/* CTA: 대출 체감만, 블루 */}
              <button
                onClick={() => router.push("/site/simulator?tab=financeFeel")}
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-all"
              >
                대출 체감해보기 →
              </button>
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
