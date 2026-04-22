type Primitive = string | number | boolean
type QueryValue = Primitive | null | undefined
type QueryParams = Record<string, QueryValue>

export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export type ApiRequestOptions<TBody = unknown> = {
  body?: TBody
  headers?: HeadersInit
  query?: QueryParams
  signal?: AbortSignal
  cache?: RequestCache
  next?: NextFetchRequestConfig
  credentials?: RequestCredentials
}

export type ApiErrorPayload = {
  message?: string
  [key: string]: unknown
}

export class ApiError extends Error {
  status: number
  payload: unknown

  constructor(message: string, status: number, payload?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.payload = payload
  }
}

const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? ""
const JSON_CONTENT_TYPE = "application/json"

function isAbsoluteUrl(url: string) {
  return /^https?:\/\//i.test(url)
}

function normalizeUrl(path: string) {
  if (isAbsoluteUrl(path)) {
    return path
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${DEFAULT_BASE_URL}${normalizedPath}`
}

function appendQuery(url: string, query?: QueryParams) {
  if (!query) {
    return url
  }

  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue
    }

    searchParams.set(key, String(value))
  }

  const queryString = searchParams.toString()
  if (!queryString) {
    return url
  }

  return `${url}${url.includes("?") ? "&" : "?"}${queryString}`
}

function shouldSerializeBody(body: unknown) {
  return body !== undefined && body !== null && !(body instanceof FormData)
}

async function parseResponsePayload(response: Response) {
  const contentType = response.headers.get("content-type") ?? ""

  if (contentType.includes(JSON_CONTENT_TYPE)) {
    return response.json()
  }

  if (contentType.startsWith("text/")) {
    return response.text()
  }

  return null
}

function resolveErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === "string" && payload.trim()) {
    return payload
  }

  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as ApiErrorPayload).message
    if (typeof message === "string" && message.trim()) {
      return message
    }
  }

  return fallback
}

function buildHeaders(headers?: HeadersInit) {
  return new Headers(headers)
}

export async function request<TResponse, TBody = unknown>(
  method: ApiMethod,
  path: string,
  options: ApiRequestOptions<TBody> = {},
) {
  const {
    body,
    headers,
    query,
    signal,
    cache,
    next,
    credentials = "include",
  } = options

  const finalHeaders = buildHeaders(headers)

  // httpOnly cookie 기반 인증을 전제로 하므로 토큰을 직접 읽지 않고
  // 브라우저가 쿠키를 자동 전송하도록 credentials: "include"를 기본값으로 둡니다.
  const hasJsonBody = shouldSerializeBody(body)

  if (hasJsonBody && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", JSON_CONTENT_TYPE)
  }

  const response = await fetch(appendQuery(normalizeUrl(path), query), {
    method,
    headers: finalHeaders,
    body: body instanceof FormData ? body : hasJsonBody ? JSON.stringify(body) : undefined,
    signal,
    cache,
    next,
    credentials,
  })

  const payload = await parseResponsePayload(response)

  if (!response.ok) {
    throw new ApiError(resolveErrorMessage(payload, `Request failed with status ${response.status}.`), response.status, payload)
  }

  return payload as TResponse
}

// 일반 조회 요청은 여기만 import 해서 사용하면 됩니다.
// 예: get<User>("/users/me")
export function get<TResponse>(path: string, options: Omit<ApiRequestOptions<never>, "body"> = {}) {
  return request<TResponse>("GET", path, options)
}

// 일반 생성/로그인 요청은 여기만 import 해서 사용하면 됩니다.
// 예: post<LoginResponse, LoginRequest>("/auth/login", body)
export function post<TResponse, TBody = unknown>(
  path: string,
  body?: TBody,
  options: Omit<ApiRequestOptions<TBody>, "body"> = {},
) {
  return request<TResponse, TBody>("POST", path, {
    ...options,
    body,
  })
}
