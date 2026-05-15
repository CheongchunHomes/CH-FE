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
  기타사업: [
    "전체",
    "기타",
  ],
}

export default function PoliciesPage() {
  const router = useRouter()

  const [policies, setPolicies] = useState<Policy[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)

  const [mainCategory, setMainCategory] = useState<string | undefined>()
  const [subCategory, setSubCategory] = useState<string | undefined>()
  const [keyword, setKeyword] = useState("")

  const [appliedMainCategory, setAppliedMainCategory] = useState<string | undefined>()
  const [appliedSubCategory, setAppliedSubCategory] = useState<string | undefined>()
  const [appliedKeyword, setAppliedKeyword] = useState("")

  const fetchData = async (
    page: number,
    mainCategory?: string,
    subCategory?: string,
    keyword?: string,
  ) => {
    try {
      const data = await getPolicies({
        mainCategory,
        subCategory,
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

  useEffect(() => {
    fetchData(0)
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
    setAppliedKeyword(trimmedKeyword)

    fetchData(0, mainCategory, subCategory, trimmedKeyword)
  }

  const handleApply = () => {
    handleSearch()
  }

  const handleReset = () => {
    setMainCategory(undefined)
    setSubCategory(undefined)
    setKeyword("")

    setAppliedMainCategory(undefined)
    setAppliedSubCategory(undefined)
    setAppliedKeyword("")

    fetchData(0)
  }

  const selectedMainForSub = mainCategory ?? "전체"
  const subCategories = SUB_CATEGORIES_BY_MAIN[selectedMainForSub] ?? ["전체"]

  return (
    <div className="min-h-screen bg-white">

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
            <div className="mb-2 text-xs text-gray-400">지원제도 조건</div>

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
            <div className="flex flex-wrap items-center gap-2 py-2">
              <span className="min-w-[70px] text-sm font-medium text-gray-600">
                세부유형
              </span>

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
            </div>

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
                onClick={() => router.push(`/site/policies/${policy.policyId}`)}
              >
                <div className="flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <Badge variant="default">
                      {policy.mainCategory ?? "지원제도"}
                    </Badge>

                    {policy.subCategory && (
                      <Badge variant="secondary">
                        {policy.subCategory}
                      </Badge>
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
                    {policy.summary || policy.targetDesc || "상세 내용을 확인해 주세요."}
                  </div>

                  <div className="text-xs text-gray-400">
                    신청기간: {policy.applyPeriod || "확인 필요"}
                    {policy.status ? ` · ${policy.status}` : ""}
                  </div>
                </div>
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