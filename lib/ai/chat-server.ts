import type { AiChatRequest, AiChatResponse } from "@/lib/ai/chat-types"

function getAiBaseUrl() {
  const aiBaseUrl = process.env.AI_BASE_URL?.trim()

  if (!aiBaseUrl) {
    throw new Error("AI_BASE_URL is not configured.")
  }

  return aiBaseUrl.replace(/[\\/]+$/, "")
}

function readReply(payload: unknown) {
  if (payload && typeof payload === "object" && "reply" in payload) {
    const reply = (payload as { reply?: unknown }).reply

    if (typeof reply === "string") {
      const trimmedReply = reply.trim()

      if (trimmedReply) {
        return trimmedReply
      }
    }
  }

  return null
}

function readErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: unknown }).error

    if (typeof error === "string" && error.trim()) {
      return error.trim()
    }
  }

  if (typeof payload === "string" && payload.trim()) {
    return payload.trim()
  }

  return fallback
}

async function readResponsePayload(response: Response) {
  const contentType = response.headers.get("content-type") ?? ""
  const text = await response.text()

  if (!text.trim()) {
    return null
  }

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text) as unknown
    } catch {
      return text
    }
  }

  return text
}

export async function requestAiChat(request: AiChatRequest): Promise<AiChatResponse> {
  const aiBaseUrl = getAiBaseUrl()

  let response: Response

  try {
    response = await fetch(`${aiBaseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      cache: "no-store",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했어요."
    throw new Error(`AI 서버 요청 실패: ${message}`)
  }

  const payload = await readResponsePayload(response)

  if (!response.ok) {
    const message = readErrorMessage(payload, `AI 서버 요청 실패: ${response.status}`)
    throw new Error(message)
  }

  const reply = readReply(payload)

  if (!reply) {
    throw new Error("AI 서버 응답에 reply가 비어 있습니다.")
  }

  return { reply }
}
