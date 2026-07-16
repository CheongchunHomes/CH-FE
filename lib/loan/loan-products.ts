import { get } from "@/lib/api/client"

export type LoanProductKey =
  | "newborn"
  | "newlywed"
  | "youthSmallBiz"
  | "youthDeposit"
  | "youthMonthly"
  | "generalBalance"

export type LoanProductView = {
  key: LoanProductKey
  title: string
  shortTitle: string
  summary: string
  contractTitle: string
  contractSubtitle: string
  rateLabel: string
  provider?: string
  loanType?: string
  externalCode?: string
  interestRate?: string
  interestRateMin?: string
  maxAmount?: string
  incomeLimit?: string
  conditions?: string
  isPolicyLoan?: boolean
  isVisible?: boolean
}

export type LoanProductApiRecord = {
  loanId?: number | string
  externalCode?: string
  provider?: string
  name?: string
  loanType?: string
  interestRate?: number | string | null
  interestRateMin?: number | string | null
  maxAmount?: number | string | null
  incomeLimit?: number | string | null
  conditions?: string | null
  policyLoan?: boolean | string | number | null
  isPolicyLoan?: boolean | string | number | null
  visible?: boolean | string | number | null
  isVisible?: boolean | string | number | null
  syncedAt?: string | null
  createdAt?: string | null
}

const LOAN_PRODUCT_ORDER: LoanProductKey[] = [
  "newborn",
  "newlywed",
  "youthSmallBiz",
  "youthDeposit",
  "youthMonthly",
  "generalBalance",
]

const FALLBACK_PRODUCTS: LoanProductView[] = [
  {
    key: "newborn",
    title: "신생아 특례 버팀목대출",
    shortTitle: "신생아 버팀목",
    summary: "신생아 출산 가구의 주거안정을 위해 특례로 주택구입자금을 대출해 드리는 상품입니다.",
    contractTitle: "주택도시기금 내집마련 디딤돌 대출거래약정서",
    contractSubtitle: "출산·양육 가구를 위한 전세자금 지원",
    rateLabel: "1.8% ~ 4.5%",
  },
  {
    key: "newlywed",
    title: "신혼부부전용 전세자금대출",
    shortTitle: "신혼부부 전세",
    summary: "신혼부부의 전세 계약과 초기 주거비 부담을 줄이기 위한 전세자금 대출입니다.",
    contractTitle: "주택도시기금 내집마련 디딤돌 대출거래약정서",
    contractSubtitle: "신혼부부를 위한 전세자금 지원",
    rateLabel: "2.0% ~ 4.8%",
  },
  {
    key: "youthSmallBiz",
    title: "중소기업취업청년 전월세 보증금 대출",
    shortTitle: "중기취업청년",
    summary: "중소기업에 취업한 청년의 전월세 보증금 마련을 지원하는 대출입니다.",
    contractTitle: "주택도시기금 내집마련 디딤돌 대출거래약정서",
    contractSubtitle: "중기취업 청년을 위한 전세자금 지원",
    rateLabel: "1.5% ~ 3.5%",
  },
  {
    key: "youthDeposit",
    title: "청년전용 버팀목전세자금 대출",
    shortTitle: "청년 버팀목",
    summary: "청년층의 전세보증금 마련을 돕는 대표적인 주거지원 대출입니다.",
    contractTitle: "주택도시기금 내집마련 디딤돌 대출거래약정서",
    contractSubtitle: "청년을 위한 전세자금 지원",
    rateLabel: "2.1% ~ 4.2%",
  },
  {
    key: "youthMonthly",
    title: "청년전용 보증부월세대출",
    shortTitle: "청년 보증부월세",
    summary: "청년의 보증금과 월세 부담을 함께 줄여주는 전용 대출입니다.",
    contractTitle: "주택도시기금 내집마련 디딤돌 대출거래약정서",
    contractSubtitle: "청년 보증부월세 지원",
    rateLabel: "2.5% ~ 4.9%",
  },
  {
    key: "generalBalance",
    title: "일반 버팀목전세자금대출",
    shortTitle: "일반 버팀목",
    summary: "전세 계약 시 일반적으로 많이 사용하는 기본형 전세자금 대출입니다.",
    contractTitle: "주택도시기금 내집마련 디딤돌 대출거래약정서",
    contractSubtitle: "일반 전세자금 지원",
    rateLabel: "2.3% ~ 5.1%",
  },
]

const FALLBACK_BY_KEY = new Map(FALLBACK_PRODUCTS.map((item) => [item.key, item] as const))

function isVisible(value: unknown) {
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value !== 0
  if (typeof value === "string") return value.toLowerCase() !== "false" && value !== "0"
  return true
}

function isPolicyLoan(value: unknown) {
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value !== 0
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    return normalized === "true" || normalized === "yes" || normalized === "y" || normalized === "1"
  }
  return false
}

function toText(value: unknown) {
  if (value === null || value === undefined) return ""
  return String(value).trim()
}

function formatMoney(value: unknown) {
  const text = toText(value)
  if (!text) return ""
  const numeric = Number(text)
  if (Number.isFinite(numeric)) {
    return `${new Intl.NumberFormat("ko-KR").format(numeric)}만원`
  }
  return text.includes("만원") ? text : `${text}만원`
}

function formatRate(value: unknown) {
  const text = toText(value)
  if (!text) return ""
  if (text.includes("%")) return text
  const numeric = Number(text)
  if (Number.isFinite(numeric)) {
    return `${numeric.toFixed(2).replace(/\.00$/, "")}%`
  }
  return `${text}%`
}

function productSummaryFromRecord(record: LoanProductApiRecord, fallback: LoanProductView | undefined) {
  return toText(record.conditions) || fallback?.summary || "상품 설명이 등록되지 않았습니다."
}

function productRateFromRecord(record: LoanProductApiRecord, fallback: LoanProductView | undefined) {
  const minRate = formatRate(record.interestRateMin)
  const maxRate = formatRate(record.interestRate)
  if (minRate && maxRate) {
    return `${minRate} ~ ${maxRate}`
  }
  return fallback?.rateLabel || "금리 정보 없음"
}

function resolveProductKey(record: Partial<LoanProductApiRecord> & { name?: string; loanType?: string }) {
  const values = [record.externalCode, record.name, record.loanType, record.provider]
    .map((value) => toText(value).toLowerCase())
    .filter(Boolean)
    .join(" ")

  if (values.includes("신생아")) return "newborn"
  if (values.includes("신혼")) return "newlywed"
  if (values.includes("중소기업") || values.includes("중기")) return "youthSmallBiz"
  if (values.includes("보증부월세") || values.includes("월세")) return "youthMonthly"
  if (values.includes("일반")) return "generalBalance"
  return "youthDeposit"
}

export function resolveLoanProductKey(value?: string | null): LoanProductKey {
  const normalized = toText(value).toLowerCase()
  if (!normalized) return "newborn"
  if (normalized === "newborn" || normalized.includes("신생아")) return "newborn"
  if (normalized === "newlywed" || normalized.includes("신혼")) return "newlywed"
  if (normalized === "youthsmallbiz" || normalized.includes("중소기업") || normalized.includes("중기")) {
    return "youthSmallBiz"
  }
  if (normalized === "youthdeposit" || normalized.includes("버팀목")) return "youthDeposit"
  if (normalized === "youthmonthly" || normalized.includes("월세")) return "youthMonthly"
  if (normalized === "generalbalance" || normalized.includes("일반")) return "generalBalance"
  return "newborn"
}

export function getLoanProductView(key: LoanProductKey) {
  return FALLBACK_BY_KEY.get(key) ?? FALLBACK_PRODUCTS[0]
}

export function listFallbackLoanProducts() {
  return [...FALLBACK_PRODUCTS]
}

function mapApiRecordToView(record: LoanProductApiRecord, index: number): LoanProductView {
  const key = resolveProductKey(record)
  const fallback = FALLBACK_BY_KEY.get(key)
  const title = toText(record.name) || fallback?.title || `대출상품 ${index + 1}`
  const shortTitle = toText(record.loanType) || fallback?.shortTitle || title
  const provider = toText(record.provider)
  const summary = productSummaryFromRecord(record, fallback)
  const rateLabel = productRateFromRecord(record, fallback)
  const maxAmount = formatMoney(record.maxAmount)
  const incomeLimit = formatMoney(record.incomeLimit)

  return {
    key,
    title,
    shortTitle,
    summary,
    contractTitle: fallback?.contractTitle || title,
    contractSubtitle: fallback?.contractSubtitle || provider || "대출 상품 안내",
    rateLabel,
    provider: provider || undefined,
    loanType: toText(record.loanType) || undefined,
    externalCode: toText(record.externalCode) || undefined,
    interestRate: formatRate(record.interestRate) || undefined,
    interestRateMin: formatRate(record.interestRateMin) || undefined,
    maxAmount: maxAmount || undefined,
    incomeLimit: incomeLimit || undefined,
    conditions: toText(record.conditions) || undefined,
    isPolicyLoan: isPolicyLoan(record.isPolicyLoan ?? record.policyLoan),
    isVisible: isVisible(record.isVisible ?? record.visible),
  }
}

function extractLoanProductRecords(response: unknown) {
  if (Array.isArray(response)) {
    return response as LoanProductApiRecord[]
  }

  if (response && typeof response === "object") {
    const record = response as {
      content?: unknown
      items?: unknown
      data?: unknown
      result?: unknown
    }

    if (Array.isArray(record.content)) return record.content as LoanProductApiRecord[]
    if (Array.isArray(record.items)) return record.items as LoanProductApiRecord[]
    if (Array.isArray(record.data)) return record.data as LoanProductApiRecord[]
    if (Array.isArray(record.result)) return record.result as LoanProductApiRecord[]
  }

  return []
}

export async function loadLoanProducts() {
  try {
    const response = await get<unknown>("/api/loan-products", {
      cache: "no-store",
      suppressGlobalError: true,
    })
    const records = extractLoanProductRecords(response)
      .filter((record) => isVisible((record as LoanProductApiRecord).isVisible ?? (record as LoanProductApiRecord).visible))
      .map((record, index) => mapApiRecordToView(record, index))

    if (records.length > 0) {
      const order = new Map(LOAN_PRODUCT_ORDER.map((key, index) => [key, index] as const))
      return records.sort((left, right) => {
        const leftOrder = order.get(left.key) ?? Number.MAX_SAFE_INTEGER
        const rightOrder = order.get(right.key) ?? Number.MAX_SAFE_INTEGER
        if (leftOrder !== rightOrder) return leftOrder - rightOrder
        return left.title.localeCompare(right.title, "ko")
      })
    }
  } catch {
    // Ignore and return no data so the UI only shows DB-backed products.
  }

  return []
}
