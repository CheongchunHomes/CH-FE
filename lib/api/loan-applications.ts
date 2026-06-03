import { post } from "@/lib/api/client"

export type LoanApplicationCreateRequest = {
  userId?: number
  loanId: number
  applyAmount: number
  address: string
}

export type LoanApplicationResponse = {
  applicationId: number
  loanId: number
  userId: number
  applyAmount: number
  address: string | null
  status: string | null
  createdAt: string
  updatedAt: string
  decisionAt: string | null
}

export function createLoanApplication(input: LoanApplicationCreateRequest) {
  return post<LoanApplicationResponse, LoanApplicationCreateRequest>("/api/loan-applications", input)
}
