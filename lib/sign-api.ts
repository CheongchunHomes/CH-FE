import { get, post } from "@/lib/api"

export type SignStatus = "ISSUED" | "PROVIDER_SIGNED" | "COMPLETED" | "CANCELED"

export type SignDocument = {
  signId: number
  providerId: number
  providerNickname: string
  customerId: number
  customerNickname: string
  propertyId: number
  propertyTitle: string
  propertyAddress: string
  status: SignStatus
  createdAt: string
  updatedAt: string
}

export async function getMySigns(): Promise<SignDocument[]> {
  return get<SignDocument[]>("/api/sign/my", {
    cache: "no-store",
  })
}

export async function cancelSign(signId: number): Promise<SignDocument> {
  return post<SignDocument>(`/api/sign/${signId}/cancel`, {})
}
