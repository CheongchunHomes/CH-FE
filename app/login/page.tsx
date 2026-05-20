"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight } from "lucide-react"

import { post } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type LoginRequest = {
  email: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const { refresh } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email.trim() || !password.trim()) {
      setErrorMessage("이메일과 비밀번호를 입력해 주세요.")
      return
    }

    setIsSubmitting(true)
    setErrorMessage("")

    try {
      await post<never, LoginRequest>(
        "/api/auth/login",
        {
          email: email.trim(),
          password,
        },
        {
          auth: false,
          retryOnUnauthorized: false,
        },
      )

      const user = await refresh()
      router.push(user?.hasPersonalInfo === false ? "/personal" : "/site")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "로그인에 실패했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
        <Link href="/site" className="mx-auto mb-10 block w-fit" aria-label="메인으로 돌아가기">
          <Image src="/logo_transparent.png" alt="청춘홈즈" width={150} height={150} priority />
        </Link>
        <Card className="w-full border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">로그인</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="login-email">이메일</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">비밀번호</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="비밀번호"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              {errorMessage ? <p className="text-sm font-medium text-rose-600">{errorMessage}</p> : null}

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "로그인 중..." : "로그인"}
                <ChevronRight className="ml-2" size={16} />
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-600">
              계정이 없나요?{" "}
              <Link href="/signup" className="font-medium text-sky-700 hover:text-sky-800">
                회원가입
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
