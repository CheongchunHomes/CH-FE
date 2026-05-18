// 카테고리 타입
export type AssetCategory =
  | "HOUSING"
  | "TRAVEL"
  | "CAR"
  | "ELECTRONICS"
  | "WEDDING"
  | "FASHION"
  | "EDUCATION"
  | "OTHER"

// DB에서 받아오는 플랜 타입
export interface AssetPlan {
  planId: number
  category: AssetCategory
  planName: string
  baseAsset: number | null
  goalAmount: number | null
  monthlySaving: number | null
  targetDate: string | null
  planData: Record<string, unknown> | null
  createdAt: string
}

// 폼 입력값 타입
export interface AssetPlanForm {
  category: AssetCategory
  planName: string
  baseAsset: number | null
  goalAmount: number | null
  monthlySaving: number | null
  targetDate: string | null
  planData: Record<string, unknown> | null
}