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
  suppressGlobalError?: boolean
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

export type ApiFeedbackEventPayload =
  | ({ kind: "retry" } & AuthRefreshRetryEventPayload)
  | {
      kind: "error"
      status: "error"
      httpStatus: number
      message: string
      payload?: unknown
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
export const API_FEEDBACK_EVENT = "api-feedback"
export const AUTH_REFRESH_RETRY_EVENT = "auth-refresh-retry"
const DEFAULT_REFRESH_RETRY_AFTER_SECONDS = 60
const DEFAULT_REFRESH_MAX_ATTEMPTS = 3
const GLOBAL_ERROR_EXCLUDED_CODES = new Set(["REAUTH_REQUIRED", "REFRESH_EXPIRED", "UNAUTHENTICATED", "USER_DISABLED"])
const ERROR_MESSAGES_BY_CODE: Record<string, string> = {
  INVALID_CREDENTIALS: "이메일 또는 비밀번호가 일치하지 않습니다.",
  REAUTH_REQUIRED: "보안을 위해 비밀번호를 다시 입력해 주세요.",
  REFRESH_EXPIRED: "로그인 시간이 만료되었습니다. 다시 로그인해 주세요.",
  UNAUTHENTICATED: "로그인이 필요합니다.",
  USER_DISABLED: "비활성화된 계정입니다. 관리자에게 문의해 주세요.",
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

  const code = getPayloadCode(payload)
  if (code && ERROR_MESSAGES_BY_CODE[code]) {
    return ERROR_MESSAGES_BY_CODE[code]
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

function getRetryInfo(payload: unknown) {
  if (!isRecord(payload) || (payload.code !== "REFRESH_RETRYABLE" && payload.code !== "API_RETRYABLE")) {
    return null
  }

  const isRefreshRetry = payload.code === "REFRESH_RETRYABLE"

  return {
    code: payload.code,
    retryAfterSeconds: readPositiveNumber(payload.retryAfterSeconds, DEFAULT_REFRESH_RETRY_AFTER_SECONDS),
    maxAttempts: readPositiveNumber(payload.maxAttempts, DEFAULT_REFRESH_MAX_ATTEMPTS),
    retryingMessage:
      typeof payload.message === "string" && payload.message.trim()
        ? payload.message
        : isRefreshRetry
          ? "인증 갱신에 실패해 다시 시도 중입니다."
          : "요청 처리에 실패해 다시 시도 중입니다.",
    successMessage: isRefreshRetry ? "인증이 갱신되었습니다." : "요청이 완료되었습니다.",
    failedMessage: isRefreshRetry
      ? "인증 갱신에 실패했습니다. 다시 로그인해 주세요."
      : "요청 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.",
  }
}

function getPayloadCode(payload: unknown) {
  return isRecord(payload) && typeof payload.code === "string" ? payload.code : undefined
}

function dispatchAuthRefreshRetryEvent(payload: AuthRefreshRetryEventPayload) {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(new CustomEvent<ApiFeedbackEventPayload>(API_FEEDBACK_EVENT, { detail: { kind: "retry", ...payload } }))
  window.dispatchEvent(new CustomEvent<AuthRefreshRetryEventPayload>(AUTH_REFRESH_RETRY_EVENT, { detail: payload }))
}

function dispatchApiErrorFeedbackEvent(payload: ApiFeedbackEventPayload) {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(new CustomEvent<ApiFeedbackEventPayload>(API_FEEDBACK_EVENT, { detail: payload }))
}

function shouldDispatchGlobalError(status: number, payload: unknown, suppressGlobalError?: boolean) {
  if (suppressGlobalError || typeof window === "undefined") {
    return false
  }

  if (status === 401) {
    return false
  }

  const code = getPayloadCode(payload)
  return !code || !GLOBAL_ERROR_EXCLUDED_CODES.has(code)
}

function buildApiError(status: number, payload: unknown, fallback: string) {
  return new ApiError(resolveErrorMessage(payload, fallback), status, payload)
}

function throwApiError(status: number, payload: unknown, suppressGlobalError?: boolean): never {
  const error = buildApiError(status, payload, `Request failed with status ${status}.`)

  if (shouldDispatchGlobalError(status, payload, suppressGlobalError)) {
    dispatchApiErrorFeedbackEvent({
      kind: "error",
      status: "error",
      httpStatus: status,
      message: error.message,
      payload,
    })
  }

  throw error
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
    suppressGlobalError,
  } = options

  const finalHeaders = buildHeaders(headers)

  const hasJsonBody = shouldSerializeBody(body)

  if (hasJsonBody && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", JSON_CONTENT_TYPE)
  }

  const url = appendQuery(normalizeUrl(path), query)
  let retryAttempt = 0
  let retryStarted = false
  let retryInfo: ReturnType<typeof getRetryInfo> = null
  let lastRetryInfo: NonNullable<ReturnType<typeof getRetryInfo>> | null = null

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
          message: lastRetryInfo.successMessage,
        })
      }

      return payload as TResponse
    }

    retryInfo = getRetryInfo(payload)

    if (retryInfo) {
      if (typeof window === "undefined") {
        throw buildApiError(response.status, payload, `Request failed with status ${response.status}.`)
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
          message: retryInfo.retryingMessage,
        })
        await waitForRetry(retryInfo.retryAfterSeconds, signal)
        continue
      }

      const failedPayload = {
        ...(isRecord(payload) ? payload : {}),
        code: retryInfo.code === "REFRESH_RETRYABLE" ? "REFRESH_RETRY_FAILED" : "API_RETRY_FAILED",
      }

      dispatchAuthRefreshRetryEvent({
        status: "failed",
        attempt: retryAttempt,
        maxAttempts: retryInfo.maxAttempts,
        retryAfterSeconds: retryInfo.retryAfterSeconds,
        message: retryInfo.failedMessage,
      })

      throw new ApiError(retryInfo.failedMessage, response.status, failedPayload)
    }

    if (retryStarted && lastRetryInfo) {
      dispatchAuthRefreshRetryEvent({
        status: "failed",
        attempt: retryAttempt,
        maxAttempts: lastRetryInfo.maxAttempts,
        retryAfterSeconds: lastRetryInfo.retryAfterSeconds,
        message: lastRetryInfo.failedMessage,
      })
    }

    throwApiError(response.status, payload, suppressGlobalError)
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
