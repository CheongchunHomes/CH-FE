import { NextRequest, NextResponse } from "next/server"
import { readAccessToken } from "@/lib/api/auth/cookies"

const BACKEND_BASE_URL =
  process.env.API_BASE_URL?.trim().replace(/\/+$/, "")

export async function POST(request: NextRequest) {
  try {
    if (!BACKEND_BASE_URL) {
      return NextResponse.json(
        { message: "LOAN_API_BASE_URL or API_BASE_URL is not configured." },
        { status: 502 },
      )
    }

    const accessToken = readAccessToken(request)
    const headers = new Headers({
      "Content-Type": "application/json",
    })

    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`)
    }

    const cookieHeader = request.headers.get("cookie")
    if (cookieHeader) {
      headers.set("cookie", cookieHeader)
    }

    const response = await fetch(`${BACKEND_BASE_URL}/loan-applications`, {
      method: "POST",
      headers,
      body: await request.text(),
      cache: "no-store",
    })

    const payload = await response.text()
    const contentType = response.headers.get("content-type") ?? "application/json"

    return new NextResponse(payload, {
      status: response.status,
      headers: {
        "content-type": contentType,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to create loan application" },
      { status: 502 },
    )
  }
}
