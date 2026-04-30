import { NextResponse } from "next/server"

type ProxyMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

const API_BASE_URL = process.env.API_BASE_URL?.trim()
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
  if (!API_BASE_URL) {
    return null
  }

  const url = new URL(request.url)
  const backendPath = url.pathname.replace(/^\/api(?=\/|$)/, "") || "/"

  return `${API_BASE_URL}${backendPath}${url.search}`
}

function getForwardHeaders(request: Request) {
  const headers = new Headers()

  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value)
    }
  })

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
        const message = (payload as { message?: unknown }).message
        if (typeof message === "string" && message.trim()) {
          return message
        }
      }

      if (payload && typeof payload === "object" && "error" in payload) {
        const error = (payload as { error?: unknown }).error
        if (typeof error === "string" && error.trim()) {
          return error
        }
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
  console.error("[api/proxy]", {
    message,
    method: context.method,
    url: context.url,
    status: context.status,
  })
}

export function proxyRoute(method: ProxyMethod) {
  return async function handler(request: Request) {
    const backendUrl = getBackendUrl(request)

    if (!backendUrl) {
      logProxyError("API_BASE_URL is not configured.", {
        method,
        url: request.url,
        status: 500,
      })

      return NextResponse.json({ message: "API_BASE_URL is not configured." }, { status: 500 })
    }

    try {
      const response = await fetch(backendUrl, {
        method,
        headers: getForwardHeaders(request),
        body: method === "GET" ? undefined : await request.arrayBuffer(),
        cache: "no-store",
      })

      if (!response.ok) {
        logProxyError(await readErrorMessage(response), {
          method,
          url: backendUrl,
          status: response.status,
        })
      }

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: getResponseHeaders(response),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "API request failed."
      logProxyError(message, {
        method,
        url: backendUrl,
        status: 500,
      })

      return NextResponse.json({ message }, { status: 500 })
    }
  }
}

export const GET = proxyRoute("GET")
export const POST = proxyRoute("POST")
export const PUT = proxyRoute("PUT")
export const PATCH = proxyRoute("PATCH")
export const DELETE = proxyRoute("DELETE")
