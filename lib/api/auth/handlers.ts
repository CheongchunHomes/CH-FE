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
  refreshToken?: string
  [key: string]: unknown
}

type SpringReauthResponse = {
  accessToken?: string
  refreshExpiresAt?: string
  [key: string]: unknown
}

export async function login(request: Request) {
  const originError = validateAuthOrigin(request)
  if (originError) return originError

  const body = await readJsonBody(request)
  if (body instanceof NextResponse) return body

  const springResponse = await postSpringJson("/auth/login", body)
  if (springResponse instanceof NextResponse) return springResponse

  if (!springResponse.ok) {
    const payload = await parseJsonPayload(springResponse)
    return NextResponse.json(payload, { status: springResponse.status })
  }

  const data = await parseJsonPayload<SpringLoginResponse>(springResponse)

  if (!data.accessToken || !data.refreshToken) {
    return NextResponse.json({ message: "Unexpected response from auth server." }, { status: 502 })
  }

  return jsonWithAuthCookies({ ok: true }, { accessToken: data.accessToken, refreshToken: data.refreshToken })
}

export async function refresh(request: Request) {
  const originError = validateAuthOrigin(request)
  if (originError) return originError

  const refreshToken = readRefreshToken(request)

  if (!refreshToken) {
    return refreshFailureResponse("UNAUTHENTICATED")
  }

  const refreshResult = await refreshAccessToken(refreshToken)
  if (!refreshResult.ok) {
    return refreshFailureResponse(refreshResult)
  }

  return jsonWithAccessCookie({ ok: true }, refreshResult.accessToken)
}

export async function reauth(request: Request) {
  const originError = validateAuthOrigin(request)
  if (originError) return originError

  const refreshToken = readRefreshToken(request)

  if (!refreshToken) {
    return refreshFailureResponse("UNAUTHENTICATED")
  }

  const body = await readJsonBody<{ password?: string }>(request)
  if (body instanceof NextResponse) return body

  if (!body.password) {
    return NextResponse.json({ message: "Password is required." }, { status: 400 })
  }

  const springResponse = await postSpringJson("/auth/reauth", { refreshToken, password: body.password })
  if (springResponse instanceof NextResponse) return springResponse

  if (!springResponse.ok) {
    const payload = await parseJsonPayload(springResponse)
    const shouldClearCookies =
      payload.code === "REFRESH_EXPIRED" ||
      payload.code === "INVALID_CREDENTIALS" ||
      springResponse.status === 401 ||
      springResponse.status === 403

    if (shouldClearCookies) {
      return jsonWithClearedAuthCookies(
        {
          ...payload,
          code: payload.code ?? (springResponse.status === 401 ? "UNAUTHENTICATED" : "INVALID_CREDENTIALS"),
        },
        springResponse.status,
      )
    }
    return NextResponse.json(payload, { status: springResponse.status })
  }

  const data = await parseJsonPayload<SpringReauthResponse>(springResponse)

  if (!data.accessToken || !data.refreshExpiresAt) {
    return NextResponse.json({ message: "Unexpected response from auth server." }, { status: 502 })
  }

  const refreshMaxAge = maxAgeFromExpiry(data.refreshExpiresAt)
  const response = jsonWithAccessCookie({ ok: true }, data.accessToken)
  response.headers.append("Set-Cookie", makeRefreshCookie(refreshToken, refreshMaxAge))

  return response
}

export async function me(request: Request) {
  const apiBaseUrl = requireApiBaseUrl()
  if (apiBaseUrl instanceof NextResponse) return apiBaseUrl

  const accessToken = readAccessToken(request)

  if (!accessToken) {
    const refreshToken = readRefreshToken(request)
    if (!refreshToken) {
      return refreshFailureResponse("UNAUTHENTICATED")
    }

    const refreshResult = await refreshAccessToken(refreshToken)
    if (!refreshResult.ok) {
      return refreshFailureResponse(refreshResult)
    }

    const meResponse = await getSpringWithAccess("/auth/me", refreshResult.accessToken)
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
    return jsonWithAccessCookie(data, refreshResult.accessToken)
  }

  const meResponse = await getSpringWithAccess("/auth/me", accessToken)

  if (!meResponse) {
    return apiRetryableResponse("백엔드 연결에 실패해 다시 시도 중입니다.")
  }

  if (meResponse.status === 401) {
    const refreshToken = readRefreshToken(request)
    if (!refreshToken) {
      return refreshFailureResponse("UNAUTHENTICATED")
    }

    const refreshResult = await refreshAccessToken(refreshToken)
    if (!refreshResult.ok) {
      return refreshFailureResponse(refreshResult)
    }

    const retryMeResponse = await getSpringWithAccess("/auth/me", refreshResult.accessToken)
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
    return jsonWithAccessCookie(data, refreshResult.accessToken)
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

  const refreshToken = readRefreshToken(request)

  if (refreshToken) {
    await postSpringJson("/auth/logout", { refreshToken })
  }

  const response = NextResponse.json({ ok: true }, { status: 200 })
  response.headers.append("Set-Cookie", clearAccessCookie())
  response.headers.append("Set-Cookie", clearRefreshCookie())

  return response
}
