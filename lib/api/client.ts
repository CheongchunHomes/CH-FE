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
  /** @deprecated cookie 기반 인증으로 전환됨. 옵션은 호환성을 위해 유지하나 동작에 영향 없음. */
  auth?: boolean
  /** @deprecated cookie 기반 인증으로 전환됨. 옵션은 호환성을 위해 유지하나 동작에 영향 없음. */
  retryOnUnauthorized?: boolean
}

export type ApiErrorPayload = {
  message?: string
  code?: string
  retryAfterSeconds?: number
  maxAttempts?: number
  [key: string]: unknown
}

export type AuthRefreshRetryEventPayload = {
  status: "retrying" | "success" | "failed"
  attempt: number
  maxAttempts: number
  retryAfterSeconds: number
  message: string
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
export const AUTH_REFRESH_RETRY_EVENT = "auth-refresh-retry"
const DEFAULT_REFRESH_RETRY_AFTER_SECONDS = 60
const DEFAULT_REFRESH_MAX_ATTEMPTS = 3

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object"
}

function readPositiveNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback
}

function getRefreshRetryInfo(payload: unknown) {
  if (!isRecord(payload) || payload.code !== "REFRESH_RETRYABLE") {
    return null
  }

  return {
    retryAfterSeconds: readPositiveNumber(payload.retryAfterSeconds, DEFAULT_REFRESH_RETRY_AFTER_SECONDS),
    maxAttempts: readPositiveNumber(payload.maxAttempts, DEFAULT_REFRESH_MAX_ATTEMPTS),
    message: typeof payload.message === "string" && payload.message.trim() ? payload.message : "Refresh failed temporarily.",
  }
}

function dispatchAuthRefreshRetryEvent(payload: AuthRefreshRetryEventPayload) {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(new CustomEvent<AuthRefreshRetryEventPayload>(AUTH_REFRESH_RETRY_EVENT, { detail: payload }))
}

function waitForRetry(seconds: number, signal?: AbortSignal) {
  if (signal?.aborted) {
    return Promise.reject(new DOMException("The operation was aborted.", "AbortError"))
  }

  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(resolve, seconds * 1000)

    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timeout)
        reject(new DOMException("The operation was aborted.", "AbortError"))
      },
      { once: true },
    )
  })
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
  } = options

  const finalHeaders = buildHeaders(headers)

  const hasJsonBody = shouldSerializeBody(body)

  if (hasJsonBody && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", JSON_CONTENT_TYPE)
  }

  const url = appendQuery(normalizeUrl(path), query)
  let retryAttempt = 0
  let retryStarted = false
  let retryInfo: ReturnType<typeof getRefreshRetryInfo> = null
  let lastRetryInfo: NonNullable<ReturnType<typeof getRefreshRetryInfo>> | null = null

  while (true) {
    const response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body instanceof FormData ? body : hasJsonBody ? JSON.stringify(body) : undefined,
      signal,
      cache,
      next,
      credentials,
    })

    const payload = await parseResponsePayload(response)

    if (response.ok) {
      if (retryStarted && lastRetryInfo) {
        dispatchAuthRefreshRetryEvent({
          status: "success",
          attempt: retryAttempt,
          maxAttempts: lastRetryInfo.maxAttempts,
          retryAfterSeconds: lastRetryInfo.retryAfterSeconds,
          message: "인증이 갱신되었습니다.",
        })
      }

      return payload as TResponse
    }

    retryInfo = getRefreshRetryInfo(payload)

    if (retryInfo) {
      if (typeof window === "undefined") {
        throw new ApiError(resolveErrorMessage(payload, `Request failed with status ${response.status}.`), response.status, payload)
      }

      lastRetryInfo = retryInfo

      if (retryAttempt < retryInfo.maxAttempts) {
        retryAttempt += 1
        retryStarted = true
        dispatchAuthRefreshRetryEvent({
          status: "retrying",
          attempt: retryAttempt,
          maxAttempts: retryInfo.maxAttempts,
          retryAfterSeconds: retryInfo.retryAfterSeconds,
          message: "인증 갱신에 실패해 다시 시도 중입니다.",
        })
        await waitForRetry(retryInfo.retryAfterSeconds, signal)
        continue
      }

      const failedPayload = {
        ...(isRecord(payload) ? payload : {}),
        code: "REFRESH_RETRY_FAILED",
      }

      dispatchAuthRefreshRetryEvent({
        status: "failed",
        attempt: retryAttempt,
        maxAttempts: retryInfo.maxAttempts,
        retryAfterSeconds: retryInfo.retryAfterSeconds,
        message: "인증 갱신에 실패했습니다. 다시 로그인해 주세요.",
      })

      throw new ApiError("인증 갱신에 실패했습니다. 다시 로그인해 주세요.", response.status, failedPayload)
    }

    if (retryStarted && lastRetryInfo) {
      dispatchAuthRefreshRetryEvent({
        status: "failed",
        attempt: retryAttempt,
        maxAttempts: lastRetryInfo.maxAttempts,
        retryAfterSeconds: lastRetryInfo.retryAfterSeconds,
        message: "인증 갱신에 실패했습니다. 다시 로그인해 주세요.",
      })
    }

    throw new ApiError(resolveErrorMessage(payload, `Request failed with status ${response.status}.`), response.status, payload)
  }
}

export async function request<TResponse, TBody = unknown>(
  method: ApiMethod,
  path: string,
  options: ApiRequestOptions<TBody> = {},
) {
  const { body, auth: _auth, retryOnUnauthorized: _retry, ...requestOptions } = options
  return sendRequest<TResponse, TBody>(method, path, body, requestOptions)
}

export function get<TResponse>(path: string, options: Omit<ApiRequestOptions<never>, "body"> = {}) {
  return request<TResponse>("GET", path, options)
}

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
