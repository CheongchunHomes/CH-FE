"use client"

import { useEffect, useRef, useState } from "react"
import { MessageCircle, Send, X, Bot, User } from "lucide-react"
import { getAnnouncement } from "@/lib/announcements-api"


// 미니채팅 UI 파일은 components/chat/MiniChatWidget.tsx입니다.
// app/site/layout.tsx에 붙여놔서 /site 하위 모든 페이지에 뜹니다.

// AI API 연결은 handleSend() 안의 TODO 부분만 보면 됩니다.
// content 변수가 사용자 입력값이고,
// Python API 응답 answer를 AI 메시지 content에 넣으면 됩니다.

/**
 * 미니채팅 말풍선 발신자 타입
 * - USER: 사용자가 입력한 메시지
 * - AI: 챗봇이 응답한 메시지
 */
type ChatSender = "USER" | "AI"

/**
 * 미니채팅 화면에 표시할 메시지 타입
 *
 * 현재는 FE 화면 표시용 id를 Date.now() 기반으로 생성함.
 * 추후 Python AI API 응답에서 messageId 등을 내려줄 경우
 * id 생성 방식을 API 응답값 기준으로 바꿔도 됨.
 */
type ChatMessage = {
  id: string
  sender: ChatSender
  content: string
}

export default function MiniChatWidget() {
  /**
   * isOpen
   * - false: 오른쪽 아래 플로팅 버튼만 표시
   * - true: 채팅창 표시
   */
  const [isOpen, setIsOpen] = useState(false)

  /**
   * input
   * - 사용자가 입력 중인 메시지
   */
  const [input, setInput] = useState("")

  /**
   * isSending
   * - 메시지 전송 중 로딩 상태
   * - 전송 중에는 중복 전송 방지
   */
  const [isSending, setIsSending] = useState(false)

  /**
   * messages
   * - 현재 미니채팅창에 표시되는 메시지 목록
   * - 현재는 프론트 상태로만 관리
   * - 상담기록 저장/조회 기능은 제외됨
   */
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "AI",
      content:
        "안녕하세요. 청춘홈즈 상담봇입니다. 주거지원, 공고, 정책, 청약 관련해서 궁금한 내용을 물어보세요.",
    },
  ])

  /**
   * 채팅 메시지 영역 ref
   * - 새 메시지가 추가될 때 자동으로 맨 아래로 스크롤하기 위해 사용
   */
  const scrollRef = useRef<HTMLDivElement | null>(null)

  /**
   * 메시지가 추가되거나 채팅창이 열릴 때
   * 채팅창 스크롤을 가장 아래로 이동
   */
  useEffect(() => {
    if (!isOpen) return

    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages, isOpen])

  /**
   * 메시지 전송 핸들러
   *
   * 현재 흐름:
   * 1. 사용자 입력값을 USER 메시지로 화면에 추가
   * 2. input 초기화
   * 3. 임시 로딩 상태 표시
   * 4. 현재는 더미 AI 답변을 추가
   *
   * AI 담당자 연결 지점:
   * - 아래 TODO 영역에서 Python 챗봇 API를 호출하면 됨.
   * - content 값이 사용자가 입력한 실제 질문임.
   * - Python API 응답의 answer 값을 AI 메시지 content에 넣으면 됨.
   */
  const handleSend = async () => {
    const content = input.trim()

    if (!content || isSending) {
      return
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "USER",
      content,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsSending(true)

    try {
      const pathname = window.location.pathname

      let userContext: string | undefined
      try {
        const profileRes = await fetch('/api/diagnosis/profile')
        if (profileRes.ok) {
          const p = await profileRes.json()
          const age = p.birthDate
            ? new Date().getFullYear() - new Date(p.birthDate).getFullYear()
            : null
          userContext = `
      - 나이: ${age ? age + '세' : '-'}
      - 연소득: ${p.annualIncome ? p.annualIncome.toLocaleString() + '원' : '-'}
      - 총자산: ${p.totalAsset ? p.totalAsset.toLocaleString() + '원' : '-'}
      - 혼인여부: ${p.married ? '기혼' : '미혼'}
      - 무주택여부: ${p.houseless ? '무주택' : '유주택'}
      - 부양가족 수: ${p.dependentCount ?? 0}명
      - 청약통장 가입기간: ${p.subscriptionMonths ?? 0}개월
      - 희망지역: ${p.desiredCity ?? '-'}
      - 고용형태: ${p.employmentStatus ?? '-'}
      - 장애여부: ${p.disabilityYn ? '해당' : '해당없음'}
      - 한부모가정: ${p.singleParent ? '해당' : '해당없음'}
      - 영유아 자녀: ${p.hasYoungChild ? '있음' : '없음'}
      - 결혼계획: ${p.marriagePlan ? '있음' : '없음'}`.trim()
        }
      } catch {}

      try {
        const recRes = await fetch('/api/recommendation/calculate/profile')
        if (recRes.ok) {
          const rec = await recRes.json()
          const topResults = (rec.results ?? [])
            .slice(0, 5)
            .map((r: any, i: number) => `${i + 1}순위: ${r.policyName} (${r.score}점, ${r.grade})`)
            .join('\n')
          userContext = (userContext ?? '') + `\n\n[제도 추천 우선순위]\n${topResults}`
        }
      } catch {}

      let pageContext = ''
      const announcementMatch = pathname.match(/\/site\/announcements\/(\d+)/)
      const policyMatch = pathname.match(/\/site\/policies\/(\d+)/)

      if (announcementMatch) {
        try {
          const ann = await getAnnouncement(Number(announcementMatch[1]))
          pageContext = `사용자가 현재 아래 공고 상세페이지를 보고 있습니다. 
          공고명: ${ann.title}
          지역: ${ann.region}
          상태: ${ann.status}
          신청기간: ${ann.applyStartDate} ~ ${ann.applyEndDate}
          주소: ${ann.address}
          시행기관: ${ann.supplyInstitution}
          대상유형: ${ann.targetType}
          내용: ${ann.content ?? ''}
          출처: ${ann.sourceUrl ?? ''}
          `
        } catch {}
      } else if (policyMatch) {
        try {
          const polRes = await fetch(`/api/policies/${policyMatch[1]}`)
          if (polRes.ok) {
            const pol = await polRes.json()
            pageContext = `사용자가 현재 아래 지원제도 상세페이지를 보고 있습니다.
      제도명: ${pol.name ?? pol.title}
      내용: ${pol.content ?? pol.description ?? ''}`
          }
        } catch {}
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_AI_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(({ sender, content }) => ({
            role: sender === 'USER' ? 'user' : 'assistant',
            content,
          })),
          pageContext: pageContext || undefined,
          userContext: userContext || undefined,
        }),
      })

      const data = await response.json()

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'AI',
        content: data.reply ?? '답변을 받아오지 못했습니다.',
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: "AI",
        content: "답변을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      {/* 채팅창 영역 */}
      {isOpen && (
        <div className="mb-3 flex h-[520px] w-[360px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {/* 채팅창 헤더 */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white">
                <Bot size={18} />
              </div>

              <div>
                <p className="text-sm font-bold text-slate-900">
                  청춘홈즈 상담봇
                </p>
                <p className="text-xs text-slate-500">
                  주거 고민을 간단히 상담해보세요
                </p>
              </div>
            </div>

            {/* <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="채팅 닫기"
            >
              <X size={18} />
            </button> */}
          </div>

          {/* 메시지 목록 영역 */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4"
          >
            {messages.map((message) => {
              const isUser = message.sender === "USER"

              return (
                <div
                  key={message.id}
                  className={`flex items-start gap-2 ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* AI 아이콘 */}
                  {!isUser && (
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                      <Bot size={15} />
                    </div>
                  )}

                  {/* 말풍선 */}
                  <div
                    className={`max-w-[76%] rounded-2xl px-3 py-2 text-sm leading-6 whitespace-pre-wrap ${
                      isUser
                        ? "rounded-tr-sm bg-blue-600 text-white"
                        : "rounded-tl-sm bg-white text-slate-800 shadow-sm"
                    }`}
                  >
                    {message.content}
                  </div>

                  {/* 사용자 아이콘 */}
                  {isUser && (
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <User size={15} />
                    </div>
                  )}
                </div>
              )
            })}

            {/* AI 응답 대기 상태 */}
            {isSending && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                  <Bot size={15} />
                </div>
                상담봇이 답변을 작성 중입니다...
              </div>
            )}
          </div>

          {/* 입력 영역 */}
          <div className="border-t border-slate-200 bg-white p-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  /**
                   * Enter 입력 시 전송
                   * isComposing 체크는 한글 조합 중 Enter 오작동 방지용
                   */
                  if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                    event.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="메시지를 입력하세요"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />

              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || isSending}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                aria-label="메시지 전송"
              >
                <Send size={17} />
              </button>
            </div>

            <p className="mt-2 text-[11px] leading-4 text-slate-400">
              AI 답변은 참고용이며, 실제 신청 가능 여부는 공고와 제도 상세 내용을
              함께 확인해 주세요.
            </p>
          </div>
        </div>
      )}

      {/* 오른쪽 아래 플로팅 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl transition hover:bg-blue-700"
        aria-label={isOpen ? "미니채팅 닫기" : "미니채팅 열기"}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={25} />}
      </button>
    </div>
  )
}