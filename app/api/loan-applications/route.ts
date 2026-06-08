import { NextResponse } from "next/server"

const BACKEND_BASE_URL = (process.env.LOAN_API_BASE_URL ?? process.env.API_BASE_URL ?? "http://localhost:18080")
  .trim()
  .replace(/\/+$/, "")

export async function POST(request: Request) {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/loan-applications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
