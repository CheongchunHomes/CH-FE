import { NextResponse } from "next/server"

import { request } from "@/lib/api"

type RegisterDTO = {
  email: string
  password: string
}

const API_BASE_URL = process.env.API_BASE_URL?.trim()

export async function POST(req: Request) {
  if (!API_BASE_URL) {
    return NextResponse.json({ message: "API_BASE_URL is not configured." }, { status: 500 })
  }

  let body: RegisterDTO

  try {
    body = (await req.json()) as RegisterDTO
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 })
  }

  try {
    const nickname = await request<string, RegisterDTO>("POST", `${API_BASE_URL}/register`, {
      body,
      credentials: "same-origin",
    })

    return NextResponse.json(nickname)
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number((error as { status?: unknown }).status) || 500 : 500
    const message = error instanceof Error ? error.message : "Register request failed."
    return NextResponse.json({ message }, { status })
  }
}
