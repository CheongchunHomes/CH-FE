"use client"

import { useEffect, useRef, useState } from "react"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { API_FEEDBACK_EVENT, type ApiFeedbackEventPayload } from "@/lib/api"

type FeedbackState = ApiFeedbackEventPayload | null

export function ApiFeedbackModal() {
  const [state, setState] = useState<FeedbackState>(null)
  const [isVisible, setIsVisible] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function clearCloseTimer() {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current)
        closeTimer.current = null
      }
    }

    function closeAfterDelay(delay = 2400) {
      closeTimer.current = setTimeout(() => {
        setIsVisible(false)
        closeTimer.current = setTimeout(() => setState(null), 300)
      }, delay)
    }

    function handleFeedbackEvent(event: Event) {
      const payload = (event as CustomEvent<ApiFeedbackEventPayload>).detail
      clearCloseTimer()
      setState(payload)
      requestAnimationFrame(() => setIsVisible(true))

      if (payload.kind === "error" || payload.status === "success" || payload.status === "failed") {
        closeAfterDelay(payload.kind === "error" ? 3200 : 2400)
      }
    }

    window.addEventListener(API_FEEDBACK_EVENT, handleFeedbackEvent)

    return () => {
      window.removeEventListener(API_FEEDBACK_EVENT, handleFeedbackEvent)
      clearCloseTimer()
    }
  }, [])

  if (!state) {
    return null
  }

  const isRetrying = state.kind === "retry" && state.status === "retrying"
  const isSuccess = state.kind === "retry" && state.status === "success"
  const isError = state.kind === "error" || state.status === "failed"
  const iconClassName = isSuccess ? "text-emerald-600" : isError ? "text-rose-600" : "text-sky-600"
  const message =
    state.kind === "retry" && state.status === "retrying"
      ? `${state.message} (${state.attempt}/${state.maxAttempts})`
      : state.message

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
