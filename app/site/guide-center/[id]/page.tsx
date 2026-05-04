"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAnnouncement, Announcement } from "@/lib/announcements-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Share2, Printer, ChevronUp, Home } from "lucide-react";

const SIDEBAR_MENUS = [
  {
    label: "공공임대주택",
    children: [{ label: "모집공고", path: "/site/guide-center" }],
  },
  {
    label: "공공분양주택",
    children: [{ label: "모집공고", path: "/site/guide-center" }],
  },
];

const dash = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "number" && isNaN(value)) return "-";
  return value;
};

export default function AnnouncementDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getAnnouncement(Number(id))
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  if (loading) return <div className="p-8 text-center text-gray-400">불러오는 중...</div>;
  if (!data) return <div className="p-8 text-center text-gray-400">공고를 찾을 수 없습니다.</div>;

  return (
    <div className="flex min-h-screen">

      {/* 사이드바 */}
      <aside className="w-48 border-r border-gray-200 px-3 py-6 shrink-0">
        <div className="flex flex-col items-center mb-5">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mb-1">
            <Home className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-bold text-gray-800">청년공고찾기</span>
        </div>

        <div className="flex flex-col gap-1 text-sm">
          {SIDEBAR_MENUS.map((menu) => (
            <div key={menu.label}>
              <div className="flex items-center justify-between px-2 py-2 font-semibold text-gray-700">
                <span>{menu.label}</span>
                <ChevronUp className="w-4 h-4 text-gray-400" />
              </div>
              {menu.children.map((child) => (
                <button
                  key={child.label}
                  onClick={() => router.push(child.path)}
                  className="w-full text-left px-4 py-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  · {child.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* 본문 */}
      <main className="flex-1 px-8 py-8">

        {/* 상단 타이틀 + 아이콘 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">입주 모집공고</h1>
          <div className="flex items-center gap-2">
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full" onClick={handleCopyUrl}>
                  <Share2 className="w-4 h-4 text-gray-500" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-auto p-2 text-xs text-gray-600">
                해당 URL이 복사됩니다.
              </HoverCardContent>
            </HoverCard>

            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 text-gray-500" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-auto p-2 text-xs text-gray-600">
                해당 페이지를 인쇄합니다.
              </HoverCardContent>
            </HoverCard>

            <Button variant="default" size="sm" onClick={() => window.close()}>
              ✕ 닫기
            </Button>
          </div>
        </div>

        {/* 헤더 카드 */}
        <Card className="p-5 mb-6 border-blue-400">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant={data.status === "마감" ? "destructive" : data.status === "정정공고" ? "secondary" : "default"}>
              {dash(data.status)}
            </Badge>
            <span className="text-xs text-gray-400">{dash(data.region)} · {dash(data.recuitmentType)} · {dash(data.supplyInstitution)}</span>
          </div>
          <div className="text-base font-semibold text-gray-900 mb-4">{dash(data.title)}</div>
          <div className="flex flex-col gap-2 text-sm text-gray-600">
            <div className="flex gap-3"><span className="text-gray-400 min-w-[64px]">· 단지위치</span>{dash(data.address)}</div>
            <div className="flex gap-3"><span className="text-gray-400 min-w-[64px]">· 시행기관</span>{dash(data.supplyInstitution)}</div>
            <div className="flex gap-3"><span className="text-gray-400 min-w-[64px]">· 대상유형</span>{dash(data.targetType)}</div>
          </div>
        </Card>

        {/* 단지 기본정보 */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
            <h2 className="text-sm font-semibold text-gray-800">단지 기본정보</h2>
          </div>
          <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="bg-gray-50 px-4 py-3 text-gray-500 w-1/4">총 세대수</td>
                <td className="px-4 py-3 text-gray-800">{dash(data.totHshldCo)}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="bg-gray-50 px-4 py-3 text-gray-500">난방방식</td>
                <td className="px-4 py-3 text-gray-800">{dash(data.heatMthdNm)}</td>
              </tr>
              <tr>
                <td className="bg-gray-50 px-4 py-3 text-gray-500">주소</td>
                <td className="px-4 py-3 text-gray-800">{dash(data.address)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 공급 정보 */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
            <h2 className="text-sm font-semibold text-gray-800">공급 정보</h2>
          </div>
          <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="bg-gray-50 px-4 py-3 text-gray-500 w-1/4">임대보증금</td>
                <td className="px-4 py-3 text-blue-600 font-medium">
                  {data.rentGtn ? `${data.rentGtn.toLocaleString()}원` : "-"}
                </td>
              </tr>
              <tr>
                <td className="bg-gray-50 px-4 py-3 text-gray-500">월 임대료</td>
                <td className="px-4 py-3 text-blue-600 font-medium">
                  {data.mtRntchrg ? `${data.mtRntchrg.toLocaleString()}원` : "-"}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 일정 정보 */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
            <h2 className="text-sm font-semibold text-gray-800">일정 정보</h2>
          </div>
          <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="bg-gray-50 px-4 py-3 text-gray-500 w-1/4">모집공고일</td>
                <td className="px-4 py-3 text-gray-800">{dash(data.beginDe)}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="bg-gray-50 px-4 py-3 text-gray-500">접수 기간</td>
                <td className="px-4 py-3 text-gray-800">
                  {data.applyStartDate && data.applyEndDate ? `${data.applyStartDate} ~ ${data.applyEndDate}` : "-"}
                </td>
              </tr>
              <tr>
                <td className="bg-gray-50 px-4 py-3 text-gray-500">공고 종료일</td>
                <td className="px-4 py-3 text-gray-800">{dash(data.endDe)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 공고 내용 */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
            <h2 className="text-sm font-semibold text-gray-800">공고 내용</h2>
          </div>
          <div className="border border-gray-200 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {dash(data.content)}
          </div>
        </section>
      </main>
    </div>
  );
}