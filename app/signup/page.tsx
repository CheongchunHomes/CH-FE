"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ChevronRight, LockKeyhole, Sparkles, UserRound, ShieldCheck } from "lucide-react"

import { post } from "@/lib/api"
import { setStoredNickname } from "@/lib/auth-session"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type RegisterRequest = {
  email: string
  password: string
}

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const passwordMismatch = useMemo(() => {
    if (!password || !passwordConfirm) {
      return false
    }

    return password !== passwordConfirm
  }, [password, passwordConfirm])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email.trim() || !password.trim()) {
      setErrorMessage("이메일과 비밀번호를 입력해 주세요.")
      return
    }

    if (passwordMismatch) {
      setErrorMessage("비밀번호 확인이 일치하지 않습니다.")
      return
    }

    setIsSubmitting(true)
    setErrorMessage("")

    try {
      const nickname = await post<string, RegisterRequest>("/api/register", {
        email: email.trim(),
        password,
      })

      setStoredNickname(nickname)
      router.push("/site")
      router.refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "회원가입에 실패했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#e0f2fe_0%,_#f8fbff_40%,_#eef4ff_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8 md:px-6">
        <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur md:p-10">
            <div className="space-y-6">
              <Button asChild variant="ghost" className="-ml-3 w-fit rounded-full px-3 text-slate-600 hover:bg-slate-100">
                <Link href="/login">
                  <ArrowLeft className="mr-2" size={16} />
                  로그인으로 돌아가기
                </Link>
              </Button>

              <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700">
                <Sparkles size={14} />
                청년주거ON 회원가입
              </div>

              <div className="space-y-4">
                <h1 className="max-w-xl text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
                  계정 하나로
                  <span className="block text-sky-600">청약과 대출을 바로 시작</span>
                </h1>
                <p className="max-w-lg text-base leading-7 text-slate-600 md:text-lg">
                  아이디와 비밀번호만 있으면 청약 알림과 맞춤 정보를 더 편하게 받을 수 있게 구성했어요.
                </p>
              </div>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {[
                "맞춤 청약 알림",
                "대출 가능 금액 확인",
                "계약 준비 체크리스트",
                "AI 질문 기록 저장",
              ].map((text) => (
                <div key={text} className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <ShieldCheck className="text-sky-600" size={18} />
                  <span className="text-sm font-medium text-slate-800">{text}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.12)] md:p-8">
            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="px-0">
                <CardTitle className="text-2xl tracking-tight text-slate-950">회원가입</CardTitle>
                <CardDescription className="text-slate-500">
                  아이디와 비밀번호만 입력해서 간단하게 계정을 만들어보세요.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5 px-0 pb-0">
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">이메일</Label>
                    <div className="relative">
                      <UserRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="로그인에 사용할 이메일"
                        className="h-12 rounded-2xl pl-10"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">비밀번호</Label>
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="비밀번호"
                        className="h-12 rounded-2xl pl-10"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                      />
                    </div>
                    <p className="text-xs text-slate-500">비밀번호는 입력 중에도 보이지 않도록 설정했어요.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password-confirm">비밀번호 확인</Label>
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <Input
                        id="signup-password-confirm"
                        type="password"
                        placeholder="비밀번호를 한 번 더 입력"
                        className="h-12 rounded-2xl pl-10"
                        value={passwordConfirm}
                        onChange={(event) => setPasswordConfirm(event.target.value)}
                      />
                    </div>
                    {passwordMismatch ? <p className="text-sm font-medium text-rose-600">비밀번호가 일치하지 않습니다.</p> : null}
                  </div>

                  <label className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span>서비스 이용약관과 개인정보 처리방침에 동의합니다.</span>
                  </label>

                  {errorMessage ? <p className="text-sm font-medium text-rose-600">{errorMessage}</p> : null}

                  <Button
                    type="submit"
                    disabled={isSubmitting || passwordMismatch}
                    className="h-12 w-full rounded-2xl bg-sky-600 text-white hover:bg-sky-700"
                  >
                    {isSubmitting ? "회원가입 중..." : "회원가입"}
                    <ChevronRight className="ml-2" size={16} />
                  </Button>
                </form>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">이미 계정이 있나요?</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    회원가입을 마치면 로그인 화면으로 바로 이동할 수 있어요.
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    className="mt-4 h-11 rounded-2xl border-sky-200 bg-white text-sky-700 hover:bg-sky-50"
                  >
                    <Link href="/login">
                      로그인
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
