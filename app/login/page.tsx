"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ChevronRight, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react"

import { post } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

type LoginRequest = {
  email: string
  password: string
}

function GoogleBrandMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="h-5 w-5">
      <path
        fill="#4285F4"
        d="M44.5 24.5c0-1.5-.1-2.6-.4-3.8H24v7.1h11.7c-.2 1.8-1.4 4.6-4 6.4l-.1.2 5.7 4.4.4.1c3.3-3 5.2-7.4 5.2-12.4z"
      />
      <path
        fill="#34A853"
        d="M24 45c5 0 9.2-1.6 12.3-4.4l-5.9-4.6c-1.6 1.1-3.8 1.8-6.4 1.8-4.9 0-9-3.2-10.5-7.6l-.2.1-5.9 4.6-.1.2C10.2 41 16.6 45 24 45z"
      />
      <path
        fill="#FBBC05"
        d="M13.5 30.2c-.4-1.2-.7-2.4-.7-3.7s.3-2.5.7-3.7v-.2l-6-4.7-.2.1C5.6 20.7 5 22.7 5 26.5S5.6 32.3 7.3 34.8l6.2-4.6z"
      />
      <path
        fill="#EA4335"
        d="M24 15.2c3 0 5.1 1.3 6.3 2.4l4.6-4.5C33.2 10.2 29 8.5 24 8.5 16.6 8.5 10.2 12.5 7.1 18.5l6.3 4.7c1.5-4.4 5.6-8 10.6-8z"
      />
      <path
        fill="#fff"
        opacity=".92"
        d="M24 18.9c1.7 0 3.1.5 4.1 1.4l4.8-4.7C30.5 13.6 27.7 12.5 24 12.5c-5 0-9.1 3.1-10.6 7.5l4.9 3.8c.9-3.1 3.8-4.9 5.7-4.9z"
      />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const { refresh } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [infoMessage, setInfoMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (window.location.search.includes("registered=1")) {
      setInfoMessage("회원가입이 완료되었습니다. 로그인해 주세요.")
    }
  }, [])

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

      // BFF가 HttpOnly cookie를 발급한다. token은 body로 반환되지 않는다.
      // /api/auth/me 호출로 AuthContext를 갱신한 뒤 이동한다.
      await refresh()
      router.push("/site")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "로그인에 실패했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe_0%,_#f8fbff_38%,_#eef4ff_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8 md:px-6">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="flex flex-col justify-between rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur md:p-10">
            <div className="space-y-6">
              <Button asChild variant="ghost" className="-ml-3 w-fit rounded-full px-3 text-slate-600 hover:bg-slate-100">
                <Link href="/site">
                  <ArrowLeft className="mr-2" size={16} />
                  메인으로 돌아가기
                </Link>
              </Button>

              <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700">
                <Sparkles size={14} />
                청년홈즈 로그인
              </div>

              <div className="space-y-4">
                <h1 className="max-w-xl text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
                  로그인 한 번으로
                  <span className="block text-sky-600">청약과 대출을 바로 확인</span>
                </h1>
                <p className="max-w-lg text-base leading-7 text-slate-600 md:text-lg">
                  공공 청약 정보와 맞춤 대출 정보를 더 빠르게 확인할 수 있는 로그인 화면입니다.
                </p>
              </div>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {[
                { title: "빠른 진입", desc: "한 번의 로그인으로 시작" },
                { title: "보안 강화", desc: "로그인 상태만 안전하게 유지" },
                { title: "회원가입 연결", desc: "아래에서 바로 이동" },
              ].map((item) => (
                <div key={item.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <ShieldCheck size={16} className="text-sky-600" />
                    {item.title}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.12)] md:p-8">
            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="px-0">
                <CardTitle className="text-2xl tracking-tight text-slate-950">로그인</CardTitle>
                <CardDescription className="text-slate-500">
                  구글 로그인 또는 아이디와 비밀번호로 로그인할 수 있어요.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5 px-0 pb-0">
                <Button
                  type="button"
                  className="h-12 w-full justify-start rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50"
                  variant="outline"
                >
                  <span className="mr-3 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(226,232,240,1)]">
                    <GoogleBrandMark />
                  </span>
                  Google로 로그인
                </Button>

                <div className="flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">or</span>
                  <Separator className="flex-1" />
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="login-email">이메일</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="이메일을 입력해 주세요"
                        className="h-12 rounded-2xl pl-10"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">비밀번호</Label>
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="비밀번호를 입력해 주세요"
                        className="h-12 rounded-2xl pl-10"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                      />
                    </div>
                  </div>

                  {infoMessage ? <p className="text-sm font-medium text-sky-700">{infoMessage}</p> : null}
                  {errorMessage ? <p className="text-sm font-medium text-rose-600">{errorMessage}</p> : null}

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-slate-600">
                      <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
                      로그인 상태 유지
                    </label>
                    <Link href="/signup" className="font-medium text-sky-600 hover:text-sky-700">
                    비밀번호 찾기
                  </Link>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-2xl bg-sky-600 text-white hover:bg-sky-700"
                  >
                    {isSubmitting ? "로그인 중..." : "로그인"}
                    <ChevronRight className="ml-2" size={16} />
                  </Button>
                </form>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">아직 계정이 없으신가요?</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    회원가입을 마치면 청약 알림과 AI 질문 기능을 바로 사용할 수 있어요.
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    className="mt-4 h-11 rounded-2xl border-sky-200 bg-white text-sky-700 hover:bg-sky-50"
                  >
                    <Link href="/signup">
                      회원가입
                      <ChevronRight className="ml-2" size={16} />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  )
}
