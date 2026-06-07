"use client"

import { useEffect, useState } from "react"
import { FileText } from "lucide-react"

import { getFileSignedUrl } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { getMyLoanApplicationSummary, type LoanApplicationSummary } from "@/lib/loan-applications-api"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  ActivityLoginCard,
  ActivityLoadingCard,
  ActivityPageShell,
  ActivitySection,
  InfoRow,
  ResultFlow,
  StatusPill,
} from "../activity-content"

export default function MyActivityLoanPage() {
  const { status } = useAuth()

  const [loanSummary, setLoanSummary] = useState<LoanApplicationSummary | null>(null)
  const [loanLoading, setLoanLoading] = useState(true)
  const [loanPdfOpen, setLoanPdfOpen] = useState(false)
  const [loanPdfLoading, setLoanPdfLoading] = useState(false)
  const [loanPdfUrl, setLoanPdfUrl] = useState("")
  const [loanPdfError, setLoanPdfError] = useState("")

  const loanStatusLabel = getLoanStatusLabel(loanSummary?.status)
  const loanTone = getLoanTone(loanSummary?.status)
  const loanUsesFlow = loanStatusLabel === "대기중" || loanStatusLabel === "승인" || loanStatusLabel === "거절"

  useEffect(() => {
    if (status === "loading") {
      setLoanLoading(true)
      return
    }

    if (status === "reauthRequired") {
      setLoanLoading(false)
      return
    }

    if (status !== "authenticated") {
      setLoanSummary(null)
      setLoanLoading(false)
      return
    }

    let canceled = false
    setLoanLoading(true)

    async function loadLoanSummary() {
      try {
        const data = await getMyLoanApplicationSummary()
        if (!canceled) {
          setLoanSummary(data)
        }
      } finally {
        if (!canceled) {
          setLoanLoading(false)
        }
      }
    }

    loadLoanSummary()

    return () => {
      canceled = true
    }
  }, [status])

  if (status === "loading") {
    return <ActivityLoadingCard description="대출 결과 최신 상태를 확인합니다." />
  }

  if (status !== "authenticated" && status !== "reauthRequired") {
    return <ActivityLoginCard />
  }

  return (
    <>
      <ActivityPageShell activeSection="loan">
        <ActivitySection
          title="대출 결과"
          description="최신 대출 신청 결과만 보여줍니다."
          tone={loanTone}
          progressLabel={loanStatusLabel}
          loading={loanLoading}
          emptyMessage="아직 대출 신청 결과가 없습니다."
          summaryContent={
            loanSummary ? (
              <div className="space-y-4">
                {loanUsesFlow ? (
                  <ResultFlow
                    tone={loanTone}
                    leftLabel="대기중"
                    rightLabel={loanStatusLabel === "대기중" ? "승인/거절" : loanStatusLabel}
                    resolved={loanStatusLabel !== "대기중"}
                  />
                ) : (
                  <StatusPill tone={loanTone} label={loanStatusLabel} />
                )}

                <div className="grid gap-3 md:grid-cols-2">
                  <InfoRow label="신청번호" value={loanSummary.applicationId} />
                  <InfoRow label="대출번호" value={loanSummary.loanId} />
                  <InfoRow label="사용자" value={loanSummary.userId} />
                  <InfoRow label="갱신일" value={loanSummary.updatedAt ?? loanSummary.createdAt} />
                </div>
              </div>
            ) : null
          }
          action={
            <Button
              type="button"
              disabled={loanSummary?.contractPdfFileId == null}
              onClick={handleOpenLoanPdf}
              className="w-full rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8] disabled:bg-slate-200 disabled:text-slate-400"
            >
              <FileText size={16} />
              PDF 보기
            </Button>
          }
        />
      </ActivityPageShell>

      <LoanPdfDialog
        open={loanPdfOpen}
        loading={loanPdfLoading}
        errorMessage={loanPdfError}
        signedUrl={loanPdfUrl}
        onOpenChange={setLoanPdfOpen}
      />
    </>
  )

  async function handleOpenLoanPdf() {
    const fileId = loanSummary?.contractPdfFileId
    if (fileId == null) {
      return
    }

    setLoanPdfOpen(true)
    setLoanPdfError("")
    setLoanPdfLoading(true)
    setLoanPdfUrl("")

    try {
      const data = await getFileSignedUrl(fileId)
      setLoanPdfUrl(data.signedUrl)
    } catch (error) {
      setLoanPdfError(error instanceof Error ? error.message : "PDF를 불러오지 못했습니다.")
    } finally {
      setLoanPdfLoading(false)
    }
  }
}

function LoanPdfDialog({
  open,
  loading,
  errorMessage,
  signedUrl,
  onOpenChange,
}: {
  open: boolean
  loading: boolean
  errorMessage: string
  signedUrl: string
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl overflow-hidden p-0 sm:max-w-6xl">
        <div className="space-y-4 p-6">
          <DialogHeader>
            <DialogTitle>대출 계약 PDF</DialogTitle>
            <DialogDescription>결과 카드에서 선택한 최신 대출 계약 PDF를 확인합니다.</DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm font-medium text-slate-500">
              <FileText className="animate-spin" size={16} />
              PDF를 불러오는 중입니다.
            </div>
          ) : errorMessage ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm font-medium text-rose-700">
              {errorMessage}
            </div>
          ) : signedUrl ? (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              <iframe title="대출 계약 PDF" src={signedUrl} className="h-[75vh] w-full border-0 bg-white" />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              표시할 PDF가 없습니다.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function getLoanStatusLabel(status?: string | null) {
  const trimmed = status?.trim()
  if (!trimmed) {
    return "신청 내역 없음"
  }

  const statusMap: Record<string, string> = {
    PAYMENT_PENDING: "승인대기",
    PAYMENT_COMPLETED: "승인완료",
    PAYMENT_APPROVED: "승인",
    PAYMENT_REJECTED: "승인거부",
    APPROVED: "승인",
    REJECTED: "거절",
    CANCELLED: "취소됨",
    CANCELED: "취소됨",
    PENDING: "대기중",
    REVIEWING: "대기중",
    IN_REVIEW: "대기중",
    RECEIVED: "대기중",
    SUBMITTED: "대기중",
  }

  if (trimmed in statusMap) {
    return statusMap[trimmed]
  }

  const normalized = trimmed.toLowerCase()

  if (
    normalized.includes("거절") ||
    normalized.includes("거부") ||
    normalized.includes("반려") ||
    normalized.includes("rejected") ||
    normalized.includes("reject")
  ) {
    return "거절"
  }

  if (normalized.includes("승인") || normalized.includes("approved") || normalized.includes("accept")) {
    return "승인"
  }

  if (
    normalized.includes("대기") ||
    normalized.includes("심사") ||
    normalized.includes("접수") ||
    normalized.includes("received") ||
    normalized.includes("submitted") ||
    normalized.includes("pending") ||
    normalized.includes("waiting")
  ) {
    return "대기중"
  }

  return trimmed
}

function getLoanTone(status?: string | null) {
  const label = getLoanStatusLabel(status)
  const normalized = `${status ?? label}`.trim().toLowerCase()

  if (
    normalized.includes("거부") ||
    normalized.includes("거절") ||
    normalized.includes("반려") ||
    normalized.includes("rejected") ||
    normalized.includes("reject")
  ) {
    return "rose" as const
  }

  if (
    normalized.includes("승인") ||
    normalized.includes("approved") ||
    normalized.includes("accept") ||
    normalized.includes("complete") ||
    normalized.includes("완료")
  ) {
    return "emerald" as const
  }

  if (
    normalized.includes("대기") ||
    normalized.includes("pending") ||
    normalized.includes("waiting") ||
    normalized.includes("심사") ||
    normalized.includes("접수") ||
    normalized.includes("cancel")
  ) {
    return "slate" as const
  }

  return "blue" as const
}
