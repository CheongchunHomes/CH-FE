"use client"

import { useEffect, useState } from "react"

import { useAuth } from "@/lib/auth-context"
import { getMySubscriptionApplicationSummary, type SubscriptionApplicationSummary } from "@/lib/subscription-api"

import { ActivityLoginCard, ActivityLoadingCard, ActivityPageShell, ActivitySection, InfoRow, ResultFlow, StatusPill } from "../activity-content"

export default function MyActivitySubscriptionPage() {
  const { status } = useAuth()

  const [subscriptionSummary, setSubscriptionSummary] = useState<SubscriptionApplicationSummary | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)

  const subscriptionStatusLabel = getSubscriptionStatusLabel(subscriptionSummary?.status)
  const subscriptionTone = getSubscriptionTone(subscriptionSummary?.status)
  const subscriptionUsesFlow =
    subscriptionStatusLabel === "대기중" ||
    subscriptionStatusLabel === "당첨" ||
    subscriptionStatusLabel === "낙첨"

  useEffect(() => {
    if (status === "loading") {
      setSubscriptionLoading(true)
      return
    }

    if (status === "reauthRequired") {
      setSubscriptionLoading(false)
      return
    }

    if (status !== "authenticated") {
      setSubscriptionSummary(null)
      setSubscriptionLoading(false)
      return
    }

    let canceled = false
    setSubscriptionLoading(true)

    async function loadSubscriptionSummary() {
      try {
        const data = await getMySubscriptionApplicationSummary()
        if (!canceled) {
          setSubscriptionSummary(data)
        }
      } finally {
        if (!canceled) {
          setSubscriptionLoading(false)
        }
      }
    }

    loadSubscriptionSummary()

    return () => {
      canceled = true
    }
  }, [status])

  if (status === "loading") {
    return <ActivityLoadingCard description="청약 결과 최신 상태를 확인합니다." />
  }

  if (status !== "authenticated" && status !== "reauthRequired") {
    return <ActivityLoginCard />
  }

  return (
    <ActivityPageShell activeSection="subscription">
      <ActivitySection
        title="청약 결과"
        description="최신 청약 신청 결과만 보여줍니다."
        tone={subscriptionTone}
        progressLabel={subscriptionStatusLabel}
        loading={subscriptionLoading}
        emptyMessage="아직 청약 신청 결과가 없습니다."
        summaryContent={
          subscriptionSummary ? (
            <div className="space-y-4">
              {subscriptionUsesFlow ? (
                <ResultFlow
                  tone={subscriptionTone}
                  leftLabel="대기중"
                  rightLabel={subscriptionStatusLabel === "대기중" ? "당첨/낙첨" : subscriptionStatusLabel}
                  resolved={subscriptionStatusLabel !== "대기중"}
                />
              ) : (
                <StatusPill tone={subscriptionTone} label={subscriptionStatusLabel} />
              )}

              <div className="grid gap-3 md:grid-cols-2">
                <InfoRow label="신청번호" value={subscriptionSummary.id} />
                <InfoRow label="공고명" value={subscriptionSummary.announcementTitle} />
                <InfoRow label="공급유형" value={subscriptionSummary.housingType} />
                <InfoRow label="신청자" value={subscriptionSummary.applicantName} />
                <InfoRow
                  label="결과일"
                  value={subscriptionSummary.resultAt ?? subscriptionSummary.updatedAt ?? subscriptionSummary.createdAt}
                />
                <InfoRow label="상태" value={subscriptionSummary.status} />
              </div>
            </div>
          ) : null
        }
      />
    </ActivityPageShell>
  )
}

function getSubscriptionStatusLabel(status?: string | null) {
  const trimmed = status?.trim()
  if (!trimmed) {
    return "신청 내역 없음"
  }

  const statusMap: Record<string, string> = {
    PENDING: "대기중",
    APPLIED: "당첨",
    CANCELED: "낙첨",
  }

  if (trimmed in statusMap) {
    return statusMap[trimmed]
  }

  const normalized = trimmed.toLowerCase()

  if (normalized.includes("당첨") || normalized.includes("applied")) {
    return "당첨"
  }

  if (normalized.includes("낙첨") || normalized.includes("취소") || normalized.includes("canceled")) {
    return "낙첨"
  }

  if (normalized.includes("대기") || normalized.includes("pending")) {
    return "대기중"
  }

  return trimmed
}

function getSubscriptionTone(status?: string | null) {
  const trimmed = `${status ?? ""}`.trim().toUpperCase()

  if (trimmed === "APPLIED") {
    return "emerald" as const
  }

  if (trimmed === "CANCELED") {
    return "rose" as const
  }

  if (trimmed === "PENDING") {
    return "slate" as const
  }

  const normalized = trimmed.toLowerCase()

  if (normalized.includes("낙첨") || normalized.includes("취소") || normalized.includes("canceled")) {
    return "rose" as const
  }

  if (normalized.includes("대기") || normalized.includes("pending")) {
    return "slate" as const
  }

  return "blue" as const
}
