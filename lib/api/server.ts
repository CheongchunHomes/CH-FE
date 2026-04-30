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

export function proxyRoute(method: ProxyMethod) {
  return async function handler(request: Request) {
    const backendUrl = getBackendUrl(request)

    if (!backendUrl) {
      return NextResponse.json({ message: "API_BASE_URL is not configured." }, { status: 500 })
    }

    try {
      const response = await fetch(backendUrl, {
        method,
        headers: getForwardHeaders(request),
        body: method === "GET" ? undefined : await request.arrayBuffer(),
        cache: "no-store",
      })

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: getResponseHeaders(response),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "API request failed."
      return NextResponse.json({ message }, { status: 500 })
    }
  }
}

export const GET = proxyRoute("GET")
export const POST = proxyRoute("POST")
export const PUT = proxyRoute("PUT")
export const PATCH = proxyRoute("PATCH")
export const DELETE = proxyRoute("DELETE")
