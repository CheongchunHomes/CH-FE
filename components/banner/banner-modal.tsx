"use client"

import { useEffect, useState } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { get } from "@/lib/api"

interface BannerDto {
  id: number
  title: string
  content: string | null
  noticeId: number | null
  linkUrl: string | null
  startDate: string
  endDate: string
  sortOrder: number
  isVisible: boolean
  createdAt: string
}

export default function BannerModal() {
  const [banners, setBanners] = useState<BannerDto[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const closedToday = sessionStorage.getItem("bannerClosedDate")
    const today = new Date().toDateString()
    if (closedToday === today) return

    get<BannerDto[]>("/api/banners", { cache: "no-store" })
      .then((data) => {
        if (data && data.length > 0) {
          setBanners(data)
          setIsOpen(true)
        }
      })
      .catch(() => {})
  }, [])

  const [hideToday, setHideToday] = useState(false)

  const handleClose = () => {
    if (hideToday) {
      sessionStorage.setItem("bannerClosedDate", new Date().toDateString())
    }
    setIsOpen(false)
  }

  if (!isOpen || banners.length === 0) return null

  const current = banners[currentIndex]
  const hasMultiple = banners.length > 1


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(15,23,42,0.45)" }}
      onClick={() => handleClose()}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-white"
        style={{ boxShadow: "0 24px 48px rgba(15,23,42,0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between px-6 pt-6 pb-3">
          <div>
            <span className="text-xs font-semibold tracking-wide text-blue-600 uppercase">청춘홈즈 공지</span>
            <h2 className="mt-1 text-lg font-bold text-slate-900 leading-snug">{current.title}</h2>
          </div>
          <button
            onClick={() => handleClose()}
            className="ml-4 mt-0.5 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>

        {/* 구분선 */}
        <div className="mx-4 border-t-4 border-blue-600" />

        {/* 본문 */}
        <div className="px-6 py-4">
          {current.content ? (
            <p className="text-sm leading-relaxed text-slate-600">{current.content}</p>
          ) : (
            <p className="text-sm text-slate-400">내용이 없습니다.</p>
          )}
        </div>

        {/* 다중 배너 네비게이션 */}
        {hasMultiple && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-30"
            >
              <ChevronLeft size={14} /> 이전
            </button>
            <span className="text-xs text-slate-400">{currentIndex + 1} / {banners.length}</span>
            <button
              onClick={() => setCurrentIndex((i) => Math.min(banners.length - 1, i + 1))}
              disabled={currentIndex === banners.length - 1}
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-30"
            >
              다음 <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="flex items-center justify-between px-6 pb-5 pt-2">
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={hideToday}
              onChange={(e) => setHideToday(e.target.checked)}
              className="accent-blue-600"
            />
            오늘 그만보기
          </label>
          {current.linkUrl ? (

            <a href={current.linkUrl}
            className="rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700"
              >
              자세히 보기
            </a>
            ) : (
            <button
            onClick={handleClose}
             className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:border-blue-600 hover:bg-blue-600 hover:text-white"
            >
              확인
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
