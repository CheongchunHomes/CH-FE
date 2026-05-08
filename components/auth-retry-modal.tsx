"use client"

import { useEffect, useRef, useState } from "react"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { AUTH_REFRESH_RETRY_EVENT, type AuthRefreshRetryEventPayload } from "@/lib/api/client"

type RetryState = AuthRefreshRetryEventPayload | null

export function AuthRetryModal() {
  const [state, setState] = useState<RetryState>(null)
  const [isVisible, setIsVisible] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function clearCloseTimer() {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current)
        closeTimer.current = null
      }
    }

    function handleRetryEvent(event: Event) {
      const payload = (event as CustomEvent<AuthRefreshRetryEventPayload>).detail
      clearCloseTimer()
      setState(payload)
      requestAnimationFrame(() => setIsVisible(true))

      if (payload.status === "success" || payload.status === "failed") {
        closeTimer.current = setTimeout(() => {
          setIsVisible(false)
          closeTimer.current = setTimeout(() => setState(null), 300)
        }, 2400)
      }
    }

    window.addEventListener(AUTH_REFRESH_RETRY_EVENT, handleRetryEvent)

    return () => {
      window.removeEventListener(AUTH_REFRESH_RETRY_EVENT, handleRetryEvent)
      clearCloseTimer()
    }
  }, [])

  if (!state) {
    return null
  }

  const isRetrying = state.status === "retrying"
  const isSuccess = state.status === "success"
  const iconClassName = isSuccess ? "text-emerald-600" : state.status === "failed" ? "text-rose-600" : "text-sky-600"
  const message =
    state.status === "retrying"
      ? `인증 갱신에 실패해 다시 시도 중입니다. (${state.attempt}/${state.maxAttempts})`
      : state.status === "success"
        ? "인증이 갱신되었습니다."
        : "인증 갱신에 실패했습니다. 다시 로그인해 주세요."

  return (
    <div
      className={[
        "pointer-events-none fixed left-1/2 top-4 z-[100] w-[min(92vw,420px)] -translate-x-1/2 transition-all duration-300 ease-out",
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0",
      ].join(" ")}
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-auto flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-xl">
        {isRetrying ? (
          <Loader2 className={`h-5 w-5 animate-spin ${iconClassName}`} aria-hidden="true" />
        ) : isSuccess ? (
          <CheckCircle2 className={`h-5 w-5 ${iconClassName}`} aria-hidden="true" />
        ) : (
          <AlertCircle className={`h-5 w-5 ${iconClassName}`} aria-hidden="true" />
        )}
        <p className="min-w-0 flex-1 font-medium leading-5">{message}</p>
      </div>
    </div>
  )
}
