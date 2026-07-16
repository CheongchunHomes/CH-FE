import { get, post } from "@/lib/api"

export type ApplySubscriptionParams = {
  announcementId: number
  supplyId: number | null
  housingType: string
  applicantName: string
  postalCode: string
  address: string
  detailAddress: string
}

export type SubscriptionApplicationSummary = {
  id?: number | null
  userId?: number | null
  announcementId?: number | null
  announcementTitle?: string | null
  status?: "PENDING" | "APPLIED" | "CANCELED" | string
  supplyId?: number | null
  housingType?: string | null
  applicantName?: string | null
  resultAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export async function applySubscription(params: ApplySubscriptionParams) {
  return post("/api/subscription/applications", params)
}

export async function getMySubscriptionApplicationSummary(): Promise<SubscriptionApplicationSummary | null> {
  try {
    return await get<SubscriptionApplicationSummary>("/api/subscription/applications/me", {
      cache: "no-store",
      suppressGlobalError: true,
    })
  } catch {
    return null
  }
}
