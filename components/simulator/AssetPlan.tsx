"use client"

import { useState } from "react"
import { Pencil, Trash2, ChevronDown, ChevronUp, CheckCircle2, Circle } from "lucide-react"
import { AssetPlanData, AssetPlanForm } from "@/lib/simulatorTypes"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

// 카테고리 목록
const CATEGORIES = [
  { value: "HOUSING",     label: "🏠 주거" },
  { value: "TRAVEL",      label: "✈️ 여행" },
  { value: "CAR",         label: "🚗 자동차" },
  { value: "ELECTRONICS", label: "📱 전자기기" },
  { value: "WEDDING",     label: "💍 결혼" },
  { value: "FASHION",     label: "👗 패션" },
  { value: "EDUCATION",   label: "🎓 교육" },
  { value: "OTHER",       label: "🎯 기타" },
]

// 카테고리별 이미지 경로
const CATEGORY_IMAGES: Record<string, string> = {
  HOUSING:     "/images/simulator/housing.png",
  TRAVEL:      "/images/simulator/travel.png",
  CAR:         "/images/simulator/car.png",
  ELECTRONICS: "/images/simulator/electronics.png",
  WEDDING:     "/images/simulator/wedding.png",
  FASHION:     "/images/simulator/fashion.png",
  EDUCATION:   "/images/simulator/education.png",
  OTHER:       "/images/simulator/other.png",
}

// 카테고리별 팁 문구
const CATEGORY_TIPS: Record<string, string> = {
  HOUSING:     "서울 외곽 빌라 전세 보증금 수준이에요.",
  TRAVEL:      "유럽 한 달 여행 경비로 충분해요.",
  CAR:         "국산 준중형 신차 한 대 살 수 있어요.",
  ELECTRONICS: "최신 노트북 + 스마트폰 세트로 살 수 있어요.",
  WEDDING:     "소규모 스드메 비용으로 쓸 수 있어요.",
  FASHION:     "시즌 전체 옷장을 바꿀 수 있어요.",
  EDUCATION:   "자격증 + 어학연수 비용으로 충분해요.",
  OTHER:       "목표한 것을 이룰 수 있어요.",
}

// 숫자 → 만원/천원 단위 변환
function formatCurrency(value: number): string {
  if (!value) return "0원"
  const eok = Math.floor(value / 100000000)
  const man = Math.floor((value % 100000000) / 10000)
  const cheon = Math.floor((value % 10000) / 1000)

  let result = ""
  if (eok > 0) result += `${eok}억 `
  if (man > 0) result += `${man}만 `
  if (cheon > 0) result += `${cheon}천`
  
  return result.trim() + "원"
}

// 달성률 계산
function calcProgress(baseAsset: number, goalAmount: number): number {
  if (!goalAmount) return 0
  return Math.min(Math.round((baseAsset / goalAmount) * 100), 100)
}

// 목표일 기준 월/주/일 저축액 계산
function calcSavingBreakdown(baseAsset: number, goalAmount: number, endDate: string) {
  const remaining = goalAmount - baseAsset
  if (remaining <= 0) return null
  const now = new Date()
  const target = new Date(endDate)
  const months =
    (target.getFullYear() - now.getFullYear()) * 12 +
    (target.getMonth() - now.getMonth())
  if (months <= 0) return null
  return {
    monthly: Math.ceil(remaining / months),
    weekly:  Math.ceil(remaining / (months * 4.3)),
    daily:   Math.ceil(remaining / (months * 30)),
  }
}
// 목표일 지났는지 확인 → 자동 완료 판별
function isOverdue(endDate: string | null): boolean {
  if (!endDate) return false
  return new Date(endDate) < new Date()
}

// D-day 계산
function calcDday(endDate: string | null): string {
  if (!endDate) return ""
  const now = new Date()
  const target = new Date(endDate)
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return "기간 초과"
  if (diff === 0) return "D-Day"
  return `D-${diff}`
}

interface Props {
  plans: AssetPlanData[]
  form: AssetPlanForm
  setForm: (form: AssetPlanForm) => void
  editingPlanId: number | null
  isLoading: boolean
  onCreate: () => void
  onEditStart: (plan: AssetPlanData) => void
  onUpdate: () => void
  onDelete: (planId: number) => void
  onEditCancel: () => void
  onToggleComplete: (planId: number, isCompleted: boolean) => void
}

export default function AssetPlan({
  plans,
  form,
  setForm,
  editingPlanId,
  isLoading,
  onCreate,
  onEditStart,
  onUpdate,
  onDelete,
  onEditCancel,
  onToggleComplete,
}: Props) {
  // 금액 가리기 토글
  const [hideAmount, setHideAmount] = useState(false)
  // 아코디언 열린 planId
  const [openPlanId, setOpenPlanId] = useState<number | null>(null)

  // 폼 필드 업데이트 헬퍼
  function updateForm(key: keyof AssetPlanForm, value: unknown) {
    setForm({ ...form, [key]: value })
  }

  // 저장 버튼
  function handleSubmit() {
    if (editingPlanId) {
      onUpdate()
    } else {
      onCreate()
    }
  }

  // 목표일 기준 저축액 계산
  const savingBreakdown =
  form.endDate !== null && form.goalAmount !== null
    ? calcSavingBreakdown(form.baseAsset ?? 0, form.goalAmount, form.endDate)
    : null

  // 저축 분석 계산
  const completedPlans = plans.filter((p) => p.isCompleted || isOverdue(p.endDate))
  const totalSaved = completedPlans.reduce((sum, p) => sum + (p.goalAmount ?? 0), 0)
  const totalMonths = plans.reduce((sum, p) => {
    if (!p.endDate) return sum
    const created = new Date(p.createdAt)
    const target = new Date(p.endDate)
    const months =
      (target.getFullYear() - created.getFullYear()) * 12 +
      (target.getMonth() - created.getMonth())
    return sum + Math.max(months, 0)
  }, 0)
  const dailyAvg = totalMonths > 0 ? Math.ceil(totalSaved / (totalMonths * 30)) : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">

      {/* ── 좌측: 입력 폼 ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

       {/* 카테고리 이미지 — 상단 */}
        <div className="flex flex-col items-center py-4 bg-gray-100 rounded-2xl">
        <img
            key={form.category}
            src={CATEGORY_IMAGES[form.category]}
            alt={form.category}
            className="w-72 h-72 object-contain animate-spring"
        />
        <p className="text-xs text-gray-400 mt-2 text-center">
            💡 {CATEGORY_TIPS[form.category]}
        </p>
        </div>

        {/* 카테고리 버튼 한 줄 */}
        <div className="flex justify-between gap-1">
        {CATEGORIES.map((cat) => (
            <button
            key={cat.value}
            onClick={() => updateForm("category", cat.value)}
            className={`flex-1 py-1.5 rounded-lg text-xs border transition-colors ${
                form.category === cat.value
                ? "bg-blue-600 text-white border-blue-600"
                : "border-gray-200 text-gray-600 hover:border-blue-300"
            }`}
            >
            {cat.label.split(" ")[0]}
            </button>
        ))}
        </div>

        {/* 카테고리 + 플랜명 한 줄 */}
        <div className="flex items-center gap-2">
        <div className="relative">
            <select
            value={form.category}
            onChange={(e) => updateForm("category", e.target.value)}
            className="appearance-none px-3 py-2 pr-8 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0"
            >
            {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
            </select>
            {/* 삼각형 화살표 */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronDown size={14} className="text-gray-400" />
            </div>
        </div>
        <input
            type="text"
            value={form.planName}
            onChange={(e) => updateForm("planName", e.target.value)}
            placeholder="플랜명"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        </div>

        {/* 현재 자금 */}
        <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600 shrink-0 w-20">현재 자금</label>
        <div className="relative flex-1">
            <input
                type="text"
                value={form.baseAsset ? form.baseAsset.toLocaleString() : ""}
                onChange={(e) => {
                    const raw = e.target.value.replace(/,/g, "")
                    if (!isNaN(Number(raw))) updateForm("baseAsset", Number(raw))
                }}
                onBlur={() => {
                    if (form.baseAsset) {
                    const rounded = Math.floor(form.baseAsset / 1000) * 1000
                    updateForm("baseAsset", rounded)
                    }
                }}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-24"
                />
            {/* 우측 환산 표시 */}
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
            {form.baseAsset ? formatCurrency(form.baseAsset) : "원"}
            </span>
        </div>
        </div>

        {/* 목표 금액 */}
        <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600 shrink-0 w-20">목표 금액</label>
        <div className="relative flex-1">
           <input
                type="text"
                value={form.goalAmount ? form.goalAmount.toLocaleString() : ""}
                onChange={(e) => {
                    const raw = e.target.value.replace(/,/g, "")
                    if (!isNaN(Number(raw))) updateForm("goalAmount", Number(raw))
                }}
                onBlur={() => {
                    if (form.goalAmount) {  {/* ← goalAmount */}
                    const rounded = Math.floor(form.goalAmount / 1000) * 1000 
                    updateForm("goalAmount", rounded) 
                    }
                }}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-24"
                />
                {/* 우측 환산 표시 */}
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                {form.goalAmount ? formatCurrency(form.goalAmount) : "원"}  {/* ← goalAmount */}
                </span>
         </div>
        </div>

       {/* 저축 기간 */}
        <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 shrink-0 w-20">저축 기간</label>
            <Popover>
                <PopoverTrigger asChild>
                <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.startDate && form.endDate
                    ? `${format(new Date(form.startDate), "yyyy.MM.dd")} ~ ${format(new Date(form.endDate), "yyyy.MM.dd")}`
                    : form.startDate
                    ? format(new Date(form.startDate), "yyyy.MM.dd")
                    : <span className="text-gray-400">기간 선택</span>
                    }
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="range"
                    selected={{
                    from: form.startDate ? new Date(form.startDate) : undefined,
                    to: form.endDate ? new Date(form.endDate) : undefined,
                    }}
                    onSelect={(range) => {
                    setForm({
                        ...form,
                        startDate: range?.from ? format(range.from, "yyyy-MM-dd") : null,
                        endDate: range?.to ? format(range.to, "yyyy-MM-dd") : null,
                        })
                        }}
                    fromYear={new Date().getFullYear()}
                    toYear={new Date().getFullYear() + 10}
                    captionLayout="dropdown"
                />
                </PopoverContent>
            </Popover>
        </div>

        {/* 저축 기간 안내 문구 */}
        {form.startDate && form.endDate && (
        (() => {
            const start = new Date(form.startDate)
            const end = new Date(form.endDate)
            const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
            const months = Math.floor(totalDays / 30)
            const days = totalDays % 30
            return (
            <div className="flex items-center gap-2">
                <div className="w-20 shrink-0" />  {/* ← 라벨 너비만큼 빈 공간 */}
                <p className="text-xs text-blue-500">
                {months > 0 ? `${months}개월 ` : ""}{days > 0 ? `${days}일` : ""} 동안의 저축 계획이에요!
                </p>
            </div>
            )
        })()
        )}

       
        {/* 저장/취소 버튼 */}
        <div className="flex gap-2 pt-1">
          {editingPlanId && (
            <button
              onClick={onEditCancel}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
          )}
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {editingPlanId ? "수정 완료" : "플랜 저장"}
          </button>
        </div>
      </div>

      {/* ── 우측: 플랜 목록 + 분석 ── */}
        <div className="space-y-4">

        {/* 플랜 목록 카드 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">

            {/* 카드 헤더 — 스위치 항상 표시 */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-800">저장된 플랜</p>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">금액 가리기</span>
                    <Switch
                    checked={hideAmount}
                    onCheckedChange={setHideAmount}
                    />
                </div>
            </div>

        {/* 카드 내용 */}
        {isLoading ? (
        <div className="text-center py-8 text-gray-400 text-sm">불러오는 중...</div>
        ) : plans.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
            아직 저장된 플랜이 없어요. 첫 플랜을 만들어보세요!
        </div>
        ) : (
        <div className="p-5 space-y-3">
            {plans.map((plan) => {
             const progress = calcProgress(plan.baseAsset ?? 0, plan.goalAmount ?? 0)
             const isOpen = openPlanId === plan.planId
             const categoryLabel = CATEGORIES.find((c) => c.value === plan.category)?.label ?? plan.category
             const completed = plan.isCompleted || isOverdue(plan.endDate)   // ← endDate
             const dday = calcDday(plan.endDate)                              // ← endDate
             const breakdown = plan.endDate && plan.goalAmount                // ← endDate
                 ? calcSavingBreakdown(plan.baseAsset ?? 0, plan.goalAmount, plan.endDate)
                 : null

          return (
                <div key={plan.planId} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

                  {/* 아코디언 헤더 */}
                  <div
                    className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setOpenPlanId(isOpen ? null : plan.planId)}
                  >
                    <div className="flex items-center gap-3">
                      {/* 달성 여부 아이콘 */}
                      {completed
                        ? <CheckCircle2 size={18} className="text-blue-500 shrink-0" />
                        : <Circle size={18} className="text-gray-300 shrink-0" />
                      }
                      <div>
                        <p className={`font-medium text-sm ${completed ? "text-gray-400 line-through" : "text-gray-900"}`}>
                          {plan.planName}
                        </p>
                        <p className="text-xs text-gray-400">{categoryLabel}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {hideAmount ? "••••••" : formatCurrency(plan.goalAmount ?? 0)}
                        </p>
                        <p className="text-xs text-blue-500">{dday}</p>
                      </div>
                      {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </div>

                  {/* 아코디언 상세 */}
                  {isOpen && (
                    <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">

                      {/* 달성률 프로그레스바 */}
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                          <span>현재 {hideAmount ? "••••••" : formatCurrency(plan.baseAsset ?? 0)}</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* 월 저축액 */}
                      {plan.monthlySaving && (
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-400 mb-0.5">월 저축액</p>
                          <p className="text-sm font-semibold text-gray-800">
                            {hideAmount ? "••••••" : formatCurrency(plan.monthlySaving)}
                          </p>
                        </div>
                      )}

                      {/* 달성 체크 + 수정/삭제 */}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => onToggleComplete(plan.planId, !plan.isCompleted)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            completed
                              ? "bg-blue-50 text-blue-600 border border-blue-200"
                              : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <CheckCircle2 size={13} />
                          {completed ? "달성 완료" : "달성 체크"}
                        </button>
                        <div className="flex gap-2">
                          <button
                            onClick={() => onEditStart(plan)}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            <Pencil size={13} />
                            수정
                          </button>
                          <button
                            onClick={() => onDelete(plan.planId)}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-red-100 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={13} />
                            삭제
                          </button>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        </div>

        {/* 저축 분석 */}
        {plans.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-3">
            <p className="text-sm font-bold text-gray-800">📊 나의 저축 분석</p>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{plans.length}개</span> 플랜 중{" "}
                <span className="font-semibold text-blue-600">{completedPlans.length}개</span> 달성
              </p>
              <p className="text-sm text-gray-600">
                총 모은 금액{" "}
                <span className="font-semibold text-gray-900">
                  {hideAmount ? "••••••" : formatCurrency(totalSaved)}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                달성률{" "}
                <span className="font-semibold text-blue-600">
                  {plans.length > 0 ? Math.round((completedPlans.length / plans.length) * 100) : 0}%
                </span>
              </p>
              {totalMonths > 0 && (
                <p className="text-sm text-gray-600">
                  총 <span className="font-semibold text-gray-900">{totalMonths}개월</span> 동안{" "}
                  일 평균{" "}
                  <span className="font-semibold text-gray-900">
                    {hideAmount ? "••••••" : formatCurrency(dailyAvg)}
                  </span>{" "}
                  저축
                </p>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}