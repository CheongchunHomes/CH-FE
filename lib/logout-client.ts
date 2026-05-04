"use client"

import { clearAccessToken, post } from "@/lib/api"

type LogoutResponse = {
  success: boolean
}

type LogoutRouter = {
  push: (href: string) => void
  refresh: () => void
}

export async function logoutAndRedirect(router: LogoutRouter) {
  await post<LogoutResponse>("/api/auth/logout", undefined, {
    auth: false,
    retryOnUnauthorized: false,
  })
  clearAccessToken()
  router.push("/site")
  router.refresh()
}
