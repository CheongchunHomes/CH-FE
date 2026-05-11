"use client"

import { post } from "@/lib/api"

type LogoutRouter = {
  push: (href: string) => void
  refresh: () => void
}

export async function logoutAndRedirect(router: LogoutRouter) {
  await post("/api/auth/logout", undefined, {
    auth: false,
    retryOnUnauthorized: false,
  })
  // cookie 삭제는 BFF /api/auth/logout 핸들러가 담당한다.
  router.push("/site")
  router.refresh()
}
