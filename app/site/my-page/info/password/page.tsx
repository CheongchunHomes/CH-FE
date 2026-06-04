"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowLeft } from "lucide-react"

import { request } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type PasswordChangeRequest = {
  password: string
}

export default function MyPagePasswordPage() {
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setSuccessMessage("")
    setErrorMessage("")

    if (!password.trim() || !passwordConfirm.trim()) {
      setErrorMessage("새 비밀번호와 확인 비밀번호를 모두 입력해 주세요.")
      return
    }

    if (password !== passwordConfirm) {
      setErrorMessage("새 비밀번호가 일치하지 않습니다.")
      return
    }

    setIsSubmitting(true)

    try {
      await request<unknown, PasswordChangeRequest>("PATCH", "/api/users/password", {
        body: { password },
        suppressGlobalError: true,
      })
      setPassword("")
      setPasswordConfirm("")
      setSuccessMessage("비밀번호가 변경되었습니다.")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "비밀번호 변경에 실패했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-500">비밀번호 변경</h1>
      </div>

      <Card className="border-slate-200/80 bg-white shadow-sm">
        <CardHeader>
          <Button asChild variant="ghost" className="w-fit px-0 text-slate-600 hover:bg-transparent hover:text-slate-950">
            <Link href="/site/my-page/info">
              <ArrowLeft className="mr-2 h-4 w-4" />
              내 정보로 돌아가기
            </Link>
          </Button>
          <CardTitle className="text-base font-semibold text-slate-900">새 비밀번호 입력</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="new-password">새 비밀번호</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password-confirm">새 비밀번호 확인</Label>
              <Input
                id="new-password-confirm"
                type="password"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
              />
            </div>

            {successMessage ? <p className="text-sm font-medium text-blue-600">{successMessage}</p> : null}
            {errorMessage ? <p className="text-sm font-medium text-rose-600">{errorMessage}</p> : null}

            <Button type="submit" disabled={isSubmitting} className="rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
              {isSubmitting ? "변경 중..." : "비밀번호 변경"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
