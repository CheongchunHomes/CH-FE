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
export interface AssetPlanData {
  planId: number
  category: AssetCategory
  planName: string
  baseAsset: number | null
  goalAmount: number | null
  monthlySaving: number | null
  startDate: string | null
  endDate: string | null
  isCompleted: boolean 
  createdAt: string
}

// 폼 입력값 타입
export interface AssetPlanForm {
  category: AssetCategory
  planName: string
  baseAsset: number | null
  goalAmount: number | null
  monthlySaving: number | null
  startDate: string | null
  endDate: string | null
  isCompleted: boolean
}