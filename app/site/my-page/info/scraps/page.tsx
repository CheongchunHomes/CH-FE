"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AlertCircle, Loader2 } from "lucide-react"

import { ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import {
  AnnouncementScrap,
  getMyAnnouncementScraps,
} from "@/lib/announcement-scraps-api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function MyScrapsPage() {
  const { status, refresh } = useAuth()
  const [scraps, setScraps] = useState<AnnouncementScrap[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    if (status === "loading") {
      setIsLoading(true)
      return
    }

    if (status === "reauthRequired") {
      setIsAuthenticated(true)
      setIsLoading(false)
      return
    }

    if (status !== "authenticated") {
      setIsAuthenticated(false)
      setIsLoading(false)
      setScraps([])
      return
    }

    setIsAuthenticated(true)
    setIsLoading(true)
    setErrorMessage("")

    async function loadScraps() {
      try {
        const data = await getMyAnnouncementScraps()
        setScraps(data)
      } catch (error) {
        const code =
          error instanceof ApiError &&
          error.payload &&
          typeof error.payload === "object" &&
          "code" in error.payload
            ? (error.payload as { code?: string }).code
            : undefined

        if (code === "REAUTH_REQUIRED") {
          await refresh()
          return
        }

        setErrorMessage(error instanceof Error ? error.message : "스크랩 목록을 불러오지 못했습니다.")
      } finally {
        setIsLoading(false)
      }
    }

    loadScraps()
  }, [refresh, status])

  const getDetailHref = (scrap: AnnouncementScrap) => {
    if (scrap.targetType === "공공분양주택") {
      return `/site/sale-center/${scrap.announcementId}`
    }

    return `/site/announcements/${scrap.announcementId}`
  }

  if (!isAuthenticated && !isLoading) {
    return (
      <Card className="border-slate-200/80 bg-white shadow-sm">
        <CardContent className="flex min-h-[360px] flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <AlertCircle size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-950">로그인이 필요합니다</h1>
            <p className="mt-2 text-sm text-slate-500">스크랩한 공고를 확인하려면 먼저 로그인해 주세요.</p>
          </div>
          <Button asChild className="rounded-lg bg-sky-600 text-white hover:bg-sky-700">
            <Link href="/login">로그인으로 이동</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-500">내 스크랩</h1>
      </div>

      <Card className="border-slate-200/80 bg-white shadow-sm">
        <CardContent className="space-y-4 p-6 md:p-8">
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">스크랩한 공고</h2>
              <span className="text-sm font-medium text-slate-500">{scraps.length}건</span>
            </div>

            <div className="min-h-32 bg-slate-200/70 p-5">
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <Loader2 className="animate-spin" size={16} />
                  스크랩 목록을 불러오는 중입니다.
                </div>
              ) : errorMessage ? (
                <p className="text-sm font-medium text-rose-600">{errorMessage}</p>
              ) : scraps.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                  아직 스크랩한 공고가 없습니다.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {scraps.map((scrap) => (
                    <Link key={scrap.scrapId} href={`${getDetailHref(scrap)}?from=scraps`}>
                      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-400">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant={
                              scrap.status === "마감"
                                ? "destructive"
                                : scrap.status === "정정공고"
                                  ? "secondary"
                                  : "default"
                            }
                          >
                            {scrap.status ?? "-"}
                          </Badge>

                          <span className="text-xs text-slate-400">
                            {scrap.region ?? "-"} · {scrap.recuitmentType ?? "-"} ·{" "}
                            {scrap.supplyInstitution ?? "-"}
                          </span>
                        </div>

                        <div className="mb-2 text-sm font-semibold text-slate-950">
                          {scrap.title}
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>
                            {scrap.applyStartDate && scrap.applyEndDate
                              ? `${scrap.applyStartDate} ~ ${scrap.applyEndDate}`
                              : "-"}
                          </span>
                          <span className="text-rose-400">♥ 스크랩</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}