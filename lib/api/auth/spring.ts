import { NextResponse } from "next/server"
import { REFRESH_MAX_ATTEMPTS, REFRESH_RETRY_AFTER_SECONDS } from "@/lib/api/auth/constants"
import type { SpringErrorPayload } from "@/lib/api/auth/types"

const API_BASE_URL = process.env.API_BASE_URL?.trim().replace(/\/+$/, "")

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
  options: { retryableFailure?: boolean } = {},
): Promise<Response | NextResponse> {
  const apiBaseUrl = requireApiBaseUrl()
  if (apiBaseUrl instanceof NextResponse) {
    return apiBaseUrl
  }

  try {
    return await fetch(`${apiBaseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

export async function getSpringWithAccess(path: string, accessToken: string): Promise<Response | null> {
  const apiBaseUrl = requireApiBaseUrl()
  if (apiBaseUrl instanceof NextResponse) {
    return null
  }

  return fetch(`${apiBaseUrl}${path}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  }).catch(() => null)
}
