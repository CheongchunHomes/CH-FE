"use client"

import Link from "next/link"
import Image from "next/image"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight } from "lucide-react"

import { get, post } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type RegisterRequest = {
  email: string
  nickname: string
  password: string
}

type LoginRequest = {
  email: string
  password: string
}

type NicknameCheckResponse = {
  available?: boolean
  isAvailable?: boolean
  duplicated?: boolean
  duplicate?: boolean
}

type NicknameStatus = "idle" | "checking" | "available" | "unavailable"

function isNicknameAvailable(response: NicknameCheckResponse) {
  if (typeof response.available === "boolean") return response.available
  if (typeof response.isAvailable === "boolean") return response.isAvailable
  if (typeof response.duplicated === "boolean") return !response.duplicated
  if (typeof response.duplicate === "boolean") return !response.duplicate
  return true
}

export default function SignupPage() {
  const router = useRouter()
  const { refresh } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [nickname, setNickname] = useState("")
  const [nicknameStatus, setNicknameStatus] = useState<NicknameStatus>("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const passwordMismatch = useMemo(() => {
    if (!password || !passwordConfirm) {
      return false
    }

    return password !== passwordConfirm
  }, [password, passwordConfirm])

  async function handleNicknameCheck() {
    const value = nickname.trim()

    if (!value) {
      setErrorMessage("닉네임을 입력해 주세요.")
      return
    }

    setNicknameStatus("checking")
    setErrorMessage("")

    try {
      const response = await get<NicknameCheckResponse>("/api/users/nickname/check", {
        query: { nickname: value },
        auth: false,
        retryOnUnauthorized: false,
      })

      setNicknameStatus(isNicknameAvailable(response) ? "available" : "unavailable")
    } catch (error) {
      setNicknameStatus("unavailable")
      setErrorMessage(error instanceof Error ? error.message : "닉네임 중복 확인에 실패했습니다.")
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email.trim() || !password.trim() || !passwordConfirm.trim() || !nickname.trim()) {
      setErrorMessage("이메일, 비밀번호, 닉네임을 모두 입력해 주세요.")
      return
    }

    if (passwordMismatch) {
      setErrorMessage("비밀번호 확인이 일치하지 않습니다.")
      return
    }

    if (nicknameStatus !== "available") {
      setErrorMessage("닉네임 중복 확인을 완료해 주세요.")
      return
    }

    setIsSubmitting(true)
    setErrorMessage("")

    try {
      const trimmedEmail = email.trim()

      await post<unknown, RegisterRequest>(
        "/api/users/register",
        {
          email: trimmedEmail,
          nickname: nickname.trim(),
          password,
        },
        {
          auth: false,
          retryOnUnauthorized: false,
        },
      )

      await post<never, LoginRequest>(
        "/api/auth/login",
        {
          email: trimmedEmail,
          password,
        },
        {
          auth: false,
          retryOnUnauthorized: false,
        },
      )

      await refresh()
      router.push("/personal")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "회원가입에 실패했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
        <Link href="/site" className="mx-auto mb-10 block w-fit " aria-label="메인으로 돌아가기">
          <Image src="/logo_transparent.png" alt="청춘홈즈" width={150} height={150} priority />
        </Link>
        <Card className="w-full border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">회원가입</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="signup-email">이메일</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">비밀번호</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="비밀번호"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password-confirm">비밀번호 확인</Label>
                <Input
                  id="signup-password-confirm"
                  type="password"
                  placeholder="비밀번호 확인"
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                />
                {passwordMismatch ? <p className="text-sm font-medium text-rose-600">비밀번호가 다릅니다.</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-nickname">닉네임</Label>
                <div className="flex gap-2">
                  <Input
                    id="signup-nickname"
                    placeholder="닉네임"
                    value={nickname}
                    onChange={(event) => {
                      setNickname(event.target.value)
                      setNicknameStatus("idle")
                    }}
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
                  <p className="text-sm font-medium text-sky-700">사용 가능한 닉네임입니다.</p>
                ) : null}
                {nicknameStatus === "unavailable" ? (
                  <p className="text-sm font-medium text-rose-600">사용할 수 없는 닉네임입니다.</p>
                ) : null}
              </div>

              {errorMessage ? <p className="text-sm font-medium text-rose-600">{errorMessage}</p> : null}

              <Button type="submit" disabled={isSubmitting || passwordMismatch} className="w-full">
                {isSubmitting ? "회원가입 중..." : "회원가입"}
                <ChevronRight className="ml-2" size={16} />
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-600">
              이미 계정이 있나요?{" "}
              <Link href="/login" className="font-medium text-sky-700 hover:text-sky-800">
                로그인
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
