"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { getAnnouncements, Announcement } from "@/lib/announcements-api";

const REGIONS = ["전체", "서울특별시", "경기도", "인천광역시", "부산광역시", "대구광역시", "광주광역시", "대전광역시", "울산광역시"];
const STATUSES = ["전체", "일반공고", "정정공고", "마감"];

export default function GuideCenterPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [region, setRegion] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [appliedRegion, setAppliedRegion] = useState<string | undefined>();
  const [appliedStatus, setAppliedStatus] = useState<string | undefined>();
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());

  const fetchData = async (page: number, region?: string, status?: string) => {
    try {
      const data = await getAnnouncements({ region, status, page, size: 10 });
      setAnnouncements(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
      setCurrentPage(data.number);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData(0);
  }, []);

  const handleApply = () => {
    setAppliedRegion(region);
    setAppliedStatus(status);
    fetchData(0, region, status)
  }

  const handleReset = () => {
    setRegion(undefined);
    setStatus(undefined);
    setAppliedRegion(undefined);
    setAppliedStatus(undefined);
    fetchData(0);
  };

  const handleLike = (id: number) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4">
      {/* 검색바 */}
      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 h-9 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none"
          placeholder="단지명, 지역, 제목으로 검색"
        />
        <Button variant="outline" size="sm">검색</Button>
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

       {/* 공고 상태 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500 min-w-[52px]">공고 상태</span>
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map((s) => {
              const isActive = (s === "전체" && !status) || status === s;
              return (
                <Button
                  key={s}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatus(s === "전체" ? undefined : s)}
                >
                  {s}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-gray-200 my-3" />

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>전체 초기화</Button>
          <Button size="sm" onClick={handleApply}>적용</Button>
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
            className="flex items-center gap-3 p-4 cursor-pointer hover:border-gray-400 transition-all"
            onClick={() => window.open(a.sourceUrl, "_blank")}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant={a.status === "마감" ? "destructive" : a.status === "정정공고" ? "secondary" : "default"}>
                  {a.status}
                </Badge>
                <span className="text-xs text-gray-400">{a.region} · {a.recuitmentType} · {a.supplyInstitution}</span>
              </div>
              <div className="text-sm font-medium text-gray-900 mb-1">{a.title}</div>
              <div className="text-xs text-gray-500">
                {a.applyStartDate} ~ {a.applyEndDate}
              </div>
            </div>
            {/* 좋아요 버튼 */}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); handleLike(a.announcementId); }}
              className={`rounded-full border ${likedIds.has(a.announcementId) ? "border-red-400 text-red-400" : "border-gray-200 text-gray-300"}`}
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
              onClick={() => fetchData(currentPage - 1, appliedRegion, appliedStatus)}
              className={currentPage === 0 ? "pointer-events-none opacity-40" : "cursor-pointer"}
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
                  onClick={() => fetchData(i, appliedRegion, appliedStatus)}
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
              onClick={() => fetchData(currentPage + 1, appliedRegion, appliedStatus)}
              className={currentPage === totalPages - 1 ? "pointer-events-none opacity-40" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )}
    </div>
  );
}