"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { getAnnouncement, Announcement } from "@/lib/announcements-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Share2, Printer } from "lucide-react";
import { AnnouncementSidebar } from "@/components/announcements-sidebar";


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
  const searchParams = useSearchParams()
  const from = searchParams.get("from")

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

  const handleClose = () => {
  if (from === "scraps") {
    router.push("/site/my-page/info/scraps")
    return
  }

  router.push("/site/sale-center")
  }

  if (loading) return <div className="p-8 text-center text-gray-400">불러오는 중...</div>;
  if (!data) return <div className="p-8 text-center text-gray-400">공고를 찾을 수 없습니다.</div>;

  return (
    <div className="flex min-h-screen">
      <AnnouncementSidebar />

      {/* 본문 */}
      <main className="flex-1 px-8 py-8">

        {/* 상단 타이틀 + 아이콘 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">분양 모집공고</h1>
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

            <Button variant="default" size="sm" onClick={handleClose}>
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
                <td className="bg-gray-50 px-4 py-3 text-gray-500 w-1/4">총 공급세대수</td>
                <td className="px-4 py-3 text-gray-800">{dash(data.totHshldCo)}</td>
            </tr>
            <tr className="border-b border-gray-100">
                <td className="bg-gray-50 px-4 py-3 text-gray-500">주택유형</td>
                <td className="px-4 py-3 text-gray-800">{dash(data.recuitmentType)}</td>
            </tr>
            <tr className="border-b border-gray-100">
                <td className="bg-gray-50 px-4 py-3 text-gray-500">공급기관</td>
                <td className="px-4 py-3 text-gray-800">{dash(data.supplyInstitution)}</td>
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
                <td className="bg-gray-50 px-4 py-3 text-gray-500 w-1/4">계약금</td>
                <td className="px-4 py-3 text-blue-600 font-medium">
                  {data.rentGtn != null ? `${data.rentGtn.toLocaleString()}원` : "-"}
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="bg-gray-50 px-4 py-3 text-gray-500 w-1/4">중도금</td>
                <td className="px-4 py-3 text-blue-600 font-medium">
                  {data.mtRntchrg != null ? `${data.mtRntchrg.toLocaleString()}원` : "-"}
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="bg-gray-50 px-4 py-3 text-gray-500 w-1/4">잔금</td>
                <td className="px-4 py-3 text-blue-600 font-medium">
                  {data.surlus != null ? `${data.surlus.toLocaleString()}원` : "-"}
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
                {data.applyStartDate && data.applyEndDate
                    ? `${data.applyStartDate} ~ ${data.applyEndDate}`
                    : "-"}
                </td>
            </tr>
            <tr className="border-b border-gray-100">
                <td className="bg-gray-50 px-4 py-3 text-gray-500">당첨자 발표일</td>
                <td className="px-4 py-3 text-gray-800">{dash(data.przwnerPresnatnDe)}</td>
            </tr>
            <tr>
                <td className="bg-gray-50 px-4 py-3 text-gray-500">계약 기간</td>
                <td className="px-4 py-3 text-gray-800">
                {data.cntrctCnclsBgnde && data.cntrctCnclsEndde
                    ? `${data.cntrctCnclsBgnde} ~ ${data.cntrctCnclsEndde}`
                    : "-"}
                </td>
            </tr>
            </tbody>
        </table>
        </section>

        {/* 안내사항 */}
        <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
            <h2 className="text-sm font-semibold text-gray-800">안내사항</h2>
        </div>

        <div className="border border-gray-200 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {data.content ? (
            <div className="mb-4">{data.content}</div>
            ) : (
            <p className="mb-4">
                상세 신청자격, 제출서류, 유의사항은 원문 공고문에서 확인해 주세요.
            </p>
            )}

            {data.sourceUrl ? (
            <Button
                size="sm"
                onClick={() => window.open(data.sourceUrl, "_blank")}
            >
                원문 공고문 보기
            </Button>
            ) : (
            <span className="text-gray-400">원문 URL 정보가 없습니다.</span>
            )}
        </div>
        </section>
      </main>
    </div>
  );
}