import { NextResponse } from "next/server"
import {
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  REFRESH_MAX_ATTEMPTS,
  REFRESH_RETRY_AFTER_SECONDS,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
} from "@/lib/api/auth/constants"
import { clearAccessCookie, clearRefreshCookie, makeAccessCookie, makeRefreshCookie } from "@/lib/api/auth/cookies"
import type { AuthFailureCode, AuthFailureResult, SpringErrorPayload } from "@/lib/api/auth/types"

type AuthFailureInput = AuthFailureCode | AuthFailureResult

function normalizeFailure(failure: AuthFailureInput): AuthFailureResult {
  if (typeof failure === "string") {
    return { ok: false, code: failure }
  }

  return failure
}

export function authUpstreamError(message = "Auth server request failed."): NextResponse {
  return NextResponse.json({ code: "AUTH_UPSTREAM_ERROR", message }, { status: 502 })
}

export function jsonWithClearedAuthCookies(payload: SpringErrorPayload, status: number): NextResponse {
  const response = NextResponse.json(payload, { status })
  response.headers.append("Set-Cookie", clearAccessCookie())
  response.headers.append("Set-Cookie", clearRefreshCookie())
  return response
}

export function refreshFailureResponse(failure: AuthFailureInput): NextResponse {
  const result = normalizeFailure(failure)

  if (result.code === "REAUTH_REQUIRED") {
    return NextResponse.json({ code: result.code }, { status: 401 })
  }

  if (result.code === "REFRESH_RETRYABLE") {
    return NextResponse.json(
      {
        code: result.code,
        message: result.message,
        retryAfterSeconds: result.retryAfterSeconds ?? REFRESH_RETRY_AFTER_SECONDS,
        maxAttempts: result.maxAttempts ?? REFRESH_MAX_ATTEMPTS,
      },
      { status: 503 },
    )
  }

  if (result.code === "AUTH_UPSTREAM_ERROR") {
    return authUpstreamError(result.message)
  }

  return jsonWithClearedAuthCookies({ code: result.code === "REFRESH_EXPIRED" ? result.code : "UNAUTHENTICATED" }, 401)
}

export function jsonWithAccessCookie(payload: unknown, accessToken: string, status = 200): NextResponse {
  const response = NextResponse.json(payload, { status })
  response.headers.append("Set-Cookie", makeAccessCookie(accessToken, ACCESS_TOKEN_MAX_AGE_SECONDS))
  return response
}

export function jsonWithAuthCookies(
  payload: unknown,
  tokens: { accessToken: string; refreshToken: string },
  status = 200,
): NextResponse {
  const response = jsonWithAccessCookie(payload, tokens.accessToken, status)
  response.headers.append("Set-Cookie", makeRefreshCookie(tokens.refreshToken, REFRESH_TOKEN_MAX_AGE_SECONDS))
  return response
}
