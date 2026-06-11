"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { getAnnouncements, Announcement } from "@/lib/announcements-api";
import { AnnouncementSidebar } from "@/components/announcements-sidebar";
import {
  getMyAnnouncementScrapIds,
  addAnnouncementScrap,
  removeAnnouncementScrap,
} from "@/lib/announcement-scraps-api";

const PRIMARY_REGIONS = [
  "전체",
  "서울",
  "경기",
  "인천",
  "부산",
  "대전",
  "대구",
  "광주",
];

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
];

const LOCATION_FILTERS = [
  "전체",
  "거리 순",
  "30km 이내",
  "50km 이내",
];

type AdvancedFilterType = "location" | null;

const STATUSES = ["전체", "접수중", "접수예정", "마감"];

type UserLocation = {
  latitude: number;
  longitude: number;
};

function SaleCenterPageContent() {
  const router = useRouter();
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
  const [showMoreRegions, setShowMoreRegions] = useState(false);

  const [activeAdvancedFilter, setActiveAdvancedFilter] =
    useState<AdvancedFilterType>(null);
  const [locationFilter, setLocationFilter] = useState<string | undefined>();

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedRegion, setAppliedRegion] = useState<string | undefined>();
  const [appliedStatus, setAppliedStatus] = useState<string | undefined>();
  const [appliedDeadlineSoon, setAppliedDeadlineSoon] = useState(false);
  const [appliedLocationFilter, setAppliedLocationFilter] =
    useState<string | undefined>();
  const [appliedLocation, setAppliedLocation] = useState<UserLocation | null>(
    null
  );

  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  useEffect(() => {
    const fetchScrapIds = async () => {
      try {
        const ids = await getMyAnnouncementScrapIds();
        setLikedIds(new Set(ids));
      } catch (e) {
        setLikedIds(new Set());
      }
    };

    fetchScrapIds();
  }, []);

  const isLocationFilterActive = (filter?: string) => {
    return !!filter && filter !== "전체";
  };

  const getLocationFilterGuideText = (filter?: string) => {
    if (filter === "거리 순") {
      return "내 위치 기준 가까운 공고부터 정렬됩니다.";
    }

    if (filter === "30km 이내") {
      return "내 위치 기준 30km 이하 공고만 조회됩니다.";
    }

    if (filter === "50km 이내") {
      return "내 위치 기준 50km 이하 공고만 조회됩니다.";
    }

    return "위치 기반 필터는 좌표가 있는 공고를 기준으로 적용됩니다.";
  };

  const getDisplayStatus = (announcement: Announcement) => {
    if (announcement.applyEndDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const endDate = new Date(announcement.applyEndDate);
      endDate.setHours(0, 0, 0, 0);

      if (endDate < today) {
        return "마감";
      }
    }

    return announcement.status;
  };

  const requestUserLocation = (): Promise<UserLocation | null> => {
    if (!navigator.geolocation) {
      setLocationError("현재 브라우저에서 위치 정보를 사용할 수 없습니다.");
      return Promise.resolve(null);
    }

    setIsLocationLoading(true);
    setLocationError("");

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const nextLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };

          setUserLocation(nextLocation);
          setIsLocationLoading(false);
          resolve(nextLocation);
        },
        () => {
          setLocationError(
            "위치 권한을 허용해야 내 위치 기반 필터를 사용할 수 있습니다."
          );
          setIsLocationLoading(false);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  };

  const getLocationForSearch = async () => {
    if (!isLocationFilterActive(locationFilter)) {
      return null;
    }

    if (userLocation) {
      return userLocation;
    }

    const nextLocation = await requestUserLocation();

    if (!nextLocation) {
      setLocationError("위치 확인 후 다시 적용해 주세요.");
      return null;
    }

    return nextLocation;
  };

  const fetchData = async (
    page: number,
    region?: string,
    status?: string,
    keyword?: string,
    deadlineSoon?: boolean,
    location?: UserLocation | null,
    locationFilter?: string
  ) => {
    try {
      const useLocation = !!location && isLocationFilterActive(locationFilter);

      console.log("[sale-center search params]", {
        region,
        status,
        keyword,
        deadlineSoon,
        targetType: "공공분양주택",
        latitude: useLocation ? location.latitude : undefined,
        longitude: useLocation ? location.longitude : undefined,
        locationFilter: useLocation ? locationFilter : undefined,
        page,
        size: 10,
      });

      const data = await getAnnouncements({
        region,
        status,
        keyword,
        deadlineSoon,
        targetType: "공공분양주택",
        latitude: useLocation ? location.latitude : undefined,
        longitude: useLocation ? location.longitude : undefined,
        locationFilter: useLocation ? locationFilter : undefined,
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
    setShowMoreRegions(false);

    setActiveAdvancedFilter(null);
    setLocationFilter(undefined);

    setUserLocation(null);
    setIsLocationLoading(false);
    setLocationError("");

    setAppliedRegion(undefined);
    setAppliedStatus(undefined);
    setAppliedKeyword("");
    setAppliedDeadlineSoon(false);
    setAppliedLocationFilter(undefined);
    setAppliedLocation(null);

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

  const handleSearch = async () => {
    const trimmedKeyword = keyword.trim();
    const searchLocation = await getLocationForSearch();

    if (isLocationFilterActive(locationFilter) && !searchLocation) {
      return;
    }

    setAppliedKeyword(trimmedKeyword);
    setAppliedRegion(region);
    setAppliedStatus(status);
    setAppliedDeadlineSoon(deadlineSoon);
    setAppliedLocationFilter(locationFilter);
    setAppliedLocation(searchLocation);

    await fetchData(
      0,
      region,
      status,
      trimmedKeyword,
      deadlineSoon,
      searchLocation,
      locationFilter
    );

    setIsSearchOpen(false);
  };

  const handleApply = async () => {
    const trimmedKeyword = keyword.trim();
    const searchLocation = await getLocationForSearch();

    if (isLocationFilterActive(locationFilter) && !searchLocation) {
      return;
    }

    setAppliedRegion(region);
    setAppliedStatus(status);
    setAppliedKeyword(trimmedKeyword);
    setAppliedDeadlineSoon(deadlineSoon);
    setAppliedLocationFilter(locationFilter);
    setAppliedLocation(searchLocation);

    await fetchData(
      0,
      region,
      status,
      trimmedKeyword,
      deadlineSoon,
      searchLocation,
      locationFilter
    );

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
      setLoginDialogOpen(true);
    }
  };

  const uniqueSearchSuggetions = Array.from(
    new Map(
      searchSuggestions.map((a) => [
        `${a.title}-${a.address}-${a.applyEndDate}`,
        a,
      ])
    ).values()
  );

  const filteredCommandItems = uniqueSearchSuggetions.map((a) => ({
    id: a.announcementId,
    type: a.recuitmentType || "공고",
    label: a.title,
    value: [
      a.title,
      a.region,
      a.address,
      a.supplyInstitution,
      a.recuitmentType,
      a.targetType,
    ]
      .filter(Boolean)
      .join(" "),
    keyword: a.title,
  }));

  return (
    <div className="flex min-h-screen">
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
              onClick={() => router.push("/login?redirect=/site/sale-center")}
            >
              로그인하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AnnouncementSidebar />

      <main className="flex-1 px-8 py-8">
        <div className="mx-auto max-w-4xl">
          {/* 검색바 */}
          <div className="mb-4 flex gap-2">
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
                    {filteredCommandItems.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={item.value}
                        onSelect={() => {
                          const selectedKeyword = item.keyword;

                          setKeyword(selectedKeyword);
                          setAppliedKeyword(selectedKeyword);
                          setAppliedRegion(region);
                          setAppliedStatus(status);
                          setAppliedDeadlineSoon(deadlineSoon);
                          setAppliedLocationFilter(undefined);
                          setAppliedLocation(null);

                          fetchData(
                            0,
                            region,
                            status,
                            selectedKeyword,
                            deadlineSoon
                          );

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
          <div className="mb-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="mb-2 text-xs text-gray-400">기본 조건</div>

            {/* 지역 */}
            <div className="flex flex-wrap items-center gap-2 py-2">
              <span className="min-w-[70px] text-sm font-medium text-gray-600">
                지역
              </span>

              <div className="flex flex-1 flex-wrap gap-1.5">
                {PRIMARY_REGIONS.map((r) => {
                  const isActive = (r === "전체" && !region) || region === r;

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
                  );
                })}

                {showMoreRegions &&
                  EXTRA_REGIONS.map((r) => {
                    const isActive = region === r;

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
                    );
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

            {/* 추가 필터 */}
            <div className="flex flex-wrap items-center gap-4 py-2">
              <span className="min-w-[60px] text-sm font-medium text-gray-600">
                추가 필터
              </span>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant={deadlineSoon ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDeadlineSoon((prev) => !prev)}
                  className={`h-9 px-4 ${deadlineSoon ? "shadow-md" : ""}`}
                >
                  마감일 임박
                </Button>

                <Button
                  variant={
                    activeAdvancedFilter === "location" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => {
                    setActiveAdvancedFilter((prev) =>
                      prev === "location" ? null : "location"
                    );

                    if (!userLocation) {
                      requestUserLocation();
                    }
                  }}
                  className={
                    activeAdvancedFilter === "location" ? "shadow-md" : ""
                  }
                >
                  내 위치 기반
                </Button>
              </div>
            </div>

            {/* 내 위치 기반 세부 필터 */}
            {activeAdvancedFilter === "location" && (
              <div className="flex flex-wrap items-start gap-2 py-2">
                <span className="min-w-[70px] pt-2 text-sm font-medium text-gray-600">
                  위치 기준
                </span>

                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex flex-wrap gap-1.5">
                    {LOCATION_FILTERS.map((filter) => {
                      const isActive =
                        (filter === "전체" && !locationFilter) ||
                        locationFilter === filter;

                      return (
                        <Button
                          key={filter}
                          variant={isActive ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            setLocationFilter(
                              filter === "전체" ? undefined : filter
                            )
                          }
                          className={isActive ? "shadow-md" : ""}
                        >
                          {filter}
                        </Button>
                      );
                    })}
                  </div>

                  <p className="text-xs text-gray-400">
                    {getLocationFilterGuideText(locationFilter)}
                  </p>

                  {isLocationLoading && (
                    <p className="text-xs text-blue-500">
                      현재 위치를 확인하는 중입니다...
                    </p>
                  )}

                  {userLocation && !isLocationLoading && (
                    <p className="text-xs text-green-600">
                      현재 위치가 확인되었습니다. 적용 버튼을 누르면 위치 기반
                      필터가 적용됩니다.
                    </p>
                  )}

                  {locationError && (
                    <p className="text-xs text-red-500">{locationError}</p>
                  )}
                </div>
              </div>
            )}

            {/* 공고 상태 */}
            <div className="flex flex-wrap items-center gap-4 py-2">
              <span className="min-w-[60px] text-sm font-medium text-gray-600">
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
                      className={`h-9 px-4 ${isActive ? "shadow-md" : ""}`}
                    >
                      {s}
                    </Button>
                  );
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

          {/* 리스트 */}
          <div className="mb-2 text-sm text-gray-500">
            공고 리스트 ·{" "}
            <span className="text-gray-400">{totalElements}건</span>
          </div>

          <div className="flex flex-col gap-2">
            {announcements.map((a) => {
              const displayStatus = getDisplayStatus(a);

              return (
                <Card
                  key={a.announcementId}
                  className="flex cursor-pointer items-center gap-4 p-5 transition-all hover:border-gray-400"
                  onClick={() =>
                    window.open(
                      `/site/sale-center/${a.announcementId}`,
                      "_blank"
                    )
                  }
                >
                  <div className="flex-1">
                    <div className="mb-1.5 flex items-center gap-2">
                      <Badge
                        variant={
                          displayStatus === "마감" ||
                          displayStatus === "접수마감"
                            ? "destructive"
                            : displayStatus === "접수예정"
                              ? "secondary"
                              : "default"
                        }
                      >
                        {displayStatus}
                      </Badge>

                      <span className="text-xs text-gray-400">
                        {a.region} · {a.recuitmentType} · {a.supplyInstitution}
                      </span>
                    </div>

                    <div className="mb-1 text-sm font-medium text-gray-900">
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
              );
            })}

            {announcements.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
                조회된 공고가 없습니다.
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
                        appliedRegion,
                        appliedStatus,
                        appliedKeyword,
                        appliedDeadlineSoon,
                        appliedLocation,
                        appliedLocationFilter
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
                            appliedDeadlineSoon,
                            appliedLocation,
                            appliedLocationFilter
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
                        appliedDeadlineSoon,
                        appliedLocation,
                        appliedLocationFilter
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

export default function SaleCenterPage() {
  return (
    <Suspense fallback={null}>
      <SaleCenterPageContent />
    </Suspense>
  );
}
