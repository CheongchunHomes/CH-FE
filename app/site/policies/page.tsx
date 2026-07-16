"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandInput,
} from "@/components/ui/command"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import {
  getMyPolicyScrapIds,
  addPolicyScrap,
  removePolicyScrap,
} from "@/lib/policy-scraps-api"

import { getPolicies, Policy } from "@/lib/policies-api"

const MAIN_CATEGORIES = ["전체", "주거비지원", "기타지원", "기타사업"]

const SUB_CATEGORIES_BY_MAIN: Record<string, string[]> = {
  전체: ["전체"],
  주거비지원: [
    "전체",
    "월세지원",
    "보증금지원",
    "주거급여",
    "이사비지원",
    "융자지원",
  ],
  기타지원: [
    "전체",
    "주거교육",
    "상담지원",
    "공간지원",
    "기타",
  ],
  기타사업: ["전체", "기타"],
}

const PRIMARY_REGIONS = [
  "전체",
  "서울",
  "경기",
  "인천",
  "부산",
  "대전",
  "대구",
  "광주",
]

const EXTRA_REGIONS = [
  "강원",
  "세종",
  "울산",
  "제주",
  "경북",
  "경남",
  "전남",
  "전북",
  "충남",
  "충북",
]

const STATUSES = ["전체", "신청가능", "상시신청", "신청예정", "마감", "확인필요"]

const SUPPORT_TYPE = [
  "전체",
  "현금",
  "현금(융자)",
  "현금(감면)",
  "서비스",
  "기타",
]

export default function PoliciesPage() {
  const router = useRouter()

  const [policies, setPolicies] = useState<Policy[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showMoreRegions, setShowMoreRegions] = useState(false)

  const [likedIds, setLikedIds] = useState<Set<number>>(new Set())
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)

  const [mainCategory, setMainCategory] = useState<string | undefined>()
  const [subCategory, setSubCategory] = useState<string | undefined>()
  const [region, setRegion] = useState<string | undefined>()
  const [status, setStatus] = useState<string | undefined>()
  const [supportType, setSupportType] = useState<string | undefined>()
  const [keyword, setKeyword] = useState("")

  const [appliedRegion, setAppliedRegion] = useState<string | undefined>()
  const [appliedStatus, setAppliedStatus] = useState<string | undefined>()
  const [appliedSupportType, setAppliedSupportType] = useState<string | undefined>()
  const [appliedMainCategory, setAppliedMainCategory] = useState<string | undefined>()
  const [appliedSubCategory, setAppliedSubCategory] = useState<string | undefined>()
  const [appliedKeyword, setAppliedKeyword] = useState("")

  const fetchData = async (
    page: number,
    mainCategory?: string,
    subCategory?: string,
    region?: string,
    status?: string,
    supportType?: string,
    keyword?: string,
  ) => {
    try {
      const data = await getPolicies({
        mainCategory,
        subCategory,
        region,
        status,
        supportType,
        keyword,
        page,
        size: 10,
      })

      setPolicies(data.content)
      setTotalElements(data.totalElements)
      setTotalPages(data.totalPages)
      setCurrentPage(data.number)
    } catch (e) {
      console.error(e)
    }
  }

  // 지원제도 목록 조회
  useEffect(() => {
    fetchData(0)
  }, [])

  // 내가 스크랩한 지원제도 ID 목록 조회
  // 로그인 안 했거나 토큰이 만료된 경우에는 요청하지 않고 빈 Set으로 처리
  useEffect(() => {
    const fetchScrapIds = async () => {
      try {
        const ids = await getMyPolicyScrapIds();
        setLikedIds(new Set(ids));
      } catch (e) {
        setLikedIds(new Set());
      }
    };

    fetchScrapIds()
  }, [])

  const handleMainCategoryClick = (category: string) => {
    const nextMainCategory = category === "전체" ? undefined : category

    setMainCategory(nextMainCategory)
    setSubCategory(undefined)
  }

  const handleSubCategoryClick = (category: string) => {
    setSubCategory(category === "전체" ? undefined : category)
  }

  const handleSearch = () => {
    const trimmedKeyword = keyword.trim()

    setAppliedMainCategory(mainCategory)
    setAppliedSubCategory(subCategory)
    setAppliedRegion(region)
    setAppliedStatus(status)
    setAppliedSupportType(supportType)
    setAppliedKeyword(trimmedKeyword)

    fetchData(0, mainCategory, subCategory, region, status, supportType, trimmedKeyword)
  }

  const handleApply = () => {
    handleSearch()
  }

const handleLike = async (id: number) => {
  const isLiked = likedIds.has(id);

  try {
    if (isLiked) {
      await removePolicyScrap(id);
    } else {
      await addPolicyScrap(id);
    }

    setLikedIds((prev) => {
      const next = new Set(prev);

      if (isLiked) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  } catch (e) {
    setLoginDialogOpen(true);
  }
}

  const handleReset = () => {
    setMainCategory(undefined)
    setSubCategory(undefined)
    setRegion(undefined)
    setStatus(undefined)
    setSupportType(undefined)
    setShowMoreRegions(false)
    setKeyword("")

    setAppliedMainCategory(undefined)
    setAppliedSubCategory(undefined)
    setAppliedRegion(undefined)
    setAppliedStatus(undefined)
    setAppliedSupportType(undefined)
    setAppliedKeyword("")

    fetchData(0)
  }

  const selectedMainForSub = mainCategory ?? "전체"
  const subCategories = SUB_CATEGORIES_BY_MAIN[selectedMainForSub] ?? ["전체"]

  return (
    <div className="min-h-screen bg-white">
      <AlertDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>로그인이 필요한 서비스입니다</AlertDialogTitle>
            <AlertDialogDescription>
              스크랩 기능은 로그인 후 이용할 수 있습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => router.push("/login?redirect=/site/policies")}
            >
              로그인하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <main className="px-8 py-8">
        <div className="mx-auto max-w-4xl">
          {/* 검색바 */}
          <div className="mb-4 flex gap-2">
            <Command className="relative flex-1 overflow-visible rounded-lg border border-gray-200 bg-white">
              <CommandInput
                placeholder="정책명, 지원내용, 기관명으로 검색"
                value={keyword}
                onValueChange={setKeyword}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch()
                  }
                }}
              />
            </Command>

            <Button
              variant="outline"
              size="sm"
              className="h-12 px-4"
              onClick={handleSearch}
            >
              <Search className="mr-1 h-4 w-4" />
              검색
            </Button>
          </div>

          {/* 필터 */}
          <div className="mb-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-800">
                  지원제도 조건
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  원하는 조건을 선택한 뒤 적용 버튼을 눌러주세요.
                </div>
              </div>
            </div>

            {/* 대분류 */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="min-w-[70px] text-sm font-medium text-gray-600">
                대분류
              </span>

              <div className="flex flex-wrap gap-1.5">
                {MAIN_CATEGORIES.map((category) => {
                  const isActive =
                    (category === "전체" && !mainCategory) ||
                    mainCategory === category

                  return (
                    <Button
                      key={category}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleMainCategoryClick(category)}
                      className={isActive ? "shadow-md" : ""}
                    >
                      {category}
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* 소분류 */}
            <div className="flex flex-wrap items-start gap-2 py-2">
              <span className="min-w-[70px] pt-2 text-sm font-medium text-gray-600">
                세부유형
              </span>

              <div className="flex flex-1 flex-col gap-1">
                <div className="flex flex-wrap gap-1.5">
                  {subCategories.map((category) => {
                    const isActive =
                      (category === "전체" && !subCategory) ||
                      subCategory === category

                    return (
                      <Button
                        key={category}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSubCategoryClick(category)}
                        className={isActive ? "shadow-md" : ""}
                      >
                        {category}
                      </Button>
                    )
                  })}
                </div>

                <p className="text-xs text-gray-400">
                  대분류를 선택하면 관련 세부유형이 표시됩니다.
                </p>
              </div>
            </div>

            {/* 지역 */}
            <div className="flex flex-wrap items-center gap-2 py-2">
              <span className="min-w-[70px] text-sm font-medium text-gray-600">
                지역
              </span>

              <div className="flex flex-1 flex-wrap gap-1.5">
                {PRIMARY_REGIONS.map((r) => {
                  const isActive = (r === "전체" && !region) || region === r

                  return (
                    <Button
                      key={r}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRegion(r === "전체" ? undefined : r)}
                      className={isActive ? "shadow-md" : ""}
                    >
                      {r}
                    </Button>
                  )
                })}

                {showMoreRegions &&
                  EXTRA_REGIONS.map((r) => {
                    const isActive = region === r

                    return (
                      <Button
                        key={r}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => setRegion(r)}
                        className={isActive ? "shadow-md" : ""}
                      >
                        {r}
                      </Button>
                    )
                  })}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMoreRegions((prev) => !prev)}
                  className="text-gray-500 hover:text-blue-600"
                >
                  {showMoreRegions ? "지역 접기 ▲" : "지역 더보기 ▼"}
                </Button>
              </div>
            </div>

            <div className="mt-3 flex justify-start">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedFilters((prev) => !prev)}
                className="text-gray-500 hover:text-blue-600"
              >
                {showAdvancedFilters ? "상세 필터 접기 ▲" : "상세 필터 보기 ▼"}
              </Button>
            </div>

            {showAdvancedFilters && (
              <>
                <div className="my-3 h-px bg-gray-200" />

                {/* 신청상태 */}
                <div className="flex flex-wrap items-center gap-2 py-2">
                  <span className="min-w-[70px] text-sm font-medium text-gray-600">
                    신청상태
                  </span>

                  <div className="flex flex-wrap gap-1.5">
                    {STATUSES.map((s) => {
                      const isActive = (s === "전체" && !status) || status === s

                      return (
                        <Button
                          key={s}
                          variant={isActive ? "default" : "outline"}
                          size="sm"
                          onClick={() => setStatus(s === "전체" ? undefined : s)}
                          className={isActive ? "shadow-md" : ""}
                        >
                          {s}
                        </Button>
                      )
                    })}
                  </div>
                </div>

                {/* 지원유형 */}
                <div className="flex flex-wrap items-center gap-2 py-2">
                  <span className="min-w-[70px] text-sm font-medium text-gray-600">
                    지원유형
                  </span>

                  <div className="flex flex-wrap gap-1.5">
                    {SUPPORT_TYPE.map((type) => {
                      const isActive =
                        (type === "전체" && !supportType) ||
                        supportType === type

                      return (
                        <Button
                          key={type}
                          variant={isActive ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            setSupportType(type === "전체" ? undefined : type)
                          }
                          className={isActive ? "shadow-md" : ""}
                        >
                          {type}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

            <div className="my-3 h-px bg-gray-200" />

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                전체 초기화
              </Button>
              <Button size="sm" onClick={handleApply}>
                적용
              </Button>
            </div>
          </div>

          {/* 리스트 상단 */}
          <div className="mb-2 text-sm text-gray-500">
            지원제도 리스트 ·{" "}
            <span className="text-gray-400">{totalElements}건</span>
          </div>

          {/* 리스트 */}
          <div className="flex flex-col gap-2">
            {policies.map((policy) => (
              <Card
                key={policy.policyId}
                className="flex cursor-pointer items-center gap-4 p-5 transition-all hover:border-gray-400"
                onClick={() =>
                  window.open(`/site/policies/${policy.policyId}`, "_blank")
                }
              >
                <div className="flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <Badge variant="default">
                      {policy.mainCategory ?? "지원제도"}
                    </Badge>

                    {policy.subCategory && (
                      <Badge variant="secondary">{policy.subCategory}</Badge>
                    )}

                    <span className="text-xs text-gray-400">
                      {[
                        policy.region,
                        policy.supportType,
                        policy.supervisingInstitution,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>

                  <div className="mb-1 text-sm font-medium text-gray-900">
                    {policy.title}
                  </div>

                  <div className="mb-1 line-clamp-2 text-xs leading-5 text-gray-500">
                    {policy.summary ||
                      policy.targetDesc ||
                      "상세 내용을 확인해 주세요."}
                  </div>

                  <div className="text-xs text-gray-400">
                    신청기간: {policy.applyPeriod || "확인 필요"}
                    {policy.status ? ` · ${policy.status}` : ""}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleLike(policy.policyId)
                  }}
                  className={`rounded-full border ${
                    likedIds.has(policy.policyId)
                      ? "border-red-400 text-red-400"
                      : "border-gray-200 text-gray-300"
                  }`}
                >
                  ♥
                </Button>
              </Card>
            ))}

            {policies.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
                조회된 지원제도가 없습니다.
              </div>
            )}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      fetchData(
                        currentPage - 1,
                        appliedMainCategory,
                        appliedSubCategory,
                        appliedRegion,
                        appliedStatus,
                        appliedSupportType,
                        appliedKeyword,
                      )
                    }
                    className={
                      currentPage === 0
                        ? "pointer-events-none opacity-40"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => {
                  const start = Math.max(0, currentPage - 4)
                  const end = Math.min(totalPages - 1, start + 9)
                  const adjustedStart = Math.max(0, end - 9)

                  if (i < adjustedStart || i > end) return null

                  return (
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() =>
                          fetchData(
                            i,
                            appliedMainCategory,
                            appliedSubCategory,
                            appliedRegion,
                            appliedStatus,
                            appliedSupportType,
                            appliedKeyword,
                          )
                        }
                        isActive={i === currentPage}
                        className="cursor-pointer"
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}

                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      fetchData(
                        currentPage + 1,
                        appliedMainCategory,
                        appliedSubCategory,
                        appliedRegion,
                        appliedStatus,
                        appliedSupportType,
                        appliedKeyword,
                      )
                    }
                    className={
                      currentPage === totalPages - 1
                        ? "pointer-events-none opacity-40"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </main>
    </div>
  )
}
