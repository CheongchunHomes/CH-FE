import { post } from "@/lib/api/client"

import type { ApiRequestOptions } from "@/lib/api/client"
import type { AiChatRequest, AiChatResponse } from "@/lib/ai/chat-types"

export function sendAiChat(
  request: AiChatRequest,
  options?: Omit<ApiRequestOptions<AiChatRequest>, "body">,
): Promise<AiChatResponse> {
  return post<AiChatResponse, AiChatRequest>("/api/chat", request, options)
}
