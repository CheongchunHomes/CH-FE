"use client"

import { useEffect, useState } from "react";
import { HourglassIcon, Layers, TrendingUp, Pencil, Trash2, ChevronDown, ChevronUp, CheckCircle2, PiggyBank } from "lucide-react"
import { AssetPlanData, AssetPlanForm } from "@/lib/simulatorTypes"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { get, post } from "@/lib/api";
import { useRouter} from "next/navigation";
import { DiagnosisForm, RecommendationResponse, sanitizeDiagnosisForm } from "@/lib/diagnosisUtils";

// ─ 카테고리 목록
const CATEGORIES = [
  { value: "HOUSING",     emoji: "🏠", label: "주거" },
  { value: "TRAVEL",      emoji: "✈️", label: "여행" },
  { value: "CAR",         emoji: "🚗", label: "자동차" },
  { value: "ELECTRONICS", emoji: "📱", label: "전자기기" },
  { value: "WEDDING",     emoji: "💍", label: "결혼" },
  { value: "FASHION",     emoji: "👗", label: "패션" },
  { value: "EDUCATION",   emoji: "🎓", label: "교육" },
  { value: "OTHER",       emoji: "🎯", label: "기타" },
]

// ─ 카테고리별 이미지
const CATEGORY_IMAGES: Record<string, string> = {
  HOUSING:     "/images/simulator/asset/housing.png",
  TRAVEL:      "/images/simulator/asset/travel.png",
  CAR:         "/images/simulator/asset/car.png",
  ELECTRONICS: "/images/simulator/asset/electronics.png",
  WEDDING:     "/images/simulator/asset/wedding.png",
  FASHION:     "/images/simulator/asset/fashion.png",
  EDUCATION:   "/images/simulator/asset/education.png",
  OTHER:       "/images/simulator/asset/other.png",
}

// ─ 카테고리별 콘텐츠
const CATEGORY_CONTENT: Record<string, {
  shock: string
  sub: string
  placeholder: { planName: string; baseAsset: string; goalAmount: string }
  dailyUnit: string
}> = {
  HOUSING: {
    shock: "드디어 내 공간, 현실로 만들어봐요",
    sub: "보증금 한 발짝씩 모으면 어느새 내 집 앞이에요",
    placeholder: { planName: "전세 보증금 마련", baseAsset: "5,000,000", goalAmount: "50,000,000" },
    dailyUnit: "아메리카노",
  },
  TRAVEL: {
    shock: "이번 여행 참으면 월세 한 달 아껴요",
    sub: "근데 그래도 가고 싶죠? 그럼 목표부터 세워봐요",
    placeholder: { planName: "여름 유럽 여행", baseAsset: "500,000", goalAmount: "3,000,000" },
    dailyUnit: "편의점 도시락",
  },
  CAR: {
    shock: "이 차 값이면 서울 전세 보증금이에요",
    sub: "그래도 핸들 잡고 싶죠? 목표 세우면 현실이 달라져요",
    placeholder: { planName: "첫 차 구입", baseAsset: "2,000,000", goalAmount: "15,000,000" },
    dailyUnit: "주유비",
  },
  ELECTRONICS: {
    shock: "최신폰 한 번 참으면 청약통장 2년치예요",
    sub: "그래도 갖고 싶죠? 일단 모아보면 생각이 바뀔 수도 있어요",
    placeholder: { planName: "맥북 구입", baseAsset: "300,000", goalAmount: "2,500,000" },
    dailyUnit: "카페 라떼",
  },
  WEDDING: {
    shock: "결혼 준비, 미리 모으면 신혼집이 달라져요",
    sub: "웨딩 비용보다 신혼집이 더 중요하다는 거 알잖아요",
    placeholder: { planName: "결혼 준비 자금", baseAsset: "3,000,000", goalAmount: "30,000,000" },
    dailyUnit: "외식비",
  },
  FASHION: {
    shock: "옷값 아끼면 관리비 걱정 없는 집 살 수 있어요",
    sub: "스타일은 유지하면서 목표도 세워봐요",
    placeholder: { planName: "시즌 쇼핑 예산", baseAsset: "100,000", goalAmount: "500,000" },
    dailyUnit: "택시비",
  },
  EDUCATION: {
    shock: "자격증 하나가 연봉을 바꾸고 집을 바꿔요",
    sub: "배움에 투자하는 돈은 아깝지 않아요",
    placeholder: { planName: "자격증 취득 비용", baseAsset: "200,000", goalAmount: "1,000,000" },
    dailyUnit: "구독 서비스",
  },
  OTHER: {
    shock: "작은 절약이 쌓이면 내 집이 돼요",
    sub: "목표가 생기면 소비가 달라져요",
    placeholder: { planName: "나만의 목표", baseAsset: "100,000", goalAmount: "1,000,000" },
    dailyUnit: "커피",
  },
}

// ─ 유틸
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


function calcProgress(baseAsset: number, goalAmount: number): number {
  if (!goalAmount) return 0
  return Math.min(Math.round((baseAsset / goalAmount) * 100), 100)
}

function calcSavingBreakdown(baseAsset: number, goalAmount: number, startDate: string, endDate: string) {
  const remaining = goalAmount - baseAsset
  if (remaining <= 0) return null
  const start = new Date(startDate)
  const target = new Date(endDate)
  const totalDays = Math.ceil((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  if (totalDays <= 0) return null
  return {
    daily:    Math.ceil(remaining / totalDays),
    weekly:   Math.ceil(remaining / Math.ceil(totalDays / 7)),
    monthly:  Math.ceil(remaining / Math.max(Math.ceil(totalDays / 30), 1)),
    totalDays,
  }
}

function isOverdue(endDate: string | null): boolean {
  if (!endDate) return false
  return new Date(endDate) < new Date()
}

function calcDday(endDate: string | null): string {
  if (!endDate) return ""
  const diff = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return "기간 초과"
  if (diff === 0) return "D-Day"
  return `D-${diff}`
}

function getEulReul(word: string): string {
  if (!word) return "을"
  const code = word[word.length - 1].charCodeAt(0)
  if (code < 0xAC00 || code > 0xD7A3) return "을"
  return (code - 0xAC00) % 28 > 0 ? "을" : "를"
}

// ─ Props
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

export default function AssetPlan({
                                    plans, form, setForm, editingPlanId, isLoading,
                                    onCreate, onEditStart, onUpdate, onDelete, onEditCancel, onToggleComplete,
                                  }: Props) {
  const [hideAmount, setHideAmount] = useState(false)
  const [sortBy, setSortBy] = useState<"date" | "status">("status")
  const [openPlanId, setOpenPlanId] = useState<number | null>(null)

  const content = CATEGORY_CONTENT[form.category]
  const ph = content.placeholder

  function updateForm(key: keyof AssetPlanForm, value: unknown) {
    setForm({ ...form, [key]: value })
  }

  function handleSubmit() {
    editingPlanId ? onUpdate() : onCreate()
  }

  /* 플랜 tip */
  const [tipPolicies, setTipPolicies] = useState<PolicyListDTO[]>([])

// 정책 상세 페이지로 이동
  const router = useRouter()

  useEffect(() => {
    get<{ content: PolicyListDTO[] }>("/api/policies", {
      query: { keyword: "저축,적금,통장", size: 100 }
    })
      .then((res) => setTipPolicies((res.content ?? []).slice(0, 3)))
      .catch(() => {})
  }, [])

  // 저축 분석
  const completedPlans = plans.filter((p) => p.isCompleted || isOverdue(p.endDate))
  const totalSaved = completedPlans.reduce((sum, p) => sum + (p.goalAmount ?? 0), 0)
  const totalMonths = plans.reduce((sum, p) => {
    if (!p.endDate) return sum
    const created = new Date(p.createdAt)
    const target = new Date(p.endDate)
    return sum + Math.max((target.getFullYear() - created.getFullYear()) * 12 + (target.getMonth() - created.getMonth()), 0)
  }, 0)
  const dailyAvg = totalMonths > 0 ? Math.ceil(totalSaved / (totalMonths * 30)) : 0

  // step3 계산
  const breakdown = form.startDate && form.endDate && form.goalAmount
    ? calcSavingBreakdown(form.baseAsset ?? 0, form.goalAmount, form.startDate, form.endDate)
    : null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">

      {/* ── 좌측: 입력 폼 (4단계 흐름) ── */}
      <div className="space-y-4">

        {/* step1: 카테고리 선택 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="text-xs text-gray-400 font-medium tracking-wide">STEP 1</p>
          <div>
            <p className="text-base font-bold text-gray-900">목표가 생기면 저축 속도가 달라져요</p>
            <p className="text-xs text-gray-400 mt-0.5">뭘 위해 모을지 정하는 것부터 시작이에요</p>
          </div>

          {/* 카테고리 그리드 4x2 — 이미지 버튼 */}
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => updateForm("category", cat.value)}
                className={`flex flex-col items-center rounded-xl border overflow-hidden transition-all ${
                  form.category === cat.value
                    ? "border-blue-600 ring-2 ring-blue-400 scale-105"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <img
                  src={CATEGORY_IMAGES[cat.value]}
                  alt={cat.label}
                  className={`w-full aspect-square object-cover transition-transform duration-300 ${
                    form.category === cat.value ? "animate-spring" : ""
                  }`}
                />
                <span className={`text-[10px] py-1 font-medium w-full text-center ${
                  form.category === cat.value ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-500"
                }`}>
        {cat.label}
      </span>
              </button>
            ))}
          </div>

          {/* 각성 문구 */}
          <div className="bg-blue-50 rounded-xl px-4 py-3">
            <p className="text-sm font-semibold text-blue-700">{content.shock}</p>
            <p className="text-xs text-blue-400 mt-1">{content.sub}</p>
          </div>

          {/* 각성 문구 강조v */}
          {/*<div className="bg-blue-500 text-white px-4 py-3 rounded-2xl">
            <p className="text-sm font-semibold">{content.shock}</p>
            <p className="text-xs text-blue-200 mt-1">{content.sub}</p>
          </div>*/}
        </div>

        {/* step2: 금액 입력 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="text-xs text-gray-400 font-medium tracking-wide">STEP 2</p>
          <div>
            <p className="text-base font-bold text-gray-900">얼마나, 언제까지?</p>
            <p className="text-xs text-gray-400 mt-0.5">목표가 구체적일수록 달성 확률이 3배 높아요</p>
          </div>

          {/* 카테고리 + 플랜명 */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={form.category}
                onChange={(e) => updateForm("category", e.target.value)}
                className="appearance-none px-3 py-2 pr-8 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.emoji} {cat.label}</option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown size={14} className="text-gray-400" />
              </div>
            </div>
            <input
              type="text"
              value={form.planName}
              onChange={(e) => updateForm("planName", e.target.value)}
              placeholder={ph.planName}
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
                  if (form.baseAsset) updateForm("baseAsset", Math.floor(form.baseAsset / 1000) * 1000)
                }}
                placeholder={ph.baseAsset}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-24"
              />
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
                  if (form.goalAmount) updateForm("goalAmount", Math.floor(form.goalAmount / 1000) * 1000)
                }}
                placeholder={ph.goalAmount}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-24"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                {form.goalAmount ? formatCurrency(form.goalAmount) : "원"}
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
        </div>

        {/* step3: 이렇게 모으면 돼요 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="text-xs text-gray-400 font-medium tracking-wide">STEP 3</p>
          <div>
            <p className="text-base font-bold text-gray-900">이렇게만 하면 돼요</p>
           {/* <p className="text-xs text-gray-400 mt-0.5">매일 이것만 아끼면 목표일에 딱 맞게 모여요</p>*/}
          </div>

          {breakdown ? (
            <>
              {/* 말풍선 */}
              {form.planName && form.goalAmount && (
                <div className="relative bg-blue-500 text-white text-xs font-medium px-4 py-2.5 rounded-2xl">
                  ✨ {form.planName}{getEulReul(form.planName)} 목표로 {formatCurrency(form.goalAmount)} 저축 시작!
                  <div className="absolute -top-2 left-6 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-blue-500" />
                </div>
              )}

              {/* 3열 저축액 */}
              <div className="grid grid-cols-3 divide-x divide-gray-100 bg-gray-50 rounded-xl py-3">
                <div className="text-center space-y-1">
                  <p className="text-xs text-gray-400">매일</p>
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(breakdown.daily)}</p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs text-gray-400">매주</p>
                  <p className="text-sm font-bold text-blue-600">{formatCurrency(breakdown.weekly)}</p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs text-gray-400">매달</p>
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(breakdown.monthly)}</p>
                </div>
              </div>

              {/* 일상 환산 */}
              <p className="text-xs text-gray-400 text-center">
                매일 {content.dailyUnit} 한 잔 아끼는 것부터 시작해봐요 ☕
              </p>
            </>
          ) : (
            <div className="bg-gray-50 rounded-xl py-6 text-center">
              <p className="text-xs text-gray-400">목표 금액과 기간을 입력하면 저축 플랜이 나와요</p>
            </div>
          )}
          {/* 저장 버튼 */}
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
              disabled={!form.planName || !form.goalAmount}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {editingPlanId ? "수정 완료" : "플랜 저장"}
            </button>
          </div>
        </div>


      </div>

      {/* ── 우측: 플랜 목록 + 분석 ── */}
      <div className="space-y-4">

        {/* 플랜 목록 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">

          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Layers size={16} className="text-blue-500" />
              <p className="text-sm font-bold text-gray-800">저축 플랜</p>
              <div className="flex gap-1">
                <button
                  onClick={() => setSortBy("date")}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                    sortBy === "date" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400 hover:text-gray-600"
                  }`}
                >
                  날짜순
                </button>
                <button
                  onClick={() => setSortBy("status")}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                    sortBy === "status" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400 hover:text-gray-600"
                  }`}
                >
                  진행상태
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">금액 가리기</span>
              <Switch checked={hideAmount} onCheckedChange={setHideAmount} />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-gray-400 text-sm">불러오는 중...</div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              아직 저장된 플랜이 없어요. 첫 플랜을 만들어보세요!
            </div>
          ) : (
            <div className="p-5 space-y-3">
              {[...plans].sort((a, b) => {
                if (sortBy === "status") {
                  const aC = a.isCompleted || isOverdue(a.endDate)
                  const bC = b.isCompleted || isOverdue(b.endDate)
                  return aC === bC ? 0 : aC ? 1 : -1
                }
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              }).map((plan) => {
                const progress = calcProgress(plan.baseAsset ?? 0, plan.goalAmount ?? 0)
                const isOpen = openPlanId === plan.planId
                const cat = CATEGORIES.find((c) => c.value === plan.category)
                const categoryLabel = cat ? `${cat.emoji} ${cat.label}` : plan.category
                const completed = plan.isCompleted || isOverdue(plan.endDate)
                const dday = calcDday(plan.endDate)
                const planBreakdown = plan.startDate && plan.endDate && plan.goalAmount
                  ? calcSavingBreakdown(plan.baseAsset ?? 0, plan.goalAmount, plan.startDate, plan.endDate)
                  : null

                return (
                  <div key={plan.planId} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

                    {/* 아코디언 헤더 */}
                    <div
                      className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setOpenPlanId(isOpen ? null : plan.planId)}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant={completed ? "default" : "outline"} className="text-xs">
                          {categoryLabel}
                        </Badge>
                        <p className={`font-medium text-sm ${completed ? "text-gray-400 line-through" : "text-gray-900"}`}>
                          {plan.planName}
                        </p>
                        {dday && <span className="text-xs text-blue-500 font-medium">{dday}</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-semibold text-gray-900">
                          {hideAmount ? "•••••원" : formatCurrency(plan.goalAmount ?? 0)}
                        </p>
                        {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                      </div>
                    </div>

                    {/* 아코디언 상세 */}
                    {isOpen && (
                      <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">

                        {/* 타임라인 */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">{hideAmount ? "••••••" : formatCurrency(plan.baseAsset ?? 0)}</span>
                            <span className="text-gray-500">{hideAmount ? "••••••" : formatCurrency(plan.goalAmount ?? 0)}</span>
                          </div>
                          <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                          </div>
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>{plan.startDate}</span>
                            <span className="text-blue-500 font-medium">{progress}% 달성</span>
                            <span>{plan.endDate}</span>
                          </div>
                        </div>

                        {/* 페이스 카드 */}
                        {planBreakdown && (() => {
                          const start = plan.startDate ? new Date(plan.startDate) : null
                          const today = new Date()
                          if (start && today < start) return (
                            <div className="border border-gray-100 rounded-xl p-3 text-center">
                              <p className="text-xs text-gray-400">아직 시작 전이에요</p>
                              <p className="text-sm font-medium text-gray-500 mt-1">{plan.startDate} 부터 시작돼요</p>
                            </div>
                          )
                          return (
                            <div className="border border-gray-100 rounded-xl p-3 space-y-3">
                              <div className="grid grid-cols-3 divide-x divide-gray-100 text-center">
                                <div className="space-y-1 pr-2">
                                  <p className="text-xs text-gray-400">매일 · {planBreakdown.totalDays}일</p>
                                  <p className="text-sm font-bold text-gray-900">{hideAmount ? "••••" : formatCurrency(planBreakdown.daily)}</p>
                                </div>
                                <div className="space-y-1 px-2">
                                  <p className="text-xs text-gray-400">매주 · {Math.ceil(planBreakdown.totalDays / 7)}주</p>
                                  <p className="text-sm font-bold text-gray-900">{hideAmount ? "••••" : formatCurrency(planBreakdown.weekly)}</p>
                                </div>
                                <div className="space-y-1 pl-2">
                                  <p className="text-xs text-gray-400">매달 · {Math.max(Math.ceil(planBreakdown.totalDays / 30), 1)}개월</p>
                                  <p className="text-sm font-bold text-gray-900">{hideAmount ? "••••" : formatCurrency(planBreakdown.monthly)}</p>
                                </div>
                              </div>
                              <div className="flex justify-between text-xs text-gray-400 border-t border-gray-100 pt-2">
                                <span>남은 금액 {hideAmount ? "••••" : formatCurrency((plan.goalAmount ?? 0) - (plan.baseAsset ?? 0))}</span>
                                <span>{dday}</span>
                              </div>
                            </div>
                          )
                        })()}

                        {/* 달성 체크 + 수정/삭제 */}
                        <div className="flex items-center justify-between pt-1">
                          <button
                            onClick={() => onToggleComplete(plan.planId, !plan.isCompleted)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              completed
                                ? "bg-primary text-primary-foreground hover:bg-primary/80"
                                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {completed ? <CheckCircle2 size={13} /> : <HourglassIcon size={13} />}
                            {completed ? "완료" : "진행"}
                          </button>
                          <div className="flex gap-2">
                            {!completed && (
                              <button
                                onClick={() => onEditStart(plan)}
                                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                              >
                                <Pencil size={13} />
                                수정
                              </button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/80 transition-colors">
                                  <Trash2 size={13} />
                                  삭제
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>플랜을 삭제할까요?</AlertDialogTitle>
                                  <AlertDialogDescription>삭제된 플랜은 복구할 수 없어요.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>취소</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => onDelete(plan.planId)}>삭제</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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

        {/* 저축 리포트 */}
        {plans.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-500" />
              <p className="text-sm font-bold text-gray-800">저축 리포트</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-gray-900">{completedPlans.length}/{plans.length}</p>
                <p className="text-xs text-gray-400 mt-1">달성</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-gray-900">{hideAmount ? "•••" : formatCurrency(totalSaved)}</p>
                <p className="text-xs text-gray-400 mt-1">총 모은 금액</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-blue-600">
                  {plans.length > 0 ? Math.round((completedPlans.length / plans.length) * 100) : 0}%
                </p>
                <p className="text-xs text-gray-400 mt-1">달성률</p>
              </div>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${plans.length > 0 ? Math.round((completedPlans.length / plans.length) * 100) : 0}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 font-medium">달성 <span className="text-blue-500 font-bold">{hideAmount ? "•••" : formatCurrency(totalSaved)}</span></span>
              <span className="text-gray-500 font-medium">진행중 <span className="text-gray-700 font-bold">{hideAmount ? "•••" : formatCurrency(plans.filter(p => !p.isCompleted && !isOverdue(p.endDate)).reduce((sum, p) => sum + (p.goalAmount ?? 0), 0))}</span></span>
            </div>
            {(() => {
              const upcoming = plans
                .filter(p => !p.isCompleted && !isOverdue(p.endDate) && p.endDate)
                .sort((a, b) => new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime())[0]
              if (!upcoming) return null
              return (
                <p className="text-xs text-gray-500 font-medium text-center">
                  다음 목표 <span className="font-bold text-gray-800">{upcoming.planName}</span> · <span className="text-blue-500 font-bold">{calcDday(upcoming.endDate)}</span>
                </p>
              )
            })()}
            {totalMonths > 0 && (
              <p className="text-xs text-gray-400 text-center">
                총 {totalMonths}개월 · 일 평균 {hideAmount ? "•••" : formatCurrency(dailyAvg)}
              </p>
            )}
          </div>
        )}

        {/* 플랜 tip. 이런 제도도 있어요 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="text-xs text-gray-400 font-medium tracking-wide">플랜 Tip</p>
          <p className="text-base font-bold text-gray-900">이런 제도도 있어요</p>
          {tipPolicies.length === 0 ? (
            <p className="text-xs text-gray-400">불러오는 중...</p>
          ) : (
            <div className="space-y-2">
              {tipPolicies.map((p, i) => (
                // 카드 클릭 시 정책 상세 페이지로 이동
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
