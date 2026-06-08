// app/site/simulator/page.tsx

"use client"

import { Suspense, useState, useEffect } from "react"
import { get, post, request } from "@/lib/api"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import AssetPlan      from "@/components/simulator/AssetPlan"
import HousingCompare from "@/components/simulator/HousingCompare"
import FinanceFeel    from "@/components/simulator/FinanceFeel"
import Roadmap        from "@/components/simulator/Roadmap"
import { AssetPlanData, AssetPlanForm } from "@/lib/simulatorUtils"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DiagnosisForm } from "@/lib/diagnosisUtils"

// 폼 초기값
const EMPTY_FORM: AssetPlanForm = {
  category:      "HOUSING",
  planName:      "",
  baseAsset:     null,
  goalAmount:    null,
  monthlySaving: null,
  startDate:     null,
  endDate:       null,
  isCompleted:   false,
}

function SimulatorPageContent() {
  const [plans,         setPlans]         = useState<AssetPlanData[]>([])
  const [form,          setForm]           = useState<AssetPlanForm>(EMPTY_FORM)
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null)
  const [isLoading,     setIsLoading]     = useState(false)
  const [userProfile,   setUserProfile]   = useState<DiagnosisForm | null>(null)
  // 로그인 여부 — layout/navbar와 공유하는 useAuth() 사용
  // 진단 미완료 유저(userProfile null)여도 로그인이면 탭4 진입 허용
  const { status } = useAuth()
  const isLoggedIn = status === "authenticated" || status === "reauthRequired"

  const router       = useRouter()
  const searchParams = useSearchParams()
  const activeTab    = searchParams.get("tab") ?? "assetPlan"

  useEffect(() => {
    // 진단 프로필 조회 — 진단 완료면 data, 미완료면 404(null 유지)
    get<DiagnosisForm>("/api/diagnosis/profile")
      .then(setUserProfile)
      .catch(() => {})

    void fetchPlans()
  }, [])

  // GET /api/simulator/asset-plans
  async function fetchPlans() {
    setIsLoading(true)
    try {
      const data = await get<AssetPlanData[]>("/api/simulator/asset-plans", { cache: "no-store" })
      setPlans(data ?? [])
    } catch {
      // 비로그인 시 401 — 빈 배열 유지
      setPlans([])
    } finally {
      setIsLoading(false)
    }
  }

  // POST /api/simulator/asset-plans
  async function handleCreate() {
    await post("/api/simulator/asset-plans", form)
    setForm(EMPTY_FORM)
    await fetchPlans()
  }

  // 수정 모드 진입 — 플랜 값을 폼에 세팅
  function handleEditStart(plan: AssetPlanData) {
    setEditingPlanId(plan.planId)
    setForm({
      category:      plan.category,
      planName:      plan.planName,
      baseAsset:     plan.baseAsset,
      goalAmount:    plan.goalAmount,
      monthlySaving: plan.monthlySaving,
      startDate:     plan.startDate,
      endDate:       plan.endDate,
      isCompleted:   plan.isCompleted,
    })
  }

  // PUT /api/simulator/asset-plans/:id
  async function handleUpdate() {
    if (!editingPlanId) return
    await request("PUT", `/api/simulator/asset-plans/${editingPlanId}`, { body: form })
    setEditingPlanId(null)
    setForm(EMPTY_FORM)
    await fetchPlans()
  }

  // 달성 토글 — 낙관적 업데이트 (실패 시 롤백)
  async function handleToggleComplete(planId: number, isCompleted: boolean) {
    const plan = plans.find((p) => p.planId === planId)
    if (!plan) return

    // 롤백용 이전 state 저장
    const prev = [...plans]

    // 로컬 state 먼저 반영
    setPlans((prevPlans) => prevPlans.map((p) => p.planId === planId ? { ...p, isCompleted } : p))

    // 백엔드 동기화
    const { planId: _, createdAt: __, ...planForm } = plan
    try {
      await request("PUT", `/api/simulator/asset-plans/${planId}`, {
        body: { ...planForm, isCompleted },
      })
    } catch {
      // 실패 시 이전 state로 롤백
      setPlans(prev)
    }
  }

  // DELETE /api/simulator/asset-plans/:id
  async function handleDelete(planId: number) {
    await request("DELETE", `/api/simulator/asset-plans/${planId}`)
    await fetchPlans()
  }

  // 수정 취소
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
            // [FIX] 탭4 차단 기준 = 로그인 여부만
            // 진단 미완료(userProfile null)여도 로그인이면 진입 허용
            if (tab === "roadmap" && !isLoggedIn) {
              router.push("/login?redirect=/site/simulator?tab=roadmap")
              return
            }
            router.push(`/site/simulator?tab=${tab}`)
          }}
        >
          <TabsList className="w-full">
            <TabsTrigger value="assetPlan"      className="flex-1">자산 플랜</TabsTrigger>
            <TabsTrigger value="housingCompare" className="flex-1">주거 비교</TabsTrigger>
            <TabsTrigger value="financeFeel"    className="flex-1">금융 체감</TabsTrigger>
            <TabsTrigger value="roadmap"        className="flex-1">청춘 플랜</TabsTrigger>
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

          {/* 탭04 청춘 플랜 — userProfile null이어도 렌더링, 내부에서 graceful 처리 */}
          <TabsContent value="roadmap">
            <Roadmap />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
export default function SimulatorPage() {
  return (
    <Suspense fallback={null}>
      <SimulatorPageContent/>
    </Suspense>
  )
}
