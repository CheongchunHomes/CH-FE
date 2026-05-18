"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ExternalLink, Printer, Share2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

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
    <tr className="border-b border-slate-100 last:border-b-0">
      <td className="w-[280px] bg-slate-50 px-4 py-3 text-sm text-slate-500">
        {label}
      </td>
      <td className="px-4 py-3 text-sm whitespace-pre-line text-slate-950">
        {String(value)}
      </td>
    </tr>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-600" />
      <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
    </div>
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
      <SectionTitle title={title} />

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="whitespace-pre-line text-sm leading-7 text-slate-950">
          {content}
        </p>
      </div>
    </section>
  )
}

export default function PolicyDetailPage() {
  const params = useParams()

  const [data, setData] = useState<PolicyDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const id = Number(params.id)

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      alert("URL이 복사되었습니다.")
    } catch (e) {
      alert("URL 복사에 실패했습니다.")
    }
  }

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
      <main className="min-h-screen bg-white px-8 py-8">
        <div className="mx-auto max-w-6xl text-sm text-slate-500">
          지원제도 정보를 불러오는 중입니다.
        </div>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-white px-8 py-8">
        <div className="mx-auto max-w-6xl">
          <Card className="border-slate-200 p-8 text-center text-sm text-slate-500 shadow-none">
            지원제도 정보를 찾을 수 없습니다.
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white px-8 py-8">
      <div className="mx-auto max-w-6xl">
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
                  <Share2 className="h-4 w-4 text-slate-500" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-auto p-2 text-xs text-slate-600">
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
                  <Printer className="h-4 w-4 text-slate-500" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-auto p-2 text-xs text-slate-600">
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
        <Card className="mb-6 rounded-lg border border-blue-500 bg-white shadow-none">
          <CardHeader className="p-5">
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
            </div>

            <CardTitle className="text-lg font-bold leading-snug text-slate-950">
              {data.title}
            </CardTitle>

            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-500">
              {data.summary || "지원제도 상세 정보를 확인해 주세요."}
            </p>
          </CardHeader>
        </Card>

        {/* 기본 정보 */}
        <section className="mb-6">
          <SectionTitle title="기본 정보" />

          <table className="w-full overflow-hidden rounded-lg border border-slate-200 text-sm">
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
          <SectionTitle title="대상 조건" />

          <table className="w-full overflow-hidden rounded-lg border border-slate-200 text-sm">
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
          <SectionTitle title="문의 및 링크" />

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            {data.contact && (
              <div>
                <div className="mb-1 text-xs font-medium text-slate-400">
                  문의처
                </div>
                <p className="whitespace-pre-line text-sm leading-6 text-slate-950">
                  {data.contact}
                </p>
              </div>
            )}

            <Separator className="my-4" />

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
                <span className="text-sm text-slate-400">
                  원문 URL 정보가 없습니다.
                </span>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}