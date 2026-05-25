// app/site/simulator/page.tsx 전체

"use client"

import { useState, useEffect } from "react"
import { get, post, request } from "@/lib/api"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import AssetPlan from "@/components/simulator/AssetPlan"
import HousingCompare from "@/components/simulator/HousingCompare"
import FinanceFeel from "@/components/simulator/FinanceFeel"
import Roadmap from "@/components/simulator/Roadmap"
import { AssetPlanData, AssetPlanForm } from "@/lib/simulatorTypes"
import { useSearchParams, useRouter } from "next/navigation"
import { DiagnosisForm } from "@/lib/diagnosisUtils"

// 폼 초기값
const EMPTY_FORM: AssetPlanForm = {
  category: "HOUSING",
  planName: "",
  baseAsset: null,
  goalAmount: null,
  monthlySaving: null,
  startDate: null,
  endDate: null,
  isCompleted: false,
}

export default function SimulatorPage() {
  // 탭01 저장된 플랜 목록
  const [plans, setPlans] = useState<AssetPlanData[]>([])
  // 탭01 폼 입력값
  const [form, setForm] = useState<AssetPlanForm>(EMPTY_FORM)
  // 수정 중인 플랜 id (null이면 생성 모드)
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null)
  // 플랜 목록 로딩 상태
  const [isLoading, setIsLoading] = useState(false)

  const [userProfile, setUserProfile] = useState<DiagnosisForm | null>(null)

// 프로필 조회(비로그인 시 null)와 플랜 목록 독립 호출
  useEffect(() => {
    get<DiagnosisForm>("/api/diagnosis/profile")
      .then(setUserProfile)
      .catch(() => {})
    fetchPlans()
  }, [])

  // 탭 상태 URL 쿼리로 관리 (?tab=assetPlan)
  // 로그인 여부 — userProfile로 판단
  const isLoggedIn = userProfile !== null
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab") ?? "assetPlan"

  // GET /api/simulator/asset-plans — 유저 플랜 전체 목록
  async function fetchPlans() {
    setIsLoading(true)
    try {
      const data = await get<AssetPlanData[]>("/api/simulator/asset-plans", { cache: "no-store" })
      setPlans(data)
    } finally {
      setIsLoading(false)
    }
  }

  // POST /api/simulator/asset-plans — 새 플랜 생성
  async function handleCreate() {
    await post("/api/simulator/asset-plans", form)
    setForm(EMPTY_FORM)
    fetchPlans()
  }

  // 수정 버튼 클릭 시 — 해당 플랜 값을 폼에 세팅하고 수정 모드로 전환
  function handleEditStart(plan: AssetPlanData) {
    setEditingPlanId(plan.planId)
    setForm({
      category: plan.category,
      planName: plan.planName,
      baseAsset: plan.baseAsset,
      goalAmount: plan.goalAmount,
      monthlySaving: plan.monthlySaving,
      startDate: plan.startDate,
      endDate: plan.endDate,
       isCompleted: plan.isCompleted,
    })
  }

  // PUT /api/simulator/asset-plans/:id — 플랜 수정
  async function handleUpdate() {
    if (!editingPlanId) return
    await request("PUT", `/api/simulator/asset-plans/${editingPlanId}`, {
      body: form
    })
    setEditingPlanId(null)
    setForm(EMPTY_FORM)
    fetchPlans()
  }
      // 달성 여부
    async function handleToggleComplete(planId: number, isCompleted: boolean) {
      const plan = plans.find(p => p.planId === planId)
      if (!plan) return

      // 로컬 state 먼저 업데이트
      setPlans(prev => prev.map(p =>
        p.planId === planId ? { ...p, isCompleted } : p
      ))

      // 백엔드 업데이트
      const { planId: _, createdAt: __, ...planForm } = plan
      await request("PUT", `/api/simulator/asset-plans/${planId}`, {
        body: { ...planForm, isCompleted }
      })
    }

  // DELETE /api/simulator/asset-plans/:id — 플랜 삭제
  async function handleDelete(planId: number) {
    await request("DELETE", `/api/simulator/asset-plans/${planId}`)
    fetchPlans()
  }


  // 수정 취소 — editingPlanId 초기화 + 폼 초기화
  function handleEditCancel() {
    setEditingPlanId(null)
    setForm(EMPTY_FORM)
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* 헤더 */}
      <div className="bg-white border-b py-6">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">청춘 플랜 · 시뮬레이터</h1>
          <p className="text-sm text-gray-500 mt-1">모으고, 비교하고, 계산하고, 결국 내 집까지</p>
        </div>
      </div>

      {/* 탭 전체 */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <Tabs
          value={activeTab}
          onValueChange={(tab) => {
            if (tab === "roadmap" && !isLoggedIn) {
              router.push("/login?redirect=/site/simulator?tab=roadmap")
              return
            }
            router.push(`/site/simulator?tab=${tab}`)
          }}
        >

          {/* 탭바 */}
          <TabsList className="w-full">
            <TabsTrigger value="assetPlan" className="flex-1">자산 플랜</TabsTrigger>
            <TabsTrigger value="housingCompare" className="flex-1">주거 비교</TabsTrigger>
            <TabsTrigger value="financeFeel" className="flex-1">금융 체감</TabsTrigger>
            <TabsTrigger
              value="roadmap"
              className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              AI청춘 플래너
            </TabsTrigger>
          </TabsList>

          {/* 탭01 자산 플랜 */}
          <TabsContent value="assetPlan">
            <AssetPlan
              plans={plans}
              form={form}
              setForm={setForm}
              editingPlanId={editingPlanId}
              isLoading={isLoading}
              onCreate={handleCreate}
              onEditStart={handleEditStart}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onEditCancel={handleEditCancel}
              onToggleComplete={handleToggleComplete}
              />
          </TabsContent>

          {/* 탭02 주거 비교 */}
          <TabsContent value="housingCompare">
            <HousingCompare userProfile={userProfile} />
          </TabsContent>

          {/* 탭03 금융 체감 */}
          <TabsContent value="financeFeel">
            <FinanceFeel userProfile={userProfile} />
          </TabsContent>

          {/* 탭04 전략 로드맵 */}
          <TabsContent value="roadmap">
            <Roadmap />
          </TabsContent>

        </Tabs>
      </div>

    </div>
  )
}
