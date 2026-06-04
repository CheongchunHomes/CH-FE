"use client"

import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { TrendingUp, AlertCircle } from "lucide-react"

// ─ 상수
const JEONWOLSE_RATE = 0.055  // 전월세전환율 5.5%
const EXPECTED_RETURN = 0.035 // 기대수익률 3.5%
const APPRECIATION    = 0.03  // 집값 상승률 연 3%

// ─ 거주 기간 옵션
const YEAR_OPTIONS = [4, 6, 10]

// ─ 평수 목록
const SIZES = [
  { value: 20, label: "20㎡", name: "원룸",   img: "/images/simulator/housing/oneroom.png" },
  { value: 33, label: "33㎡", name: "투룸",   img: "/images/simulator/housing/tworoom.png" },
  { value: 59, label: "59㎡", name: "빌라",   img: "/images/simulator/housing/villa.png" },
  { value: 84, label: "84㎡", name: "아파트", img: "/images/simulator/housing/apartment.png" },
]

// ─ 평수별 이미지 px 크기
const SIZE_PX: Record<number, number> = {
  20: 220,
  33: 250,
  59: 280,
  84: 310,
}

// ─ 평수별 서울 기준 기본값 (단위: 만원)
const DEFAULT_COSTS: Record<number, {
  monthly:  { deposit: number; rent: number }
  jeonse:   { deposit: number }
  purchase: { price: number; loan: number; rate: number; period: number }
}> = {
  20: {
    monthly:  { deposit: 1000,  rent: 55 },
    jeonse:   { deposit: 15000 },
    purchase: { price: 25000, loan: 15000, rate: 4.0, period: 30 },
  },
  33: {
    monthly:  { deposit: 2000,  rent: 75 },
    jeonse:   { deposit: 25000 },
    purchase: { price: 45000, loan: 27000, rate: 4.0, period: 30 },
  },
  59: {
    monthly:  { deposit: 3000,  rent: 100 },
    jeonse:   { deposit: 40000 },
    purchase: { price: 70000, loan: 42000, rate: 4.0, period: 30 },
  },
  84: {
    monthly:  { deposit: 5000,  rent: 130 },
    jeonse:   { deposit: 60000 },
    purchase: { price: 100000, loan: 60000, rate: 4.0, period: 30 },
  },
}

// ─ 주거형태
const TYPES = [
  { value: "monthly",  label: "월세" },
  { value: "jeonse",   label: "전세" },
  { value: "purchase", label: "자가" },
]

// ─ 숫자 포맷
function fmt(value: number): string {
  if (!value || isNaN(value)) return "0원"
  const sign = value < 0 ? "-" : ""
  const abs  = Math.abs(value)
  const eok  = Math.floor(abs / 10000)
  const man  = abs % 10000
  if (eok > 0 && man > 0) return `${sign}${eok}억 ${man}만원`
  if (eok > 0) return `${sign}${eok}억원`
  return `${sign}${abs}만원`
}

// ─ 월 실질 비용 계산
function calcMonthly(type: string, costs: typeof DEFAULT_COSTS[20]): number {
  if (type === "monthly") {
    const { deposit, rent } = costs.monthly
    // 월세 + 보증금 기회비용
    return Math.round(deposit * JEONWOLSE_RATE / 12 + rent)
  }
  if (type === "jeonse") {
    // 전세금 기회비용
    return Math.round(costs.jeonse.deposit * EXPECTED_RETURN / 12)
  }
  // 자가: 이자만 실질 소모 (원금은 자산으로 쌓임)
  const { loan, rate } = costs.purchase
  return Math.round(loan * (rate / 100) / 12)
}

// ─ N년 후 자산 계산 (만원)
function calcAssetN(type: string, costs: typeof DEFAULT_COSTS[20], years: number): number {
  if (type === "monthly") {
    const { deposit, rent } = costs.monthly
    const totalRent      = rent * 12 * years
    const opportunityCost = Math.round(deposit * JEONWOLSE_RATE * years)
    return deposit - totalRent - opportunityCost
  }
  if (type === "jeonse") {
    const opportunityCost = Math.round(costs.jeonse.deposit * EXPECTED_RETURN * years)
    return costs.jeonse.deposit - opportunityCost
  }
  // 자가: 집값 상승 - 남은 대출
  const { price, loan, rate, period } = costs.purchase
  const appreciated = Math.round(price * Math.pow(1 + APPRECIATION, years))
  const monthlyRate  = rate / 100 / 12
  const months       = period * 12
  const payment      = Math.round(loan * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1))
  let remaining = loan
  for (let i = 0; i < years * 12; i++) {
    const interest  = Math.round(remaining * monthlyRate)
    const principal = Math.max(payment - interest, 0)
    remaining = Math.max(remaining - principal, 0)
  }
  return appreciated - remaining
}

interface CostForm {
  monthly:  { deposit: number; rent: number }
  jeonse:   { deposit: number }
  purchase: { price: number; loan: number; rate: number; period: number }
}

const chartConfig: ChartConfig = {
  월세: { label: "월세", color: "#94a3b8" },
  전세: { label: "전세", color: "#60a5fa" },
  자가: { label: "자가", color: "#2563eb" },
}

export default function HousingCompare() {
  const [selectedSize, setSelectedSize] = useState(20)
  const [selectedType, setSelectedType] = useState("monthly")
  const [costs, setCosts]   = useState<CostForm>(DEFAULT_COSTS[20])
  const [years, setYears]   = useState(10)

  function handleSizeChange(size: number) {
    setSelectedSize(size)
    setCosts(DEFAULT_COSTS[size])
  }

  const currentMonthly = calcMonthly(selectedType, costs)
  const totalWaste     = currentMonthly * 12 * years

  const comparison = TYPES.map((t) => ({
    label:   t.label,
    monthly: calcMonthly(t.value, costs),
    assetN:  calcAssetN(t.value, costs, years),
  }))

  const chartData = [{
    name: `${years}년 후`,
    월세: Math.max(comparison[0].assetN, 0),
    전세: Math.max(comparison[1].assetN, 0),
    자가: Math.max(comparison[2].assetN, 0),
  }]

  const bestAsset    = Math.max(...comparison.map(c => c.assetN))
  const currentAsset = comparison.find(t => t.label === TYPES.find(t => t.value === selectedType)?.label)?.assetN ?? 0
  const diff         = bestAsset - currentAsset

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">

      {/* ── 좌측: 선택 흐름 ── */}
      <div className="space-y-4">

        {/* STEP 1: 평수 선택 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="text-xs text-gray-400 font-medium tracking-wide">STEP 1</p>
          <div>
            <p className="text-base font-bold text-gray-900">어떤 집에 살고 싶어요?</p>
            <p className="text-xs text-gray-400 mt-0.5">평수가 달라지면 비용도 달라져요</p>
          </div>

          {/* 집 이미지 */}
          <div className="flex justify-center items-center bg-gray-50 rounded-2xl overflow-hidden" style={{ height: 320 }}>
            <img
              key={selectedSize}
              src={SIZES.find(s => s.value === selectedSize)?.img}
              alt={SIZES.find(s => s.value === selectedSize)?.name}
              style={{ width: SIZE_PX[selectedSize], height: SIZE_PX[selectedSize] }}
              className="object-contain animate-spring"
            />
          </div>

          {/* 평수 버튼 */}
          <div className="grid grid-cols-4 gap-2">
            {SIZES.map((s) => (
              <button
                key={s.value}
                onClick={() => handleSizeChange(s.value)}
                className={`py-2.5 rounded-xl border text-xs font-medium transition-all ${
                  selectedSize === s.value
                    ? "bg-blue-600 text-white border-blue-600 scale-105"
                    : "border-gray-200 text-gray-600 hover:border-blue-300"
                }`}
              >
                <p>{s.label}</p>
                <p className={`text-[10px] mt-0.5 ${selectedSize === s.value ? "text-blue-200" : "text-gray-400"}`}>{s.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* STEP 2: 주거형태 + 비용 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="text-xs text-gray-400 font-medium tracking-wide">STEP 2</p>
          <div>
            <p className="text-base font-bold text-gray-900">어떤 방식으로 살 거예요?</p>
            <p className="text-xs text-gray-400 mt-0.5">같은 집도 방식에 따라 {years}년 후가 달라져요</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setSelectedType(t.value)}
                className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                  selectedType === t.value
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-gray-200 text-gray-600 hover:border-blue-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <AlertCircle size={11} />
              서울 기준 평균값 적용 · 직접 수정 가능해요
            </p>

            {selectedType === "monthly" && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 shrink-0 w-20">보증금</label>
                  <div className="relative flex-1">
                    <input type="number" value={costs.monthly.deposit}
                           onChange={(e) => setCosts({ ...costs, monthly: { ...costs.monthly, deposit: Number(e.target.value) } })}
                           className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">만원</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 shrink-0 w-20">월세</label>
                  <div className="relative flex-1">
                    <input type="number" value={costs.monthly.rent}
                           onChange={(e) => setCosts({ ...costs, monthly: { ...costs.monthly, rent: Number(e.target.value) } })}
                           className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">만원</span>
                  </div>
                </div>
              </>
            )}

            {selectedType === "jeonse" && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 shrink-0 w-20">전세금</label>
                <div className="relative flex-1">
                  <input type="number" value={costs.jeonse.deposit}
                         onChange={(e) => setCosts({ ...costs, jeonse: { deposit: Number(e.target.value) } })}
                         className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">만원</span>
                </div>
              </div>
            )}

            {selectedType === "purchase" && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 shrink-0 w-20">매매가</label>
                  <div className="relative flex-1">
                    <input type="number" value={costs.purchase.price}
                           onChange={(e) => setCosts({ ...costs, purchase: { ...costs.purchase, price: Number(e.target.value) } })}
                           className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">만원</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 shrink-0 w-20">대출금</label>
                  <div className="relative flex-1">
                    <input type="number" value={costs.purchase.loan}
                           onChange={(e) => setCosts({ ...costs, purchase: { ...costs.purchase, loan: Number(e.target.value) } })}
                           className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">만원</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* STEP 3: 거주 기간 + 각성 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="text-xs text-gray-400 font-medium tracking-wide">STEP 3</p>
          <div>
            <p className="text-base font-bold text-gray-900">얼마나 살 거예요?</p>
            <p className="text-xs text-gray-400 mt-0.5">거주 기간이 길수록 선택의 차이가 커져요</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {YEAR_OPTIONS.map((y) => (
              <button
                key={y}
                onClick={() => setYears(y)}
                className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                  years === y
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-gray-200 text-gray-600 hover:border-blue-300"
                }`}
              >
                {y}년
              </button>
            ))}
          </div>

          <div className="bg-blue-500 text-white px-4 py-3 rounded-2xl">
            <p className="text-sm font-semibold">{years}년간 실질 주거비 {fmt(totalWaste)}</p>
            <p className="text-xs text-blue-200 mt-1">매달 {fmt(currentMonthly)} × {years * 12}개월</p>
          </div>

          <p className="text-xs text-gray-400 text-center">
            매일 {fmt(Math.round(currentMonthly / 30))}씩 나가고 있어요
          </p>
        </div>
      </div>

      {/* ── 우측: 실시간 결과판 ── */}
      <div className="space-y-4">

        {/* 월 실질 비용 비교 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-500" />
            <p className="text-sm font-bold text-gray-800">월 실질 비용 비교</p>
          </div>
          <p className="text-xs text-gray-400">전월세전환율 5.5% · 기대수익률 3.5% · 서울 기준</p>

          <div className="space-y-3">
            {comparison.map((c) => {
              const isSelected = TYPES.find(t => t.value === selectedType)?.label === c.label
              const max = Math.max(...comparison.map(x => x.monthly))
              const pct = max > 0 ? Math.round((c.monthly / max) * 100) : 0
              return (
                <div key={c.label} className={`rounded-xl p-3 ${isSelected ? "bg-blue-50 border border-blue-200" : "bg-gray-50"}`}>
                  <div className="flex justify-between items-center mb-2">
                    <p className={`text-sm font-medium ${isSelected ? "text-blue-700" : "text-gray-700"}`}>{c.label}</p>
                    <p className={`text-sm font-bold ${isSelected ? "text-blue-700" : "text-gray-900"}`}>{fmt(c.monthly)}/월</p>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isSelected ? "bg-blue-500" : "bg-gray-300"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* N년 후 자산 비교 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-500" />
            <p className="text-sm font-bold text-gray-800">{years}년 후 내 자산</p>
          </div>
          <p className="text-xs text-gray-400">집값 연 3% 상승 · 대출 원리금 상환 반영</p>

          <div className="grid grid-cols-3 gap-3">
            {comparison.map((c) => {
              const isSelected = TYPES.find(t => t.value === selectedType)?.label === c.label
              return (
                <div key={c.label} className={`rounded-xl p-3 text-center ${isSelected ? "bg-blue-50 border border-blue-200" : "bg-gray-50"}`}>
                  <p className={`text-xs mb-1 ${isSelected ? "text-blue-500" : "text-gray-400"}`}>{c.label}</p>
                  <p className={`text-sm font-bold ${c.assetN < 0 ? "text-red-500" : isSelected ? "text-blue-700" : "text-gray-700"}`}>
                    {fmt(c.assetN)}
                  </p>
                </div>
              )
            })}
          </div>

          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${Math.round(v / 10000)}억`} domain={[0, 'auto']} />
              <ChartTooltip content={<ChartTooltipContent formatter={(value: number) => fmt(value)} />} />
              <Bar dataKey="월세" fill="var(--color-월세)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="전세" fill="var(--color-전세)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="자가" fill="var(--color-자가)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>

          {diff > 0 && selectedType !== "purchase" && (
            <div className="bg-blue-500 text-white px-4 py-3 rounded-2xl">
              <p className="text-sm font-semibold">
                자가 선택 시 {years}년 후 {fmt(diff)} 더 남아요
              </p>
              <p className="text-xs text-blue-200 mt-1">지금 선택이 미래 자산을 결정해요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
