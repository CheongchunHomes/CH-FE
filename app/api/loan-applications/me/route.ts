import { NextRequest, NextResponse } from "next/server"
import { readAccessToken } from "@/lib/api/auth/cookies"

const CANDIDATE_PATHS = ["/loan-applications/me"]

export async function GET(request: NextRequest) {
  const accessToken = readAccessToken(request)

  for (const path of CANDIDATE_PATHS) {
    try {
      const headers = new Headers()
      if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`)
      }

      const response = await fetch(`${process.env.API_BASE_URL}${path}`, {
        cache: "no-store",
        headers,
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data)
      }
    } catch {
      // try next candidate
    }
  }

  return NextResponse.json({ status: null }, { status: 200 })
}
