"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { logoutAndRedirect } from "@/lib/logout-client"
import { getUnreadAlarmNotifications, markAlarmNotificationAsRead, type AlarmNotification } from "@/lib/alarm-notifications-api"

const navItems = [
  { label: "공지", href: "/site/announcements" },
  { label: "제도", href: "/site/policies" },
  { label: "대출", href: "/loan" },
  { label: "지도", href: "/site/map" },
]

export default function Navbar() {
  const router = useRouter()
  const { status, user, clear } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutErrorMessage, setLogoutErrorMessage] = useState("")
  const [isAlarmOpen, setIsAlarmOpen] = useState(false)
  const [alarms, setAlarms] = useState<AlarmNotification[]>([])
  const [alarmLoading, setAlarmLoading] = useState(false)
  const alarmPanelRef = useRef<HTMLDivElement | null>(null)

  const isAuthenticated = status === "authenticated" || status === "reauthRequired"

  async function refreshAlarms() {
    if (!isAuthenticated) {
      setAlarms([])
      return
    }

    setAlarmLoading(true)
    try {
      const unreadAlarms = await getUnreadAlarmNotifications()
      setAlarms(unreadAlarms)
    } catch {
      setAlarms([])
    } finally {
      setAlarmLoading(false)
    }
  }

  useEffect(() => {
    void refreshAlarms()
  }, [isAuthenticated, user?.id])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    const timer = window.setInterval(() => {
      void refreshAlarms()
    }, 30000)

    return () => window.clearInterval(timer)
  }, [isAuthenticated, user?.id])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!alarmPanelRef.current) {
        return
      }

      if (!alarmPanelRef.current.contains(event.target as Node)) {
        setIsAlarmOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [])

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

  async function handleAlarmClick(alarmNotificationId: number) {
    try {
      await markAlarmNotificationAsRead(alarmNotificationId)
    } catch {
      // 읽음 처리 실패는 조용히 무시하고 이동은 진행합니다.
    } finally {
      setIsAlarmOpen(false)
      await refreshAlarms()
      router.push("/site/my-page")
    }
  }

  return (
    <header className="mb-4 rounded-3xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <Link href="/site" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center">
            <Image src="/logo_only.png" alt="로고" width={40} height={40} className="h-10 w-10 object-contain" />
          </div>
          <div className="flex h-10 items-center">
            <Image src="/logo_text.png" alt="청년주택" width={100} height={30} className="h-8 object-contain" />
          </div>
        </Link>

        <nav className="hidden flex-1 items-center justify-end gap-6 text-sm font-medium text-slate-600 md:flex">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className="transition hover:text-slate-950">
              {item.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <Link href="/site/my-page" className="transition hover:text-slate-950">
              마이페이지
            </Link>
          ) : null}
        </nav>

        <div className="relative flex items-center gap-2" ref={alarmPanelRef}>
          <button
            type="button"
            className="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="notifications"
            onClick={() => setIsAlarmOpen((current) => !current)}
          >
            <Bell size={18} />
            {alarms.length > 0 ? <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" /> : null}
          </button>

          {isAlarmOpen ? (
            <div className="absolute right-0 top-12 z-20 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">알림</p>
                <p className="text-xs text-slate-500">{alarmLoading ? "불러오는 중" : `${alarms.length}개`}</p>
              </div>

              <div className="max-h-80 overflow-auto">
                {alarms.length > 0 ? (
                  alarms.map((alarm) => (
                    <button
                      key={alarm.alarmNotificationId}
                      type="button"
                      onClick={() => void handleAlarmClick(alarm.alarmNotificationId)}
                      className="block w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 last:border-b-0"
                    >
                      <p className="text-sm font-medium text-slate-900">{alarm.description}</p>
                      <p className="mt-1 text-xs text-slate-500">대출신청 상태를 확인하려면 클릭하세요.</p>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-slate-500">새 알림이 없습니다.</div>
                )}
              </div>
            </div>
          ) : null}

          {isAuthenticated ? (
            <>
              <Link href="/site/my-page" className="rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
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
