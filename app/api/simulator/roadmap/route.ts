import { NextResponse } from "next/server"
import { createChatReply, type ChatMessage } from "@/lib/openai"
import { DiagnosisForm } from "@/lib/diagnosisUtils"
import { AssetPlanData } from "@/lib/simulatorTypes"

interface HousingSnapshot {
  region: string
  currentSize: number
  currentRent: number
  targetSize: number
  targetDeposit: number
  targetRent: number
  tenYearWaste: number
  monthlyGap: number
  savingAmount: number
  loanAmount: number
  yearsToGoal: number
  yearsWithLoan: number
  yearsSaved: number
  loanCoversAll: boolean
}

interface FinanceSnapshot {
  loanAmount: number
  annualRate: number
  monthlyIncome: number
  repayMonths: number
  method: string
  monthlyPayment: number
  dsr: number
  dsrLabel: string
  totalInterest: number
}

interface RecommendationResult {
  results: Array<{ policyName: string; grade: string; score: number }>
}

interface RoadmapRequestBody {
  profile?: DiagnosisForm
  recommendation?: RecommendationResult
  assetPlans?: AssetPlanData[]
  housingSnapshot?: HousingSnapshot
  financeSnapshot?: FinanceSnapshot
}

interface RoadmapParsed {
  checkList: Array<{ label: string; status: "pass" | "fail" | "warn" }>
  numbers: Array<{ label: string; value: string; sub?: string }>
  insights: Array<{ item: string; metaphor: string; action: string }>
  actions: Array<{ title: string; reason: string; priority: string; link: string | null }>
  timeline: Array<{ period: string; title: string; why: string; action: string }>
}

export async function POST(request: Request) {
  let body: RoadmapRequestBody

  try {
    body = await request.json() as RoadmapRequestBody
  } catch {
    return NextResponse.json({ error: "요청 본문을 읽을 수 없습니다." }, { status: 400 })
  }

  const { profile, recommendation, assetPlans, housingSnapshot, financeSnapshot } = body
  const sections: string[] = []

  if (profile) {
    const age = profile.birthDate
      ? Math.floor((Date.now() - new Date(profile.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365))
      : null
    sections.push(`[사용자 프로필]
- 나이: ${age ? `만 ${age}세` : "정보 없음"}
- 혼인 여부: ${profile.married ? "기혼" : "미혼"}
- 무주택 여부: ${profile.houseless ? "무주택" : "유주택"}
- 연소득: ${profile.annualIncome ? `${Math.round(profile.annualIncome / 10000).toLocaleString()}만원` : "정보 없음"}
- 희망 지역: ${profile.desiredCity ?? "정보 없음"} ${profile.desiredDistrict ?? ""}
- 청약통장: ${profile.subscriptionMonths ? `${profile.subscriptionMonths}개월` : "정보 없음"}
- 부양가족: ${profile.dependentCount ?? 0}명
- 고용 상태: ${profile.employmentStatus ?? "정보 없음"}`)
  }

  if (recommendation?.results?.length) {
    const top3 = recommendation.results
      .slice(0, 3)
      .map((r) => `  - ${r.policyName}: ${r.grade} (${r.score}점)`)
      .join("\n")
    sections.push(`[제도 추천 결과 TOP3]\n${top3}`)
  }

  if (assetPlans?.length) {
    const planSummary = assetPlans
      .map((p) => `  - ${p.planName}: 목표 ${Math.round((p.goalAmount ?? 0) / 10000)}만원 (${p.isCompleted ? "완료" : "진행중"})`)
      .join("\n")
    sections.push(`[저축 플랜]\n${planSummary}`)
  }

  if (housingSnapshot) {
    const h = housingSnapshot
    // savingAmount가 너무 작으면 (월세랑 같은 초기값) yearsToGoal 신뢰도 낮음
    const yearsDisplay = h.savingAmount <= h.currentRent
      ? "저축액 미입력"
      : `${h.yearsToGoal}년`

    sections.push(`[주거비 시뮬레이션]
- 현재 월세: ${h.currentRent}만원
- 목표 평수: ${h.targetSize}㎡ (${h.region})
- 목표 전세 보증금: ${Math.round(h.targetDeposit / 10000)}만원
- 순수 저축 시 목표까지: ${yearsDisplay}
- 대출 활용 시: ${h.loanCoversAll ? "바로 가능" : `${h.yearsWithLoan}년`}
- 10년 월세 소멸액: ${h.tenYearWaste}만원`)
  }

  if (financeSnapshot) {
    const f = financeSnapshot
    sections.push(`[대출/금융 체감]
- 대출금액: ${Math.round(f.loanAmount / 10000)}만원
- 연 금리: ${f.annualRate}%
- 월 납입액: ${Math.round(f.monthlyPayment / 10000)}만원
- DSR: ${f.dsr}% (${f.dsrLabel})
- 월 소득: ${Math.round(f.monthlyIncome / 10000)}만원`)
  }

  const dataContext = sections.join("\n\n")

  const systemPrompt = `당신은 청춘홈즈 서비스의 AI 청춘 플래너예요.
청년의 주거 상황을 분석해서 핵심만 짚어주세요.

[응답 규칙]
- 반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만.

- checkList: 조건 체크리스트 4~5개. status는 pass/fail/warn 중 하나.
  예) 무주택 → pass, 청약통장 없음 → fail, DSR 55% → warn

- numbers: 시뮬레이터 숫자 요약 카드 3개. 데이터 없으면 value에 "정보 없음" 표시.
  예) 10년 월세 소멸액 / DSR+월납입 / 목표까지 기간

- insights: 일상 비유 3~4개. 각 항목 = item(상황, 20자 이내) + metaphor(비유 한 문장, 30자 이내) + action(할 일, 30자 이내)
  [비유 규칙]
  - 아래 카테고리에서 매번 다르게 선택, 같은 카테고리 2번 연속 금지
  - 사용 가능 카테고리: 요리, 공사/건축, 스포츠/경기, 게임, 운전/여행, 식물/농사, 이사/짐, 영화/드라마, 날씨/계절, 목표/과녁
  - insights 3개면 3개 카테고리 모두 달라야 함
  - 요리는 전체 insights 중 1개만 허용

- actions: 지금 당장 할 것 3가지. priority는 high/medium/low.
link는 반드시 아래 목록에서만 선택:
"/site/announcements?keyword=행복주택"      → 행복주택 관련
"/site/announcements?keyword=청년매입임대"   → 청년 매입임대 관련
"/site/announcements?keyword=청년전세임대"   → 청년 전세임대 관련
"/site/announcements?keyword=청년버팀목"     → 대출 관련
"/site/loan"                                → 대출 상세
"/site/simulator?tab=assetPlan"             → 저축 목표 관련
"/site/simulator?tab=housingCompare"        → 주거비 비교 관련
"/site/simulator?tab=financeFeel"           → DSR·대출 체감 관련
null                                        → 해당 없음

- timeline: 현재/3개월/1년/3년 4단계 주거 전략 로드맵. 각 단계 = period + title(10자 이내) + why(40자 이내) + action(40자 이내)

{
  "checkList": [
    { "label": "무주택", "status": "pass" },
    { "label": "청약통장 없음", "status": "fail" }
  ],
  "numbers": [
    { "label": "10년 월세 소멸액", "value": "7,200만원", "sub": "월 60만원 기준" },
    { "label": "DSR", "value": "55%", "sub": "월 납입 110만원" },
    { "label": "목표까지", "value": "4년", "sub": "저축 기준" }
  ],
  "insights": [
    {
      "item": "청약통장 정보 없음",
      "metaphor": "경기 시작 전 유니폼을 안 챙긴 것과 같아요",
      "action": "지금 바로 청약통장 개설하세요"
    }
  ],
  "actions": [
    {
      "title": "액션 제목 (20자 이내)",
      "reason": "이유 (40자 이내)",
      "priority": "high",
      "link": "/site/loan 또는 null"
    }
  ],
  "timeline": [
    { "period": "현재", "title": "한 줄 상태", "why": "이유", "action": "할 일" },
    { "period": "3개월", "title": "...", "why": "...", "action": "..." },
    { "period": "1년",   "title": "...", "why": "...", "action": "..." },
    { "period": "3년",   "title": "...", "why": "...", "action": "..." }
  ]
}`

  const messages: ChatMessage[] = [
    {
      role: "user",
      content: `아래 데이터를 바탕으로 AI 청춘 플래너 분석을 해주세요.\n\n[시스템 지시]\n${systemPrompt}\n\n${dataContext}`,
    },
  ]

  try {
    const reply = await createChatReply(messages)
    const clean = reply.replace(/```json|```/g, "").trim()
    const parsed = JSON.parse(clean) as RoadmapParsed
    return NextResponse.json(parsed)
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류"
    console.error("[roadmap route error]", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
