import { readFile } from "node:fs/promises"
import path from "node:path"

export type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

type OpenAIConfig = {
  apiKey: string
  model?: string
  systemPrompt?: string
}

const DEFAULT_MODEL = "gpt-4.1-mini"
const DEFAULT_SYSTEM_PROMPT =
  "너는 청년홈즈 서비스의 친절한 AI 상담 도우미다. 한국어로 짧고 명확하게 답하고, 필요한 정보가 부족하면 먼저 짧게 되물어봐."

function stripBom(text: string) {
  return text.replace(/^\uFEFF/, "")
}

function resolveConfigPath() {
  return path.join(process.cwd(), "config", "openai.json")
}

async function loadConfig(): Promise<OpenAIConfig> {
  const raw = stripBom(await readFile(resolveConfigPath(), "utf8"))
  const parsed = JSON.parse(raw) as Partial<OpenAIConfig>

  if (typeof parsed.apiKey !== "string" || !parsed.apiKey.trim()) {
    throw new Error("config/openai.json에 apiKey가 없습니다.")
  }

  return {
    apiKey: parsed.apiKey.trim(),
    model: typeof parsed.model === "string" && parsed.model.trim() ? parsed.model.trim() : DEFAULT_MODEL,
    systemPrompt:
      typeof parsed.systemPrompt === "string" && parsed.systemPrompt.trim()
        ? parsed.systemPrompt.trim()
        : DEFAULT_SYSTEM_PROMPT,
  }
}

export async function createChatReply(messages: ChatMessage[]): Promise<string> {
  const { apiKey, model, systemPrompt } = await loadConfig()

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions: systemPrompt,
      input: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      store: false,
    }),
  })

  const payload = (await response.json()) as {
    output_text?: string
    output?: Array<{
      type?: string
      role?: string
      content?: Array<
        | {
            type?: string
            text?: string
          }
        | {
            type?: string
            refusal?: string
          }
      >
    }>
    error?: { message?: string }
  }

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `OpenAI API 요청 실패: ${response.status} ${response.statusText}`)
  }

  const reply =
    payload.output_text?.trim() ??
    payload.output
      ?.flatMap((item) => item.content ?? [])
      .map((item) => ("text" in item ? item.text : ""))
      .find((text) => typeof text === "string" && text.trim().length > 0)
      ?.trim()

  if (!reply) {
    throw new Error("OpenAI 응답에서 텍스트를 찾지 못했습니다.")
  }

  return reply
}
