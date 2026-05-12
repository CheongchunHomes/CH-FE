import { NextResponse } from "next/server"
import {
  clearAccessCookie,
  clearRefreshCookie,
  makeRefreshCookie,
  maxAgeFromExpiry,
  readAccessToken,
  readRefreshToken,
} from "@/lib/api/auth/cookies"
import { readJsonBody, validateAuthOrigin } from "@/lib/api/auth/request"
import { refreshAccessToken } from "@/lib/api/auth/refresh"
import {
  apiRetryableResponse,
  jsonWithClearedAuthCookies,
  jsonWithAccessCookie,
  jsonWithAuthCookies,
  refreshFailureResponse,
} from "@/lib/api/auth/responses"
import { getSpringWithAccess, parseJsonPayload, postSpringJson, requireApiBaseUrl } from "@/lib/api/auth/spring"

type SpringLoginResponse = {
  accessToken?: string
  accessExpiresAt?: string
  refreshToken?: string
  refreshExpiresAt?: string
  [key: string]: unknown
}

type SpringReauthResponse = {
  accessToken?: string
  accessExpiresAt?: string
  refreshExpiresAt?: string
  [key: string]: unknown
}

export async function login(request: Request) {
  const originError = validateAuthOrigin(request)
  if (originError) return originError

  const userAgent = request.headers.get("user-agent")
  const body = await readJsonBody(request)
  if (body instanceof NextResponse) return body

  const springResponse = await postSpringJson("/auth/login", body, { userAgent })
  if (springResponse instanceof NextResponse) return springResponse

  if (!springResponse.ok) {
    const payload = await parseJsonPayload(springResponse)
    return NextResponse.json(payload, { status: springResponse.status })
  }

  const data = await parseJsonPayload<SpringLoginResponse>(springResponse)

  if (!data.accessToken || !data.accessExpiresAt || !data.refreshToken || !data.refreshExpiresAt) {
    return NextResponse.json({ message: "Unexpected response from auth server." }, { status: 502 })
  }

  const accessMaxAge = maxAgeFromExpiry(data.accessExpiresAt)
  const refreshMaxAge = maxAgeFromExpiry(data.refreshExpiresAt)
  if (!Number.isFinite(accessMaxAge) || !Number.isFinite(refreshMaxAge)) {
    return NextResponse.json({ message: "Unexpected response from auth server." }, { status: 502 })
  }

  return jsonWithAuthCookies(
    { ok: true },
    { accessToken: data.accessToken, accessMaxAge, refreshToken: data.refreshToken, refreshMaxAge },
  )
}

export async function refresh(request: Request) {
  const originError = validateAuthOrigin(request)
  if (originError) return originError

  const userAgent = request.headers.get("user-agent")
  const refreshToken = readRefreshToken(request)

  if (!refreshToken) {
    return refreshFailureResponse("UNAUTHENTICATED")
  }

  const refreshResult = await refreshAccessToken(refreshToken, { userAgent })
  if (!refreshResult.ok) {
    return refreshFailureResponse(refreshResult)
  }

  return jsonWithAccessCookie({ ok: true }, refreshResult.accessToken, refreshResult.accessMaxAge)
}

export async function reauth(request: Request) {
  const originError = validateAuthOrigin(request)
  if (originError) return originError

  const userAgent = request.headers.get("user-agent")
  const refreshToken = readRefreshToken(request)

  if (!refreshToken) {
    return refreshFailureResponse("UNAUTHENTICATED")
  }

  const body = await readJsonBody<{ password?: string }>(request)
  if (body instanceof NextResponse) return body

  if (!body.password) {
    return NextResponse.json({ message: "Password is required." }, { status: 400 })
  }

  const springResponse = await postSpringJson("/auth/reauth", { refreshToken, password: body.password }, { userAgent })
  if (springResponse instanceof NextResponse) return springResponse

  if (!springResponse.ok) {
    const payload = await parseJsonPayload(springResponse)
    const shouldClearCookies =
      payload.code === "REFRESH_EXPIRED" ||
      payload.code === "UNAUTHENTICATED"

    if (shouldClearCookies) {
      return jsonWithClearedAuthCookies(
        {
          ...payload,
          code: payload.code ?? "UNAUTHENTICATED",
        },
        springResponse.status,
      )
    }
    return NextResponse.json(payload, { status: springResponse.status })
  }

  const data = await parseJsonPayload<SpringReauthResponse>(springResponse)

  if (!data.accessToken || !data.accessExpiresAt || !data.refreshExpiresAt) {
    return NextResponse.json({ message: "Unexpected response from auth server." }, { status: 502 })
  }

  const accessMaxAge = maxAgeFromExpiry(data.accessExpiresAt)
  const refreshMaxAge = maxAgeFromExpiry(data.refreshExpiresAt)
  if (!Number.isFinite(accessMaxAge) || !Number.isFinite(refreshMaxAge)) {
    return NextResponse.json({ message: "Unexpected response from auth server." }, { status: 502 })
  }

  const response = jsonWithAccessCookie({ ok: true }, data.accessToken, accessMaxAge)
  response.headers.append("Set-Cookie", makeRefreshCookie(refreshToken, refreshMaxAge))

  return response
}

export async function me(request: Request) {
  const apiBaseUrl = requireApiBaseUrl()
  if (apiBaseUrl instanceof NextResponse) return apiBaseUrl

  const userAgent = request.headers.get("user-agent")
  const accessToken = readAccessToken(request)

  if (!accessToken) {
    const refreshToken = readRefreshToken(request)
    if (!refreshToken) {
      return refreshFailureResponse("UNAUTHENTICATED")
    }

    const refreshResult = await refreshAccessToken(refreshToken, { userAgent })
    if (!refreshResult.ok) {
      return refreshFailureResponse(refreshResult)
    }

    const meResponse = await getSpringWithAccess("/auth/me", refreshResult.accessToken, { userAgent })
    if (!meResponse) {
      return apiRetryableResponse("백엔드 연결에 실패해 다시 시도 중입니다.")
    }

    if (!meResponse.ok) {
      if (meResponse.status === 401) {
        return refreshFailureResponse("UNAUTHENTICATED")
      }
      const payload = await meResponse.json().catch(() => ({ message: meResponse.statusText }))
      return NextResponse.json(payload, { status: meResponse.status })
    }

    const data = await meResponse.json()
    return jsonWithAccessCookie(data, refreshResult.accessToken, refreshResult.accessMaxAge)
  }

  const meResponse = await getSpringWithAccess("/auth/me", accessToken, { userAgent })

  if (!meResponse) {
    return apiRetryableResponse("백엔드 연결에 실패해 다시 시도 중입니다.")
  }

  if (meResponse.status === 401) {
    const refreshToken = readRefreshToken(request)
    if (!refreshToken) {
      return refreshFailureResponse("UNAUTHENTICATED")
    }

    const refreshResult = await refreshAccessToken(refreshToken, { userAgent })
    if (!refreshResult.ok) {
      return refreshFailureResponse(refreshResult)
    }

    const retryMeResponse = await getSpringWithAccess("/auth/me", refreshResult.accessToken, { userAgent })
    if (!retryMeResponse) {
      return apiRetryableResponse("백엔드 연결에 실패해 다시 시도 중입니다.")
    }

    if (!retryMeResponse.ok) {
      if (retryMeResponse.status === 401) {
        return refreshFailureResponse("UNAUTHENTICATED")
      }
      const payload = await retryMeResponse.json().catch(() => ({ message: retryMeResponse.statusText }))
      return NextResponse.json(payload, { status: retryMeResponse.status })
    }

    const data = await retryMeResponse.json()
    return jsonWithAccessCookie(data, refreshResult.accessToken, refreshResult.accessMaxAge)
  }

  if (!meResponse.ok) {
    const payload = await meResponse.json().catch(() => ({ message: meResponse.statusText }))
    return NextResponse.json(payload, { status: meResponse.status })
  }

  const data = await meResponse.json()
  return NextResponse.json(data, { status: 200 })
}

export async function logout(request: Request) {
  const originError = validateAuthOrigin(request)
  if (originError) return originError

  const userAgent = request.headers.get("user-agent")
  const refreshToken = readRefreshToken(request)

  if (refreshToken) {
    await postSpringJson("/auth/logout", { refreshToken }, { userAgent })
  }

  const response = NextResponse.json({ ok: true }, { status: 200 })
  response.headers.append("Set-Cookie", clearAccessCookie())
  response.headers.append("Set-Cookie", clearRefreshCookie())

  return response
}
