"use client"

import Link from "next/link"
import { type ReactNode } from "react"
import { AlertCircle, Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export type ActivitySectionKey = "loan" | "subscription" | "documents"

type Tone = "blue" | "emerald" | "rose" | "slate"

type ToneStyles = {
  badge: string
  dot: string
  section: string
}

const toneStyles: Record<Tone, ToneStyles> = {
  blue: {
    badge: "border-blue-200 bg-blue-50 text-[#2563EB]",
    dot: "bg-[#2563EB]",
    section: "border-blue-200 bg-blue-50",
  },
  emerald: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
    section: "border-emerald-200 bg-emerald-50",
  },
  rose: {
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
    section: "border-rose-200 bg-rose-50",
  },
  slate: {
    badge: "border-slate-200 bg-slate-100 text-slate-700",
    dot: "bg-slate-400",
    section: "border-slate-200 bg-slate-100",
  },
}

const activitySections: Array<{ key: ActivitySectionKey; label: string; href: string }> = [
  { key: "loan", label: "대출 결과", href: "/site/my-page/activity/loan" },
  { key: "subscription", label: "청약 결과", href: "/site/my-page/activity/subscription" },
  { key: "documents", label: "결제 서류", href: "/site/my-page/activity/documents" },
]

export function ActivityPageShell({
  activeSection,
  children,
}: {
  activeSection: ActivitySectionKey
  children: ReactNode
}) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-500">내 활동</h1>
      </div>

      <Card className="border-slate-200/80 bg-white shadow-sm">
        <CardContent className="space-y-5 p-6 md:p-8">
          <ActivityNavigation activeSection={activeSection} />
          <div className="mt-5">{children}</div>
        </CardContent>
      </Card>
    </div>
  )
}

export function ActivityLoadingCard({ description }: { description: string }) {
  return (
    <Card className="border-slate-200/80 bg-white shadow-sm">
      <CardContent className="flex min-h-[360px] flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">
          <Loader2 className="animate-spin" size={22} />
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-950">내 활동을 불러오는 중입니다</h1>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function ActivityLoginCard() {
  return (
    <Card className="border-slate-200/80 bg-white shadow-sm">
      <CardContent className="flex min-h-[360px] flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <AlertCircle size={22} />
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-950">로그인이 필요합니다</h1>
          <p className="mt-2 text-sm text-slate-500">내 활동을 확인하려면 먼저 로그인해 주세요.</p>
        </div>

        <Button asChild className="rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
          <Link href="/login">로그인으로 이동</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export function ActivityNavigation({ activeSection }: { activeSection: ActivitySectionKey }) {
  return (
    <nav
      aria-label="내 활동 섹션"
      className="grid h-auto w-full grid-cols-3 rounded-2xl border border-slate-200 bg-slate-100 p-1.5"
    >
      {activitySections.map((item) => {
        const isActive = item.key === activeSection

        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-lg border px-3 py-2 text-center text-sm font-semibold transition-all ${
              isActive
                ? "border-slate-300 bg-white font-bold text-slate-950 shadow-sm ring-1 ring-blue-200"
                : "border-transparent text-slate-500 hover:bg-white/70 hover:text-slate-800"
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function ActivitySection({
  title,
  description,
  tone,
  progressLabel,
  loading,
  emptyMessage,
  summaryContent,
  action,
  hideAction = false,
}: {
  title: string
  description: string
  tone: Tone
  progressLabel: string
  loading: boolean
  emptyMessage: string
  summaryContent: ReactNode
  action?: ReactNode
  hideAction?: boolean
}) {
  const styles = toneStyles[tone]

  return (
    <section className={`overflow-hidden rounded-lg border shadow-sm ${styles.section}`}>
      <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <Badge variant="outline" className={`w-fit ${styles.badge}`}>
          {progressLabel}
        </Badge>
      </div>

      <div className="min-h-32 bg-white/80 p-5">
        {loading ? (
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Loader2 className="animate-spin" size={16} />
            {title}을(를) 불러오는 중입니다.
          </div>
        ) : summaryContent ? (
          <div className="space-y-4">
            {summaryContent}
            {!hideAction && action ? <div className="pt-1">{action}</div> : null}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              {emptyMessage}
            </div>
            {!hideAction && action ? <div>{action}</div> : null}
          </div>
        )}
      </div>
    </section>
  )
}

export function ResultFlow({
  tone,
  leftLabel,
  rightLabel,
  resolved,
}: {
  tone: Tone
  leftLabel: string
  rightLabel: string
  resolved: boolean
}) {
  const styles = toneStyles[tone]
  const activeChip = styles.badge
  const inactiveChip = "border-slate-200 bg-white text-slate-400"

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
      <div
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
          resolved ? inactiveChip : activeChip
        }`}
      >
        <span className={`h-2.5 w-2.5 rounded-full ${resolved ? "bg-slate-300" : styles.dot}`} />
        {leftLabel}
      </div>

      <span className="px-1 text-sm font-bold text-slate-300">→</span>

      <div
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
          resolved ? activeChip : inactiveChip
        }`}
      >
        <span className={`h-2.5 w-2.5 rounded-full ${resolved ? styles.dot : "bg-slate-300"}`} />
        {rightLabel}
      </div>
    </div>
  )
}

export function StatusPill({ tone, label }: { tone: Tone; label: string }) {
  const styles = toneStyles[tone]

  return (
    <div className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${styles.badge}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${styles.dot}`} />
      {label}
    </div>
  )
}

export function InfoRow({ label, value }: { label: string; value: number | string | null | undefined }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
      <div className="font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-950">{formatValue(value)}</div>
    </div>
  )
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatValue(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "-"
  }

  return typeof value === "number" ? String(value) : value
}
