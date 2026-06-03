import { NextResponse } from "next/server"

export async function GET() {
  try {
    const response = await fetch(`${process.env.API_BASE_URL}/api/loan-products`, {
      cache: "no-store",
    })

    if (!response.ok) {
      return NextResponse.json(
        { message: "Failed to load loan products", status: response.status },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load loan products"
    return NextResponse.json({ message }, { status: 500 })
  }
}
