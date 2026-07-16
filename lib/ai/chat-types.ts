export type AiChatRole = "user" | "assistant"

export type AiChatMessage = {
  role: AiChatRole
  content: string
}

export type AiChatRequest = {
  messages: AiChatMessage[]
  pageContext?: string
  userContext?: string
}

export type AiChatResponse = {
  reply: string
}
