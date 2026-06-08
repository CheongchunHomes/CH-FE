// app/api/simulator/roadmap/route.ts 전체 교체

import { NextResponse } from "next/server"
import { DiagnosisForm } from "@/lib/diagnosisUtils"
import { AssetPlanData, formatManwon, wonToManwon } from "@/lib/simulatorUtils"

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

export interface RoadmapParsed {
  insights: Array<{ item: string; metaphor: string; action: string }>
  actions: Array<{ title: string; reason: string; priority: "high" | "medium" | "low"; link: string | null }>
  timeline: Array<{ period: string; title: string; why: string; action: string }>
}

const CATEGORY_LABEL: Record<string, string> = {
  HOUSING: "주거", TRAVEL: "여행", CAR: "자동차",
  ELECTRONICS: "전자기기", WEDDING: "결혼", FASHION: "패션",
  EDUCATION: "교육", OTHER: "기타",
}

// ── 방어처리 ──────────────────────────────────────────────────────────

function normalizeRoadmap(parsed: RoadmapParsed): RoadmapParsed {
  const insights = (parsed.insights ?? [])
    .map((ins) => ({
      item:     ins.item?.trim()     || ins.metaphor?.trim().slice(0, 20) || "현재 상황 점검",
      metaphor: ins.metaphor?.trim() || "입력된 내용을 바탕으로 다음 행동을 정리했어요",
      action:   ins.action?.trim()   || "다음 단계를 확인해봐요",
    }))
    .filter((ins) => ins.item || ins.metaphor)
    .slice(0, 4)

  const actions = (parsed.actions ?? [])
    .map((a) => ({
      title:    a.title?.trim()  || "확인하기",
      reason:   a.reason?.trim() || "",
      priority: a.priority       || "medium",
      link:     a.link           ?? null,
    }))
    .slice(0, 3)

  const timeline = (parsed.timeline ?? [])
    .map((t) => ({
      period: t.period?.trim() || "",
      title:  t.title?.trim()  || "",
      why:    t.why?.trim()    || "",
      action: t.action?.trim() || "",
    }))
    .filter((t) => t.period || t.title)
    .slice(0, 4)

  return { insights, actions, timeline }
}

export async function POST(request: Request) {
  let body: RoadmapRequestBody
  try {
    body = await request.json() as RoadmapRequestBody
  } catch {
    return NextResponse.json({ error: "요청 본문을 읽을 수 없습니다." }, { status: 400 })
  }

  const { profile, recommendation, assetPlans, housingSnapshot, financeSnapshot } = body

  // ── 데이터 요약 ────────────────────────────────────────────────────
  const sections: string[] = []

  if (profile) {
    const age = profile.birthDate
      ? Math.floor((Date.now() - new Date(profile.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365))
      : null
    sections.push(`[사용자 프로필]
- 나이: ${age != null ? `만 ${age}세` : "정보 없음"}
- 혼인 여부: ${profile.married ? "기혼" : "미혼"}
- 무주택 여부: ${profile.houseless ? "무주택" : "유주택"}
- 연소득: ${profile.annualIncome ? `${wonToManwon(profile.annualIncome).toLocaleString()}만원/년 (월 ${Math.round(wonToManwon(profile.annualIncome) / 12)}만원)` : "정보 없음"}
- 희망 지역: ${profile.desiredCity ?? "정보 없음"} ${profile.desiredDistrict ?? ""}
- 청약통장: ${profile.subscriptionMonths > 0 ? `${profile.subscriptionMonths}개월 납입` : "미보유"}
- 부양가족: ${profile.dependentCount ?? 0}명
- 고용 상태: ${profile.employmentStatus ?? "정보 없음"}`)
  }

  if (assetPlans && assetPlans.length > 0) {
    const completed = assetPlans.filter((p) => p.isCompleted)
    const active    = assetPlans.filter((p) => !p.isCompleted)
    const savedTotal       = assetPlans.reduce((s, p) => s + (p.baseAsset  ?? 0), 0)
    const completedTotal   = completed.reduce((s, p)  => s + (p.goalAmount ?? 0), 0)
    const activeGoalTotal  = active.reduce((s, p)     => s + (p.goalAmount ?? 0), 0)
    const planLines = assetPlans.map((p) => {
      const goal    = wonToManwon(p.goalAmount ?? 0)
      const current = wonToManwon(p.baseAsset  ?? 0)
      const rate    = goal > 0 ? Math.round((current / goal) * 100) : 0
      return `  - [${p.isCompleted ? "완료" : "진행중"}] ${CATEGORY_LABEL[p.category ?? ""] ?? p.planName}: 목표 ${goal}만원, 현재 ${current}만원 (${rate}% 달성)`
    }).join("\n")

    sections.push(`[저축 플랜 현황]
- 전체: ${assetPlans.length}개 (완료 ${completed.length}개, 진행 ${active.length}개)
- 지금까지 모은 금액: ${wonToManwon(savedTotal).toLocaleString()}만원
- 달성 완료 금액: ${wonToManwon(completedTotal).toLocaleString()}만원
- 진행 중 목표 합계: ${wonToManwon(activeGoalTotal).toLocaleString()}만원
${planLines}`)
  } else {
    sections.push(`[저축 플랜 현황]\n- 저축 플랜 없음`)
  }

  if (housingSnapshot) {
    const h = housingSnapshot
    // 월세와 저축액은 별도 입력값이므로 0원일 때만 미입력으로 판단한다.
    const savingInsufficient = h.savingAmount === 0
    sections.push(`[주거비 시뮬레이션]
- 현재: ${h.currentSize}㎡, 월세 ${h.currentRent}만원
- 목표: ${h.region} ${h.targetSize}㎡ (전세 보증금 ${formatManwon(h.targetDeposit)})
- 10년 월세 소멸액: ${h.tenYearWaste.toLocaleString()}만원
- 목표까지 (순수 저축): ${savingInsufficient ? "저축액 미입력" : `${h.yearsToGoal}년`}
- 목표까지 (대출 활용): ${h.loanCoversAll ? "바로 가능" : `${h.yearsWithLoan}년`}
- 대출로 단축: ${h.yearsSaved > 0 ? `${h.yearsSaved}년` : "없음"}
- 월 저축액: ${h.savingAmount}만원${savingInsufficient ? " (미입력, 초기값)" : ""}`)
  } else {
    sections.push(`[주거비 시뮬레이션]\n- 미입력`)
  }

  if (financeSnapshot) {
    const f = financeSnapshot
    const monthlyNet = f.monthlyIncome - f.monthlyPayment
    // loanAmount 0이면 미입력 처리
    if (f.loanAmount === 0) {
      sections.push(`[대출/금융 체감]\n- 대출금 미입력 (월 소득 ${wonToManwon(f.monthlyIncome)}만원만 입력됨)`)
    } else {
      sections.push(`[대출/금융 체감]
- 대출금: ${wonToManwon(f.loanAmount).toLocaleString()}만원 (연 ${f.annualRate}%)
- 월 납입액: ${wonToManwon(f.monthlyPayment)}만원
- DSR: ${f.dsr}% (${f.dsrLabel})
- 월 소득: ${wonToManwon(f.monthlyIncome)}만원
- 상환 후 잔액: ${wonToManwon(monthlyNet)}만원`)
    }
  }

  if (recommendation?.results?.length) {
    const top3 = recommendation.results.slice(0, 3)
      .map((r) => `  - ${r.policyName}: ${r.grade} (${r.score}점)`).join("\n")
    sections.push(`[제도 추천 TOP3]\n${top3}`)
  }

  const dataContext = sections.join("\n\n")

  // ── 시스템 프롬프트 ────────────────────────────────────────────────
  const systemPrompt = `당신은 청춘홈즈의 AI 청춘 플래너예요.
청년의 주거 상황을 분석해서 진짜 도움이 되는 개인화된 조언을 해주세요.

[핵심 원칙]
- 데이터를 단순 반복하지 말고 반드시 "해석"하세요.
- 이 사람 고유 수치(저축 현황, DSR, 목표 지역)를 명시적으로 언급하세요.
- 일반론 금지. 구체적인 수치 기반으로만.

[말투 원칙]
- 친한 선배가 카페에서 얘기해주는 톤으로. 딱딱한 금융 보고서 말투 절대 금지.
- 수치는 반드시 포함하되 쉽게 풀어서. 예) "DSR 873%는 버는 돈보다 갚아야 할 돈이 8배 많다는 뜻이에요"
- 어려운 용어 바로 뒤에 괄호로 쉬운 말 추가. 예) "DSR(소득 대비 상환 비율)"
- 문장은 짧게. 한 문장에 내용 두 개 넣지 말 것.
- "~합니다" 금지. "~해요", "~거예요" 유지.

[응답 형식]
반드시 아래 JSON만. 다른 텍스트 없이.

insights: 4개 고정. 반드시 아래 순서대로.
  슬롯0 — 자산플랜 기반
  슬롯1 — 주거비교 기반
  슬롯2 — 금융체감 기반
  슬롯3 — 프로필/청약 또는 제도추천 기반

  각 항목 = item(상황 20자 이내 명사구) + metaphor(상황 해석 60자 이내) + action(다음 행동 30자 이내)

  [공통 규칙]
  - item 비어있는 insight 생성 금지
  - metaphor는 반드시 "~해요", "~거예요"로 종결. "~된다", "~진다" 금지
  - 미입력 슬롯도 건너뛰지 말고 미입력 상태 insight로 생성
  - metaphor에 카테고리명·접두어 금지

  [슬롯별 톤]
  슬롯0 자산플랜 → 체크 + 독려
  - 금지 표현: "불과해요", "에 불과", "미흡해요"
  - metaphor 예시 (좋은): "2개 플랜 중 1개 완료했고 지금까지 43만원 모았어요. 작게 시작했지만 방향은 잡혔어요."
  - metaphor 예시 (나쁜): "달성률이 0.76%에 불과해요" → 절대 금지
  - action 예시: "이번 달 주거 저축 목표 금액부터 정해봐요"

  슬롯1 주거비교 → 현실 직시 + 대안 제시
  - metaphor 예시 (좋은): "지금 월세 60만원이면 10년 뒤엔 7,200만원이 그냥 사라지는 거예요. 전세로 갈아타면 그 돈이 내 자산이 돼요."
  - action 예시: "대출 활용 시나리오로 목표 시점을 앞당겨봐요"

  슬롯2 금융체감 → 리스크 경고 + 조정 유도
  - metaphor 예시 (좋은): "DSR 873%면 버는 돈보다 갚아야 할 돈이 8배 많아요. 지금 이 대출 구조로는 생활이 어려워요."
  - metaphor 예시 (나쁜): "DSR 873%로 실제 불가능합니다" → 딱딱한 보고서 말투 금지
  - action 예시: "대출금을 줄이거나 상환 기간을 늘려서 다시 계산해봐요"
  - 미입력 또는 대출금 0이면 추측 절대 금지
  - 미입력이면 반드시: "금융 체감 탭에서 대출금을 입력하면 실제 상환 부담을 계산할 수 있어요."
  - "부족해 보이지만", "관리가 필요해요" 같은 추측성 표현 금지

  슬롯3 프로필/청약 → 현재 상태 + 다음 단계
  - metaphor 예시 (좋은): "청약통장 36개월 납입 중이라 1순위 조건은 이미 갖췄어요. 지금은 공고 타이밍이 핵심이에요."
  - metaphor 예시 (나쁜): "충족 조건에 근접해요" → 애매한 표현 금지. 충족이면 충족, 미충족이면 몇 개월 남았는지 명확하게
  - action 예시: "이번 주 청년 매입임대 공고 확인해봐요"

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

timeline: 현재/3개월/1년/3년.
  - period + title(10자 이내) + action(20자 이내) + why(50자 이내)
  - why 어미: "~해요", "~거예요"로 종결. 마침표 포함.
  - 명사형 종결 금지("~함", "~증가"). 세미콜론 금지.
  - 실제 수치 기반. 미입력 탭은 "시뮬레이터 입력 후 구체화 가능"으로.`

  const messages = [{
    role: "user",
    content: `아래 데이터를 분석해서 AI 청춘 플래너 결과를 JSON으로 작성해주세요.\n\n${dataContext}\n\n${systemPrompt}`,
  }]

  try {
    const aiBaseUrl = process.env.NEXT_PUBLIC_AI_BASE_URL ?? "http://localhost:8000"
    const response = await fetch(`${aiBaseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    })

    if (!response.ok) throw new Error(`AI 서버 요청 실패: ${response.status}`)

    const data = await response.json() as { reply?: string; error?: string }
    const reply = data.reply?.trim()
    if (!reply) throw new Error("AI 서버 응답이 비어 있습니다.")

    const clean = reply.replace(/```json|```/g, "").trim()
    const parsed = normalizeRoadmap(JSON.parse(clean) as RoadmapParsed)
    return NextResponse.json(parsed)
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류"
    console.error("[roadmap route error]", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
