"use client"

import { useEffect, useState } from "react"
import { ArrowRight, Landmark, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { loadLoanProducts, type LoanProductView } from "@/lib/loan/loan-products"

const clamp4Style = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical" as const,
  WebkitLineClamp: 4,
  overflow: "hidden",
}

export function LoanProductBrowser() {
  const router = useRouter()
  const [products, setProducts] = useState<LoanProductView[]>([])
  const [selectedSelectionId, setSelectedSelectionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const getProductSelectionId = (product: LoanProductView, index: number) => {
    return product.externalCode?.trim() || `${product.key}-${index}`
  }

  useEffect(() => {
    let cancelled = false

    void loadLoanProducts()
      .then((list) => {
        if (cancelled) return
        setProducts(list)
        setSelectedSelectionId((current) => {
          if (current && list.some((item, index) => getProductSelectionId(item, index) === current)) {
            return current
          }
          return list.length > 0 ? getProductSelectionId(list[0], 0) : null
        })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const selected = selectedSelectionId
    ? products.find((product, index) => getProductSelectionId(product, index) === selectedSelectionId) ?? null
    : null

  const openContract = (key = selected?.key) => {
    if (!key) return
    router.push(`/site/loan?product=${key}`)
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
        <section className="rounded-[2rem] border border-slate-200/80 bg-white shadow-sm">
          <div className="px-6 py-6 lg:px-8 lg:py-8">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700">
                <Sparkles size={14} />
                대출상품 비교
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold tracking-[0.2em] text-slate-400">현재 선택</p>
                <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
                  {selected?.title ?? (loading ? "상품을 불러오는 중" : "등록된 상품이 없습니다")}
                </h1>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">계약서 제목</p>
                  <p className="mt-2 text-lg font-black text-slate-950">
                    {selected?.contractTitle ?? "선택한 계약서 제목"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {selected?.contractSubtitle ?? "상품을 선택하면 계약서 제목이 바뀝니다."}
                  </p>
                </div>
                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">금리</p>
                  <p className="mt-2 text-2xl font-black text-blue-600">{selected?.rateLabel ?? "-"}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">선택한 상품 기준 금리가 표시됩니다.</p>
                </div>
              </div>

              <section className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold tracking-[0.18em] text-slate-400">상품 안내</p>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">
                      {selected?.shortTitle ?? "선택한 상품 상세 안내"}
                    </h2>
                  </div>
                  <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {loading ? "불러오는 중" : `총 ${products.length}개`}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold text-slate-400">상품 설명</p>
                    <p className="mt-2 text-sm leading-7 text-slate-700" style={clamp4Style}>
                      {selected?.summary ?? "등록된 상품이 없습니다."}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold text-slate-400">적용 조건</p>
                    <p className="mt-2 text-sm leading-7 text-slate-700" style={clamp4Style}>
                      {selected?.conditions ?? "상품을 선택하면 조건이 표시됩니다."}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold text-slate-400">제공기관 / 유형</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {selected?.provider ?? "-"} / {selected?.loanType ?? "-"}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold text-slate-400">한도 / 소득</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      최대 {selected?.maxAmount ?? "-"}만원 · 소득 {selected?.incomeLimit ?? "-"}만원
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 md:col-span-2">
                    <p className="text-xs font-semibold text-slate-400">노출 / 정책 여부</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      정책대출 {selected?.isPolicyLoan ? "예" : "아니오"} · 노출 {selected?.isVisible ? "예" : "아니오"}
                    </p>
                  </div>
                </div>
              </section>

              <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">계약 상태</p>
                    <div className="mt-2 text-2xl font-black text-slate-950">
                      {selected ? "상품 선택 완료" : "상품 선택 대기"}
                    </div>
                  </div>
                  <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    계약서 확인 대기
                  </div>
                </div>

                <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-white p-4">
                  <div className="text-xs font-semibold text-slate-400">다음 단계</div>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    상품을 선택한 뒤 계약서 보기 버튼으로 상세 계약서 화면으로 이동합니다.
                  </p>
                </div>

                <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-white p-4">
                  <div className="text-xs font-semibold text-slate-400">선택 상품</div>
                  <div className="mt-1 text-lg font-black text-slate-950">
                    {selected?.shortTitle ?? "상품을 선택해주세요"}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {selected?.summary ?? "상품을 선택하면 상세 안내가 아래에 표시됩니다."}
                  </p>
                </div>

                <div className="mt-5 flex justify-end">
                  <Button type="button" className="px-5" disabled={!selected} onClick={() => openContract()}>
                    계약서 보기
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold tracking-[0.18em] text-slate-400">DB에 등록된 대출상품</p>
              <h3 className="mt-2 text-2xl font-black text-slate-950">대출상품 목록</h3>
            </div>
            <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              총 {products.length}개
            </div>
          </div>

          {products.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product, index) => {
                const selectionId = getProductSelectionId(product, index)
                const active = selectionId === selectedSelectionId

                return (
                  <button
                    key={selectionId}
                    type="button"
                    onClick={() => setSelectedSelectionId(selectionId)}
                    className={`rounded-[1.5rem] border p-5 text-left transition ${
                      active ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-blue-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-blue-600">
                        <Landmark size={20} />
                      </div>
                      <div className="text-xs font-semibold text-slate-400">계약 상품</div>
                    </div>
                    <div className="mt-5 text-xl font-black text-slate-950">{product.title}</div>
                    <div className="mt-2 text-sm font-semibold text-blue-600">{product.shortTitle}</div>
                    <p className="mt-3 text-sm leading-7 text-slate-600" style={clamp4Style}>
                      {product.summary}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        대출과목
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {product.rateLabel}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
              등록된 대출상품이 없습니다.
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
