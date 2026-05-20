import { get, post, request } from "@/lib/api"
import type { Policy } from "@/lib/policies-api"

export interface PolicyScrap extends Policy {
    scrapId: number
    scrapedAt: string
    policyVisible?: boolean
}

// 내가 스크랩한 제도 ID 목록 조회
// 지원제도 리스트/상세페이지에서 하트 상태 표시할 때 사용
export async function getMyPolicyScrapIds(): Promise<number[]> {
    return get<number[]>("/api/policy-scraps/me/ids", {
        cache: "no-store",
    })
}

// 내 제도 스크랩 목록 조회
// 마이페이지에서 사용
export async function getMyPolicyScraps(): Promise<PolicyScrap[]> {
    return get<PolicyScrap[]>("/api/policy-scraps/me", {
        cache: "no-store",
    })
}

// 제도 스크랩 등록
export async function addPolicyScrap(policyId: number): Promise<void> {
    await post(`/api/policy-scraps/${policyId}`, {})
}

// 제도 스크랩 취소
export async function removePolicyScrap(policyId: number): Promise<void> {
    await request("DELETE", `/api/policy-scraps/${policyId}`)
}