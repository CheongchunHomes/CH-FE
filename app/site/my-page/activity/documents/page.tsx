"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { FileSignature, Loader2, MapPin, UserRound } from "lucide-react"

import { ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { cancelSign, getMySigns, type SignDocument, type SignStatus } from "@/lib/sign-api"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { ActivityLoginCard, ActivityLoadingCard, ActivityPageShell, ActivitySection, formatDateTime } from "../activity-content"

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

export default function MyActivityDocumentsPage() {
  const { status, refresh, user } = useAuth()

  const [signs, setSigns] = useState<SignDocument[]>([])
  const [signsLoading, setSignsLoading] = useState(false)
  const [signError, setSignError] = useState("")
  const [cancelingSignId, setCancelingSignId] = useState<number | null>(null)

  useEffect(() => {
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
      setSignError("")
      setSignsLoading(false)
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
  }, [refresh, status])

  if (status === "loading") {
    return <ActivityLoadingCard description="결제 서류 최신 상태를 확인합니다." />
  }

  if (status !== "authenticated" && status !== "reauthRequired") {
    return <ActivityLoginCard />
  }

  return (
    <ActivityPageShell activeSection="documents">
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
    </ActivityPageShell>
  )

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

function getSignStatusBadgeVariant(status: SignStatus) {
  if (status === "CANCELED") {
    return "destructive"
  }

  if (status === "COMPLETED") {
    return "default"
  }

  return "secondary"
}

function getApiErrorCode(error: unknown) {
  return error instanceof ApiError &&
    error.payload &&
    typeof error.payload === "object" &&
    "code" in error.payload
    ? (error.payload as { code?: string }).code
    : undefined
}
