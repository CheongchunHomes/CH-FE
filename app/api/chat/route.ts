import { NextResponse } from "next/server"

import { createChatReply, type ChatMessage } from "@/lib/openai"

type ChatRequestBody = {
  message?: unknown
  messages?: unknown
}

function normalizeMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) {
    return []
  }

  return input
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null
      }

      const role = "role" in item ? String((item as { role?: unknown }).role) : ""
      const content = "content" in item ? String((item as { content?: unknown }).content) : ""

      if ((role !== "user" && role !== "assistant") || !content.trim()) {
        return null
      }

      return {
        role,
        content: content.trim(),
      } satisfies ChatMessage
    })
    .filter((item): item is ChatMessage => item != null)
}

export async function POST(request: Request) {
  let body: ChatRequestBody

  try {
    body = (await request.json()) as ChatRequestBody
  } catch {
    return NextResponse.json({ error: "요청 본문을 읽을 수 없습니다." }, { status: 400 })
  }

  const messages = normalizeMessages(body.messages)
  const message = typeof body.message === "string" ? body.message.trim() : ""

  if (message) {
    messages.push({ role: "user", content: message })
  }

  if (messages.length === 0) {
    return NextResponse.json({ error: "메시지를 하나 이상 보내주세요." }, { status: 400 })
  }

  try {
    const reply = await createChatReply(messages)
    return NextResponse.json({ reply })
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "알 수 없는 오류가 발생했어요."
    return NextResponse.json({ error: messageText }, { status: 500 })
  }
  
}

