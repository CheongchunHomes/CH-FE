export type SpringErrorPayload = {
  code?: string
  message?: string
  retryAfterSeconds?: number
  maxAttempts?: number
  [key: string]: unknown
}

export type AuthFailureCode =
  | "REAUTH_REQUIRED"
  | "REFRESH_EXPIRED"
  | "UNAUTHENTICATED"
  | "REFRESH_RETRYABLE"
  | "AUTH_UPSTREAM_ERROR"

export type AuthFailureResult = {
  ok: false
  code: AuthFailureCode
  message?: string
  retryAfterSeconds?: number
  maxAttempts?: number
}

export type RefreshResult = { ok: true; accessToken: string } | AuthFailureResult
