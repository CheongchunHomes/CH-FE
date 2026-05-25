"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Slider } from "@/components/ui/slider"
import { ChevronDown, ChevronUp, TrendingUp, CreditCard } from "lucide-react"
import { get } from "@/lib/api"
import { DiagnosisForm } from "@/lib/diagnosisUtils"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

// DSR 구간별 캐릭터
const DSR_LEVELS = [
  {
    max: 20,
    img: "/images/simulator/finance/relaxed.png",
    label: "여유로워요",
    sub: "대출 부담이 적어요. 추가 저축 여력이 있어요.",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    max: 40,
    img: "/images/simulator/finance/normal.png",
    label: "감당 가능해요",
    sub: "적정 수준이에요. 지출 관리가 필요해요.",
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-100",
  },
  {
    max: 60,
    img: "/images/simulator/finance/stressed.png",
    label: "조금 버거워요",
    sub: "DSR 40% 초과예요. 대출 축소를 고려해봐요.",
    color: "text-orange-500",
    bg: "bg-orange-50",
    border: "border-orange-100",
  },
  {
    max: Infinity,
    img: "/images/simulator/finance/crushed.png",
    label: "위험 수준이에요",
    sub: "DSR 60% 초과. 금융기관 대출이 어려울 수 있어요.",
    color: "text-red-500",
    bg: "bg-red-50",
    border: "border-red-100",
  },
]

// 상환 스케줄 계산 (원리금균등)
function calcSchedule(principal: number, annualRate: number, months: number) {
  if (!principal || !annualRate || !months) return []
  const r = annualRate / 100 / 12
  const monthly = r === 0
    ? principal / months
    : (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)

  const rows = []
  let balance = principal
  for (let i = 1; i <= months; i++) {
    const interest = balance * r
    const repayment = Math.round(monthly - interest)
    const payment = Math.round(monthly)
    balance = Math.max(balance - repayment, 0)
    rows.push({ seq: i, repayment, interest: Math.round(interest), payment, balance: Math.round(balance) })
  }
  return rows
}

// 이자만 상환 월납입
function calcInterestOnly(principal: number, annualRate: number) {
  return Math.round((principal * (annualRate / 100)) / 12)
}

function fmt(value: number): string {
  if (!value) return "0원"
  const eok = Math.floor(value / 100000000)
  const man = Math.floor((value % 100000000) / 10000)
  const cheon = Math.floor((value % 10000) / 1000)
  let result = ""
  if (eok > 0) result += `${eok}억 `
  if (man > 0) result += `${man}만 `
  if (cheon > 0) result += `${cheon}천`
  return (result.trim() || "0") + "원"
}

function fmtNum(n: number) {
  return n.toLocaleString() + "원"
}

// mock 대출 데이터 (API 연동 전)
const MOCK_LOANS = [
  { loanId: 1, name: "청년 버팀목 전세대출", balance: 120000000, annualRate: 2.5, remainMonths: 24 },
]

// DSR 설명 아코디언
function DsrInfo() {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-5 border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-blue-600">DSR이란?</span>
          <span className="text-[10px] text-gray-400">총부채원리금상환비율</span>
        </div>
        {open
          ? <ChevronUp size={14} className="text-gray-400" />
          : <ChevronDown size={14} className="text-gray-400" />
        }
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3">
          <p className="text-xs text-gray-600 leading-relaxed">
            월 소득 중 모든 대출 상환액이 차지하는 비율이에요.
          </p>
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <p className="text-xs font-medium text-gray-700 mb-1">예시</p>
            <p className="text-xs text-gray-500">
              월급 <span className="font-bold text-gray-900">300만원</span> · 월 상환액 <span className="font-bold text-gray-900">120만원</span> → DSR <span className="font-bold text-blue-600">40%</span>
            </p>
          </div>
          <div className="space-y-1.5">
            {[
              { range: "20% 이하",  label: "여유로운 수준",           color: "text-blue-600",   bg: "bg-blue-50" },
              { range: "20~40%",    label: "적정 수준 (금융기관 권장)", color: "text-yellow-600", bg: "bg-yellow-50" },
              { range: "40% 초과",  label: "대출 심사 제한",           color: "text-orange-500", bg: "bg-orange-50" },
              { range: "60% 초과",  label: "대부분 대출 불가",          color: "text-red-500",    bg: "bg-red-50" },
            ].map((item) => (
              <div key={item.range} className={`flex items-center justify-between px-3 py-2 rounded-lg ${item.bg}`}>
                <span className="text-xs font-bold text-gray-700">DSR {item.range}</span>
                <span className={`text-xs font-medium ${item.color}`}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 상환 스케줄 테이블 컴포넌트
function ScheduleTable({ rows }: { rows: ReturnType<typeof calcSchedule> }) {
  const PAGE_SIZE = 12
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(rows.length / PAGE_SIZE)
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="space-y-2">
      {totalPages > 1 && (
        <p className="text-[11px] text-gray-400 px-1">
          {page * PAGE_SIZE + 1}~{Math.min((page + 1) * PAGE_SIZE, rows.length)}회차 / 전체 {rows.length}회
        </p>
      )}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-xs">
          <thead>
          <tr className="bg-gray-50 text-gray-500">
            <th className="py-2 px-3 text-left font-medium">회차</th>
            <th className="py-2 px-3 text-right font-medium">납입원금</th>
            <th className="py-2 px-3 text-right font-medium">이자</th>
            <th className="py-2 px-3 text-right font-medium">월납입액</th>
            <th className="py-2 px-3 text-right font-medium">잔액</th>
          </tr>
          </thead>
          <tbody>
          {pageRows.map((row, i) => (
            <tr key={row.seq} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
              <td className="py-2 px-3 text-gray-500">{row.seq}회</td>
              <td className="py-2 px-3 text-right text-gray-700">{fmtNum(row.repayment)}</td>
              <td className="py-2 px-3 text-right text-red-400">{fmtNum(row.interest)}</td>
              <td className="py-2 px-3 text-right font-medium text-gray-900">{fmtNum(row.payment)}</td>
              <td className="py-2 px-3 text-right text-gray-500">{fmtNum(row.balance)}</td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>

      {/* shadcn Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(p - 1, 0)) }}
                aria-disabled={page === 0}
                className={page === 0 ? "pointer-events-none opacity-30" : ""}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  href="#"
                  onClick={(e) => { e.preventDefault(); setPage(i) }}
                  isActive={page === i}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(p + 1, totalPages - 1)) }}
                aria-disabled={page === totalPages - 1}
                className={page === totalPages - 1 ? "pointer-events-none opacity-30" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}

// 대출 아코디언 아이템
function LoanAccordionItem({ loan, monthlyIncome }: {
  loan: typeof MOCK_LOANS[0]
  monthlyIncome: number
}) {
  const [open, setOpen] = useState(false)
  const [method, setMethod] = useState<"equal" | "interest">("interest")
  const [months, setMonths] = useState(loan.remainMonths)

  const schedule = method === "equal" ? calcSchedule(loan.balance, loan.annualRate, months) : []
  const monthlyPayment = method === "equal"
    ? (schedule[0]?.payment ?? 0)
    : calcInterestOnly(loan.balance, loan.annualRate)
  const totalInterest = method === "equal"
    ? schedule.reduce((s, r) => s + r.interest, 0)
    : calcInterestOnly(loan.balance, loan.annualRate) * months
  const totalPayment = loan.balance + totalInterest
  const dsrContrib = monthlyIncome > 0 ? Math.round((monthlyPayment / monthlyIncome) * 100) : 0

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      {/* 헤더 */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <CreditCard size={14} className="text-blue-600" />
          <div>
            <p className="text-sm font-bold text-gray-900">{loan.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              잔액 {fmt(loan.balance)} · 연 {loan.annualRate}%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold text-blue-600">{fmtNum(monthlyPayment)}</p>
            <p className="text-[10px] text-gray-400">월 납입</p>
          </div>
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>

      {/* 상세 */}
      {open && (
        <div className="px-5 pb-5 pt-0 border-t border-gray-100 space-y-4">

          {/* 상환 방식 + 기간 — 세그먼트 탭 */}
          <div className="space-y-3 pt-4">
            <div className="space-y-1.5">
              <p className="text-xs text-gray-500">상환 방식</p>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {(["interest", "equal"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                      method === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {m === "interest" ? "이자만" : "원리금균등"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-gray-500">상환 기간</p>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {[12, 24, 36, 60, 120].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMonths(m)}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                      months === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {m}개월
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 요약 */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-0">
            {/*<div className="flex justify-between items-center py-1.5 border-b border-gray-100">*/}
            {/*  <p className="text-xs text-gray-500">총 이자</p>*/}
            {/*  <p className="text-sm font-bold text-red-500">{fmtNum(totalInterest)}</p>*/}
            {/*</div>*/}
            <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
              <p className="text-xs text-gray-500">연 이자</p>
              <p className="text-sm font-bold text-red-500">{fmtNum(Math.round(totalInterest / (months / 12)))}</p>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
              <p className="text-xs text-gray-500">월 납입액</p>
              <p className="text-sm font-bold text-gray-900">{fmtNum(monthlyPayment)}</p>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <p className="text-xs text-gray-500">매일로 나누면</p>
              <p className="text-sm font-bold text-gray-900">{fmtNum(Math.round(monthlyPayment / 30))}/일</p>
            </div>
          </div>

          {/* 일상 환산 + DSR 기여도 */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex justify-between items-center">
            <p className="text-xs text-blue-600">매일로 나누면</p>
            <p className="text-xs font-bold text-blue-600">{fmtNum(Math.round(monthlyPayment / 30))}/일</p>
            {monthlyIncome > 0 && (
              <p className="text-xs font-medium text-blue-500">DSR 기여 {dsrContrib}%</p>
            )}
          </div>

          {/* 상환 스케줄 */}
          {method === "equal" && schedule.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">상환 스케줄</p>
              <ScheduleTable rows={schedule} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface FinanceFeelProps {
  userProfile: DiagnosisForm | null
}

export default function FinanceFeel({ userProfile }: FinanceFeelProps) {
  const router = useRouter()

  // 연봉 → 월소득 자동입력
  const defaultMonthlyIncome = userProfile?.annualIncome
    ? Math.round(userProfile.annualIncome / 12) * 10000  // 만원 단위 → 원 단위
    : 3000000  // 기본값 300만원 (원 단위)

// sessionStorage에서 이전 값 복원
  const savedFinance = (() => {
    try { return JSON.parse(sessionStorage.getItem("financeSnapshot") ?? "null") } catch { return null }
  })()

// DSR 시뮬레이터 state
  const [loanAmount, setLoanAmount]       = useState(savedFinance?.loanAmount   ?? 120000000)
  const [annualRate, setAnnualRate]       = useState(savedFinance?.annualRate    ?? 3.5)
  const [monthlyIncome, setMonthlyIncome] = useState(savedFinance?.monthlyIncome ?? defaultMonthlyIncome)
  const [repayMonths, setRepayMonths]     = useState(savedFinance?.repayMonths   ?? 60)
  const [method, setMethod] = useState<"equal" | "interest">(
    savedFinance?.method === "equal" || savedFinance?.method === "interest"
      ? savedFinance.method
      : "interest"
  )

  // 계산
  const schedule = method === "equal"
    ? calcSchedule(loanAmount, annualRate, repayMonths)
    : []
  const monthlyPayment = method === "equal"
    ? (schedule[0]?.payment ?? 0)
    : calcInterestOnly(loanAmount, annualRate)
  const dsr = monthlyIncome > 0 ? Math.round((monthlyPayment / monthlyIncome) * 100) : 0

  const dsrLevel = DSR_LEVELS.find((l) => dsr < l.max) ?? DSR_LEVELS[DSR_LEVELS.length - 1]
  const totalInterest = method === "equal"
    ? schedule.reduce((s, r) => s + r.interest, 0)
    : calcInterestOnly(loanAmount, annualRate) * repayMonths

  // financeSnapshot → sessionStorage 저장 (탭4 AI 프롬프트용)
  useEffect(() => {
    const snapshot = {
      loanAmount,
      annualRate,
      monthlyIncome,
      repayMonths,
      method,
      monthlyPayment,
      dsr,
      dsrLabel: dsrLevel.label,
      totalInterest,
    }
    sessionStorage.setItem("financeSnapshot", JSON.stringify(snapshot))
  }, [loanAmount, annualRate, monthlyIncome, repayMonths, method,
    monthlyPayment, dsr, dsrLevel.label, totalInterest])

  return (
    <div className="space-y-4 pt-6">

      {/* ── DSR 시뮬레이터 ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-1.5 mb-1">
          <TrendingUp size={14} className="text-blue-600" />
          <p className="text-sm font-bold text-gray-900">내 월급으로 이 대출, 감당할 수 있을까?</p>
        </div>
        <p className="text-xs text-gray-500 mb-3">대출 조건을 조정해서 내 상환 부담을 체감해봐요</p>

        {/* DSR 설명 아코디언 */}
        <DsrInfo />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* 좌: 입력 */}
          <div className="space-y-5">

            {/* 대출금액 */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <p className="text-xs text-gray-500">대출금액</p>
                <p className="text-sm font-bold text-gray-900">{fmt(loanAmount)}</p>
              </div>
              <Slider
                min={10000000}
                max={500000000}
                step={5000000}
                value={[loanAmount]}
                onValueChange={([v]) => setLoanAmount(v)}
              />
              <div className="flex justify-between">
                <span className="text-[10px] text-gray-400">1,000만원</span>
                <span className="text-[10px] text-gray-400">5억원</span>
              </div>
            </div>

            {/* 금리 */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <p className="text-xs text-gray-500">연 금리</p>
                <p className="text-sm font-bold text-gray-900">{annualRate}%</p>
              </div>
              <Slider
                min={1}
                max={10}
                step={0.1}
                value={[annualRate]}
                onValueChange={([v]) => setAnnualRate(Math.round(v * 10) / 10)}
              />
              <div className="flex justify-between">
                <span className="text-[10px] text-gray-400">1%</span>
                <span className="text-[10px] text-gray-400">10%</span>
              </div>
            </div>

            {/* 월소득 */}
            <div className="space-y-1.5">
              <p className="text-xs text-gray-500">월 소득</p>
              <div className="relative">
                <input
                  type="number"
                  value={monthlyIncome === 0 ? "" : Math.round(monthlyIncome / 10000)}
                  onChange={(e) => setMonthlyIncome((Number(e.target.value) || 0) * 10000)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">만원</span>
              </div>
              <p className="text-xs text-gray-400">
                {userProfile?.annualIncome
                  ? `연봉 ${(userProfile.annualIncome / 10000).toLocaleString()}만원이에요 · 직접 수정 가능`
                  : "기본값 300만원 적용 · 직접 수정 가능"}
              </p>
            </div>

            {/* 상환 방식 */}
            <div className="space-y-1.5">
              <p className="text-xs text-gray-500">상환 방식</p>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {(["interest", "equal"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                      method === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {m === "interest" ? "이자만" : "원리금균등"}
                  </button>
                ))}
              </div>
            </div>

            {/* 상환 기간 */}
            <div className="space-y-1.5">
              <p className="text-xs text-gray-500">상환 기간</p>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {[12, 24, 36, 60, 120].map((m) => (
                  <button
                    key={m}
                    onClick={() => setRepayMonths(m)}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                      repayMonths === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {m}개월
                  </button>
                ))}
              </div>
            </div>

            {/* 요약 */}
            <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-0">
              {/*<div className="flex justify-between items-center py-1.5 border-b border-gray-100">*/}
              {/*  <p className="text-xs text-gray-500">총 이자</p>*/}
              {/*  <p className="text-sm font-bold text-red-500">{fmtNum(totalInterest)}</p>*/}
              {/*</div>*/}
              <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                <p className="text-xs text-gray-500">연 이자</p>
                <p className="text-sm font-bold text-red-500">{fmtNum(Math.round(totalInterest / (repayMonths / 12)))}</p>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                <p className="text-xs text-gray-500">월 납입액</p>
                <p className="text-sm font-bold text-gray-900">{fmtNum(monthlyPayment)}</p>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <p className="text-xs text-gray-500">매일로 나누면</p>
                <p className="text-sm font-bold text-gray-900">{fmtNum(Math.round(monthlyPayment / 30))}/일</p>
              </div>
            </div>
          </div>

          {/* 우: 캐릭터 + DSR */}
          <div className="flex flex-col items-center justify-center gap-4">
            <div className={`w-full rounded-2xl border ${dsrLevel.border} ${dsrLevel.bg} flex flex-col items-center py-8 px-6 gap-3`}>
              <img
                src={dsrLevel.img}
                alt={dsrLevel.label}
                className="w-80 h-60 object-contain transition-all duration-300"
              />
              <div className="text-center">
                <p className={`text-2xl font-bold ${dsrLevel.color}`}>DSR {dsr}%</p>
                <p className={`text-sm font-bold mt-1 ${dsrLevel.color}`}>{dsrLevel.label}</p>
                <p className="text-xs text-gray-500 mt-1">{dsrLevel.sub}</p>
              </div>
            </div>

            {/* DSR 체감 문구 */}
            <div className="w-full rounded-xl px-4 py-3 border border-gray-100 bg-gray-50">
              <p className={`text-xs font-bold mb-1 ${
                dsr > 60 ? "text-red-500" : dsr > 40 ? "text-orange-500" : dsr > 20 ? "text-yellow-600" : "text-blue-600"
              }`}>
                대출이 월급의 {dsr}%를 가져가요
              </p>
              {monthlyIncome > 0 && (
                <p className="text-xs font-semibold text-gray-500">
                  남은 {fmt(monthlyIncome - monthlyPayment)}으로 식비·교통·생활비 다 해결해야 해요
                </p>
              )}
            </div>


            <button
              onClick={() => router.push("/site/simulator?tab=assetPlan")}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-all"
            >
              저축 플랜 세우기 →
            </button>
          </div>
        </div>
      </div>

      {/* ── 내 대출 불러오기 ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-1.5 mb-1">
          <CreditCard size={14} className="text-blue-600" />
          <p className="text-sm font-bold text-gray-900">내 대출 상세</p>
        </div>
        <p className="text-xs text-gray-500 mb-5">등록된 대출의 상환 스케줄을 확인해봐요</p>

        <div className="space-y-3">
          {MOCK_LOANS.map((loan) => (
            <LoanAccordionItem
              key={loan.loanId}
              loan={loan}
              monthlyIncome={monthlyIncome}
            />
          ))}
        </div>

        {/* API 연동 후 제거할 mock 안내 */}
        <p className="text-[11px] text-gray-300 text-center mt-4">
          * 대출 API 연동 전 mock 데이터입니다
        </p>
      </div>

    </div>
  )
}
