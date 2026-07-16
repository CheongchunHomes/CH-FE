import { NextResponse } from "next/server"
import { REFRESH_MAX_ATTEMPTS, REFRESH_RETRY_AFTER_SECONDS } from "@/lib/api/auth/constants"
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

export function apiRetryableResponse(message = "API request failed temporarily."): NextResponse {
  return NextResponse.json(
    {
      code: "API_RETRYABLE",
      message,
      retryAfterSeconds: REFRESH_RETRY_AFTER_SECONDS,
      maxAttempts: REFRESH_MAX_ATTEMPTS,
    },
    { status: 503 },
  )
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

  return jsonWithClearedAuthCookies({ code: result.code }, 401)
}

export function jsonWithAccessCookie(
  payload: unknown,
  accessToken: string,
  accessMaxAge: number,
  status = 200,
): NextResponse {
  const response = NextResponse.json(payload, { status })
  response.headers.append("Set-Cookie", makeAccessCookie(accessToken, accessMaxAge))
  return response
}

export function jsonWithAuthCookies(
  payload: unknown,
  tokens: { accessToken: string; accessMaxAge: number; refreshToken: string; refreshMaxAge: number },
  status = 200,
): NextResponse {
  const response = jsonWithAccessCookie(payload, tokens.accessToken, tokens.accessMaxAge, status)
  response.headers.append("Set-Cookie", makeRefreshCookie(tokens.refreshToken, tokens.refreshMaxAge))
  return response
}
