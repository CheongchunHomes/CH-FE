"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { AlertCircle, Loader2, MapPin, UserRound } from "lucide-react"

import { ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { getMySigns, SignDocument } from "@/lib/sign-api"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function TemporarySignApprovePage() {
  const params = useParams<{ signId: string }>()
  const signId = useMemo(() => Number(params.signId), [params.signId])
  const { status, refresh } = useAuth()

  const [sign, setSign] = useState<SignDocument | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)

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
      setSign(null)
      return
    }

    setIsAuthenticated(true)
    setIsLoading(true)
    setErrorMessage("")

    async function loadSign() {
      try {
        const signs = await getMySigns()
        const foundSign = signs.find((item) => item.signId === signId)

        if (!foundSign) {
          setErrorMessage("결제 서류를 찾을 수 없습니다.")
          setSign(null)
          return
        }

        setSign(foundSign)
      } catch (error) {
        const code = getApiErrorCode(error)

        if (code === "REAUTH_REQUIRED") {
          await refresh()
          return
        }

        setErrorMessage(error instanceof Error ? error.message : "결제 서류를 불러오지 못했습니다.")
      } finally {
        setIsLoading(false)
      }
    }

    loadSign()
  }, [refresh, signId, status])

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
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-lg font-semibold text-slate-500">결제 서류 상세</h1>

        <Button asChild variant="outline" className="w-fit bg-white">
          <Link href="/site/my-page/sign">목록으로 돌아가기</Link>
        </Button>
      </div>

      <Card className="border-slate-200/80 bg-white shadow-sm">
        <CardContent className="space-y-4 p-6 md:p-8">
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            <div className="px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">임시 상세 페이지</h2>
              <p className="mt-1 text-xs text-slate-500">승인 기능은 아직 연결하지 않았습니다.</p>
            </div>

            <div className="min-h-32 bg-slate-200/70 p-5">
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <Loader2 className="animate-spin" size={16} />
                  결제 서류를 불러오는 중입니다.
                </div>
              ) : errorMessage ? (
                <p className="text-sm font-medium text-rose-600">{errorMessage}</p>
              ) : sign ? (
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div>
                    <p className="text-xs font-semibold text-sky-600">서류번호 #{sign.signId}</p>
                    <h3 className="mt-2 text-base font-semibold text-slate-950">
                      {sign.propertyTitle || `매물 #${sign.propertyId}`}
                    </h3>
                  </div>

                  <div className="mt-5 grid gap-3 text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <UserRound size={16} className="text-sky-600" />
                      <span className="font-semibold text-slate-500">임차인</span>
                      <span className="font-medium text-slate-950">{sign.customerNickname || "-"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <UserRound size={16} className="text-sky-600" />
                      <span className="font-semibold text-slate-500">임대인</span>
                      <span className="font-medium text-slate-950">{sign.providerNickname || "-"}</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="mt-0.5 shrink-0 text-sky-600" />
                      <span className="font-semibold text-slate-500">매물 주소</span>
                      <span className="font-medium text-slate-950">{sign.propertyAddress || "-"}</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}

function getApiErrorCode(error: unknown) {
  return error instanceof ApiError &&
    error.payload &&
    typeof error.payload === "object" &&
    "code" in error.payload
    ? (error.payload as { code?: string }).code
    : undefined
}
