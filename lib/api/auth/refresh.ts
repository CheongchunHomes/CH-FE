import { REFRESH_MAX_ATTEMPTS, REFRESH_RETRY_AFTER_SECONDS } from "@/lib/api/auth/constants"
import { parseJsonPayload, postSpringJson } from "@/lib/api/auth/spring"
import type { RefreshResult } from "@/lib/api/auth/types"

type RefreshAccessTokenOptions = {
  userAgent?: string | null
}

export async function refreshAccessToken(
  refreshToken: string,
  options: RefreshAccessTokenOptions = {},
): Promise<RefreshResult> {
  const springResponse = await postSpringJson(
    "/auth/refresh",
    { refreshToken },
    {
      retryableFailure: true,
      userAgent: options.userAgent,
    },
  )

  const payload = await parseJsonPayload<{ accessToken?: string; code?: string; message?: string }>(springResponse)

  if (springResponse.ok && payload.accessToken) {
    return { ok: true, accessToken: payload.accessToken }
  }

  if (springResponse.status === 401 && payload.code === "REAUTH_REQUIRED") {
    return { ok: false, code: "REAUTH_REQUIRED" }
  }

  if (springResponse.status === 401 && payload.code === "REFRESH_EXPIRED") {
    return { ok: false, code: "REFRESH_EXPIRED" }
  }

  if (springResponse.status === 401) {
    return { ok: false, code: "UNAUTHENTICATED" }
  }

  if (payload.code === "AUTH_UPSTREAM_ERROR") {
    return { ok: false, code: "AUTH_UPSTREAM_ERROR", message: payload.message }
  }

  if (springResponse.status >= 500 || payload.code === "REFRESH_RETRYABLE") {
    return {
      ok: false,
      code: "REFRESH_RETRYABLE",
      message: payload.message,
      retryAfterSeconds: REFRESH_RETRY_AFTER_SECONDS,
      maxAttempts: REFRESH_MAX_ATTEMPTS,
    }
  }

  return { ok: false, code: "AUTH_UPSTREAM_ERROR", message: payload.message }
}
