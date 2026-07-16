import { NextResponse } from "next/server"

import { requestAiChat } from "@/lib/ai/chat-server"
import type { AiChatMessage, AiChatRequest, AiChatRole } from "@/lib/ai/chat-types"

export const runtime = "nodejs"

type ChatRequestBody = {
  messages?: unknown
  pageContext?: unknown
  userContext?: unknown
}

function isAiChatRole(role: unknown): role is AiChatRole {
  return role === "user" || role === "assistant"
}

function parseMessages(messages: unknown) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return null
  }

  const parsedMessages: AiChatMessage[] = []

  for (const message of messages) {
    if (!message || typeof message !== "object") {
      return null
    }

    const role = (message as { role?: unknown }).role
    const content = (message as { content?: unknown }).content

    if (!isAiChatRole(role) || typeof content !== "string") {
      return null
    }

    const trimmedContent = content.trim()
    if (!trimmedContent) {
      return null
    }

    parsedMessages.push({
      role,
      content: trimmedContent,
    })
  }

  return parsedMessages
}

function parseOptionalString(value: unknown) {
  if (value === undefined) {
    return undefined
  }

  return typeof value === "string" ? value : null
}

export async function POST(request: Request) {
  let body: ChatRequestBody

  try {
    body = (await request.json()) as ChatRequestBody
  } catch {
    return NextResponse.json({ error: "요청 본문을 읽을 수 없습니다." }, { status: 400 })
  }

  const messages = parseMessages(body.messages)
  if (!messages) {
    return NextResponse.json({ error: "messages 형식이 올바르지 않습니다." }, { status: 400 })
  }

  const pageContext = parseOptionalString(body.pageContext)
  if (pageContext === null) {
    return NextResponse.json({ error: "pageContext 형식이 올바르지 않습니다." }, { status: 400 })
  }

  const userContext = parseOptionalString(body.userContext)
  if (userContext === null) {
    return NextResponse.json({ error: "userContext 형식이 올바르지 않습니다." }, { status: 400 })
  }

  const aiRequest: AiChatRequest = {
    messages,
    ...(pageContext !== undefined ? { pageContext } : {}),
    ...(userContext !== undefined ? { userContext } : {}),
  }

  try {
    const response = await requestAiChat(aiRequest)
    return NextResponse.json({ reply: response.reply })
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI 서버 요청 실패"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
