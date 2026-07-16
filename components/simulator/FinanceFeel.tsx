"use client"

import { useState, useEffect } from "react"
import { useRouter }  from "next/navigation"
import { Slider }     from "@/components/ui/slider"
import { ChevronDown, ChevronUp, TrendingUp, CreditCard } from "lucide-react"
import { get }        from "@/lib/api"
import { DiagnosisForm } from "@/lib/diagnosisUtils"
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination"
import {
  calcSchedule, calcInterestOnly, calcDsr,
  formatCurrency, formatWon, manwonToWon, wonToManwon,
  RepayRow, FinanceSnapshot,
} from "@/lib/simulatorUtils"

// 대출 상품 타입 (대출파트 LoanProduct 엔티티 기준)
interface LoanProduct {
  loanId:         number
  name:           string
  provider:       string
  loanType:       string
  interestRate:    number | null
  interestRateMin: number | null
  maxAmount:       number | null
  incomeLimit:     number | null
  conditions:      string | null
  policyLoan:      boolean
  visible:         boolean
}

const DSR_LEVELS = [
  { max: 10,       label: "완전 여유",  color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-100",   img: "/images/simulator/finance/relaxed.png",  sub: "오늘 먹고 싶은 거 그냥 시켜도 되는 달이에요."                     },
  { max: 20,       label: "여유",       color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-100",   img: "/images/simulator/finance/relaxed.png",  sub: "월급날보다 대출 갚는 날이 더 신나는 삶이에요."                     },
  { max: 30,       label: "적정",       color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-100", img: "/images/simulator/finance/normal.png",   sub: "친구 생일 선물, 고민은 하지만 챙길 수는 있어요."                   },
  { max: 40,       label: "살짝 빠듯",  color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-100", img: "/images/simulator/finance/normal.png",   sub: "배달비 3,000원이 아깝기 시작하는 금액이에요."                      },
  { max: 50,       label: "빠듯",       color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100", img: "/images/simulator/finance/stressed.png", sub: "이번 달 생일인 친구가 3명이 넘지 않길 바라야 해요."                 },
  { max: 60,       label: "꽤 버거움",  color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100", img: "/images/simulator/finance/stressed.png", sub: "점심 메뉴 고를 때 가격을 먼저 보게 되는 달이에요."                  },
  { max: 70,       label: "버거움",     color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100", img: "/images/simulator/finance/stressed.png", sub: "퇴근길에 편의점 들르는 게 사치처럼 느껴져요."                      },
  { max: 80,       label: "위험 신호",  color: "text-red-500",    bg: "bg-red-50",    border: "border-red-100",    img: "/images/simulator/finance/crushed.png",  sub: "카드값 문자가 오면 일단 숨부터 참게 돼요."                         },
  { max: 90,       label: "위험",       color: "text-red-500",    bg: "bg-red-50",    border: "border-red-100",    img: "/images/simulator/finance/crushed.png",  sub: "내일은 어떻게 버티지, 일에도 집중이 안 되는 달이에요."              },
  { max: 100,      label: "매우 위험",  color: "text-red-500",    bg: "bg-red-50",    border: "border-red-100",    img: "/images/simulator/finance/crushed.png",  sub: "월급은 통장을 스쳐가고, 하루하루 시들어가는 느낌이에요."            },
  { max: 120,      label: "심각",       color: "text-red-500",    bg: "bg-red-50",    border: "border-red-100",    img: "/images/simulator/finance/crushed.png",  sub: "버는 족족 나가고, 남는 게 없어요. 지금 구조를 바꿔야 해요."         },
  { max: Infinity, label: "불가능",     color: "text-red-500",    bg: "bg-red-50",    border: "border-red-100",    img: "/images/simulator/finance/crushed.png",  sub: "지금 이 대출은 삶을 갉아먹고 있어요. 당장 줄여야 해요."             },
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
          <span className="text-xs font-bold text-blue-600">DSR이란?</span>
          <span className="text-[10px] font-semibold text-gray-400">총부채원리금상환비율</span>
        </div>
        {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3">
          <p className="text-xs text-gray-600 leading-relaxed">월 소득 중 모든 대출 상환액이 차지하는 비율이에요.</p>
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <p className="text-xs font-medium text-gray-700 mb-1">예시</p>
            <p className="text-xs text-gray-500">
              월급 <span className="font-bold text-gray-900">300만원</span> · 월 상환액 <span className="font-bold text-gray-900">120만원</span> → DSR <span className="font-bold text-blue-600">40%</span>
            </p>
          </div>
          <div className="space-y-1.5">
            {[
              { range: "20% 이하", label: "여유로운 수준",            color: "text-blue-600",   bg: "bg-blue-50"   },
              { range: "20~40%",   label: "적정 수준 (금융기관 권장)", color: "text-yellow-600", bg: "bg-yellow-50" },
              { range: "40% 초과", label: "대출 심사 제한",            color: "text-orange-500", bg: "bg-orange-50" },
              { range: "60% 초과", label: "대부분 대출 불가",          color: "text-red-500",    bg: "bg-red-50"    },
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

// 상환 스케줄 테이블
function ScheduleTable({ rows }: { rows: RepayRow[] }) {
  const PAGE_SIZE  = 12
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(rows.length / PAGE_SIZE)
  const pageRows   = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

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
              <td className="py-2 px-3 text-right text-gray-700">{formatWon(row.repayment)}</td>
              <td className="py-2 px-3 text-right text-red-400">{formatWon(row.interest)}</td>
              <td className="py-2 px-3 text-right font-medium text-gray-900">{formatWon(row.payment)}</td>
              <td className="py-2 px-3 text-right text-gray-500">{formatWon(row.balance)}</td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
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
                <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setPage(i) }} isActive={page === i}>
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

// 추천 대출 상품 아코디언 아이템
function LoanAccordionItem({ loan, monthlyIncome }: { loan: LoanProduct; monthlyIncome: number }) {
  const [open,   setOpen]   = useState(false)
  const [method, setMethod] = useState<"equal" | "interest">("equal")
  const [months, setMonths] = useState(24)

  // [FIX] null 방어: interestRate → interestRateMin → 기본값 3.5% 순 fallback
  const rate    = loan.interestRate ?? loan.interestRateMin ?? 3.5
  // 추천 대출 상품은 DB 한도 금액을 기준으로 월 납입/이자/DSR을 시뮬레이션한다.
  const loanLimitWon = manwonToWon(loan.maxAmount ?? 0)
  const rateLabel = loan.interestRateMin != null && loan.interestRate != null && loan.interestRateMin !== loan.interestRate
    ? `${loan.interestRateMin}~${loan.interestRate}%`
    : `${rate}%`

  const schedule       = method === "equal" ? calcSchedule(loanLimitWon, rate, months) : []
  const monthlyPayment = method === "equal" ? (schedule[0]?.payment ?? 0) : calcInterestOnly(loanLimitWon, rate)
  const totalInterest  = method === "equal"
    ? schedule.reduce((s, r) => s + r.interest, 0)
    : calcInterestOnly(loanLimitWon, rate) * months
  const dsrContrib = calcDsr(monthlyPayment, monthlyIncome)

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <CreditCard size={14} className="text-blue-600" />
          <div>
            <p className="text-sm font-bold text-gray-900">{loan.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              최대 {formatCurrency(loanLimitWon)} · 연 {rateLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold text-blue-600">{formatWon(monthlyPayment)}</p>
            <p className="text-[10px] text-gray-400">월 납입</p>
          </div>
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>

      {open && (
        <div className="px-5 pb-5 pt-0 border-t border-gray-100 space-y-4">
          <div className="space-y-3 pt-4">
            <div className="space-y-1.5">
              <p className="text-xs text-gray-500">상환 방식</p>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {(["equal", "interest"] as const).map((m) => (
                  <button key={m} onClick={() => setMethod(m)}
                          className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${method === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                    {m === "equal" ? "원리금균등상환" : "원금거치상환"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-gray-500">상환 기간</p>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {[12, 24, 36, 60, 120].map((m) => (
                  <button key={m} onClick={() => setMonths(m)}
                          className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${months === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                    {m}개월
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-0">
            {/* 대출금액 — 기준점 */}
            <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
              <p className="text-xs font-bold text-gray-400">대출금액</p>
              <p className="text-sm font-bold text-gray-900">{formatCurrency(loanLimitWon)}</p>
            </div>
            {method === "equal" ? (
              <>
                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-400">월 납입액</p>
                  <p className="text-sm font-bold text-red-500">{formatWon(monthlyPayment)}</p>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <p className="text-xs font-bold text-gray-400">총 이자</p>
                  <p className="text-sm font-bold text-gray-400">{formatWon(totalInterest)}</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                  <p className="text-sm font-bold text-gray-400">월 납입액 (이자만)</p>
                  <p className="text-sm font-bold text-red-500">{formatWon(monthlyPayment)}</p>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <p className="text-xs font-bold text-gray-400">연 이자</p>
                  <p className="text-sm font-medium text-gray-400">{formatWon(Math.round(totalInterest / (months / 12)))}</p>
                </div>
              </>
            )}
            {monthlyIncome > 0 && (
              <div className="flex justify-between items-center py-1.5 border-t border-gray-100 mt-1">
                <p className="text-xs font-bold text-gray-400">DSR 기여</p>
                <p className="text-xs font-bold text-blue-500">{dsrContrib}%</p>
              </div>
            )}
          </div>

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

// 대출 상품 필터링 — 소득·혼인·자녀 조건
function filterLoanProducts(loans: LoanProduct[], userProfile: DiagnosisForm | null): LoanProduct[] {
  return loans.filter((loan) => {
    // 연소득은 원 단위, incomeLimit은 만원 단위라 비교 전 연소득을 만원으로 환산한다.
    const incomeOk   = loan.incomeLimit == null || wonToManwon(userProfile?.annualIncome ?? 0) <= loan.incomeLimit
    const marriageOk = userProfile?.married      || !loan.name.includes("신혼부부")
    const childOk    = userProfile?.hasYoungChild || !loan.name.includes("신생아")
    return incomeOk && marriageOk && childOk
  }).slice(0, 5)
}

export default function FinanceFeel({ userProfile }: FinanceFeelProps) {
  const router = useRouter()

  // savedFinance 먼저 선언
  const savedFinance = (() => {
    try { return JSON.parse(sessionStorage.getItem("financeSnapshot") ?? "null") as FinanceSnapshot | null }
    catch { return null }
  })()

  const [loanAmount,    setLoanAmount]    = useState(savedFinance?.loanAmount  ?? 0)
  const [annualRate,    setAnnualRate]    = useState(savedFinance?.annualRate  ?? 1.0)
  // annualIncome 있으면 항상 프로필 연봉 기준 재계산 (연봉 변경 시 세션 캐시 무시)
  const [monthlyIncome, setMonthlyIncome] = useState(
    userProfile?.annualIncome
      ? Math.round(userProfile.annualIncome / 12)
      : savedFinance?.monthlyIncome ?? 2_500_000
  )
  const [repayMonths,   setRepayMonths]   = useState(savedFinance?.repayMonths ?? 60)
  const [method, setMethod] = useState<"equal" | "interest">(
    savedFinance?.method === "equal" || savedFinance?.method === "interest"
      ? savedFinance.method : "equal"
  )
  const [loans,        setLoans]       = useState<LoanProduct[]>([])
  const [loanLoading,  setLoanLoading] = useState(true)
  const [showDetail,   setShowDetail]  = useState(false)  // 요약 카드 상세보기 토글

  // 사용자가 조정한 대출 조건으로 월 납입액과 DSR을 즉시 계산한다.
  const schedule       = method === "equal" ? calcSchedule(loanAmount, annualRate, repayMonths) : []
  const monthlyPayment = method === "equal" ? (schedule[0]?.payment ?? 0) : calcInterestOnly(loanAmount, annualRate)
  const dsr            = calcDsr(monthlyPayment, monthlyIncome)
  const dsrLevel       = DSR_LEVELS.find((l) => dsr < l.max) ?? DSR_LEVELS[DSR_LEVELS.length - 1]
  const totalInterest  = method === "equal"
    ? schedule.reduce((s, r) => s + r.interest, 0)
    : calcInterestOnly(loanAmount, annualRate) * repayMonths

  // 청춘플랜 탭에서 재사용할 금융 체감 스냅샷을 저장한다.
  useEffect(() => {
    const snapshot: FinanceSnapshot = {
      loanAmount, annualRate, monthlyIncome, repayMonths, method,
      monthlyPayment, dsr, dsrLabel: dsrLevel.label, totalInterest,
    }
    sessionStorage.setItem("financeSnapshot", JSON.stringify(snapshot))
  }, [loanAmount, annualRate, monthlyIncome, repayMonths, method,
    monthlyPayment, dsr, dsrLevel.label, totalInterest])

  useEffect(() => {
    get<LoanProduct[]>("/api/loan-products")
      .then((data) => setLoans(filterLoanProducts(data, userProfile)))
      .catch(() => setLoans([]))
      .finally(() => setLoanLoading(false))
  }, [userProfile])

  return (
    <div className="space-y-4 pt-6">

      {/* ── DSR 시뮬레이터 ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-1.5 mb-1">
          <TrendingUp size={14} className="text-blue-600" />
          <p className="text-sm font-bold text-gray-900">내 월급으로 이 대출, 감당할 수 있을까?</p>
        </div>
        <p className="text-xs text-gray-500 mb-3">대출 조건을 조정해서 내 상환 부담을 체감해봐요</p>

        <DsrInfo />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 좌: 입력 */}
          <div className="space-y-5">

            <div className="space-y-2">
              <div className="flex justify-between">
                <p className="text-xs text-gray-500">대출금액</p>
                <p className="text-sm font-bold text-gray-900">{formatCurrency(loanAmount)}</p>
              </div>
              <Slider min={0} max={500_000_000} step={5_000_000} value={[loanAmount]} onValueChange={([v]) => setLoanAmount(v)} />
              <div className="flex justify-between">
                <span className="text-[10px] text-gray-400">1,000만원</span>
                <span className="text-[10px] text-gray-400">5억원</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <p className="text-xs text-gray-500">연 금리</p>
                <p className="text-sm font-bold text-gray-900">{annualRate}%</p>
              </div>
              <Slider min={1} max={10} step={0.1} value={[annualRate]} onValueChange={([v]) => setAnnualRate(Math.round(v * 10) / 10)} />
              <div className="flex justify-between">
                <span className="text-[10px] text-gray-400">1%</span>
                <span className="text-[10px] text-gray-400">10%</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-gray-500">월 소득</p>
              <div className="relative">
                <input
                  type="number"
                  value={monthlyIncome === 0 ? "" : wonToManwon(monthlyIncome)}
                  onChange={(e) => setMonthlyIncome(manwonToWon(Math.max(0, Number(e.target.value) || 0)))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">만원</span>
              </div>
              <p className="text-xs text-gray-400">
                {userProfile?.annualIncome
                  ? `연봉 ${wonToManwon(userProfile.annualIncome).toLocaleString()}만원이에요 · 직접 수정 가능`
                  : "기본값 250만원 적용 · 직접 수정 가능"}
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-gray-500">상환 방식</p>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {(["equal", "interest"] as const).map((m) => (
                  <button key={m} onClick={() => setMethod(m)}
                          className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${method === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                    {m === "equal" ? "원리금균등상환" : "원금거치상환"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-gray-500">상환 기간</p>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {[12, 24, 36, 60, 120].map((m) => (
                  <button key={m} onClick={() => setRepayMonths(m)}
                          className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${repayMonths === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                    {m}개월
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-0">
              {/* 대출금액 — 기준점 */}
              <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
                <p className="text-xs font-bold text-gray-400">대출금액</p>
                <p className="text-sm font-bold text-gray-900">{formatWon(loanAmount)}</p>
              </div>

              {/* 월 납입액 — 핵심 */}
              <div className="flex justify-between items-center py-1.5">
                <p className="text-xs font-bold text-gray-400">{method === "equal" ? "월 납입액" : "월 납입액 (이자만)"}</p>
                <p className="text-sm font-bold text-red-500">{formatWon(monthlyPayment)}</p>
              </div>

              {/* 상세보기 토글 */}
              <button
                onClick={() => setShowDetail(!showDetail)}
                className="w-full flex items-center justify-center gap-1 py-1.5 text-[11px] font-bold text-gray-400 hover:text-gray-600 transition-colors border-t border-gray-100"
              >
                {showDetail ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showDetail ? "접기" : "상세보기"}
              </button>

              {showDetail && (
                <div className="border-t border-gray-100 pt-1">
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-400">매일로 나누면</p>
                    <p className="text-sm font-bold text-gray-500">{formatWon(Math.round(monthlyPayment / 30))}</p>
                  </div>
                  {method === "equal" ? (
                    <>
                      <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                        <p className="text-xs font-bold text-gray-400">총 이자</p>
                        <p className="text-sm font-bold text-gray-400">{formatWon(totalInterest)}</p>
                      </div>
                      <div className="flex justify-between items-center py-1.5">
                        <p className="text-xs font-bold text-gray-400">총 상환액</p>
                        <p className="text-sm font-bold text-gray-400">{formatWon(monthlyPayment * repayMonths)}</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center py-1.5">
                      <p className="text-xs text-gray-400">연 이자</p>
                      <p className="text-sm font-medium text-gray-400">{formatWon(Math.round(totalInterest / (repayMonths / 12)))}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 우: 캐릭터 + DSR */}
          <div className="flex flex-col items-center justify-center gap-4">
            <div className={`w-full rounded-2xl border ${dsrLevel.border} ${dsrLevel.bg} flex flex-col items-center py-8 px-6 gap-3`}>
              <img src={dsrLevel.img} alt={dsrLevel.label} className="w-80 h-60 object-contain transition-all duration-300" />
              <div className="text-center">
                <p className={`text-2xl font-bold ${dsrLevel.color}`}>DSR {dsr}%</p>
                <p className={`text-sm font-bold mt-1 ${dsrLevel.color}`}>{dsrLevel.label}</p>
              </div>
            </div>

            <div className="w-full rounded-xl px-4 py-3 border border-gray-100 bg-gray-50 text-center">
              <p className={`text-xs font-bold ${dsrLevel.color}`}>
                {dsrLevel.sub}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                대출이 월급의 {dsr}%를 가져가요
              </p>
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

      {/* ── 추천 대출 상품 ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-1.5 mb-1">
          <CreditCard size={14} className="text-blue-600" />
          <p className="text-sm font-bold text-gray-900">이런 대출 어때요?</p>
        </div>
        <p className="text-xs text-gray-500 mb-5">조건에 맞는 대출 상품으로 상환 부담을 시뮬레이션해봐요</p>
        <div className="space-y-3">
          {loanLoading ? (
            <p className="text-sm text-gray-400 text-center py-4">대출 상품을 불러오는 중입니다...</p>
          ) : loans.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">추천 대출 상품이 없습니다.</p>
          ) : (
            loans.map((loan) => (
              <LoanAccordionItem key={loan.loanId} loan={loan} monthlyIncome={monthlyIncome} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
