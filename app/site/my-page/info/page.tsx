"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AlertCircle, Loader2 } from "lucide-react"

import { ApiError, get } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type MyProfileDTO = {
  email: string
  nickname: string
}

export default function MyPageInfoPage() {
  const { status, refresh } = useAuth()
  const [profile, setProfile] = useState<MyProfileDTO | null>(null)
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
      setProfile(null)
      return
    }

    setIsAuthenticated(true)
    setIsLoading(true)
    setErrorMessage("")

    async function loadProfile() {
      try {
        const data = await get<MyProfileDTO>("/api/users/mypage", {
          cache: "no-store",
          suppressGlobalError: true,
        })

        setProfile(data)
      } catch (error) {
        const code =
          error instanceof ApiError &&
          error.payload &&
          typeof error.payload === "object" &&
          "code" in error.payload
            ? (error.payload as { code?: string }).code
            : undefined

        if (code === "REAUTH_REQUIRED") {
          await refresh()
          return
        }

        setErrorMessage(error instanceof Error ? error.message : "회원 정보를 불러오지 못했습니다.")
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [refresh, status])

  if (!isAuthenticated && !isLoading) {
    return (
      <Card className="border-slate-200/80 bg-white shadow-sm">
        <CardContent className="flex min-h-[360px] flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <AlertCircle size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-950">로그인이 필요합니다</h1>
            <p className="mt-2 text-sm text-slate-500">내 정보를 확인하려면 먼저 로그인해 주세요.</p>
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
        <h1 className="text-lg font-semibold text-slate-500">내 정보</h1>
      </div>

      <Card className="border-slate-200/80 bg-white shadow-sm">
        <CardContent className="space-y-4 p-6 md:p-8">
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            <div className="px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">내정보</h2>
            </div>
            <div className="min-h-32 bg-slate-200/70 p-5">
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <Loader2 className="animate-spin" size={16} />
                  회원 정보를 불러오는 중입니다.
                </div>
              ) : errorMessage ? (
                <p className="text-sm font-medium text-rose-600">{errorMessage}</p>
              ) : (
                <div className="space-y-3 text-sm text-slate-700">
                  <p>
                    <span className="font-semibold text-slate-500">이메일 : </span>
                    <span className="font-medium text-slate-950">{profile?.email}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500">닉네임 : </span>
                    <span className="font-medium text-slate-950">{profile?.nickname}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500">비밀번호 : </span>
                    <Button asChild className="w-fit rounded-lg bg-sky-600 text-white hover:bg-sky-700">
                      <Link href="/site/my-page/info/password">비밀번호 변경</Link>
                    </Button>
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            <div className="px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">개인 정보</h2>
            </div>
            <div className="flex min-h-32 flex-col gap-4 bg-slate-200/70 p-5 md:justify-center">
              <Button asChild className="w-fit rounded-lg bg-sky-600 text-white hover:bg-sky-700">
                <Link href="/site/my-page/info/personal">개인정보표시버튼</Link>
              </Button>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
