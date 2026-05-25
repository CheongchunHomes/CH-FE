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

// numbers 필드 제거 — 프론트에서 직접 계산
export interface RoadmapParsed {
  insights: Array<{ item: string; metaphor: string; action: string }>
  actions: Array<{ title: string; reason: string; priority: "high" | "medium" | "low"; link: string | null }>
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

  // ── 데이터 요약 계산 (프롬프트에 해석된 값 전달) ──────────────────
  const sections: string[] = []

  // 1. 사용자 기본 프로필
  if (profile) {
    const age = profile.birthDate
      ? Math.floor((Date.now() - new Date(profile.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365))
      : null
    sections.push(`[사용자 프로필]
- 나이: ${age != null ? `만 ${age}세` : "정보 없음"}
- 혼인 여부: ${profile.married ? "기혼" : "미혼"}
- 무주택 여부: ${profile.houseless ? "무주택" : "유주택"}
- 연소득: ${profile.annualIncome ? `${Math.round(profile.annualIncome / 10000).toLocaleString()}만원/년 (월 ${Math.round(profile.annualIncome / 120000)}만원)` : "정보 없음"}
- 희망 지역: ${profile.desiredCity ?? "정보 없음"} ${profile.desiredDistrict ?? ""}
- 청약통장: ${profile.subscriptionMonths ? `${profile.subscriptionMonths}개월 납입` : "미보유"}
- 부양가족: ${profile.dependentCount ?? 0}명
- 고용 상태: ${profile.employmentStatus ?? "정보 없음"}`)
  }

  // 2. 저축 플랜 — 달성 현황 계산해서 전달
  if (assetPlans && assetPlans.length > 0) {
    const completedPlans = assetPlans.filter((p) => p.isCompleted)
    const activePlans    = assetPlans.filter((p) => !p.isCompleted)

    // 달성된 플랜 합계 (goalAmount 기준)
    const completedTotal = completedPlans.reduce((s, p) => s + (p.goalAmount ?? 0), 0)
    // 진행 중인 플랜 목표 합계
    const activeGoalTotal = activePlans.reduce((s, p) => s + (p.goalAmount ?? 0), 0)
    // baseAsset(현재 모은 금액) 합계
    const savedTotal = assetPlans.reduce((s, p) => s + (p.baseAsset ?? 0), 0)

    const planLines = assetPlans
      .map((p) => {
        const goal    = Math.round((p.goalAmount ?? 0) / 10000)
        const current = Math.round((p.baseAsset ?? 0) / 10000)
        const rate    = goal > 0 ? Math.round((current / goal) * 100) : 0
        return `  - [${p.isCompleted ? "완료" : "진행중"}] ${p.planName}: 목표 ${goal}만원, 현재 ${current}만원 (${rate}% 달성)`
      })
      .join("\n")

    sections.push(`[저축 플랜 현황]
- 전체 플랜: ${assetPlans.length}개 (완료 ${completedPlans.length}개, 진행 중 ${activePlans.length}개)
- 지금까지 모은 금액: ${Math.round(savedTotal / 10000).toLocaleString()}만원
- 달성 완료 금액: ${Math.round(completedTotal / 10000).toLocaleString()}만원
- 진행 중 목표 합계: ${Math.round(activeGoalTotal / 10000).toLocaleString()}만원
${planLines}`)
  } else {
    sections.push(`[저축 플랜 현황]\n- 저축 플랜 없음 (탭1 미입력)`)
  }

  // 3. 주거비 시뮬레이션
  if (housingSnapshot) {
    const h = housingSnapshot
    const savingInsufficient = h.savingAmount <= h.currentRent || h.savingAmount === 0
    const yearsDisplay = savingInsufficient ? "미입력" : `${h.yearsToGoal}년`

    sections.push(`[주거비 시뮬레이션]
- 현재 거주: ${h.currentSize}㎡, 월세 ${h.currentRent}만원
- 목표 주거: ${h.region} ${h.targetSize}㎡ (전세 보증금 ${Math.round(h.targetDeposit / 10000).toLocaleString()}만원)
- 10년 월세 소멸액: ${h.tenYearWaste.toLocaleString()}만원
- 목표까지 (순수 저축): ${yearsDisplay}
- 목표까지 (대출 활용): ${h.loanCoversAll ? "바로 가능" : h.yearsWithLoan > 0 ? `${h.yearsWithLoan}년` : "미입력"}
- 대출로 단축 가능 기간: ${h.yearsSaved > 0 ? `${h.yearsSaved}년` : "없음"}
- 설정 월 저축액: ${h.savingAmount}만원${savingInsufficient ? " (저축액 미입력 — 월세와 동일한 초기값)" : ""}`)
  } else {
    sections.push(`[주거비 시뮬레이션]\n- 탭2 미입력`)
  }

  // 4. 대출/금융 체감
  if (financeSnapshot) {
    const f = financeSnapshot
    const monthlyNet = f.monthlyIncome - f.monthlyPayment
    sections.push(`[대출/금융 체감]
- 시뮬레이션 대출금액: ${Math.round(f.loanAmount / 10000).toLocaleString()}만원 (연 ${f.annualRate}%)
- 월 납입액: ${Math.round(f.monthlyPayment / 10000)}만원
- DSR: ${f.dsr}% → ${f.dsrLabel}
- 월 소득: ${Math.round(f.monthlyIncome / 10000)}만원
- 상환 후 실수령: ${Math.round(monthlyNet / 10000)}만원 (생활비·식비 등 충당 필요)`)
  } else {
    sections.push(`[대출/금융 체감]\n- 탭3 미입력`)
  }

  // 5. 제도 추천 결과
  if (recommendation?.results?.length) {
    const top3 = recommendation.results
      .slice(0, 3)
      .map((r) => `  - ${r.policyName}: ${r.grade} (${r.score}점)`)
      .join("\n")
    sections.push(`[제도 추천 결과 TOP3]\n${top3}`)
  }

  const dataContext = sections.join("\n\n")

  // ── 시스템 프롬프트 ────────────────────────────────────────────────
  const systemPrompt = `당신은 청춘홈즈의 AI 청춘 플래너예요.
청년의 주거 상황을 분석해서 진짜 도움이 되는 개인화된 조언을 해주세요.

[핵심 원칙]
- 데이터를 단순 반복하지 마세요. 반드시 "해석"하세요.
- 이 사람 고유의 상황(저축 현황, DSR, 목표 지역)을 명시적으로 언급하세요.
- "청약통장이 없어요" 같은 일반론 금지. "280만원을 모았는데 청약통장은 없어요" 처럼 구체적으로.
- 비유는 이 사람의 상황에 딱 맞게. 누구한테나 적용되는 비유는 금지.

[응답 형식]
반드시 아래 JSON만. 다른 텍스트 없이.

checkList: 4~5개. status는 pass/fail/warn.
  - 데이터가 없는 항목(탭 미입력)은 warn으로 표시. 예) "주거비 시뮬레이션 미입력 → warn"
  - 구체적인 수치 포함. 예) "DSR 600% — 위험 수준" 이 아닌 "DSR ${financeSnapshot?.dsr ?? "?"}%"

insights: 3~4개. 각 항목 = item(상황 설명 20자 이내) + metaphor(비유 한 문장, 40자 이내) + action(할 일 30자 이내)
  [규칙]
  - item은 이 사람의 상황을 짧게. "저축 목표 달성 미흡", "청약통장 미보유" 같은 식.
  - metaphor는 비유만. 카테고리명·접두어 절대 금지. "게임:", "요리:" 같은 거 붙이지 말 것.
  - metaphor는 친구한테 말하듯 자연스럽게. "게임으로 치면 레벨업 아이템도 없이 던전 들어간 거예요" 처럼.
  - 이 사람 고유 수치나 상황을 녹일 것. 누구한테나 해당되는 말 금지.

actions: 3개. priority는 high/medium/low.
  link는 아래 목록에서만:
  "/site/announcements?keyword=행복주택"
  "/site/announcements?keyword=청년매입임대"
  "/site/announcements?keyword=청년전세임대"
  "/site/announcements?keyword=청년버팀목"
  "/site/loan"
  "/site/simulator?tab=assetPlan"
  "/site/simulator?tab=housingCompare"
  "/site/simulator?tab=financeFeel"
  null

timeline: 현재/3개월/1년/3년. period + title(10자 이내) + why(40자 이내) + action(40자 이내)
  - 실제 수치 기반으로. "저축 목표" 같은 추상어 금지. "월 30만원 저축으로 38개월 후 달성" 처럼.
  - 탭 미입력 시에는 해당 단계에 "시뮬레이터 입력 후 구체화 가능" 으로 표시.

응답 예시 구조:
{
  "checkList": [...],
  "insights": [...],
  "actions": [...],
  "timeline": [...]
}`

  const messages: ChatMessage[] = [
    {
      role: "user",
      content: `아래 데이터를 분석해서 AI 청춘 플래너 결과를 JSON으로 작성해주세요.\n\n${dataContext}\n\n${systemPrompt}`,
    },
  ]

  try {
    const reply  = await createChatReply(messages)
    const clean  = reply.replace(/```json|```/g, "").trim()
    const parsed = JSON.parse(clean) as RoadmapParsed
    return NextResponse.json(parsed)
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류"
    console.error("[roadmap route error]", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
