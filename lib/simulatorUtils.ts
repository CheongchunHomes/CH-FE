// lib/simulatorUtils.ts
// 시뮬레이터 파트 공통 타입 + 계산 유틸 통합
// diagnosisUtils.ts 패턴과 동일하게 타입 + 순수함수 한 파일로 관리

// ─────────────────────────────────────────
// 공통 타입
// ─────────────────────────────────────────

/** asset_plans 테이블 엔티티 기준 */
export interface AssetPlanData {
  planId:        number
  category:      string
  planName:      string
  baseAsset:     number
  goalAmount:    number
  monthlySaving: number | null  // 월 저축 목표액
  startDate:     string
  endDate:       string | null
  isCompleted:   boolean
  createdAt:     string
}

/** 자산 플랜 입력 폼 */
export interface AssetPlanForm {
  category:      string
  planName:      string
  baseAsset:     number | null
  goalAmount:    number | null
  monthlySaving: number | null  // 월 저축 목표액
  startDate:     string | null
  endDate:       string | null
  isCompleted:   boolean
}

/** 원리금균등상환 스케줄 행 */
export interface RepayRow {
  seq:       number  // 회차
  repayment: number  // 납입원금 (원)
  interest:  number  // 이자 (원)
  payment:   number  // 월납입액 (원)
  balance:   number  // 잔액 (원)
}

/** housingSnapshot — sessionStorage 저장 구조 (탭4 공유) */
export interface HousingSnapshot {
  region:        string
  currentSize:   number
  currentRent:   number   // 만원 단위
  targetSize:    number
  targetDeposit: number   // 만원 단위
  targetRent:    number   // 만원 단위
  tenYearWaste:  number   // 만원 단위
  monthlyGap:    number   // 만원 단위
  savingAmount:  number   // 만원 단위
  loanAmount:    number   // 만원 단위
  yearsToGoal:   number
  yearsWithLoan: number
  yearsSaved:    number
  loanCoversAll: boolean
}

/** financeSnapshot — sessionStorage 저장 구조 (탭4 공유) */
export interface FinanceSnapshot {
  loanAmount:     number  // 원 단위
  annualRate:     number
  monthlyIncome:  number  // 원 단위
  repayMonths:    number
  method:         "equal" | "interest"
  monthlyPayment: number  // 원 단위
  dsr:            number
  dsrLabel:       string
  totalInterest:  number  // 원 단위
}

/** 탭4에서 asset-plans API 집계 결과 */
export interface AssetPlanSummary {
  totalSaved:     number
  totalGoal:      number
  activePlans:    number
  completedPlans: number
}

// ─────────────────────────────────────────
// 통화 포맷
// ─────────────────────────────────────────

/**
 * 원 단위 숫자 → "N억 N만 N천원"
 * AssetPlan, FinanceFeel 등 원 단위 표시용
 */
export function formatCurrency(value: number): string {
  if (!value || value < 0) return "0원"
  const eok   = Math.floor(value / 100_000_000)
  const man   = Math.floor((value % 100_000_000) / 10_000)
  const cheon = Math.floor((value % 10_000) / 1_000)
  let result = ""
  if (eok   > 0) result += `${eok}억 `
  if (man   > 0) result += `${man}만 `
  if (cheon > 0) result += `${cheon}천`
  return (result.trim() || "0") + "원"
}

/**
 * 만원 단위 숫자 → "N억원 / N억 N만원 / N만원"
 * HousingCompare, Roadmap 집 가격 표시용
 */
export function formatManwon(value: number): string {
  if (!value || value < 0) return "0원"
  const eok = Math.floor(value / 10_000)
  const man = value % 10_000
  if (eok > 0 && man > 0) return `${eok}억 ${man.toLocaleString()}만원`
  if (eok > 0) return `${eok}억원`
  return `${value.toLocaleString()}만원`
}

/**
 * 원 단위 숫자 → "N,NNN원" (테이블 셀 표시용)
 */
export function formatWon(value: number): string {
  return value.toLocaleString() + "원"
}

// ─────────────────────────────────────────
// 자산 플랜 유틸 (탭1)
// ─────────────────────────────────────────

/** 달성률 계산 (0~100 clamp) */
export function calcProgress(baseAsset: number, goalAmount: number): number {
  if (!goalAmount || goalAmount <= 0) return 0
  return Math.min(Math.round((baseAsset / goalAmount) * 100), 100)
}

/**
 * 저축 분해: 일/주/월 납입액 + 총 기간(일)
 * startDate > endDate 또는 remaining <= 0 이면 null 반환
 */
export function calcSavingBreakdown(
  baseAsset:  number,
  goalAmount: number,
  startDate:  string,
  endDate:    string,
): { daily: number; weekly: number; monthly: number; totalDays: number } | null {
  const remaining = goalAmount - baseAsset
  if (remaining <= 0) return null

  const start      = new Date(startDate)
  const end        = new Date(endDate)
  const totalDays  = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  if (totalDays <= 0) return null

  const months = Math.max(Math.ceil(totalDays / 30), 1)
  const weeks  = Math.max(Math.ceil(totalDays / 7), 1)

  return {
    daily:    Math.ceil(remaining / totalDays),
    weekly:   Math.ceil(remaining / weeks),
    monthly:  Math.ceil(remaining / months),
    totalDays,
  }
}

/** 기간 초과 여부 */
export function isOverdue(endDate: string | null | undefined): boolean {
  if (!endDate) return false
  const d = new Date(endDate)
  // Invalid Date 방어
  if (isNaN(d.getTime())) return false
  return d < new Date()
}

/** D-Day 문자열 반환 */
export function calcDday(endDate: string | null | undefined): string {
  if (!endDate) return ""
  const d = new Date(endDate)
  if (isNaN(d.getTime())) return ""
  const diff = Math.ceil((d.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0)   return "기간 초과"
  if (diff === 0) return "D-Day"
  return `D-${diff}`
}

/** 조사 "을/를" 반환 */
export function getEulReul(word: string): string {
  if (!word) return "을"
  const code = word[word.length - 1].charCodeAt(0)
  if (code < 0xAC00 || code > 0xD7A3) return "을"
  return (code - 0xAC00) % 28 > 0 ? "을" : "를"
}

// ─────────────────────────────────────────
// 금융 체감 유틸 (탭3)
// ─────────────────────────────────────────

/**
 * 원리금균등상환 스케줄
 * 공식: M = P × r(1+r)^n / ((1+r)^n - 1)
 *   P = 원금, r = 월금리(annualRate/100/12), n = 개월수
 */
export function calcSchedule(
  principal:  number,
  annualRate: number,
  months:     number,
): RepayRow[] {
  if (!principal || principal <= 0) return []
  if (!annualRate || annualRate < 0) return []
  if (!months || months <= 0) return []

  const r       = annualRate / 100 / 12
  const monthly = r === 0
    ? principal / months
    : (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)

  const rows: RepayRow[] = []
  let balance = principal

  // 마지막 회차는 잔여 원금 + 이자로 확정
  for (let i = 1; i <= months; i++) {
    const interest  = Math.round(balance * r)
    const isLast    = i === months
    const payment   = isLast ? balance + interest : Math.round(monthly)
    const repayment = payment - interest
    balance         = isLast ? 0 : Math.max(Math.round(balance - repayment), 0)
    rows.push({ seq: i, repayment, interest, payment, balance })
  }
  return rows
}

/**
 * 원금거치 월 이자
 * 공식: principal × (annualRate / 100) / 12
 */
export function calcInterestOnly(principal: number, annualRate: number): number {
  if (!principal || principal <= 0) return 0
  if (!annualRate || annualRate < 0) return 0
  return Math.round((principal * (annualRate / 100)) / 12)
}

/**
 * DSR 계산 (정수 %)
 * 공식: monthlyPayment / monthlyIncome × 100
 */
export function calcDsr(monthlyPayment: number, monthlyIncome: number): number {
  if (!monthlyIncome || monthlyIncome <= 0) return 0
  return Math.round((monthlyPayment / monthlyIncome) * 100)
}

// ─────────────────────────────────────────
// sessionStorage 파싱 유틸
// ─────────────────────────────────────────

/** sessionStorage JSON 파싱 — 실패 시 null 반환 */
export function parseSession<T>(key: string): T | null {
  try {
    return JSON.parse(sessionStorage.getItem(key) ?? "null") as T
  } catch {
    return null
  }
}
