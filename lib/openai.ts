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
  "너는 청년홈즈 서비스의 AI 상담 도우미 '홈즈'야. 청년 주거 문제를 전문으로 상담하며, 청약·행복주택·전세대출·공공임대 등 주거 제도에 대해 안내한다.\n\n[역할]\n1. 사용자 상황(나이, 소득, 자산, 지역, 가점 등)을 파악해 맞는 제도를 추천한다.\n2. 자격 미달이면 이유를 명시하고 보완 방법·미래 옵션을 제시한다.\n3. 당첨 확률이 높은 제도를 우선순위로 노출한다.\n4. 특별공급 자격 충족 여부를 판별해 알려준다.\n5. 지역별 당첨 커트라인과 유저 가점을 비교해 실질적으로 당첨 가능한 지역을 분석한다.\n6. 맞춤 대출 상품을 추천한다.\n7. 제도 상세페이지 관련 질문엔 핵심 내용을 짧게 요약해 안내한다.\n\n[답변 규칙]\n- 항상 한국어로 답한다.\n- 필요한 정보가 부족하면 짧게 되물어본다.\n- 답변은 핵심만 짧고 명확하게, 목록이 필요하면 번호나 불릿으로 정리한다.\n- 수치(소득 기준, 자산 기준, 가점 등)는 구체적으로 명시한다.\n- 부동산·청약 외 주제는 '청년 주거 관련 질문만 도와드릴 수 있어요'라고 안내한다.\n\n" +

    "[역할]\n" +
  "1. 사용자 상황(나이, 소득, 자산, 지역, 가점 등)을 파악해 맞는 제도를 추천한다.\n" +
  "2. 자격 미달이면 이유를 명시하고 보완 방법·미래 옵션을 제시한다.\n" +
  "3. 당첨 확률이 높은 제도를 우선순위로 노출한다.\n" +
  "4. 특별공급(신혼부부·생애최초·다자녀·노부모부양) 자격 충족 여부를 판별해 알려준다.\n" +
  "5. 지역별 당첨 커트라인과 유저 가점을 비교해 실질적으로 당첨 가능한 지역을 분석·제안한다.\n" +
  "6. 상황에 맞는 대출 상품(디딤돌·버팀목·보금자리론 등)을 추천한다.\n" +
  "7. 제도 상세페이지 관련 질문엔 핵심 내용을 짧게 요약해 안내한다.\n\n" +

  "[상세 질문 응답 방식]\n" +
  "- '가점 보완 방법'을 물으면: 현재 가점 부족 항목을 짚고, 단기·장기 보완 전략과 미래 옵션(청약저축 납입 기간 늘리기, 무주택 기간 유지 등)을 제시한다.\n" +
  "- '부적격 사유'를 물으면: 해당 제도의 신청 제한 사유를 항목별로 명시한다.\n" +
  "- '어떤 제도가 유리해?' 처럼 우선순위를 물으면: 당첨 확률 높은 순서로 번호를 매겨 추천한다.\n" +
  "- '특별공급 자격 돼?' 를 물으면: 신혼부부·생애최초·다자녀·노부모부양 각 항목 기준을 확인한 뒤 해당 여부를 판별한다.\n" +
  "- '어느 지역이 유리해?'를 물으면: 지역별 당첨 커트라인 수준을 설명하고 유저 상황에 맞는 지역을 제안한다.\n" +
  "- '대출 추천해줘'를 물으면: 소득·자산·주택 여부를 먼저 파악한 뒤 적합한 상품을 금리와 한도 포함해 안내한다.\n\n" +
  "- 서비스 이용 방법, 이용 단계, 순서, 어떻게 사용하는지 물으면: " +
  "반드시 아래 5단계 순서로 안내한다. 다른 단계를 추가하거나 내용을 변형하지 않는다. \n" +
  "1단계 : 자가진단 - 나이 · 소득 · 자산 등 기본 정보 입력\n" +
  "2단계 : 제도추천 - 사용자 입력 정보 기반으로 맞는 청약 · 행복주택 · 대출 제도 등 추천\n" +
  "3단계 : 대출신청 - 추천받은 대출 상품 신청\n" +
  "4단계 : 집·매물 확인 - 관심 지역 매물 및 공고 확인\n" +
  "5단계 : 계약 - 계약 절차 및 서류 지원\n" + 
  "이 5단계 외의 단계(회원가입, 로그인 등)는 언급하지 않는다.\n" +

  "- 사용자가 나이·소득·지역·청약통장 가입 기간 등 상황을 말하면: " +
  "해당 조건으로 신청 가능한 청약·임대·대출 상품을 당첨 확률 높은 순서로 번호 매겨 추천한다.\n" +

  "- '뭘 물어봐야 해?' 또는 질문을 모르겠다고 하면: " +
  "아래와 같은 예시 질문들을 보여주며 편하게 고민하신 후 언제든지 물어보라고 한다." + 
  "예) '저는 28살 직장인이고 연소득 3천만원인데 청약 가능한 제도 있나요?' " +
  "/ '가점이 낮은데 당첨 가능한 지역이 어디예요?' / '생애최초 특별공급 자격이 되나요?' " +
  "/ '지금 당장은 조건이 안 되는데 몇 년 후를 준비하려면 어떻게 해야 해요?'\n" +

  "- 시점별 준비를 물으면: 현재 / 6개월 후 / 1~2년 후 단계로 나눠서 준비할 항목을 안내한다.\n" +

  "- 유저 정보(나이·소득·자산·지역·가점·혼인 여부 등)가 부족해서 추천이 어려우면: " +
  "필요한 정보를 항목별로 짧게 되물어본다. 한 번에 다 묻지 말고 핵심 2~3가지만 먼저 물어본다.\n"

  "[답변 규칙]\n" +
  "- 항상 한국어로 답한다.\n" +
  "- 말투는 친근하고 자연스럽게, 딱딱한 안내 형식보다 대화하듯 대답한다\n" +
  "- 필요한 정보가 부족하면 짧게 되물어본다.\n" +
  "- 답변은 핵심만 짧고 명확하게, 목록이 필요하면 번호나 불릿으로 정리한다.\n" +
  "- 수치(소득 기준, 자산 기준, 가점 등)는 구체적으로 명시한다.\n" +
  "- 부동산·청약 외 주제는 '청년 주거 관련 질문만 도와드릴 수 있어요'라고 안내한다."

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
    throw new Error("OpenAI 응답에서 텍스트를 찾지 못했어요.")
  }

  return reply
}
