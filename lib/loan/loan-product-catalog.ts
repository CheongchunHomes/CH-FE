import { get } from "@/lib/api/client"

export type LoanProductKey =
  | "newborn"
  | "newlywed"
  | "youthSmallBiz"
  | "youthDeposit"
  | "youthMonthly"
  | "generalBalance"

export type LoanProductRecord = {
  loanId: number
  externalCode: string
  provider: string
  name: string
  loanType: string
  interestRate?: number | null
  interestRateMin?: number | null
  maxAmount?: number | null
  incomeLimit?: number | null
  conditions?: string | null
  isPolicyLoan?: boolean | null
  isVisible?: boolean | null
  syncedAt?: string | null
}

export type LoanProductCard = LoanProductRecord & {
  key: LoanProductKey
  shortTitle: string
  summary: string
  contractTitle: string
  contractSubtitle: string
  rateLabel: string
}

const FALLBACK_PRODUCTS: LoanProductCard[] = [
  {
    loanId: 1,
    key: "newborn",
    externalCode: "newborn-didimdol",
    provider: "주택도시기금",
    name: "신생아 특례 버팀목대출",
    loanType: "전세자금",
    interestRate: 1.8,
    interestRateMin: 4.5,
    maxAmount: 44000,
    incomeLimit: 8500,
    conditions: "신생아 출산 가구의 주거안정을 위해 특례로 주택구입자금을 대출해 드립니다.",
    isPolicyLoan: true,
    isVisible: true,
    syncedAt: null,
    shortTitle: "신생아 버팀목",
    summary: "신생아 출산 가구의 주거안정을 위해 특례로 주택구입자금을 대출해 드리는 상품입니다.",
    contractTitle: "주택도시기금 내집마련 디딤돌 대출거래약정서",
    contractSubtitle: "출산·양육 가구를 위한 전세자금 지원",
    rateLabel: "1.8% ~ 4.5%",
  },
  {
    loanId: 2,
    key: "newlywed",
    externalCode: "newlywed-rent",
    provider: "주택도시기금",
    name: "신혼부부전용 전세자금대출",
    loanType: "전세자금",
    interestRate: 2.0,
    interestRateMin: 4.8,
    maxAmount: 30000,
    incomeLimit: 8500,
    conditions: "신혼부부의 전세 계약과 초기 주거비 부담을 줄이기 위한 전세자금 대출입니다.",
    isPolicyLoan: true,
    isVisible: true,
    syncedAt: null,
    shortTitle: "신혼부부 전세",
    summary: "신혼부부의 전세 계약과 초기 주거비 부담을 줄이기 위한 전세자금 대출입니다.",
    contractTitle: "주택도시기금 내집마련 디딤돌 대출거래약정서",
    contractSubtitle: "신혼부부를 위한 전세자금 지원",
    rateLabel: "2.0% ~ 4.8%",
  },
  {
    loanId: 3,
    key: "youthSmallBiz",
    externalCode: "youth-smallbiz-rent",
    provider: "주택도시기금",
    name: "중소기업취업청년 전월세 보증금 대출",
    loanType: "전세자금",
    interestRate: 1.5,
    interestRateMin: 3.5,
    maxAmount: 25000,
    incomeLimit: 5000,
    conditions: "중소기업에 취업한 청년의 전월세 보증금 마련을 지원하는 대출입니다.",
    isPolicyLoan: true,
    isVisible: true,
    syncedAt: null,
    shortTitle: "중기취업청년",
    summary: "중소기업에 취업한 청년의 전월세 보증금 마련을 지원하는 대출입니다.",
    contractTitle: "주택도시기금 내집마련 디딤돌 대출거래약정서",
    contractSubtitle: "중기취업 청년을 위한 전세자금 지원",
    rateLabel: "1.5% ~ 3.5%",
  },
  {
    loanId: 4,
    key: "youthDeposit",
    externalCode: "youth-buttimok-rent",
    provider: "주택도시기금",
    name: "청년전용 버팀목전세자금 대출",
    loanType: "전세자금",
    interestRate: 2.1,
    interestRateMin: 4.2,
    maxAmount: 20000,
    incomeLimit: 5000,
    conditions: "청년층의 전세보증금 마련을 돕는 대표적인 주거지원 대출입니다.",
    isPolicyLoan: true,
    isVisible: true,
    syncedAt: null,
    shortTitle: "청년 버팀목",
    summary: "청년층의 전세보증금 마련을 돕는 대표적인 주거지원 대출입니다.",
    contractTitle: "주택도시기금 내집마련 디딤돌 대출거래약정서",
    contractSubtitle: "청년을 위한 전세자금 지원",
    rateLabel: "2.1% ~ 4.2%",
  },
  {
    loanId: 5,
    key: "youthMonthly",
    externalCode: "youth-monthly-rent",
    provider: "주택도시기금",
    name: "청년전용 보증부월세대출",
    loanType: "월세자금",
    interestRate: 2.5,
    interestRateMin: 4.9,
    maxAmount: 12000,
    incomeLimit: 5000,
    conditions: "청년의 보증금과 월세 부담을 함께 줄여주는 전용 대출입니다.",
    isPolicyLoan: true,
    isVisible: true,
    syncedAt: null,
    shortTitle: "청년 보증부월세",
    summary: "청년의 보증금과 월세 부담을 함께 줄여주는 전용 대출입니다.",
    contractTitle: "주택도시기금 내집마련 디딤돌 대출거래약정서",
    contractSubtitle: "청년 보증부월세 지원",
    rateLabel: "2.5% ~ 4.9%",
  },
  {
    loanId: 6,
    key: "generalBalance",
    externalCode: "general-buttimok-rent",
    provider: "주택도시기금",
    name: "일반 버팀목전세자금대출",
    loanType: "전세자금",
    interestRate: 2.3,
    interestRateMin: 5.1,
    maxAmount: 20000,
    incomeLimit: 5000,
    conditions: "전세 계약 시 일반적으로 많이 사용하는 기본형 전세자금 대출입니다.",
    isPolicyLoan: true,
    isVisible: true,
    syncedAt: null,
    shortTitle: "일반 버팀목",
    summary: "전세 계약 시 일반적으로 많이 사용하는 기본형 전세자금 대출입니다.",
    contractTitle: "주택도시기금 내집마련 디딤돌 대출거래약정서",
    contractSubtitle: "일반 전세자금 지원",
    rateLabel: "2.3% ~ 5.1%",
  },
]

function resolveLoanProductKey(value?: string | null): LoanProductKey {
  const normalized = (value ?? "").toLowerCase()
  if (normalized.includes("신생아") || normalized.includes("newborn")) return "newborn"
  if (normalized.includes("신혼") || normalized.includes("newlywed")) return "newlywed"
  if (normalized.includes("중소기업") || normalized.includes("중기") || normalized.includes("smallbiz")) return "youthSmallBiz"
  if (normalized.includes("보증부월세") || normalized.includes("monthly")) return "youthMonthly"
  if (normalized.includes("일반") || normalized.includes("general")) return "generalBalance"
  return "youthDeposit"
}

function formatRateLabel(minRate?: number | null, maxRate?: number | null) {
  const parts = [minRate, maxRate]
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
    .map((value) => `${value.toFixed(1)}%`)

  if (parts.length === 2) {
    return `${parts[0]} ~ ${parts[1]}`
  }

  if (parts.length === 1) {
    return parts[0]
  }

  return "금리 정보 확인"
}

function buildLoanProductCard(record: LoanProductRecord, fallbackIndex: number): LoanProductCard {
  const key = resolveLoanProductKey(record.name || record.loanType || record.externalCode)
  const fallback = FALLBACK_PRODUCTS.find((item) => item.key === key) ?? FALLBACK_PRODUCTS[fallbackIndex] ?? FALLBACK_PRODUCTS[0]

  return {
    loanId: record.loanId ?? fallback.loanId,
    key,
    externalCode: record.externalCode ?? fallback.externalCode,
    provider: record.provider ?? fallback.provider,
    name: record.name ?? fallback.name,
    loanType: record.loanType ?? fallback.loanType,
    interestRate: record.interestRate ?? fallback.interestRate,
    interestRateMin: record.interestRateMin ?? fallback.interestRateMin,
    maxAmount: record.maxAmount ?? fallback.maxAmount,
    incomeLimit: record.incomeLimit ?? fallback.incomeLimit,
    conditions: record.conditions ?? fallback.conditions,
    isPolicyLoan: record.isPolicyLoan ?? fallback.isPolicyLoan,
    isVisible: record.isVisible ?? fallback.isVisible,
    syncedAt: record.syncedAt ?? fallback.syncedAt,
    shortTitle: fallback.shortTitle,
    summary: fallback.summary,
    contractTitle: fallback.contractTitle,
    contractSubtitle: fallback.contractSubtitle,
    rateLabel: formatRateLabel(record.interestRate, record.interestRateMin) || fallback.rateLabel,
  }
}

export async function loadLoanProducts(): Promise<LoanProductCard[]> {
  try {
    const response = await get<LoanProductRecord[] | { content?: LoanProductRecord[] }>("/api/loan-products", {
      cache: "no-store",
      suppressGlobalError: true,
    })

    const payload = Array.isArray(response) ? response : response?.content
    if (!Array.isArray(payload) || payload.length === 0) {
      return FALLBACK_PRODUCTS
    }

    return payload.map((item, index) => buildLoanProductCard(item, index))
  } catch {
    return FALLBACK_PRODUCTS
  }
}

export function findLoanProductByKey(products: LoanProductCard[], key: LoanProductKey) {
  return products.find((product) => product.key === key) ?? products[0] ?? FALLBACK_PRODUCTS[0]
}

export function findLoanProductById(products: LoanProductCard[], loanId?: number | null) {
  if (loanId == null) {
    return products[0] ?? FALLBACK_PRODUCTS[0]
  }

  return products.find((product) => product.loanId === loanId) ?? products[0] ?? FALLBACK_PRODUCTS[0]
}

export { FALLBACK_PRODUCTS as LOAN_PRODUCT_FALLBACKS }
