"use client"

import { clearStoredNickname } from "@/lib/auth-session"
import { post } from "@/lib/api"

type LogoutResponse = {
  success: boolean
}

type LogoutRouter = {
  push: (href: string) => void
  refresh: () => void
}

export async function logoutAndRedirect(router: LogoutRouter) {
  await post<LogoutResponse>("/api/logout")
  clearStoredNickname()
  router.push("/site")
  router.refresh()
}
