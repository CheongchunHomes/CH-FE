"use client"

import { useState, useRef, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react"
import { get } from "@/lib/api";
import { useRouter } from "next/navigation"

// 정책 목록 API 응답 타입 (GET /api/policies)
interface PolicyListDTO {
  policyId: number;
  title: string;
  summary: string;
  mainCategory: string;
  subCategory: string;
  status: string;
  applyPeriod: string;
  supervisingInstitution: string;
}

interface CostForm {
  monthly: { deposit: number; rent: number }
  jeonse: { deposit: number }
  purchase: { price: number; loan: number; rate: number; period: number }
}


// ─ 상수
const JEONWOLSE_RATE = 0.055  // 전월세전환율 5.5%
const EXPECTED_RETURN = 0.035 // 기대수익률 3.5%
const YEARS = 10              // 비교 기간 고정 10년

// ─ 평수 목록
const SIZES = [
  { value: 20, label: "20㎡", name: "원룸",  img: "/images/simulator/housing/oneroom.png" },
  { value: 33, label: "33㎡", name: "투룸",  img: "/images/simulator/housing/tworoom.png" },
  { value: 59, label: "59㎡", name: "빌라",  img: "/images/simulator/housing/villa.png" },
  { value: 84, label: "84㎡", name: "아파트", img: "/images/simulator/housing/apartment.png" },
]

// ─ 평수별 이미지 크기
const SIZE_PX: Record<number, number> = {
  20: 320,
  33: 340,
  59: 380,
  84: 450,
}

// ─ 평수별 서울 기준 기본값 (단위: 만원)
const DEFAULT_COSTS: Record<number, {
  monthly: { deposit: number; rent: number }      // 월세: 보증금, 월세
  jeonse: { deposit: number }                      // 전세: 보증금
  purchase: { price: number; loan: number; rate: number; period: number } // 자가: 매매가, 대출, 금리, 기간
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
  if (!value) return "0원"
  const eok = Math.floor(value / 10000)
  const man = value % 10000
  if (eok > 0 && man > 0) return `${eok}억 ${man}만원`
  if (eok > 0) return `${eok}억원`
  return `${value}만원`
}

// ─ 월 실질 비용 계산
function calcMonthly(type: string, costs: typeof DEFAULT_COSTS[20]): number {
  if (type === "monthly") {
    const { deposit, rent } = costs.monthly
    return Math.round(deposit * JEONWOLSE_RATE / 12 + rent)
  }
  if (type === "jeonse") {
    return Math.round(costs.jeonse.deposit * EXPECTED_RETURN / 12)
  }
  // 자가: 원리금균등상환 월상환액 - 원금상환분 (이자만)
  const { loan, rate, period } = costs.purchase
  const monthlyRate = rate / 100 / 12
  const months = period * 12
  const payment = Math.round(loan * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1))
  const interest = Math.round(loan * monthlyRate)
  return interest
}

// ─ 10년 후 자산 계산 (만원)
function calcAsset10(type: string, costs: typeof DEFAULT_COSTS[20], monthlyOut: number): number {
  const years = YEARS
  if (type === "monthly") {
    const { deposit, rent } = costs.monthly
    const totalRent = rent * 12 * years
    const opportunityCost = Math.round(deposit * JEONWOLSE_RATE * years)
    // 보증금 돌려받고 월세+기회비용 차감, 최소 -totalRent
    return deposit - totalRent - opportunityCost
  }
  if (type === "jeonse") {
    // 전세: 보증금 전액 돌려받음
    return costs.jeonse.deposit
  }
  // 자가: 매매가 상승 가정 (연 3%) + 대출 원금 일부 상환
  const { price, loan, rate, period } = costs.purchase
  const appreciated = Math.round(price * Math.pow(1.03, years))
  const monthlyRate = rate / 100 / 12
  const months = period * 12
  const payment = Math.round(loan * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1))
  // 10년간 상환된 원금
  let remaining = loan
  for (let i = 0; i < years * 12; i++) {
    const interest = Math.round(remaining * monthlyRate)
    const principal = payment - interest
    remaining = Math.max(remaining - principal, 0)
  }
  return appreciated - remaining
}

export default function HousingCompare() {
  const [selectedSize, setSelectedSize] = useState(20)
  const [selectedType, setSelectedType] = useState("monthly")
  const [costs, setCosts] = useState<CostForm>(DEFAULT_COSTS[20])

  // 슬라이드 방향
  const [slideDir, setSlideDir] = useState<"animate-slide-left" | "animate-slide-right">("animate-slide-left")
  const [tipPolicies, setTipPolicies] = useState<PolicyListDTO[]>([])

  // 정책 상세 페이지로 이동
  const router = useRouter()

  // 정책 제도
  useEffect(() => {
    const subCategory = selectedType === "jeonse" ? "보증금지원" : "월세지원"
    get<{ content: PolicyListDTO[] }>("/api/policies", {
      query: { subCategory, size: 100 }
    })
      .then((res) => setTipPolicies((res.content ?? []).slice(0, 3)))
      .catch(() => {})
  }, [selectedType])


  // 현재 선택된 월 실질 비용
  const currentMonthly = calcMonthly(selectedType, costs)

  // 3가지 형태 비교
  const comparison = TYPES.map((t) => ({
    label: t.label,
    monthly: calcMonthly(t.value, costs),
    asset10: calcAsset10(t.value, costs, calcMonthly(t.value, costs)),
  }))

  // 바차트 데이터
  const chartData = [
    {
      name: "10년 후 자산",
      월세: comparison[0].asset10,
      전세: comparison[1].asset10,
      자가: comparison[2].asset10,
    }
  ]

  // 각성 문구
  const monthlyWaste = currentMonthly * 12 * YEARS
  const bestAsset = Math.max(...comparison.map(c => c.asset10))
  const currentAsset = comparison.find(t => t.label === TYPES.find(t => t.value === selectedType)?.label)?.asset10 ?? 0

  // 평수 변경 시 기본값 업데이트
  function handleSizeChange(size: number) {
    setSlideDir(size > selectedSize ? "animate-slide-left" : "animate-slide-right")
    setSelectedSize(size)
    setCosts(DEFAULT_COSTS[size])
  }

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
              className={`object-contain ${slideDir}`}
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

        {/* STEP 2: 주거형태 선택 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="text-xs text-gray-400 font-medium tracking-wide">STEP 2</p>
          <div>
            <p className="text-base font-bold text-gray-900">어떤 방식으로 살 거예요?</p>
            <p className="text-xs text-gray-400 mt-0.5">같은 집도 방식에 따라 10년 후가 달라져요</p>
          </div>

          {/* 주거형태 버튼 */}
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

          {/* 비용 입력 */}
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
                    <input
                      type="number"
                      value={costs.monthly.deposit}
                      onChange={(e) => setCosts({ ...costs, monthly: { ...costs.monthly, deposit: Number(e.target.value) } })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">만원</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 shrink-0 w-20">월세</label>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={costs.monthly.rent}
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
                  <input
                    type="number"
                    value={costs.jeonse.deposit}
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
                    <input
                      type="number"
                      value={costs.purchase.price}
                      onChange={(e) => setCosts({ ...costs, purchase: { ...costs.purchase, price: Number(e.target.value) } })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">만원</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 shrink-0 w-20">대출금</label>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={costs.purchase.loan}
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

        {/* STEP 3: 각성 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="text-xs text-gray-400 font-medium tracking-wide">STEP 3</p>
          <div>
            <p className="text-base font-bold text-gray-900">이게 맞는 선택이야?</p>
            <p className="text-xs text-gray-400 mt-0.5">같은 돈으로 선택이 달라지면 자산이 달라져요</p>
          </div>

          <div className="bg-blue-500 text-white px-4 py-3 rounded-2xl">
            <p className="text-sm font-semibold">
              {YEARS}년간 실질 주거비 {fmt(monthlyWaste)}
            </p>
            <p className="text-xs text-blue-200 mt-1">
              매달 {fmt(currentMonthly)} × {YEARS * 12}개월
            </p>
          </div>

          {/* 일상 환산 */}
          <p className="text-xs text-gray-400 text-center">
            매일 {fmt(Math.round(currentMonthly / 30))} 씩 나가고 있어요
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
          <p className="text-xs text-gray-400">전월세전환율 5.5% · 기대수익률 3.5% · 2025년 기준</p>

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
                      className={`h-full rounded-full transition-all duration-500 ${isSelected ? "bg-blue-500" : "bg-gray-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 10년 후 자산 바차트 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-500" />
            <p className="text-sm font-bold text-gray-800">{YEARS}년 후 내 자산</p>
          </div>
          <p className="text-xs text-gray-400">집값 연 3% 상승 · 대출 원리금 상환 반영</p>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {comparison.map((c) => {
              const isSelected = TYPES.find(t => t.value === selectedType)?.label === c.label
              return (
                <div key={c.label} className={`rounded-xl p-3 text-center ${isSelected ? "bg-blue-50 border border-blue-200" : "bg-gray-50"}`}>
                  <p className={`text-xs mb-1 ${isSelected ? "text-blue-500" : "text-gray-400"}`}>{c.label}</p>
                  <p className={`text-sm font-bold ${isSelected ? "text-blue-700" : "text-gray-700"}`}>{fmt(c.asset10)}</p>
                </div>
              )
            })}
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${Math.round(v / 10000)}억`} domain={[0, 'auto']} />
              <Tooltip formatter={(value: number) => [`${fmt(value)}`, ""]} />
              <Bar dataKey="월세" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="전세" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              <Bar dataKey="자가" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* 각성 문구 */}
          {currentAsset < bestAsset && (
            <div className="bg-blue-500 text-white px-4 py-3 rounded-2xl">
              <p className="text-sm font-semibold">
                자가 선택 시 {YEARS}년 후 {fmt(bestAsset - currentAsset)} 더 남아요
              </p>
              <p className="text-xs text-blue-200 mt-1">지금 선택이 미래 자산을 결정해요</p>
            </div>
          )}
        </div>
        {/* 관련 제도 팁 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="text-xs text-gray-400 font-medium tracking-wide">플랜 Tip</p>
          <p className="text-base font-bold text-gray-900">이런 제도도 있어요</p>
          {tipPolicies.length === 0 ? (
            <p className="text-xs text-gray-400">불러오는 중...</p>
          ) : (
            <div className="space-y-2">
              {tipPolicies.map((p, i) => (
                <div
                  key={p.policyId}
                  // 카드 클릭 시 정책 상세 페이지로 이동
                  onClick={() => router.push(`/site/policies/${p.policyId}`)}
                  className={`rounded-xl p-3 border cursor-pointer hover:opacity-80 ${i === 0 ? "border-blue-300 bg-blue-50" : "border-gray-100 bg-gray-50"}`}
                >
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium inline-block mb-1 ${i === 0 ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-500"}`}>
                  {i === 0 ? "추천" : "참고"}
                </span>
                  <p className={`text-xs font-bold ${i === 0 ? "text-blue-700" : "text-gray-800"}`}>{p.title}</p>
                  <p className={`text-[10px] leading-relaxed line-clamp-2 mt-0.5 ${i === 0 ? "text-blue-500" : "text-gray-400"}`}>{p.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
