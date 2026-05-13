"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { getAnnouncements, Announcement } from "@/lib/announcements-api";
import { AnnouncementSidebar } from "@/components/announcements-sidebar";
import {
  getMyAnnouncementScrapIds,
  addAnnouncementScrap,
  removeAnnouncementScrap,
} from "@/lib/announcement-scraps-api";

const REGIONS = [
  "전체",
  "서울",
  "경기",
  "인천",
  "강원",
  "대전",
  "세종",
  "대구",
  "광주",
  "울산",
  "부산",
  "제주",
  "경북",
  "경남",
  "전남",
  "전북",
  "충남",
  "충북",
];

const STATUSES = ["전체", "접수중", "접수예정", "마감"];

export default function GuideCenterPage() {
  const searchParams = useSearchParams();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<Announcement[]>([]);
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);

  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const [region, setRegion] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [keyword, setKeyword] = useState("");
  const [deadlineSoon, setDeadlineSoon] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedRegion, setAppliedRegion] = useState<string | undefined>();
  const [appliedStatus, setAppliedStatus] = useState<string | undefined>();
  const [appliedDeadlineSoon, setAppliedDeadlineSoon] = useState(false);

  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  
    useEffect(() => {
      const fetchScrapIds = async () => {
        try {
          const ids = await getMyAnnouncementScrapIds();
          setLikedIds(new Set(ids));
        } catch (e) {
          // 비로그인 또는 토큰 만료 상태에서는 스크랩 목록을 못 가져오는 게 정상
          // 공고 리스트는 계속 보여야 하므로 빈 Set으로 처리
          setLikedIds(new Set());
        }
      };

        fetchScrapIds();
    }, []); 

  const fetchData = async (
    page: number,
    region?: string,
    status?: string,
    keyword?: string,
    deadlineSoon?: boolean
  ) => {
    try {
      const data = await getAnnouncements({
        region,
        status,
        keyword,
        deadlineSoon,
        sourceType: "마이홈포털-공공분양주택",
        targetType: "공공분양주택",
        page,
        size: 10,
      });

      setAnnouncements(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
      setCurrentPage(data.number);
    } catch (e) {
      console.error(e);
    }
  };

  const resetAll = () => {
    setRegion(undefined);
    setStatus(undefined);
    setKeyword("");
    setDeadlineSoon(false);

    setAppliedRegion(undefined);
    setAppliedStatus(undefined);
    setAppliedKeyword("");
    setAppliedDeadlineSoon(false);

    setSearchSuggestions([]);
    setIsSuggestionLoading(false);
    setIsSearchOpen(false);

    fetchData(0);
  };

  useEffect(() => {
    resetAll();
  }, [searchParams.get("reset")]);

  useEffect(() => {
    const trimmedKeyword = keyword.trim();

    if (!trimmedKeyword) {
      setSearchSuggestions([]);
      setIsSuggestionLoading(false);
      return;
    }

    setIsSuggestionLoading(true);

    const timer = setTimeout(async () => {
      try {
        const data = await getAnnouncements({
          keyword: trimmedKeyword,
          sourceType: "마이홈포털-공공분양주택",
          targetType: "공공분양주택",
          page: 0,
          size: 8,
        });

        setSearchSuggestions(data.content);
      } catch (e) {
        console.error(e);
        setSearchSuggestions([]);
      } finally {
        setIsSuggestionLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword]);

  const handleSearch = () => {
    const trimmedKeyword = keyword.trim();

    setAppliedKeyword(trimmedKeyword);
    setAppliedRegion(region);
    setAppliedStatus(status);
    setAppliedDeadlineSoon(deadlineSoon);

    fetchData(0, region, status, trimmedKeyword, deadlineSoon);
    setIsSearchOpen(false);
  };

  const handleApply = () => {
    const trimmedKeyword = keyword.trim();

    setAppliedRegion(region);
    setAppliedStatus(status);
    setAppliedKeyword(trimmedKeyword);
    setAppliedDeadlineSoon(deadlineSoon);

    fetchData(0, region, status, trimmedKeyword, deadlineSoon);
    setIsSearchOpen(false);
  };

  const handleReset = () => {
    resetAll();
  };

 const handleLike = async (id: number) => {
  const isLiked = likedIds.has(id);

  try {
    if (isLiked) {
      await removeAnnouncementScrap(id);
    } else {
      await addAnnouncementScrap(id);
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
    alert("로그인 후 이용할 수 있습니다.");
  }
 };

  const filteredCommandItems = searchSuggestions.map((a) => ({
    type: a.recuitmentType || "공고",
    label: a.title,
    value: [
      a.title,
      a.region,
      a.address,
      a.supplyInstitution,
      a.recuitmentType,
    ]
      .filter(Boolean)
      .join(" "),
    keyword: a.title,
  }));

  return (
  <div className="flex min-h-screen">
    <AnnouncementSidebar />

    <main className="flex-1 px-8 py-8">
      <div className="max-w-4xl mx-auto">
        {/* 검색바 */}
        <div className="flex gap-2 mb-4">
          <Command className="relative flex-1 overflow-visible rounded-lg border border-gray-200 bg-white">
            <CommandInput
              placeholder="단지명, 지역, 제목으로 검색"
              value={keyword}
              onValueChange={(value) => {
                setKeyword(value);
                setIsSearchOpen(true);
              }}
              onFocus={() => {
                if (keyword.trim()) {
                  setIsSearchOpen(true);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />

            {isSearchOpen && keyword.trim().length > 0 && (
              <CommandList className="absolute left-0 top-full z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-md">
                <CommandEmpty>
                  {isSuggestionLoading
                    ? "검색 중입니다."
                    : "검색 결과가 없습니다."}
                </CommandEmpty>

                <CommandGroup heading="연관 검색어">
                  {filteredCommandItems.map((item, index) => (
                    <CommandItem
                      key={`${item.type}-${item.value}-${index}`}
                      value={item.value}
                      onSelect={() => {
                        const selectedKeyword = item.keyword;

                        setKeyword(selectedKeyword);
                        setAppliedKeyword(selectedKeyword);
                        setAppliedRegion(region);
                        setAppliedStatus(status);
                        setAppliedDeadlineSoon(deadlineSoon);

                        fetchData(0, region, status, selectedKeyword, deadlineSoon);
                        setIsSearchOpen(false);
                      }}
                    >
                      <Search className="h-4 w-4" />
                      <span className="truncate">{item.label}</span>
                      <span className="ml-auto shrink-0 text-xs text-gray-400">
                        {item.type}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            )}
          </Command>

          <Button
            variant="outline"
            size="sm"
            className="h-12 px-4"
            onClick={handleSearch}
          >
            검색
          </Button>
        </div>

        {/* 필터 */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-4">
          <div className="text-xs text-gray-400 mb-2">기본 조건</div>

          {/* 지역 */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-sm text-gray-500 min-w-[52px]">지역</span>
            <div className="flex flex-wrap gap-1.5">
              {REGIONS.map((r) => {
                const isActive = (r === "전체" && !region) || region === r;

                return (
                  <Button
                    key={r}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRegion(r === "전체" ? undefined : r)}
                  >
                    {r}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* 추가 필터 */}
          <div className="flex items-center gap-4 flex-wrap py-2">
            <span className="text-sm font-medium text-gray-600 min-w-[60px]">
              추가 필터
            </span>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={deadlineSoon ? "default" : "outline"}
                size="sm"
                onClick={() => setDeadlineSoon((prev) => !prev)}
                className={`px-4 h-9 ${deadlineSoon ? "shadow-md" : ""}`}
              >
                마감일 임박
              </Button>

              <Button variant="outline" size="sm" disabled className="px-4 h-9">
                무주택 여부
              </Button>

              <Button variant="outline" size="sm" disabled className="px-4 h-9">
                청약통장 여부
              </Button>

              <Button variant="outline" size="sm" disabled className="px-4 h-9">
                출퇴근 1시간 이내
              </Button>
            </div>
          </div>

          {/* 공고 상태 */}
          <div className="flex items-center gap-4 flex-wrap py-2">
            <span className="text-sm font-medium text-gray-600 min-w-[60px]">
              공고 상태
            </span>

            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => {
                const isActive = (s === "전체" && !status) || status === s;

                return (
                  <Button
                    key={s}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatus(s === "전체" ? undefined : s)}
                    className={`px-4 h-9 ${isActive ? "shadow-md" : ""}`}
                  >
                    {s}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-gray-200 my-3" />

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              전체 초기화
            </Button>
            <Button size="sm" onClick={handleApply}>
              적용
            </Button>
          </div>
        </div>

        {/* 리스트 */}
        <div className="text-sm text-gray-500 mb-2">
          공고 리스트 · <span className="text-gray-400">{totalElements}건</span>
        </div>

        <div className="flex flex-col gap-2">
          {announcements.map((a) => (
            <Card
              key={a.announcementId}
              className="flex items-center gap-4 p-5 cursor-pointer hover:border-gray-400 transition-all"
              onClick={() =>
                window.open(`/site/sale-center/${a.announcementId}`, "_blank")
              }
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge
                    variant={
                      a.status === "마감"
                        ? "destructive"
                        : a.status === "접수예정"
                          ? "secondary"
                          : "default"
                    }
                  >
                    {a.status}
                  </Badge>

                  <span className="text-xs text-gray-400">
                    {a.region} · {a.recuitmentType} · {a.supplyInstitution}
                  </span>
                </div>

                <div className="text-sm font-medium text-gray-900 mb-1">
                  {a.title}
                </div>

                <div className="text-xs text-gray-500">
                  {a.applyStartDate} ~ {a.applyEndDate}
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike(a.announcementId);
                }}
                className={`rounded-full border ${
                  likedIds.has(a.announcementId)
                    ? "border-red-400 text-red-400"
                    : "border-gray-200 text-gray-300"
                }`}
              >
                ♥
              </Button>
            </Card>
          ))}
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
                      appliedRegion,
                      appliedStatus,
                      appliedKeyword,
                      appliedDeadlineSoon
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
                const start = Math.max(0, currentPage - 4);
                const end = Math.min(totalPages - 1, start + 9);
                const adjustedStart = Math.max(0, end - 9);

                if (i < adjustedStart || i > end) return null;

                return (
                  <PaginationItem key={i}>
                    <PaginationLink
                      onClick={() =>
                        fetchData(
                          i,
                          appliedRegion,
                          appliedStatus,
                          appliedKeyword,
                          appliedDeadlineSoon
                        )
                      }
                      isActive={i === currentPage}
                      className="cursor-pointer"
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    fetchData(
                      currentPage + 1,
                      appliedRegion,
                      appliedStatus,
                      appliedKeyword,
                      appliedDeadlineSoon
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
 );
}