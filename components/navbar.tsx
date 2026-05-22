"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Bell } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { logoutAndRedirect } from "@/lib/logout-client"
import { Button } from "@/components/ui/button"
import { getPageSampleHref } from "@/lib/page-samples"

const navItems = [
  { label: "공고", href: getPageSampleHref("announcements") },
  { label: "제도", href: getPageSampleHref("policies")},
  { label: "대출", href: "/loan" },
  { label: "지도", href: getPageSampleHref("rent") },
]

export default function Navbar() {
  const router = useRouter()
  const { status, user, clear } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutErrorMessage, setLogoutErrorMessage] = useState("")

  const isAuthenticated = status === "authenticated" || status === "reauthRequired"

  async function handleLogout() {
    setIsLoggingOut(true)
    setLogoutErrorMessage("")

    try {
      await logoutAndRedirect(router)
      clear()
    } catch (error) {
      setLogoutErrorMessage(error instanceof Error ? error.message : "로그아웃에 실패했습니다.")
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="mb-4 rounded-3xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <Link href="/site" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center">
            <Image src="/logo_only.png" alt="" width={40} height={40} className="h-10 w-10 object-contain" />
          </div>
          <div className="flex h-10 items-center">
            <Image src="/logo_text.png" alt="청춘홈즈" width={100} height={30} className="h-8 object-contain" />
          </div>
        </Link>

        <nav className="hidden flex-1 items-center justify-end gap-6 text-sm font-medium text-slate-600 md:flex">
          {navItems.map((item) => {
            if (item.label === "공고") {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => router.push(`/site/announcements?reset=${Date.now()}`)}
                  className="transition hover:text-slate-950"
                >
                  {item.label}
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className="transition hover:text-slate-950"
              >
                {item.label}
              </Link>
            );
          })}
         {isAuthenticated ? (
            <Link href={getPageSampleHref("my-page")} className="transition hover:text-slate-950">
              마이페이지
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          <button
            className="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="notifications"
          >
            <Bell size={18} />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />
          </button>
          {isAuthenticated ? (
            <>
              <Link
                href={getPageSampleHref("my-page")}
                className="rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700"
              >
                {user?.nickname ?? "마이페이지"}
              </Link>
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
              <Button asChild variant="ghost" className="rounded-full text-slate-600">
                <Link href="/signup">회원가입</Link>
              </Button>
              <Button asChild className="hidden rounded-full bg-sky-600 text-white hover:bg-sky-700 md:inline-flex">
                <Link href="/login">로그인</Link>
              </Button>
            </>
          )}
        </div>
      </div>
      {logoutErrorMessage ? <p className="mt-3 text-sm font-medium text-rose-600">{logoutErrorMessage}</p> : null}
    </header>
  )
}
