import { NextResponse } from "next/server"
import { REFRESH_MAX_ATTEMPTS, REFRESH_RETRY_AFTER_SECONDS } from "@/lib/api/auth/constants"
import type { SpringErrorPayload } from "@/lib/api/auth/types"

const API_BASE_URL = process.env.API_BASE_URL?.trim().replace(/\/+$/, "")

type SpringJsonRequestOptions = {
  retryableFailure?: boolean
  userAgent?: string | null
}

type SpringAccessRequestOptions = {
  userAgent?: string | null
}

function setUserAgentHeader(headers: Headers, userAgent?: string | null) {
  const value = userAgent?.trim()
  if (value) {
    headers.set("User-Agent", value)
  }
}

export function requireApiBaseUrl(): string | NextResponse {
  if (!API_BASE_URL) {
    return NextResponse.json(
      { code: "AUTH_UPSTREAM_ERROR", message: "API_BASE_URL is not configured." },
      { status: 502 },
    )
  }

  return API_BASE_URL
}

export async function parseJsonPayload<T = SpringErrorPayload>(response: Response): Promise<T> {
  return (await response.json().catch(() => ({}))) as T
}

export async function postSpringJson(
  path: string,
  body: unknown,
  options: SpringJsonRequestOptions = {},
): Promise<Response | NextResponse> {
  const apiBaseUrl = requireApiBaseUrl()
  if (apiBaseUrl instanceof NextResponse) {
    return apiBaseUrl
  }

  const headers = new Headers({ "Content-Type": "application/json" })
  setUserAgentHeader(headers, options.userAgent)

  try {
    return await fetch(`${apiBaseUrl}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Spring request failed."
    if (options.retryableFailure) {
      return NextResponse.json(
        {
          code: "REFRESH_RETRYABLE",
          message,
          retryAfterSeconds: REFRESH_RETRY_AFTER_SECONDS,
          maxAttempts: REFRESH_MAX_ATTEMPTS,
        },
        { status: 503 },
      )
    }

    return NextResponse.json({ code: "AUTH_UPSTREAM_ERROR", message }, { status: 502 })
  }
}

export async function getSpringWithAccess(
  path: string,
  accessToken: string,
  options: SpringAccessRequestOptions = {},
): Promise<Response | null> {
  const apiBaseUrl = requireApiBaseUrl()
  if (apiBaseUrl instanceof NextResponse) {
    return null
  }

  const headers = new Headers({ Authorization: `Bearer ${accessToken}` })
  setUserAgentHeader(headers, options.userAgent)

  return fetch(`${apiBaseUrl}${path}`, {
    method: "GET",
    headers,
    cache: "no-store",
  }).catch(() => null)
}
