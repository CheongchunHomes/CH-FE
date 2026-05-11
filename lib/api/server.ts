import { NextResponse } from "next/server"
import { makeAccessCookie, readAccessToken, readRefreshToken } from "@/lib/api/auth/cookies"
import { ACCESS_TOKEN_MAX_AGE_SECONDS } from "@/lib/api/auth/constants"
import { refreshAccessToken } from "@/lib/api/auth/refresh"
import { apiRetryableResponse, refreshFailureResponse } from "@/lib/api/auth/responses"

type ProxyMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

const API_BASE_URL = process.env.API_BASE_URL?.trim().replace(/\/+$/, "")

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
])

function getBackendUrl(request: Request) {
  if (!API_BASE_URL) return null
  const url = new URL(request.url)
  const backendPath = url.pathname.replace(/^\/api(?=\/|$)/, "") || "/"
  return `${API_BASE_URL}${backendPath}${url.search}`
}

function getForwardHeaders(request: Request, accessToken?: string | null) {
  const headers = new Headers()
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase()) && key.toLowerCase() !== "cookie") {
      headers.set(key, value)
    }
  })
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`)
  }
  return headers
}

function getResponseHeaders(response: Response) {
  const headers = new Headers()
  response.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value)
    }
  })
  return headers
}

async function readErrorMessage(response: Response) {
  const contentType = response.headers.get("content-type") ?? ""
  try {
    if (contentType.includes("application/json")) {
      const payload = await response.clone().json()
      if (payload && typeof payload === "object" && "message" in payload) {
        const msg = (payload as { message?: unknown }).message
        if (typeof msg === "string" && msg.trim()) return msg
      }
      return JSON.stringify(payload)
    }
    const text = await response.clone().text()
    return text.trim() || response.statusText
  } catch {
    return response.statusText
  }
}

function logProxyError(message: string, context: { method: ProxyMethod; url: string; status?: number }) {
  console.error("[api/proxy]", { message, method: context.method, url: context.url, status: context.status })
}

export function proxyRoute(method: ProxyMethod) {
  return async function handler(request: Request) {
    const backendUrl = getBackendUrl(request)

    if (!backendUrl) {
      logProxyError("API_BASE_URL is not configured.", { method, url: request.url, status: 502 })
      return NextResponse.json(
        { code: "AUTH_UPSTREAM_ERROR", message: "API_BASE_URL is not configured." },
        { status: 502 },
      )
    }

    const accessToken = readAccessToken(request)
    const userAgent = request.headers.get("user-agent")
    const body = method === "GET" ? undefined : await request.arrayBuffer()

    const tryRequest = async (token: string | null) =>
      fetch(backendUrl, {
        method,
        headers: getForwardHeaders(request, token),
        body,
        cache: "no-store",
      })

    let response = await tryRequest(accessToken).catch((error) => {
      const message = error instanceof Error ? error.message : "API request failed."
      logProxyError(message, { method, url: backendUrl, status: 500 })
      return null
    })

    if (!response) {
      return apiRetryableResponse("백엔드 연결에 실패해 다시 시도 중입니다.")
    }

    // 401 -> refresh 후 원 요청 1회 재시도. refresh 일시 실패 재시도는 client wrapper가 담당한다.
    if (response.status === 401) {
      const refreshToken = readRefreshToken(request)

      if (!refreshToken) {
        return refreshFailureResponse("UNAUTHENTICATED")
      }

      const refreshResult = await refreshAccessToken(refreshToken, { userAgent })

      if (!refreshResult.ok) {
        return refreshFailureResponse(refreshResult)
      }

      // refresh 성공: 새 access token으로 원 요청 1회 재시도
      response = await tryRequest(refreshResult.accessToken).catch(() => null)

      if (!response) {
        return apiRetryableResponse("백엔드 연결에 실패해 다시 시도 중입니다.")
      }

      if (!response.ok) {
        logProxyError(await readErrorMessage(response), { method, url: backendUrl, status: response.status })
      }

      const retryResponse = new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: getResponseHeaders(response),
      })
      retryResponse.headers.append("Set-Cookie", makeAccessCookie(refreshResult.accessToken, ACCESS_TOKEN_MAX_AGE_SECONDS))
      return retryResponse
    }

    if (!response.ok) {
      logProxyError(await readErrorMessage(response), { method, url: backendUrl, status: response.status })
    }

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: getResponseHeaders(response),
    })
  }
}

export const GET = proxyRoute("GET")
export const POST = proxyRoute("POST")
export const PUT = proxyRoute("PUT")
export const PATCH = proxyRoute("PATCH")
export const DELETE = proxyRoute("DELETE")
