"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, CircleHelp, Clock3, Coins, Landmark, ShieldCheck, Sparkles } from "lucide-react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { loadLoanProducts, type LoanProductView } from "@/lib/loan/loan-products"

type CalculatorProduct = {
  key: string
  selectionId: string
  name: string
  shortTitle: string
  summary: string
  contractTitle: string
  contractSubtitle: string
  provider?: string
  loanType?: string
  rateLabel: string
  limitText: string
  limitManwon: number
  annualRate: number
  descriptionBadge: string
}

const clamp4Style = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical" as const,
  WebkitLineClamp: 4,
  overflow: "hidden",
}

function formatManwon(value: number) {
  return new Intl.NumberFormat("ko-KR").format(Math.round(value))
}

function getSelectionId(product: CalculatorProduct, index: number) {
  return product.selectionId?.trim() || `${product.key}-${index}`
}

function parseManwonText(value?: string | null) {
  if (!value) return 0
  const numeric = Number(String(value).replace(/[^\d.-]/g, ""))
  return Number.isFinite(numeric) ? numeric : 0
}

function parseRateText(value?: string | null) {
  if (!value) return 0
  const numbers = String(value)
    .match(/[\d.]+/g)
    ?.map((item) => Number(item))
    .filter((item) => Number.isFinite(item)) ?? []

  if (numbers.length === 0) return 0
  if (numbers.length === 1) return numbers[0]
  return (numbers[0] + numbers[numbers.length - 1]) / 2
}

function toCalculatorProduct(view: LoanProductView, index: number): CalculatorProduct {
  const title = view.title || view.shortTitle || `대출상품 ${index + 1}`
  const shortTitle = view.shortTitle || view.loanType || title
  const summary = view.summary || "DB에 등록된 대출상품입니다."
  const limitManwon = parseManwonText(view.maxAmount)
  const annualRate = parseRateText(view.interestRate || view.interestRateMin || view.rateLabel)

  return {
    key: view.key,
    selectionId: view.externalCode?.trim() || `${view.key}-${index}`,
    name: title,
    shortTitle,
    summary,
    contractTitle: view.contractTitle || title,
    contractSubtitle: view.contractSubtitle || view.provider || "대출상품 안내",
    provider: view.provider,
    loanType: view.loanType,
    rateLabel: view.rateLabel || "금리 정보 없음",
    limitText: view.maxAmount ? `${view.maxAmount}까지` : "한도 정보 없음",
    limitManwon,
    annualRate,
    descriptionBadge: view.isPolicyLoan ? "정책대출" : view.provider || "대출상품",
  }
}

const faqItems = [
  {
    question: "대출 신청은 언제 하는 게 좋나요?",
    answer:
      "보통 계약 일정과 자금 계획이 어느 정도 정해진 뒤 신청하는 것이 좋습니다. 다만 은행 심사나 상품 조건에 따라 준비 서류와 처리 시간이 달라질 수 있으니, 먼저 조건을 확인하는 것이 중요합니다.",
  },
  {
    question: "전세대출과 월세대출은 어떻게 다른가요?",
    answer:
      "전세대출은 보증금 중심, 월세대출은 월세 부담을 줄이는 데 더 적합합니다. 같은 대출이라도 상품별로 대상과 한도가 다를 수 있습니다.",
  },
  {
    question: "금리 정보는 왜 따로 모달로 보여주나요?",
    answer:
      "상품이 바뀔 때마다 금리와 조건이 함께 달라질 수 있어서, 한 번에 비교할 수 있도록 모달로 분리했습니다.",
  },
]

export default function LoanCalculatorDb() {
  const [products, setProducts] = useState<CalculatorProduct[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [selectedSelectionId, setSelectedSelectionId] = useState<string | null>(null)

  const [deposit, setDeposit] = useState(20000)
  const [ownFunds, setOwnFunds] = useState(3000)
  const [monthlyRent, setMonthlyRent] = useState(35)
  const [annualIncome, setAnnualIncome] = useState(3600)

  useEffect(() => {
    let cancelled = false

    void loadLoanProducts()
      .then((views) => {
        if (cancelled) return
        const nextProducts = views.map((view, index) => toCalculatorProduct(view, index))
        setProducts(nextProducts)
        setSelectedSelectionId((current) => {
          if (current && nextProducts.some((product, index) => getSelectionId(product, index) === current)) {
            return current
          }
          return nextProducts.length > 0 ? getSelectionId(nextProducts[0], 0) : null
        })
      })
      .finally(() => {
        if (!cancelled) setLoadingProducts(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (products.length === 0) {
      setSelectedSelectionId(null)
      return
    }

    setSelectedSelectionId((current) => {
      if (current && products.some((product, index) => getSelectionId(product, index) === current)) {
        return current
      }
      return getSelectionId(products[0], 0)
    })
  }, [products])

  const selectedProduct = selectedSelectionId
    ? products.find((product, index) => getSelectionId(product, index) === selectedSelectionId) ?? null
    : products[0] ?? null

  const loanableBase = Math.max(deposit - ownFunds, 0)
  const estimatedLoan = selectedProduct ? Math.min(loanableBase, selectedProduct.limitManwon) : 0
  const monthlyInterest = selectedProduct ? (estimatedLoan * selectedProduct.annualRate) / 100 / 12 : 0
  const monthlyBurden = monthlyInterest + monthlyRent
  const affordability = annualIncome > 0 ? Math.max(0, 100 - Math.round((monthlyBurden * 12 * 100) / annualIncome)) : 0

  const resultLabel = useMemo(() => {
    if (!selectedProduct) {
      return loadingProducts ? "DB 상품을 불러오는 중입니다." : "등록된 대출상품이 없습니다."
    }
    if (loanableBase <= 0) return "보유자금이 보증금보다 많아요"
    if (estimatedLoan >= loanableBase) return "현재 조건 기준으로는 보증금 전액 대응이 가능해 보여요"
    return "상품 한도 기준으로는 일부 금액만 대출이 필요해 보여요"
  }, [estimatedLoan, loanableBase, loadingProducts, selectedProduct])

  const compareProducts = products.length > 0 ? products : []

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
        <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-[#2563EB]">
                <Sparkles size={14} />
                청년 주거 원스텝
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">대출 계산</h1>
                <p className="max-w-xl text-base leading-7 text-slate-600 md:text-lg">
                  보증금, 보유 자금, 월세, 소득을 넣으면 대출 가능 금액과 월 부담액을 바로 확인할 수 있어요.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild className="rounded-full bg-[#2563EB] px-6 text-white hover:bg-[#1D4ED8]">
                  <Link
                    href={
                      selectedProduct
                        ? `/site/step/loan-contract?product=${encodeURIComponent(selectedProduct.key)}`
                        : "/site/step/loan-contract"
                    }
                  >
                    <ArrowLeft className="mr-2" size={16} />
                    계약 단계로 이동
                  </Link>
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="rounded-full border-slate-300 px-6">
                      <CircleHelp className="mr-2" size={16} />
                      금리정보
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-5xl">
                    <DialogHeader>
                      <DialogTitle>대출상품 비교</DialogTitle>
                      <DialogDescription>DB에 등록된 상품 기준으로 한도와 금리를 한 번에 비교할 수 있어요.</DialogDescription>
                    </DialogHeader>

                    {compareProducts.length > 0 ? (
                      <div className="space-y-6">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>상품명</TableHead>
                              <TableHead>제공기관</TableHead>
                              <TableHead>한도</TableHead>
                              <TableHead>금리</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {compareProducts.map((product) => (
                              <TableRow key={product.selectionId}>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell>{product.provider ?? product.loanType ?? "-"}</TableCell>
                                <TableCell>{product.limitText}</TableCell>
                                <TableCell>{product.rateLabel}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>

                        <Separator />

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {compareProducts.map((product) => (
                            <div key={product.selectionId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <p className="text-sm font-semibold text-slate-900">{product.name}</p>
                              <p className="mt-2 text-sm text-slate-600">{product.rateLabel}</p>
                              <p className="mt-1 text-xs text-slate-500">{product.summary}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                        등록된 대출상품이 아직 없습니다.
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-[#f8fbff] p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">대출 계산 요약</p>
                  <p className="text-xs text-slate-500">현재 입력값 기준으로 빠르게 확인해요</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
                  {loadingProducts ? "불러오는 중" : "실시간"}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-50 text-[#2563EB]">
                      <Landmark size={16} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">선택 상품</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{selectedProduct?.name ?? "-"}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-50 text-[#2563EB]">
                      <Coins size={16} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">예상 가능 금액</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{formatManwon(estimatedLoan)}만원</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-50 text-[#2563EB]">
                      <Clock3 size={16} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">월 부담액</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{formatManwon(monthlyBurden)}만원</span>
                </div>
              </div>

              <Button asChild className="mt-4 w-full rounded-full bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
                <Link
                  href={
                    selectedProduct
                      ? `/site/step/loan-contract?product=${encodeURIComponent(selectedProduct.key)}`
                      : "/site/step/loan-contract"
                  }
                >
                  계산 다시 보기
                  <ArrowRight className="ml-2" size={16} />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-slate-200/80 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900">대출 계산기</CardTitle>
              <CardDescription>값을 넣으면 바로 계산돼요. 실제 심사 결과와는 다를 수 있어요.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="deposit">보증금(만원)</Label>
                  <Input
                    id="deposit"
                    type="number"
                    value={deposit}
                    onChange={(event) => setDeposit(Number(event.target.value) || 0)}
                    placeholder="예: 20000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownFunds">보유 자금(만원)</Label>
                  <Input
                    id="ownFunds"
                    type="number"
                    value={ownFunds}
                    onChange={(event) => setOwnFunds(Number(event.target.value) || 0)}
                    placeholder="예: 3000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthlyRent">월세(만원)</Label>
                  <Input
                    id="monthlyRent"
                    type="number"
                    value={monthlyRent}
                    onChange={(event) => setMonthlyRent(Number(event.target.value) || 0)}
                    placeholder="예: 35"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annualIncome">연소득(만원)</Label>
                  <Input
                    id="annualIncome"
                    type="number"
                    value={annualIncome}
                    onChange={(event) => setAnnualIncome(Number(event.target.value) || 0)}
                    placeholder="예: 3600"
                  />
                </div>
              </div>

              {products.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {products.map((product, index) => {
                    const selectionId = getSelectionId(product, index)
                    const active = selectionId === selectedSelectionId

                    return (
                      <button
                        key={selectionId}
                        type="button"
                        onClick={() => setSelectedSelectionId(selectionId)}
                        className={[
                          "rounded-3xl border p-4 text-left transition",
                          active
                            ? "border-[#2563EB] bg-blue-50 shadow-sm"
                            : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl text-white bg-[#2563EB]">
                            <Landmark size={16} />
                          </div>
                          <span className="text-xs font-medium text-slate-500">{product.descriptionBadge}</span>
                        </div>
                        <p className="mt-3 text-sm font-semibold text-slate-900">{product.name}</p>
                        <p className="mt-2 text-xs text-slate-500">{product.limitText}</p>
                        <p className="mt-3 text-sm leading-6 text-slate-600" style={clamp4Style}>
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

              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">계산 결과</p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs text-slate-500">대출 가능 예상</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{formatManwon(estimatedLoan)}만원</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs text-slate-500">월 이자 예상</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{formatManwon(monthlyInterest)}만원</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs text-slate-500">대출 적합도</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{affordability}%</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-600">{resultLabel}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900">빠른 도움말</CardTitle>
              <CardDescription>자주 묻는 질문과 계산 전에 보면 좋은 내용을 정리했어요.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem key={item.question} value={`faq-${index}`}>
                    <AccordionTrigger className="text-left no-underline hover:no-underline">{item.question}</AccordionTrigger>
                    <AccordionContent className="text-slate-600">{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <Separator className="my-6" />

              <div className="space-y-3 rounded-3xl bg-blue-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <ShieldCheck size={16} className="text-[#2563EB]" />
                  계산 전에 보면 좋은 것
                </div>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>계약서 상 보증금과 실제 입력값이 같은지 확인하기</li>
                  <li>중개보수, 이사비, 인지세 같은 부대비용도 함께 보기</li>
                  <li>대출 금리는 공고와 시점에 따라 달라질 수 있어요</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
