import { get, post } from "@/lib/api"
import type { FileSignedUrlResponse } from "@/lib/api"

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

export type ContractParty = {
  userId: number
  realName: string | null
  address: string | null
  phone: string | null
  birthDate: string | null
}

export type ContractProperty = {
  propertyId: number
  address: string | null
  depositAmount: number | null
  supplyAreaM2: number | null
  exclusiveAreaM2: number | null
  buildingUse: string | null
  moveInDate: string | null
}

export type SignContractDocument = {
  signId: number
  status: SignStatus
  createdAt: string
  updatedAt: string
  property: ContractProperty
  provider: ContractParty
  customer: ContractParty
  contract: {
    leaseEndDate: string | null
    contractAmount: number | null
    interimAmount1: number | null
    interimAmount1Date: string | null
    interimAmount2: number | null
    interimAmount2Date: string | null
    balanceAmount: number | null
    balanceDate: string | null
    specialTerms: string | null
    buildingDong: string | null
    unitHo: string | null
    rentedPart: string | null
    providerSignatureFileId: number | null
    customerSignatureFileId: number | null
    completedPdfFileId: number | null
    providerSignedAt: string | null
    customerSignedAt: string | null
  } | null
}

export type BrokerSignDocument = {
  objectPath: string
  signedUrl: string
  expiresInSeconds: number
  contentType: string
  filename: string
}

export async function getMySigns(): Promise<SignDocument[]> {
  return get<SignDocument[]>("/api/sign/my", {
    cache: "no-store",
  })
}

export async function createSign(propertyId: number): Promise<SignDocument> {
  return post<SignDocument>("/api/sign", {
    propertyId,
  })
}

export async function getSignContract(signId: number): Promise<SignContractDocument> {
  return get<SignContractDocument>(`/api/sign/${signId}/contract`, {
    cache: "no-store",
  })
}

export type ProviderSignInput = {
  leaseEndDate: string
  contractAmount: number | null
  interimAmount1: number | null
  interimAmount1Date: string | null
  interimAmount2: number | null
  interimAmount2Date: string | null
  balanceAmount: number | null
  balanceDate: string | null
  specialTerms: string
  buildingDong: string
  unitHo: string
  rentedPart: string
  providerSignatureFileId: number
}

export async function providerSign(signId: number, input: ProviderSignInput): Promise<void> {
  return post<void, ProviderSignInput>(`/api/sign/${signId}/provider-sign`, input)
}

export async function customerSign(
  signId: number,
  input: { customerSignatureFileId: number; completedPdfFileId: number },
): Promise<void> {
  return post<void, { customerSignatureFileId: number; completedPdfFileId: number }>(
    `/api/sign/${signId}/customer-sign`,
    input,
  )
}

export async function getBrokerSign(): Promise<BrokerSignDocument> {
  return get<BrokerSignDocument>("/api/sign/broker-sign", {
    cache: "no-store",
  })
}

export async function getSignFileSignedUrl(signId: number, fileId: number): Promise<FileSignedUrlResponse> {
  return get<FileSignedUrlResponse>(`/api/sign/${signId}/files/${fileId}/signed-url`, {
    cache: "no-store",
  })
}

export async function cancelSign(signId: number): Promise<SignDocument> {
  return post<SignDocument>(`/api/sign/${signId}/cancel`, {})
}
