"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AlertCircle, Loader2, Mail, UserRound } from "lucide-react"

import { get } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type MyProfileDTO = {
  email: string
  nickname: string
}

export default function MyPageInfoPage() {
  const { status } = useAuth()
  const [profile, setProfile] = useState<MyProfileDTO | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    if (status === "loading") {
      setIsLoading(true)
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
        })

        setProfile(data)
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "회원 정보를 불러오지 못했습니다.")
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [status])

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
              <h2 className="text-base font-semibold text-slate-900">회원 정보</h2>
            </div>
            <div className="flex min-h-32 flex-col gap-4 bg-slate-200/70 p-5 md:flex-row md:items-center md:justify-between">
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <Loader2 className="animate-spin" size={16} />
                  회원 정보를 불러오는 중입니다.
                </div>
              ) : errorMessage ? (
                <p className="text-sm font-medium text-rose-600">{errorMessage}</p>
              ) : (
                <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <UserRound size={16} className="text-sky-600" />
                    <span className="font-semibold text-slate-500">닉네임</span>
                    <span className="font-medium text-slate-950">{profile?.nickname}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-sky-600" />
                    <span className="font-semibold text-slate-500">이메일</span>
                    <span className="font-medium text-slate-950">{profile?.email}</span>
                  </div>
                </div>
              )}

              <Button type="button" className="w-fit rounded-lg bg-sky-600 text-white hover:bg-sky-700">
                PW 변경
              </Button>
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            <div className="px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">기본 정보</h2>
            </div>
            <div className="flex min-h-32 flex-col gap-4 bg-slate-200/70 p-5 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-slate-600">주소, 소득정보 등은 추후 표시됩니다.</p>
              <Button type="button" className="w-fit rounded-lg bg-sky-600 text-white hover:bg-sky-700">
                수정
              </Button>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
