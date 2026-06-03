import { get } from "@/lib/api"

export type LoanApplicationSummary = {
  applicationId?: number
  status?: string
  updatedAt?: string
  createdAt?: string
  loanId?: number
  userId?: number
}

function toTime(value?: string) {
  if (!value) {
    return 0
  }

  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : 0
}

function compareSummary(a: LoanApplicationSummary, b: LoanApplicationSummary) {
  return (
    toTime(b.updatedAt ?? b.createdAt) - toTime(a.updatedAt ?? a.createdAt) ||
    (b.applicationId ?? 0) - (a.applicationId ?? 0)
  )
}

function pickLatestFromList(list: LoanApplicationSummary[] | undefined): LoanApplicationSummary | null {
  if (!Array.isArray(list) || list.length === 0) {
    return null
  }

  return [...list].sort(compareSummary)[0] ?? null
}

function pickLatestSummary(payload: unknown): LoanApplicationSummary | null {
  if (!payload) {
    return null
  }

  if (Array.isArray(payload)) {
    return pickLatestFromList(payload as LoanApplicationSummary[])
  }

  if (typeof payload === "object") {
    const record = payload as Record<string, unknown>

    if (Array.isArray(record.content)) {
      return pickLatestFromList(record.content as LoanApplicationSummary[])
    }

    return payload as LoanApplicationSummary
  }

  return null
}

export async function getMyLoanApplicationSummary(): Promise<LoanApplicationSummary | null> {
  try {
    const data = await get<unknown>("/api/loan-applications/me", {
      cache: "no-store",
      suppressGlobalError: true,
    })

    return pickLatestSummary(data)
  } catch {
    return null
  }
}
