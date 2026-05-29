import { post } from "@/lib/api"

export type ApplySubscriptionParams = {
  announcementId: number
  supplyId: number | null
  housingType: string
  applicantName: string
  postalCode: string
  address: string
  detailAddress: string
}

export async function applySubscription(params: ApplySubscriptionParams) {
  return post("/api/subscription/applications", params)
}
