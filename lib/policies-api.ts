import { get } from "@/lib/api"

export interface Policy {
    policyId: number
    title: string
    region: string | null
    mainCategory: string | null
    subCategory: string | null
    originalCategory: string | null
    keyword: string | null
    summary: string | null
    targetDesc: string | null
    applyPeriod: string | null
    supportType: string | null
    supervisingInstitution: string | null
    status: string | null
}

export interface PolicyDetail extends Policy {
    externalId: string | null
    sourceType: string | null
    originalMiddleCategory: string | null
    content: string | null
    excludedTarget: string | null
    selectionCriteria: string | null
    applyMethod: string | null
    screeningMethod: string | null
    businessPeriod: string | null
    etc: string | null
    operatingInstitution: string | null
    receptionOrg: string | null
    contact: string | null
    sourceUrl: string | null
    onlineApplyUrl: string | null
    law: string | null
    ageMin: number | null
    ageMax: number | null
    incomeMin: number | null
    incomeMax: number | null
    incomeDesc: string | null
    homelessRequired: boolean | null
    isVisible: boolean | null
}

export interface PageResponse<T> {
    content: T[]
    totalElements: number
    totalPages: number
    number: number
    size: number
    first: boolean
    last: boolean
}

export async function getPolicies(params: {
    mainCategory?: string
    subCategory?: string
    keyword?: string
    page?: number
    size?: number
}): Promise<PageResponse<Policy>> {
    return get<PageResponse<Policy>>("/api/policies", {
        query: {
            mainCategory: params.mainCategory,
            subCategory: params.subCategory,
            keyword: params.keyword,
            page: params.page ?? 0,
            size: params.size ?? 10,
        },
        cache: "no-store",
    })
}

export async function getPolicy(id: number): Promise<PolicyDetail> {
    return get<PolicyDetail>(`/api/policies/${id}`, {
        cache: "no-store",
    })
}