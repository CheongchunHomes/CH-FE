import { NextResponse } from "next/server"
import { validateOrigin } from "@/lib/api/auth/security"

export function validateAuthOrigin(request: Request): NextResponse | null {
  return validateOrigin(request, "POST")
}

export async function readJsonBody<T = unknown>(request: Request): Promise<T | NextResponse> {
  try {
    return (await request.json()) as T
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 })
  }
}
