"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react"

import { ApiError, get, request } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type MyProfileDTO = {
  email: string
  nickname: string
}

type NicknameCheckResponse = {
  available?: boolean
  isAvailable?: boolean
  duplicated?: boolean
  duplicate?: boolean
}

type NicknameStatus = "idle" | "checking" | "available" | "unavailable"

type NicknameUpdateRequest = {
  nickname: string
}

function isNicknameAvailable(response: NicknameCheckResponse) {
  if (typeof response.available === "boolean") return response.available
  if (typeof response.isAvailable === "boolean") return response.isAvailable
  if (typeof response.duplicated === "boolean") return !response.duplicated
  if (typeof response.duplicate === "boolean") return !response.duplicate
  return true
}

export default function MyPageInfoEditPage() {
  const { status, refresh } = useAuth()
  const [profile, setProfile] = useState<MyProfileDTO | null>(null)
  const [nickname, setNickname] = useState("")
  const [nicknameStatus, setNicknameStatus] = useState<NicknameStatus>("idle")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
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
      setNickname("")
      return
    }

    setIsAuthenticated(true)
    setIsLoading(true)
    setErrorMessage("")
    setSuccessMessage("")

    async function loadProfile() {
      try {
        const data = await get<MyProfileDTO>("/api/users/mypage", {
          cache: "no-store",
          suppressGlobalError: true,
        })

        setProfile(data)
        setNickname(data.nickname)
        setNicknameStatus("idle")
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

  async function handleNicknameCheck() {
    const value = nickname.trim()
    const currentNickname = profile?.nickname.trim() ?? ""

    if (!value) {
      setErrorMessage("닉네임을 입력해 주세요.")
      return
    }

    if (value === currentNickname) {
      setNicknameStatus("idle")
      setErrorMessage("닉네임이 변경되지 않았습니다.")
      setSuccessMessage("")
      return
    }

    setNicknameStatus("checking")
    setErrorMessage("")
    setSuccessMessage("")

    try {
      const response = await get<NicknameCheckResponse>("/api/users/nickname/check", {
        query: { nickname: value },
        suppressGlobalError: true,
      })

      setNicknameStatus(isNicknameAvailable(response) ? "available" : "unavailable")
    } catch (error) {
      setNicknameStatus("unavailable")
      setErrorMessage(error instanceof Error ? error.message : "닉네임 중복 확인에 실패했습니다.")
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedNickname = nickname.trim()
    const currentNickname = profile?.nickname.trim() ?? ""
    const isChanged = trimmedNickname !== currentNickname

    setSuccessMessage("")
    setErrorMessage("")

    if (!trimmedNickname) {
      setErrorMessage("닉네임을 입력해 주세요.")
      return
    }

    if (!isChanged) {
      setErrorMessage("닉네임이 변경되지 않았습니다.")
      return
    }

    if (nicknameStatus !== "available") {
      setErrorMessage("닉네임 중복 확인을 완료해 주세요.")
      return
    }

    setIsSubmitting(true)

    try {
      await request<unknown, NicknameUpdateRequest>("PATCH", "/api/users/mypage", {
        body: { nickname: trimmedNickname },
        suppressGlobalError: true,
      })

      setProfile((current) => (current ? { ...current, nickname: trimmedNickname } : current))
      setNickname(trimmedNickname)
      setNicknameStatus("idle")
      await refresh()
      setSuccessMessage("회원정보가 수정되었습니다.")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "회원정보 수정에 실패했습니다.")
    } finally {
      setIsSubmitting(false)
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
            <p className="mt-2 text-sm text-slate-500">회원정보를 수정하려면 먼저 로그인해 주세요.</p>
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
        <h1 className="text-lg font-semibold text-slate-500">회원정보 수정</h1>
      </div>

      <Card className="border-slate-200/80 bg-white shadow-sm">
        <CardContent className="space-y-4 p-6 md:p-8">
          <Button asChild variant="ghost" className="w-fit px-0 text-slate-600 hover:bg-transparent hover:text-slate-950">
            <Link href="/site/my-page/info">
              <ArrowLeft className="mr-2 h-4 w-4" />
              내 정보로 돌아가기
            </Link>
          </Button>

          <section className="overflow-hidden rounded-lg border border-blue-100 bg-blue-50/60">
            <div className="px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">내정보</h2>
            </div>
            <div className="min-h-32 bg-white p-5">
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <Loader2 className="animate-spin" size={16} />
                  회원 정보를 불러오는 중입니다.
                </div>
              ) : errorMessage && !profile ? (
                <p className="text-sm font-medium text-rose-600">{errorMessage}</p>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-3 text-sm text-slate-700">
                    <p>
                      <span className="font-semibold text-slate-500">이메일 : </span>
                      <span className="font-medium text-slate-950">{profile?.email}</span>
                    </p>

                    <div className="pb-4 text-sm text-slate-700">
                      <p className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <span className="font-semibold text-slate-500">비밀번호 : </span>
                        <Button asChild className="w-fit rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
                          <Link href="/site/my-page/info/password">비밀번호 변경</Link>
                        </Button>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Label htmlFor="mypage-nickname" className="shrink-0 font-semibold text-slate-500">
                          닉네임 :
                        </Label>
                        <Input
                          id="mypage-nickname"
                          maxLength={20}
                          value={nickname}
                          onChange={(event) => {
                            setNickname(event.target.value)
                            setNicknameStatus("idle")
                            setSuccessMessage("")
                          }}
                          className="max-w-72"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={nicknameStatus === "checking"}
                          onClick={handleNicknameCheck}
                          className="shrink-0"
                        >
                          {nicknameStatus === "checking" ? "확인 중" : "중복 확인"}
                        </Button>
                      </div>
                      {nicknameStatus === "available" ? (
                        <p className="text-sm font-medium text-blue-600">사용 가능한 닉네임입니다.</p>
                      ) : null}
                      {nicknameStatus === "unavailable" ? (
                        <p className="text-sm font-medium text-rose-600">사용할 수 없는 닉네임입니다.</p>
                      ) : null}
                    </div>
                  </div>

                  {successMessage ? <p className="text-sm font-medium text-blue-600">{successMessage}</p> : null}
                  {errorMessage ? <p className="text-sm font-medium text-rose-600">{errorMessage}</p> : null}

                  <Button type="submit" disabled={isSubmitting} className="rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
                    {isSubmitting ? "닉네임 변경 중..." : "닉네임 변경"}
                  </Button>

                </form>
              )}
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
