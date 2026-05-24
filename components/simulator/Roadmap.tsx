"use client"

import { useState, useEffect } from "react"
import { get, post } from "@/lib/api"
import { useRouter } from "next/navigation"
import { DiagnosisForm } from "@/lib/diagnosisUtils"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Sparkles, ChevronRight, RotateCcw, Zap, MapPin, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"

interface CheckItem {
  label: string
  status: "pass" | "fail" | "warn"
}

interface NumberCard {
  label: string
  value: string
  sub?: string
}

interface InsightItem {
  item: string
  metaphor: string
  action: string
}

interface ActionItem {
  title: string
  reason: string
  priority: "high" | "medium" | "low"
  link: string | null
}

interface PolicyScore {
  policyName: string
  score: number
  grade: string
}

interface TimelineItem {
  period: string
  title: string
  why: string
  action: string
}

interface RoadmapResult {
  checkList: CheckItem[]
  numbers: NumberCard[]
  insights: InsightItem[]
  actions: ActionItem[]
  timeline: TimelineItem[]
}

const PRIORITY_CONFIG = {
  high:   { label: "지금 바로",    color: "bg-blue-100 text-blue-700",    border: "border-blue-200"   },
  medium: { label: "이번 달 안에", color: "bg-yellow-100 text-yellow-700", border: "border-yellow-200" },
  low:    { label: "준비해두기",   color: "bg-gray-100 text-gray-600",    border: "border-gray-200"   },
}

const STATUS_CONFIG = {
  pass: { icon: CheckCircle2,  color: "text-blue-500",   bg: "bg-blue-50"   },
  fail: { icon: XCircle,       color: "text-red-400",    bg: "bg-red-50"    },
  warn: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-50" },
}

export default function Roadmap() {
  const router = useRouter()
  const [result, setResult]             = useState<RoadmapResult | null>(null)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [profile, setProfile]           = useState<DiagnosisForm | null>(null)
  const [policyScores, setPolicyScores] = useState<PolicyScore[]>([])

  useEffect(() => { fetchRoadmap() }, [])

  async function fetchRoadmap(forceRefresh = false) {
    setLoading(true)
    setError(null)

    try {
      // 캐시 확인
      if (!forceRefresh) {
        const cached = sessionStorage.getItem("roadmapResult")
        if (cached) {
          setResult(JSON.parse(cached) as RoadmapResult)
          loadSideData()
          setLoading(false)
          return
        }
      }

      // 프로필 조회
      const profileData = await get<DiagnosisForm>("/api/diagnosis/profile").catch(() => null)
      setProfile(profileData)

      // 제도 추천 점수
      const recommendation = await get<{ results: PolicyScore[] }>("/api/recommendation/calculate/profile", { cache: "no-store" }).catch(() => null)
      if (recommendation?.results) {
        setPolicyScores(recommendation.results.slice(0, 6))
      }

      // sessionStorage 데이터
      const housingSnapshot = parseSession("housingSnapshot")
      const financeSnapshot = parseSession("financeSnapshot")

      // 저축 플랜
      const assetPlans = await get<unknown[]>("/api/simulator/asset-plans", { cache: "no-store" }).catch(() => [])

      // AI 호출
      const data = await post<RoadmapResult>("/api/simulator/roadmap", {
        profile: profileData,
        recommendation,
        assetPlans,
        housingSnapshot,
        financeSnapshot,
      })

      sessionStorage.setItem("roadmapResult", JSON.stringify(data))
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했어요")
    } finally {
      setLoading(false)
    }
  }

  async function loadSideData() {
    const recommendation = await get<{ results: PolicyScore[] }>("/api/recommendation/calculate/profile", { cache: "no-store" }).catch(() => null)
    if (recommendation?.results) {
      setPolicyScores(recommendation.results.slice(0, 6))
    }
  }

  function parseSession(key: string) {
    try { return JSON.parse(sessionStorage.getItem(key) ?? "null") } catch { return null }
  }

  if (loading) return <LoadingSkeleton />
  if (error)   return <ErrorScreen message={error} onRetry={() => fetchRoadmap(true)} />

  return (
    <div className="space-y-4 pt-6">

      {/* 헤더 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-blue-600" />
            <p className="text-sm font-bold text-gray-900">AI 청춘 플래너</p>
            <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-200 bg-blue-50">
              AI 분석
            </Badge>
          </div>
          <button
            onClick={() => fetchRoadmap(true)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RotateCcw size={12} />
            다시 분석
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {profile ? "입력하신 조건을 바탕으로 맞춤 주거 전략을 분석했어요" : "시뮬레이터 데이터를 바탕으로 분석했어요"}
        </p>
      </div>

      {/* 숫자 요약 카드 3개 */}
      {result?.numbers && result.numbers.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {result.numbers.map((n, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center space-y-1">
              <p className="text-[11px] text-gray-400">{n.label}</p>
              <p className="text-lg font-bold text-gray-900">{n.value}</p>
              {n.sub && <p className="text-[10px] text-gray-400">{n.sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* 조건 체크리스트 + 제도 스코어 + AI 한마디 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="grid grid-cols-2 gap-6 relative items-stretch">
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gray-100" />

          {/* 좌: 체크리스트 */}
          <div>
            <p className="text-xs font-bold text-gray-500 mb-3">내 조건 체크</p>
            <div className="space-y-2">
              {result?.checkList?.map((item, i) => {
                const config = STATUS_CONFIG[item.status]
                const Icon = config.icon
                return (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${config.bg}`}>
                    <Icon size={13} className={config.color} />
                    <p className="text-xs text-gray-700">{item.label}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 우: 제도 스코어 */}
          <div>
            <p className="text-xs font-bold text-gray-500 mb-3">추천 제도 순위</p>
            <div className="space-y-2">
              {policyScores.length > 0 ? (
                policyScores.map((p, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-2">
            <span className={`text-xs font-bold w-4 flex-shrink-0 ${
              i === 0 ? "text-blue-600" : i === 1 ? "text-blue-400" : "text-gray-300"
            }`}>{i + 1}</span>
                      <p className="text-xs text-gray-700 flex-1 truncate">{p.policyName}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                        p.grade === "적극추천"   ? "bg-blue-100 text-blue-700"     :
                          p.grade === "추천가능"   ? "bg-blue-50 text-blue-500"      :
                            p.grade === "조건부추천" ? "bg-yellow-100 text-yellow-700" :
                              "bg-gray-100 text-gray-400"
                      }`}>{p.grade}</span>
                      <span className="text-xs font-bold text-gray-900 w-8 text-right flex-shrink-0">{p.score}점</span>
                    </div>
                    <div className="pl-4">
                      <Progress value={p.score} className="h-1.5" />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400">조건진단을 완료하면 표시돼요</p>
              )}
            </div>
          </div>
        </div>

        {/* 구분선 + AI 한마디 */}
        {result?.insights && result.insights.length > 0 && (
          <>
            <div className="border-t border-gray-100 my-5" />
            <div className="flex items-center gap-1.5 mb-3">
              <Sparkles size={12} className="text-blue-500" />
              <p className="text-xs font-bold text-blue-600">AI 청춘 플래너의 한마디</p>
            </div>
            <div className="flex gap-3">
              {result.insights.map((ins, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-1 flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate">ㆍ {ins.item}</p>
                  <p className="text-xs text-gray-500" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{ins.metaphor}</p>
                  <p className="text-xs font-medium text-blue-600" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{ins.action}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 지금 당장 할 것 3가지 + 타임라인 2열 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* 좌: 지금 당장 할 것 3가지 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-1.5 mb-4">
            <Zap size={14} className="text-blue-600" />
            <p className="text-sm font-bold text-gray-900">지금 당장 할 것 3가지</p>
          </div>
          <div className="space-y-3">
            {result?.actions.map((action, i) => {
              const config = PRIORITY_CONFIG[action.priority] ?? PRIORITY_CONFIG.low
              return (
                <Card
                  key={i}
                  className={`border ${config.border} ${action.link ? "cursor-pointer hover:shadow-md" : ""} transition-all`}
                  onClick={() => action.link && router.push(action.link)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="text-sm font-bold text-gray-900">{action.title}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${config.color}`}>
                              {config.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{action.reason}</p>
                        </div>
                      </div>
                      {action.link && <ChevronRight size={16} className="text-gray-300 flex-shrink-0 mt-1" />}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* 우: 주거 전략 타임라인 */}
        {result?.timeline && result.timeline.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-1.5 mb-5">
              <MapPin size={14} className="text-blue-600" />
              <p className="text-sm font-bold text-gray-900">주거 전략 타임라인</p>
            </div>
            <div className="relative">
              <div className="absolute left-[5px] top-3 bottom-3 w-0.5 bg-gray-100" />
              <div className="space-y-2">
                {result.timeline.map((item, i) => (
                  <TimelineAccordion key={i} item={item} index={i} isLast={i === result.timeline.length - 1} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

function TimelineAccordion({ item, index, isLast }: { item: TimelineItem; index: number; isLast: boolean }) {
  const [open, setOpen] = useState(false)

  const dotColor = index === 0
    ? "bg-blue-600 ring-4 ring-blue-100"
    : index === 1
      ? "bg-blue-400 ring-4 ring-blue-50"
      : "bg-gray-300 ring-4 ring-gray-50"

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center flex-shrink-0 mt-3.5">
        <div className={`w-3 h-3 rounded-full z-10 ${dotColor}`} />
      </div>
      <div className="flex-1 mb-2">
        <div
          className={`border rounded-xl overflow-hidden cursor-pointer transition-all ${
            open ? "border-blue-200 shadow-sm" : "border-gray-100"
          }`}
          onClick={() => setOpen(!open)}
        >
          <div className={`flex items-center justify-between px-4 py-3 ${open ? "bg-blue-50" : "hover:bg-gray-50"}`}>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                index === 0 ? "bg-blue-600 text-white" :
                  index === 1 ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-500"
              }`}>
                {item.period}
              </span>
              <p className="text-sm font-bold text-gray-900">{item.title}</p>
            </div>
            <ChevronRight
              size={14}
              className={`text-gray-400 transition-transform ${open ? "rotate-90" : ""}`}
            />
          </div>
          {open && (
            <div className="px-4 py-3 border-t border-gray-100 space-y-2.5 bg-white">
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-bold text-gray-400 mt-0.5 flex-shrink-0 w-8">Why</span>
                <p className="text-xs text-gray-600 leading-relaxed">{item.why}</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-bold text-blue-500 mt-0.5 flex-shrink-0 w-8">할일</span>
                <p className="text-xs font-medium text-gray-800 leading-relaxed">{item.action}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 pt-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-blue-600 animate-pulse" />
          <p className="text-sm font-bold text-gray-900">AI 청춘 플래너 분석 중...</p>
        </div>
        <p className="text-xs text-gray-400 mt-1">입력하신 조건을 분석하고 있어요. 잠시만 기다려주세요.</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-8 rounded-xl" />)}
          </div>
          <div className="space-y-2">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-5 rounded" />)}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
          <Skeleton className="h-4 w-32 rounded" />
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
          <Skeleton className="h-4 w-32 rounded" />
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      </div>
    </div>
  )
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="pt-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-3">
        <p className="text-2xl">😢</p>
        <p className="text-sm font-bold text-gray-900">분석에 실패했어요</p>
        <p className="text-xs text-gray-500">{message}</p>
        <button
          onClick={onRetry}
          className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-all"
        >
          다시 시도하기
        </button>
      </div>
    </div>
  )
}
