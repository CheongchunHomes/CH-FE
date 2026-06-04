"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Loader2, MessageCircleQuestion, Newspaper, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getTodayAnnouncementCount } from "@/lib/announcements-api"
import { getMyLoanApplicationSummary } from "@/lib/loan-applications-api"

type PanelState = {
  todayAnnouncementCount: number
  loanStatus: string
  loading: boolean
}

function normalizeStatus(value?: string | null) {
  const trimmed = value?.trim()
  if (!trimmed) {
    return "신청 내역 없음"
  }

  const statusMap: Record<string, string> = {
    PAYMENT_PENDING: "결제대기",
    PAYMENT_COMPLETED: "결제완료",
    PAYMENT_APPROVED: "결제승인",
    PAYMENT_REJECTED: "결제거부",
    APPROVED: "승인됨",
    REJECTED: "거절됨",
    CANCELLED: "취소됨",
    CANCELED: "취소됨",
    PENDING: "대기중",
    REVIEWING: "심사중",
    IN_REVIEW: "심사중",
    RECEIVED: "접수됨",
    SUBMITTED: "접수됨",
  }

  return statusMap[trimmed] ?? trimmed
}

function getStatusTone(status: string) {
  if (status.includes("승인")) {
    return {
      badge: "border-blue-200 bg-blue-50 text-[#2563EB]",
      dot: "bg-[#2563EB]",
    }
  }

  if (status.includes("거부") || status.includes("거절")) {
    return {
      badge: "border-rose-200 bg-rose-50 text-rose-700",
      dot: "bg-rose-500",
    }
  }

  if (status.includes("대기") || status.includes("접수") || status.includes("심사")) {
    return {
      badge: "border-slate-200 bg-slate-100 text-slate-700",
      dot: "bg-slate-400",
    }
  }

  return {
      badge: "border-blue-200 bg-blue-50 text-[#2563EB]",
      dot: "bg-[#2563EB]",
  }
}

function getLoanStatusTone(status: string) {
  const normalized = status.trim().toLowerCase()

  if (
    normalized.includes("거부") ||
    normalized.includes("반려") ||
    normalized.includes("rejected") ||
    normalized.includes("reject")
  ) {
    return {
      badge: "border-rose-200 bg-rose-50 text-rose-700",
      dot: "bg-rose-500",
    }
  }

  if (
    normalized.includes("승인") ||
    normalized.includes("approved") ||
    normalized.includes("accept")
  ) {
    return {
      badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
    }
  }

  if (
    normalized.includes("대기") ||
    normalized.includes("pending") ||
    normalized.includes("waiting")
  ) {
    return {
      badge: "border-slate-200 bg-slate-100 text-slate-700",
      dot: "bg-slate-400",
    }
  }

  return {
    badge: "border-slate-200 bg-slate-100 text-slate-700",
    dot: "bg-slate-400",
  }
}

export function HomeQuickPanel() {
  const [state, setState] = useState<PanelState>({
    todayAnnouncementCount: 0,
    loanStatus: "신청 내역 없음",
    loading: true,
  })

  useEffect(() => {
    let mounted = true

    async function run() {
      try {
        const [announcementCount, loanSummary] = await Promise.all([
          getTodayAnnouncementCount(),
          getMyLoanApplicationSummary(),
        ])

        if (!mounted) {
          return
        }

        setState({
          todayAnnouncementCount: announcementCount,
          loanStatus: normalizeStatus(loanSummary?.status),
          loading: false,
        })
      } catch {
        if (!mounted) {
          return
        }

        setState({
          todayAnnouncementCount: 0,
          loanStatus: "신청 내역 없음",
          loading: false,
        })
      }
    }

    void run()

    return () => {
      mounted = false
    }
  }, [])

  const statusTone = getLoanStatusTone(state.loanStatus)

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">요약 가이드</p>
          <p className="text-xs text-slate-500">오늘의 공고, 대출 현재상황, AI 문의를 바로 확인합니다.</p>
        </div>
        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-[#2563EB]">
          실시간 반영
        </Badge>
      </div>

      <div className="space-y-3">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
                <Newspaper size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">오늘의 공고</p>
                <p className="mt-1 text-xs text-slate-500">오늘 기준으로 올라온 공고 수를 확인합니다.</p>
              </div>
            </div>

            <Link
              href="/site/subscription"
              className="mt-3 block rounded-2xl bg-slate-50 px-3 py-3 transition hover:bg-slate-100"
            >
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">오늘의 공고</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                    {state.loading ? "-" : state.todayAnnouncementCount}
                  </p>
                </div>
                <p className="text-sm text-slate-500">건</p>
              </div>
            </Link>

            {state.loading ? (
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                공고를 불러오는 중입니다.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Link href="/site/my-page" className="block">
          <Card className="border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:bg-slate-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
                  <Sparkles size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">대출 현재상황</p>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusTone.badge}`}>
                      <span className={`h-2 w-2 rounded-full ${statusTone.dot}`} />
                      {state.loanStatus}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">현재 신청한 대출의 최신 상태값을 보여줍니다.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link
          href="/live2d"
          className="block rounded-2xl bg-[#2563EB] px-4 py-3 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">AI 문의</p>
              <p className="mt-1 text-xs text-blue-100">기존 AI 비서와 바로 대화할 수 있습니다.</p>
            </div>
            <MessageCircleQuestion size={18} />
          </div>
        </Link>
      </div>
    </div>
  )
}
