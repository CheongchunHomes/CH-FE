"use client"

import { useState } from "react"
import { LockKeyhole } from "lucide-react"
import { ApiError, post } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ReauthResponse = { ok: boolean }

export function ReauthDialog() {
  const { refresh } = useAuth()
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!password.trim()) {
      setErrorMessage("비밀번호를 입력해 주세요.")
      return
    }

    setIsSubmitting(true)
    setErrorMessage("")

    try {
      await post<ReauthResponse>("/api/auth/reauth", { password }, {
        auth: false,
        retryOnUnauthorized: false,
      })
      await refresh()
    } catch (error) {
      const code =
        error instanceof ApiError &&
        error.payload &&
        typeof error.payload === "object" &&
        "code" in error.payload
          ? (error.payload as { code?: string }).code
          : undefined

      if (code === "INVALID_CREDENTIALS") {
        setErrorMessage("비밀번호가 일치하지 않습니다.")
        return
      }

      setErrorMessage(error instanceof Error ? error.message : "재인증에 실패했습니다.")
      await refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50">
            <LockKeyhole size={22} className="text-sky-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">재인증이 필요합니다</h2>
          <p className="mt-1 text-sm text-slate-500">
            보안을 위해 비밀번호를 다시 입력해 주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reauth-password">비밀번호</Label>
            <div className="relative">
              <LockKeyhole
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <Input
                id="reauth-password"
                type="password"
                placeholder="비밀번호를 입력해 주세요"
                className="h-12 rounded-2xl pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {errorMessage ? (
            <p className="text-sm font-medium text-rose-600">{errorMessage}</p>
          ) : null}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full rounded-2xl bg-sky-600 text-white hover:bg-sky-700"
          >
            {isSubmitting ? "확인 중..." : "확인"}
          </Button>
        </form>
      </div>
    </div>
  )
}
