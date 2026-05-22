"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight } from "lucide-react"

import { post } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { logoutAndRedirect } from "@/lib/logout-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type PersonalInfoRequest = {
  realName: string
  phone: string
  address: string
}

export default function PersonalPage() {
  const router = useRouter()
  const { status, user, refresh, clear } = useAuth()
  const [realName, setRealName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    }

    if (status === "authenticated" && user?.hasPersonalInfo === true) {
      router.replace("/site")
    }
  }, [router, status, user?.hasPersonalInfo])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!realName.trim() || !phone.trim() || !address.trim()) {
      setErrorMessage("본명, 연락처, 주소를 모두 입력해 주세요.")
      return
    }

    setIsSubmitting(true)
    setErrorMessage("")

    try {
      await post<unknown, PersonalInfoRequest>("/api/users/personal", {
        realName: realName.trim(),
        phone: phone.trim(),
        address: address.trim(),
      })

      await refresh()
      router.push("/site")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "개인정보 저장에 실패했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true)
    setErrorMessage("")

    try {
      await logoutAndRedirect(router)
      clear()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "로그아웃에 실패했습니다.")
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (status === "loading" || status === "unauthenticated" || (status === "authenticated" && user?.hasPersonalInfo === true)) {
    return null
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4 py-8">
        <Card className="w-full border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">개인정보 입력</CardTitle>
            <CardDescription>서비스 이용에 필요한 정보를 입력해 주세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="personal-real-name">본명</Label>
                <Input
                  id="personal-real-name"
                  placeholder="본명"
                  value={realName}
                  onChange={(event) => setRealName(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="personal-phone">연락처</Label>
                <Input
                  id="personal-phone"
                  type="tel"
                  placeholder="010-0000-0000"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="personal-address">주소</Label>
                <Input
                  id="personal-address"
                  placeholder="도로명 주소"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                />
              </div>

              {errorMessage ? <p className="text-sm font-medium text-rose-600">{errorMessage}</p> : null}

              <Button type="submit" disabled={isSubmitting || status !== "authenticated"} className="w-full">
                {isSubmitting ? "저장 중..." : "저장하고 시작하기"}
                <ChevronRight className="ml-2" size={16} />
              </Button>
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleLogout}
                className="block w-full text-center text-sm font-medium text-slate-500 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
