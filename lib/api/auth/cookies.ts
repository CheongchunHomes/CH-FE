const IS_PROD = process.env.NODE_ENV === "production"

export const COOKIE_NAMES = {
  access: IS_PROD ? "__Host-access_token" : "access_token",
  refresh: IS_PROD ? "__Host-refresh_token" : "refresh_token",
} as const

function buildSetCookie(name: string, value: string, maxAgeSeconds: number): string {
  const parts: string[] = [
    `${name}=${value}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${maxAgeSeconds}`,
  ]

  if (IS_PROD) {
    parts.push("Secure")
  }

  return parts.join("; ")
}

export function makeAccessCookie(token: string, maxAgeSeconds: number): string {
  return buildSetCookie(COOKIE_NAMES.access, token, maxAgeSeconds)
}

export function makeRefreshCookie(token: string, maxAgeSeconds: number): string {
  return buildSetCookie(COOKIE_NAMES.refresh, token, maxAgeSeconds)
}

export function clearAccessCookie(): string {
  return buildSetCookie(COOKIE_NAMES.access, "", 0)
}

export function clearRefreshCookie(): string {
  return buildSetCookie(COOKIE_NAMES.refresh, "", 0)
}

export function readAccessToken(request: Request): string | null {
  return readCookie(request, COOKIE_NAMES.access)
}

export function readRefreshToken(request: Request): string | null {
  return readCookie(request, COOKIE_NAMES.refresh)
}

function readCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("cookie")
  if (!cookieHeader) return null

  for (const part of cookieHeader.split(";")) {
    const [key, ...rest] = part.trim().split("=")
    if (key.trim() === name) {
      return rest.join("=").trim() || null
    }
  }

  return null
}

export function maxAgeFromExpiry(expiresAt: string | Date): number {
  const expMs = typeof expiresAt === "string" ? new Date(expiresAt).getTime() : expiresAt.getTime()
  const seconds = Math.floor((expMs - Date.now()) / 1000)
  return Math.max(0, seconds)
}
