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
  auth?: boolean
  retryOnUnauthorized?: boolean
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
const AUTH_PATHS = new Set(["/api/auth/login", "/api/auth/refresh", "/api/auth/logout", "/api/users/register"])

let accessToken: string | null = null
let refreshPromise: Promise<string> | null = null

type AccessTokenResponse = {
  accessToken?: unknown
}

export function getAccessToken() {
  return accessToken
}

export function setAccessToken(token: string) {
  const trimmed = token.trim()
  accessToken = trimmed || null
}

export function clearAccessToken() {
  accessToken = null
}

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

function getPathname(path: string) {
  try {
    return new URL(path, "http://localhost").pathname
  } catch {
    return path.startsWith("/") ? path : `/${path}`
  }
}

function isAuthPath(path: string) {
  return AUTH_PATHS.has(getPathname(path))
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
  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get("content-type") ?? ""

  if (contentType.includes(JSON_CONTENT_TYPE)) {
    const text = await response.text()
    return text.trim() ? JSON.parse(text) : null
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

function readAccessTokenPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new ApiError("Access token response is invalid.", 500, payload)
  }

  const token = (payload as AccessTokenResponse).accessToken
  if (typeof token !== "string" || !token.trim()) {
    throw new ApiError("Access token response is invalid.", 500, payload)
  }

  return token
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = request<AccessTokenResponse>("POST", "/api/auth/refresh", {
      auth: false,
      retryOnUnauthorized: false,
    })
      .then((payload) => {
        const token = readAccessTokenPayload(payload)
        setAccessToken(token)
        return token
      })
      .catch((error) => {
        clearAccessToken()
        throw error
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

async function sendRequest<TResponse, TBody = unknown>(
  method: ApiMethod,
  path: string,
  body: TBody | undefined,
  options: Omit<ApiRequestOptions<TBody>, "body"> = {},
) {
  const {
    headers,
    query,
    signal,
    cache,
    next,
    credentials = "include",
    auth = !isAuthPath(path),
  } = options

  const finalHeaders = buildHeaders(headers)

  if (auth && accessToken && !finalHeaders.has("Authorization")) {
    finalHeaders.set("Authorization", `Bearer ${accessToken}`)
  }

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

export async function request<TResponse, TBody = unknown>(
  method: ApiMethod,
  path: string,
  options: ApiRequestOptions<TBody> = {},
) {
  const {
    body,
    retryOnUnauthorized = !isAuthPath(path),
    ...requestOptions
  } = options

  try {
    return await sendRequest<TResponse, TBody>(method, path, body, requestOptions)
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401 || !retryOnUnauthorized) {
      throw error
    }

    await refreshAccessToken()
    return sendRequest<TResponse, TBody>(method, path, body, {
      ...requestOptions,
      retryOnUnauthorized: false,
    })
  }
}

// 일반 조회 요청은 여기만 import 해서 사용하면 됩니다.
// 예: get<User>("/users/me")
export function get<TResponse>(path: string, options: Omit<ApiRequestOptions<never>, "body"> = {}) {
  return request<TResponse>("GET", path, options)
}

// 일반 생성/로그인 요청은 여기만 import 해서 사용하면 됩니다.
// 예: post<LoginResponse, LoginRequest>("/api/auth/login", body)
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
