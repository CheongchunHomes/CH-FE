"use client"

import Link from "next/link"
import { useEffect, useState, type ReactNode } from "react"
import { useSearchParams } from "next/navigation"
import { AlertCircle, FileSignature, FileText, Loader2, MapPin, UserRound } from "lucide-react"

import { ApiError, getFileSignedUrl } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { cancelSign, getMySigns, type SignDocument, type SignStatus } from "@/lib/sign-api"
import { getMyLoanApplicationSummary, type LoanApplicationSummary } from "@/lib/loan-applications-api"
import {
  getMySubscriptionApplicationSummary,
  type SubscriptionApplicationSummary,
} from "@/lib/subscription-api"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type ActivityTab = "loan" | "subscription" | "documents"

type Tone = "blue" | "emerald" | "rose" | "slate"

type ToneStyles = {
  badge: string
  dot: string
}

const toneStyles: Record<Tone, ToneStyles> = {
  blue: {
    badge: "border-blue-200 bg-blue-50 text-[#2563EB]",
    dot: "bg-[#2563EB]",
  },
  emerald: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  rose: {
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
  },
  slate: {
    badge: "border-slate-200 bg-slate-100 text-slate-700",
    dot: "bg-slate-400",
  },
}

const signStatusLabels: Record<SignStatus, string> = {
  ISSUED: "신청",
  PROVIDER_SIGNED: "임대인 서명",
  COMPLETED: "완료",
  CANCELED: "취소",
}

const signDateLabels: Record<SignStatus, string> = {
  ISSUED: "신청일",
  PROVIDER_SIGNED: "임대인 서명일",
  COMPLETED: "완료일",
  CANCELED: "취소일",
}

function getTabFromQuery(value: string | null): ActivityTab {
  if (value === "subscription" || value === "documents") {
    return value
  }

  return "loan"
}

export default function MyActivityPage() {
  const { status, refresh, user } = useAuth()
  const searchParams = useSearchParams()
  const tabQuery = searchParams.get("tab")

  const [activeTab, setActiveTab] = useState<ActivityTab>(() => getTabFromQuery(tabQuery))

  useEffect(() => {
    setActiveTab(getTabFromQuery(tabQuery))
  }, [tabQuery])

  const [loanSummary, setLoanSummary] = useState<LoanApplicationSummary | null>(null)
  const [loanLoading, setLoanLoading] = useState(true)
  const [loanPdfOpen, setLoanPdfOpen] = useState(false)
  const [loanPdfLoading, setLoanPdfLoading] = useState(false)
  const [loanPdfUrl, setLoanPdfUrl] = useState("")
  const [loanPdfError, setLoanPdfError] = useState("")

  const [subscriptionSummary, setSubscriptionSummary] = useState<SubscriptionApplicationSummary | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)

  const [signs, setSigns] = useState<SignDocument[]>([])
  const [signsLoading, setSignsLoading] = useState(false)
  const [signsLoaded, setSignsLoaded] = useState(false)
  const [signError, setSignError] = useState("")
  const [cancelingSignId, setCancelingSignId] = useState<number | null>(null)

  const loanStatusLabel = getLoanStatusLabel(loanSummary?.status)
  const loanTone = getLoanTone(loanSummary?.status)
  const loanUsesFlow = loanStatusLabel === "대기중" || loanStatusLabel === "승인" || loanStatusLabel === "거절"

  const subscriptionStatusLabel = getSubscriptionStatusLabel(subscriptionSummary?.status)
  const subscriptionTone = getSubscriptionTone(subscriptionSummary?.status)
  const subscriptionUsesFlow =
    subscriptionStatusLabel === "대기중" ||
    subscriptionStatusLabel === "당첨" ||
    subscriptionStatusLabel === "낙첨"

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

  useEffect(() => {
    if (activeTab !== "documents") {
      return
    }

    if (status === "loading") {
      setSignsLoading(true)
      return
    }

    if (status === "reauthRequired") {
      setSignsLoading(false)
      return
    }

    if (status !== "authenticated") {
      setSigns([])
      setSignsLoaded(false)
      setSignError("")
      setSignsLoading(false)
      return
    }

    if (signsLoaded) {
      return
    }

    let canceled = false
    setSignsLoading(true)
    setSignError("")

    async function loadSigns() {
      try {
        const data = await getMySigns()
        if (!canceled) {
          setSigns(data)
          setSignsLoaded(true)
        }
      } catch (error) {
        const code = getApiErrorCode(error)

        if (code === "REAUTH_REQUIRED") {
          await refresh()
          return
        }

        if (!canceled) {
          setSignError(error instanceof Error ? error.message : "결제 서류 목록을 불러오지 못했습니다.")
        }
      } finally {
        if (!canceled) {
          setSignsLoading(false)
        }
      }
    }

    loadSigns()

    return () => {
      canceled = true
    }
  }, [activeTab, refresh, signsLoaded, status])

  if (status === "loading") {
    return (
      <Card className="border-slate-200/80 bg-white shadow-sm">
        <CardContent className="flex min-h-[360px] flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">
            <Loader2 className="animate-spin" size={22} />
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-950">내 활동을 불러오는 중입니다</h1>
            <p className="mt-2 text-sm text-slate-500">대출, 청약, 결제 서류 최신 상태를 확인합니다.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (status !== "authenticated" && status !== "reauthRequired") {
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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-500">내 활동</h1>
      </div>

      <Card className="border-slate-200/80 bg-white shadow-sm">
        <CardContent className="space-y-5 p-6 md:p-8">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ActivityTab)} className="w-full">
            <TabsList className="grid h-auto w-full grid-cols-3 rounded-2xl border border-slate-200 bg-slate-100 p-1.5">
              <TabsTrigger
                value="loan"
                className="rounded-lg border border-transparent px-3 py-2 text-sm font-semibold text-slate-500 transition-all data-[state=active]:border-slate-300 data-[state=active]:bg-white data-[state=active]:font-bold data-[state=active]:text-slate-950 data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-blue-200"
              >
                대출 결과
              </TabsTrigger>
              <TabsTrigger
                value="subscription"
                className="rounded-lg border border-transparent px-3 py-2 text-sm font-semibold text-slate-500 transition-all data-[state=active]:border-slate-300 data-[state=active]:bg-white data-[state=active]:font-bold data-[state=active]:text-slate-950 data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-blue-200"
              >
                청약 결과
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="rounded-lg border border-transparent px-3 py-2 text-sm font-semibold text-slate-500 transition-all data-[state=active]:border-slate-300 data-[state=active]:bg-white data-[state=active]:font-bold data-[state=active]:text-slate-950 data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-blue-200"
              >
                결제 서류
              </TabsTrigger>
            </TabsList>

            <TabsContent value="loan" className="mt-5">
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
            </TabsContent>

            <TabsContent value="subscription" className="mt-5">
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
                        <InfoRow label="결과일" value={subscriptionSummary.resultAt ?? subscriptionSummary.updatedAt ?? subscriptionSummary.createdAt} />
                        <InfoRow label="상태" value={subscriptionSummary.status} />
                      </div>
                    </div>
                  ) : null
                }
              />
            </TabsContent>

            <TabsContent value="documents" className="mt-5">
              <ActivitySection
                title="결제 서류"
                description="신청한 계약 서류와 서명 진행 상태를 확인합니다."
                tone={signs.length > 0 ? "blue" : "slate"}
                progressLabel={signs.length > 0 ? `전체 ${signs.length}건` : "신청 내역 없음"}
                loading={signsLoading}
                emptyMessage="아직 결제 서류가 없습니다."
                summaryContent={
                  signError ? (
                    <p className="text-sm font-medium text-rose-600">{signError}</p>
                  ) : signs.length === 0 ? null : (
                    <div className="flex flex-col gap-3">
                      {signs.map((sign) => (
                        <SignCard
                          key={sign.signId}
                          sign={sign}
                          currentUserId={user?.id ?? null}
                          isCanceling={cancelingSignId === sign.signId}
                          onCancel={handleCancelSign}
                        />
                      ))}
                    </div>
                  )
                }
                hideAction
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <LoanPdfDialog
        open={loanPdfOpen}
        loading={loanPdfLoading}
        errorMessage={loanPdfError}
        signedUrl={loanPdfUrl}
        onOpenChange={setLoanPdfOpen}
      />
    </div>
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

  async function handleCancelSign(signId: number) {
    setCancelingSignId(signId)
    setSignError("")

    try {
      const updatedSign = await cancelSign(signId)
      setSigns((current) => current.map((sign) => (sign.signId === signId ? updatedSign : sign)))
    } catch (error) {
      const code = getApiErrorCode(error)

      if (code === "REAUTH_REQUIRED") {
        await refresh()
        return
      }

      setSignError(error instanceof Error ? error.message : "결제 서류를 취소하지 못했습니다.")
    } finally {
      setCancelingSignId(null)
    }
  }
}

function ActivitySection({
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
    <section className="overflow-hidden rounded-lg border border-blue-100 bg-blue-50/60">
      <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <Badge variant="outline" className={`w-fit ${styles.badge}`}>
          {progressLabel}
        </Badge>
      </div>

      <div className="min-h-32 bg-white p-5">
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

function ResultFlow({
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

function StatusPill({ tone, label }: { tone: Tone; label: string }) {
  const styles = toneStyles[tone]

  return (
    <div className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${styles.badge}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${styles.dot}`} />
      {label}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: number | string | null | undefined }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
      <div className="font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-950">{formatValue(value)}</div>
    </div>
  )
}

function SignCard({
  sign,
  currentUserId,
  isCanceling,
  onCancel,
}: {
  sign: SignDocument
  currentUserId: number | null
  isCanceling: boolean
  onCancel: (signId: number) => void
}) {
  const canCancel = sign.status === "ISSUED" || sign.status === "PROVIDER_SIGNED"
  const detailLabel = currentUserId === sign.providerId && sign.status === "ISSUED" ? "계약서 작성" : "계약서 보기"
  const detailHref =
    currentUserId === sign.providerId ? `/site/my-page/sign/${sign.signId}` : `/site/step/sign/${sign.signId}`

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-400">
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant={getSignStatusBadgeVariant(sign.status)}>{signStatusLabels[sign.status]}</Badge>
            <span className="text-xs text-slate-400">서류번호 #{sign.signId}</span>
          </div>

          <div className="text-sm font-semibold text-slate-950">{sign.propertyTitle || `매물 #${sign.propertyId}`}</div>

          <div className="mt-2 flex items-start gap-2 text-xs leading-5 text-slate-500">
            <MapPin size={14} className="mt-0.5 shrink-0 text-[#2563EB]" />
            <span>{sign.propertyAddress || "매물 주소 확인 필요"}</span>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <Button asChild size="sm" variant="outline" className="bg-white">
            <Link href={detailHref}>{detailLabel}</Link>
          </Button>

          {canCancel && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isCanceling}
              onClick={() => onCancel(sign.signId)}
              className="border-rose-200 bg-white text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              {isCanceling ? (
                <>
                  <Loader2 className="mr-1 animate-spin" size={14} />
                  취소 중
                </>
              ) : (
                "취소"
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 rounded-lg bg-slate-50 p-4 text-xs text-slate-600 md:grid-cols-3">
        <div className="flex items-center gap-2">
          <UserRound size={14} className="text-[#2563EB]" />
          <span className="font-semibold text-slate-500">임차인</span>
          <span className="font-medium text-slate-950">{sign.customerNickname || "-"}</span>
        </div>

        <div className="flex items-center gap-2">
          <UserRound size={14} className="text-[#2563EB]" />
          <span className="font-semibold text-slate-500">임대인</span>
          <span className="font-medium text-slate-950">{sign.providerNickname || "-"}</span>
        </div>

        <div className="flex items-center gap-2">
          <FileSignature size={14} className="text-[#2563EB]" />
          <span className="font-semibold text-slate-500">{signDateLabels[sign.status]}</span>
          <span className="font-medium text-slate-950">{formatDateTime(sign.updatedAt)}</span>
        </div>
      </div>
    </div>
  )
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
              <Loader2 className="animate-spin" size={16} />
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
    PAYMENT_PENDING: "결제대기",
    PAYMENT_COMPLETED: "결제완료",
    PAYMENT_APPROVED: "결제승인",
    PAYMENT_REJECTED: "결제거부",
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

  if (
    normalized.includes("승인") ||
    normalized.includes("approved") ||
    normalized.includes("accept")
  ) {
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

function getLoanTone(status?: string | null): Tone {
  const label = getLoanStatusLabel(status)
  const normalized = `${status ?? label}`.trim().toLowerCase()

  if (
    normalized.includes("거부") ||
    normalized.includes("거절") ||
    normalized.includes("반려") ||
    normalized.includes("rejected") ||
    normalized.includes("reject")
  ) {
    return "rose"
  }

  if (
    normalized.includes("승인") ||
    normalized.includes("approved") ||
    normalized.includes("accept") ||
    normalized.includes("complete") ||
    normalized.includes("완료")
  ) {
    return "emerald"
  }

  if (
    normalized.includes("대기") ||
    normalized.includes("pending") ||
    normalized.includes("waiting") ||
    normalized.includes("심사") ||
    normalized.includes("접수") ||
    normalized.includes("cancel")
  ) {
    return "slate"
  }

  return "blue"
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

function getSubscriptionTone(status?: string | null): Tone {
  const trimmed = `${status ?? ""}`.trim().toUpperCase()

  if (trimmed === "APPLIED") {
    return "emerald"
  }

  if (trimmed === "CANCELED") {
    return "rose"
  }

  if (trimmed === "PENDING") {
    return "slate"
  }

  const normalized = trimmed.toLowerCase()

  if (normalized.includes("낙첨") || normalized.includes("취소") || normalized.includes("canceled")) {
    return "rose"
  }

  if (normalized.includes("대기") || normalized.includes("pending")) {
    return "slate"
  }

  return "blue"
}

function getSignStatusBadgeVariant(status: SignStatus) {
  if (status === "CANCELED") {
    return "destructive"
  }

  if (status === "COMPLETED") {
    return "default"
  }

  return "secondary"
}

function formatDateTime(value?: string | null) {
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

function formatValue(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "-"
  }

  return typeof value === "number" ? String(value) : value
}

function getApiErrorCode(error: unknown) {
  return error instanceof ApiError &&
    error.payload &&
    typeof error.payload === "object" &&
    "code" in error.payload
    ? (error.payload as { code?: string }).code
    : undefined
}
