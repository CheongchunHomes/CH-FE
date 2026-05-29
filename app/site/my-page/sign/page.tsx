"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AlertCircle, FileSignature, Loader2, MapPin, UserRound } from "lucide-react"

import { ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { cancelSign, getMySigns, SignDocument, SignStatus } from "@/lib/sign-api"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const statusLabels: Record<SignStatus, string> = {
  ISSUED: "신청",
  PROVIDER_SIGNED: "임대인 서명",
  COMPLETED: "완료",
  CANCELED: "취소",
}

const dateLabels: Record<SignStatus, string> = {
  ISSUED: "신청일",
  PROVIDER_SIGNED: "임대인 서명일",
  COMPLETED: "완료일",
  CANCELED: "취소일",
}

export default function MySignPage() {
  const { status, refresh, user } = useAuth()

  const [signs, setSigns] = useState<SignDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [cancelingSignId, setCancelingSignId] = useState<number | null>(null)

  useEffect(() => {
    if (status === "loading") {
      setIsLoading(true)
      return
    }

    if (status === "reauthRequired") {
      setIsAuthenticated(true)
      setIsLoading(false)
      return
    }

    if (status !== "authenticated") {
      setIsAuthenticated(false)
      setIsLoading(false)
      setSigns([])
      return
    }

    setIsAuthenticated(true)
    setIsLoading(true)
    setErrorMessage("")

    async function loadSigns() {
      try {
        const data = await getMySigns()
        setSigns(data)
      } catch (error) {
        const code = getApiErrorCode(error)

        if (code === "REAUTH_REQUIRED") {
          await refresh()
          return
        }

        setErrorMessage(error instanceof Error ? error.message : "결제 서류 목록을 불러오지 못했습니다.")
      } finally {
        setIsLoading(false)
      }
    }

    loadSigns()
  }, [refresh, status])

  async function handleCancel(signId: number) {
    setCancelingSignId(signId)
    setErrorMessage("")

    try {
      const updatedSign = await cancelSign(signId)
      setSigns((current) => current.map((sign) => (sign.signId === signId ? updatedSign : sign)))
    } catch (error) {
      const code = getApiErrorCode(error)

      if (code === "REAUTH_REQUIRED") {
        await refresh()
        return
      }

      setErrorMessage(error instanceof Error ? error.message : "결제 서류를 취소하지 못했습니다.")
    } finally {
      setCancelingSignId(null)
    }
  }

  if (!isAuthenticated && !isLoading) {
    return (
      <Card className="border-slate-200/80 bg-white shadow-sm">
        <CardContent className="flex min-h-[360px] flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <AlertCircle size={22} />
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-950">로그인이 필요합니다</h1>
            <p className="mt-2 text-sm text-slate-500">결제 서류를 확인하려면 먼저 로그인해 주세요.</p>
          </div>

          <Button asChild className="rounded-lg bg-sky-600 text-white hover:bg-sky-700">
            <Link href="/login">로그인으로 이동</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-500">결제 서류</h1>
      </div>

      <Card className="border-slate-200/80 bg-white shadow-sm">
        <CardContent className="space-y-4 p-6 md:p-8">
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            <div className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">결제 서류 목록</h2>
                <p className="mt-1 text-xs text-slate-500">신청한 계약 서류와 서명 진행 상태를 확인할 수 있습니다.</p>
              </div>

              <Badge variant="secondary" className="w-fit">
                전체 {signs.length}건
              </Badge>
            </div>

            <div className="min-h-32 bg-slate-200/70 p-5">
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <Loader2 className="animate-spin" size={16} />
                  결제 서류 목록을 불러오는 중입니다.
                </div>
              ) : errorMessage ? (
                <p className="text-sm font-medium text-rose-600">{errorMessage}</p>
              ) : signs.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                  아직 결제 서류가 없습니다.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {signs.map((sign) => (
                    <SignCard
                      key={sign.signId}
                      sign={sign}
                      currentUserId={user?.id ?? null}
                      isCanceling={cancelingSignId === sign.signId}
                      onCancel={handleCancel}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}

type SignCardProps = {
  sign: SignDocument
  currentUserId: number | null
  isCanceling: boolean
  onCancel: (signId: number) => void
}

function SignCard({ sign, currentUserId, isCanceling, onCancel }: SignCardProps) {
  const canCancel = sign.status === "ISSUED" || sign.status === "PROVIDER_SIGNED"
  const detailLabel = currentUserId === sign.providerId && sign.status === "ISSUED" ? "계약서 작성" : "계약서 보기"
  const detailHref = currentUserId === sign.providerId ? `/site/my-page/sign/${sign.signId}` : `/site/step/sign/${sign.signId}`

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-400">
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant={getStatusBadgeVariant(sign.status)}>{statusLabels[sign.status]}</Badge>
            <span className="text-xs text-slate-400">서류번호 #{sign.signId}</span>
          </div>

          <div className="text-sm font-semibold text-slate-950">{sign.propertyTitle || `매물 #${sign.propertyId}`}</div>

          <div className="mt-2 flex items-start gap-2 text-xs leading-5 text-slate-500">
            <MapPin size={14} className="mt-0.5 shrink-0 text-sky-600" />
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
          <UserRound size={14} className="text-sky-600" />
          <span className="font-semibold text-slate-500">임차인</span>
          <span className="font-medium text-slate-950">{sign.customerNickname || "-"}</span>
        </div>

        <div className="flex items-center gap-2">
          <UserRound size={14} className="text-sky-600" />
          <span className="font-semibold text-slate-500">임대인</span>
          <span className="font-medium text-slate-950">{sign.providerNickname || "-"}</span>
        </div>

        <div className="flex items-center gap-2">
          <FileSignature size={14} className="text-sky-600" />
          <span className="font-semibold text-slate-500">{dateLabels[sign.status]}</span>
          <span className="font-medium text-slate-950">{formatDateTime(sign.updatedAt)}</span>
        </div>
      </div>
    </div>
  )
}

function getStatusBadgeVariant(status: SignStatus) {
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

function getApiErrorCode(error: unknown) {
  return error instanceof ApiError &&
    error.payload &&
    typeof error.payload === "object" &&
    "code" in error.payload
    ? (error.payload as { code?: string }).code
    : undefined
}
