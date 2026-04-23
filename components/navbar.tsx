"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getStoredNickname } from "@/lib/auth-session"
import { logoutAndRedirect } from "@/lib/logout-client"
import { Bell, GraduationCap } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function Navbar() {
  const router = useRouter()
  const [nickname, setNickname] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutErrorMessage, setLogoutErrorMessage] = useState("")

  useEffect(() => {
    setNickname(getStoredNickname())
  }, [])

  async function handleLogout() {
    setIsLoggingOut(true)
    setLogoutErrorMessage("")

    try {
      await logoutAndRedirect(router)
      setNickname(null)
    } catch (error) {
      setLogoutErrorMessage(error instanceof Error ? error.message : "로그아웃에 실패했습니다.")
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="mb-4 rounded-3xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-sm">
            <GraduationCap size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">청년주거ON</p>
            <p className="text-xs text-slate-500">청년 주거 준비를 한 번에</p>
          </div>
        </div>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          {["청약", "대출", "집찾기", "계약", "가이드"].map((item) => (
            <a key={item} href="#" className="transition hover:text-slate-950">
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            className="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="notifications"
          >
            <Bell size={18} />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />
          </button>
          {nickname ? (
            <>
              <div className="rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
                {nickname}님 환영합니다
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={isLoggingOut}
                onClick={handleLogout}
                className="border-slate-300"
              >
                {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden rounded-full text-slate-600 md:inline-flex">
                <Link href="/login">로그인</Link>
              </Button>
              <Button asChild className="rounded-full bg-sky-600 text-white hover:bg-sky-700">
                <Link href="/signup">회원가입</Link>
              </Button>
            </>
          )}
        </div>
      </div>
      {logoutErrorMessage ? <p className="mt-3 text-sm font-medium text-rose-600">{logoutErrorMessage}</p> : null}
    </header>
  )
}
