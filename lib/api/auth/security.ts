import { NextResponse } from "next/server"

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])

function getExpectedOrigins(request: Request): Set<string> {
  const expected = new Set<string>()
  const requestUrl = new URL(request.url)

  expected.add(requestUrl.origin)

  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host")
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? requestUrl.protocol.replace(/:$/, "")

  if (forwardedHost && forwardedProto) {
    expected.add(`${forwardedProto}://${forwardedHost}`)
  }

  return expected
}

export function validateOrigin(request: Request, method: string): NextResponse | null {
  if (!STATE_CHANGING_METHODS.has(method.toUpperCase())) {
    return null
  }

  const origin = request.headers.get("origin")

  if (!origin || !getExpectedOrigins(request).has(origin)) {
    return NextResponse.json({ code: "INVALID_ORIGIN" }, { status: 403 })
  }

  return null
}
