"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Share2, Printer } from "lucide-react";

import { getPolicy, PolicyDetail } from "@/lib/policies-api"

function InfoRow({
  label,
  value,
}: {
  label: string
  value?: string | number | boolean | null
}) {
  if (value === null || value === undefined || value === "") return null

  return (
    <tr className="border-b border-gray-100 last:border-b-0">
      <td className="w-1/4 bg-gray-50 px-4 py-3 text-sm text-gray-500">
        {label}
      </td>
      <td className="px-4 py-3 text-sm text-gray-800 whitespace-pre-line">
        {String(value)}
      </td>
    </tr>
  )
}

function TextSection({
  title,
  content,
}: {
  title: string
  content?: string | null
}) {
  if (!content || content.trim() === "") return null

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full bg-blue-600" />
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-4">
          <p className="whitespace-pre-line text-sm leading-7 text-gray-700">
            {content}
          </p>
        </CardContent>
      </Card>
    </section>
  )
}

export default function PolicyDetailPage() {
  const params = useParams()
  const router = useRouter()

  const [data, setData] = useState<PolicyDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const id = Number(params.id)

  const handleCopyUrl = () => {
   navigator.clipboard.writeText(window.location.href);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getPolicy(id)
        setData(result)
      } catch (e) {
        console.error(e)
        alert("지원제도 정보를 불러오지 못했습니다.")
      } finally {
        setLoading(false)
      }
    }

    if (!Number.isNaN(id)) {
      fetchData()
    }
  }, [id])

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-8 py-8">
        <div className="mx-auto max-w-4xl text-sm text-gray-500">
          지원제도 정보를 불러오는 중입니다.
        </div>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-gray-50 px-8 py-8">
        <div className="mx-auto max-w-4xl">
          <Card className="p-8 text-center text-sm text-gray-500">
            지원제도 정보를 찾을 수 없습니다.
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-8 py-8">
      <div className="mx-auto max-w-4xl">
       {/* 상단 버튼 */}
          <div className="mb-4 flex items-center justify-end">
            <div className="flex items-center gap-2">
                <HoverCard>
                <HoverCardTrigger asChild>
                    <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={handleCopyUrl}
                    >
                    <Share2 className="h-4 w-4 text-gray-500" />
                    </Button>
                </HoverCardTrigger>
                <HoverCardContent className="w-auto p-2 text-xs text-gray-600">
                    해당 URL이 복사됩니다.
                </HoverCardContent>
                </HoverCard>

                <HoverCard>
                <HoverCardTrigger asChild>
                    <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={() => window.print()}
                    >
                    <Printer className="h-4 w-4 text-gray-500" />
                    </Button>
                </HoverCardTrigger>
                <HoverCardContent className="w-auto p-2 text-xs text-gray-600">
                    해당 페이지를 인쇄합니다.
                </HoverCardContent>
                </HoverCard>

                <Button
                variant="default"
                size="sm"
                onClick={() => window.close()}
                >
                ✕ 닫기
                </Button>
          </div>
        </div>

        {/* 헤더 */}
        <Card className="mb-6 border-gray-200 shadow-sm">
          <CardHeader>
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge>{data.mainCategory ?? "지원제도"}</Badge>

              {data.subCategory && (
                <Badge variant="secondary">{data.subCategory}</Badge>
              )}

              {data.status && (
                <Badge
                  variant={
                    data.status === "마감"
                      ? "destructive"
                      : data.status === "확인필요"
                        ? "outline"
                        : "default"
                  }
                >
                  {data.status}
                </Badge>
              )}

              {data.sourceType && (
                <Badge variant="outline">{data.sourceType}</Badge>
              )}
            </div>

            <CardTitle className="text-2xl font-bold leading-snug text-gray-900">
              {data.title}
            </CardTitle>

            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-500">
              {data.summary || "지원제도 상세 정보를 확인해 주세요."}
            </p>
          </CardHeader>
        </Card>

        {/* 기본 정보 */}
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-600" />
            <h2 className="text-sm font-semibold text-gray-800">기본 정보</h2>
          </div>

          <table className="w-full overflow-hidden rounded-xl border border-gray-200 text-sm">
            <tbody>
              <InfoRow label="지역" value={data.region || "전국/확인 필요"} />
              <InfoRow label="지원유형" value={data.supportType} />
              <InfoRow label="신청기간" value={data.applyPeriod} />
              <InfoRow label="사업기간" value={data.businessPeriod} />
              <InfoRow label="주관기관" value={data.supervisingInstitution} />
              <InfoRow label="운영기관" value={data.operatingInstitution} />
              <InfoRow label="접수기관" value={data.receptionOrg} />
              <InfoRow label="원본 분류" value={data.originalCategory} />
            </tbody>
          </table>
        </section>

        {/* 대상 조건 */}
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-600" />
            <h2 className="text-sm font-semibold text-gray-800">대상 조건</h2>
          </div>

          <table className="w-full overflow-hidden rounded-xl border border-gray-200 text-sm">
            <tbody>
              <InfoRow
                label="연령"
                value={
                  data.ageMin || data.ageMax
                    ? `${data.ageMin ?? "-"}세 ~ ${data.ageMax ?? "-"}세`
                    : "제한 없음/확인 필요"
                }
              />
              <InfoRow
                label="소득 조건"
                value={
                  data.incomeDesc ||
                  (data.incomeMin || data.incomeMax
                    ? `${data.incomeMin ?? "-"} ~ ${data.incomeMax ?? "-"}`
                    : "확인 필요")
                }
              />
              <InfoRow
                label="무주택 조건"
                value={
                  data.homelessRequired === true
                    ? "필요"
                    : data.homelessRequired === false
                      ? "명시 없음"
                      : "확인 필요"
                }
              />
            </tbody>
          </table>
        </section>

        <TextSection title="지원대상" content={data.targetDesc} />
        <TextSection title="지원내용" content={data.content} />
        <TextSection title="선정기준" content={data.selectionCriteria} />
        <TextSection title="신청방법" content={data.applyMethod} />
        <TextSection title="심사방법" content={data.screeningMethod} />
        <TextSection title="구비서류" content={data.requiredDocuments} />
        <TextSection title="제외대상" content={data.excludedTarget} />
        <TextSection title="기타사항" content={data.etc} />
        <TextSection title="관련 법령" content={data.law} />

        {/* 문의 / 링크 */}
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-600" />
            <h2 className="text-sm font-semibold text-gray-800">문의 및 링크</h2>
          </div>

          <Card className="border-gray-200 shadow-sm">
            <CardContent className="space-y-4 p-4">
              {data.contact && (
                <div>
                  <div className="mb-1 text-xs font-medium text-gray-400">
                    문의처
                  </div>
                  <p className="whitespace-pre-line text-sm leading-6 text-gray-700">
                    {data.contact}
                  </p>
                </div>
              )}

              <Separator />

              <div className="flex flex-wrap gap-2">
                {data.onlineApplyUrl && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => window.open(data.onlineApplyUrl!, "_blank")}
                  >
                    온라인 신청
                    <ExternalLink className="ml-1 h-4 w-4" />
                  </Button>
                )}

                {data.sourceUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(data.sourceUrl!, "_blank")}
                  >
                    원문 보기
                    <ExternalLink className="ml-1 h-4 w-4" />
                  </Button>
                )}

                {!data.onlineApplyUrl && !data.sourceUrl && (
                  <span className="text-sm text-gray-400">
                    원문 URL 정보가 없습니다.
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}