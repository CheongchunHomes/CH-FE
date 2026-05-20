"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, CircleHelp, Clock3, Coins, Landmark, Sparkles, ShieldCheck } from "lucide-react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type LoanProductKey = "hf" | "young" | "sgi"

type LoanProduct = {
  key: LoanProductKey
  name: string
  title: string
  coverage: string
  limitText: string
  limitManwon: number
  rateText: string
  annualRate: number
  description: string
  accentClass: string
}

const loanProducts: LoanProduct[] = [
  {
    key: "hf",
    name: "HF 전월세보증금 대출",
    title: "HF 전월세보증금 대출",
    coverage: "최대 80%",
    limitText: "4.44억원까지",
    limitManwon: 44400,
    rateText: "연 3.398% ~ 5.510%",
    annualRate: 4.12,
    description: "보증 중심으로 안정적인 조건을 찾을 때 먼저 보는 상품이에요.",
    accentClass: "bg-[#2563EB]",
  },
  {
    key: "young",
    name: "청년 전월세보증금 대출",
    title: "청년 전월세보증금 대출",
    coverage: "최대 90%",
    limitText: "2억원까지",
    limitManwon: 20000,
    rateText: "연 3.177% ~ 3.630%",
    annualRate: 3.38,
    description: "청년 조건에 맞는 대표적인 전월세 보증금 대출이에요.",
    accentClass: "bg-[#2563EB]",
  },
  {
    key: "sgi",
    name: "SGI 전월세보증금 대출",
    title: "SGI 전월세보증금 대출",
    coverage: "최대 80%",
    limitText: "5억원까지",
    limitManwon: 50000,
    rateText: "연 3.554% ~ 6.320%",
    annualRate: 4.54,
    description: "보증 범위가 넓고 선택지가 다양한 편인 상품이에요.",
    accentClass: "bg-[#2563EB]",
  },
]

const faqItems = [
  {
    question: "전월세보증금 대출 신청은 언제 해야 하나요?",
    answer:
      "보통 계약 전후 일정 안에서 진행하지만, 실제 신청 가능 시점은 공고와 금융기관 조건에 따라 달라집니다. 먼저 필요한 서류와 심사 일정부터 확인하는 게 좋아요.",
  },
  {
    question: "전세대출과 월세대출은 어떻게 다르나요?",
    answer:
      "전세대출은 보증금 중심, 월세대출은 월 임차료 부담을 줄이는 쪽에 가깝습니다. 같은 '대출'이라도 대상과 심사 기준이 조금씩 달라요.",
  },
  {
    question: "금리정보는 왜 따로 모달로 보여주나요?",
    answer:
      "상품별 금리는 자주 바뀌어서, 페이지를 복잡하게 만들지 않고 필요할 때만 확인할 수 있도록 모달로 분리했어요.",
  },
]

function formatManwon(value: number) {
  return new Intl.NumberFormat("ko-KR").format(Math.round(value))
}

export default function LoanCalculator() {
  const [selectedKey, setSelectedKey] = useState<LoanProductKey>("young")
  const [deposit, setDeposit] = useState(20000)
  const [ownFunds, setOwnFunds] = useState(3000)
  const [monthlyRent, setMonthlyRent] = useState(35)
  const [annualIncome, setAnnualIncome] = useState(3600)

  const selectedProduct = loanProducts.find((product) => product.key === selectedKey) ?? loanProducts[0]

  const loanableBase = Math.max(deposit - ownFunds, 0)
  const estimatedLoan = Math.min(loanableBase, selectedProduct.limitManwon)
  const monthlyInterest = (estimatedLoan * selectedProduct.annualRate) / 100 / 12
  const monthlyBurden = monthlyInterest + monthlyRent
  const affordability = annualIncome > 0 ? Math.max(0, 100 - Math.round((monthlyBurden * 12 * 100) / annualIncome)) : 0

  const resultLabel = useMemo(() => {
    if (loanableBase <= 0) return "보유자금이 보증금보다 많아요"
    if (estimatedLoan >= loanableBase) return "현재 조건 기준으로는 보증금 전액 대응이 가능해 보여요"
    return "상품 한도 기준으로 일부 금액은 자체 자금이 필요해 보여요"
  }, [estimatedLoan, loanableBase])

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
                  보증금, 보유 자금, 월세, 소득을 넣으면 대략적인 대출 가능 금액과 월 부담액을 바로 확인할 수 있어요.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild className="rounded-full bg-[#2563EB] px-6 text-white hover:bg-[#1D4ED8]">
                  <Link href="/site/loan-contract">
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
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>대출금리</DialogTitle>
                      <DialogDescription>상품별 참고 금리와 한도를 한 번에 볼 수 있어요.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                      <div>
                        <p className="mb-3 text-sm font-semibold text-slate-700">6개월 변동금리</p>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>상품</TableHead>
                              <TableHead>최대 한도</TableHead>
                              <TableHead>참고 금리</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {loanProducts.map((product) => (
                              <TableRow key={product.key}>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell>{product.limitText}</TableCell>
                                <TableCell>{product.rateText}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      <Separator />

                      <div className="grid gap-3 md:grid-cols-3">
                        {loanProducts.map((product) => (
                          <div key={product.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-sm font-semibold text-slate-900">{product.title}</p>
                            <p className="mt-2 text-sm text-slate-600">{product.rateText}</p>
                            <p className="mt-1 text-xs text-slate-500">실제 금리는 심사 조건에 따라 달라질 수 있어요.</p>
                          </div>
                        ))}
                      </div>
                    </div>
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
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">실시간</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-50 text-[#2563EB]">
                      <Landmark size={16} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">선택 상품</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{selectedProduct.name}</span>
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

              <Button className="mt-4 w-full rounded-full bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
                계산 다시 보기
                <ArrowRight className="ml-2" size={16} />
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-slate-200/80 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900">대출 계산기</CardTitle>
              <CardDescription>값을 넣으면 바로 계산돼요. 단, 실제 심사 결과와는 다를 수 있어요.</CardDescription>
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

              <div className="grid gap-3 md:grid-cols-3">
                {loanProducts.map((product) => {
                  const active = selectedKey === product.key
                  return (
                    <button
                      key={product.key}
                      type="button"
                      onClick={() => setSelectedKey(product.key)}
                      className={[
                        "rounded-3xl border p-4 text-left transition",
                        active
                          ? "border-[#2563EB] bg-blue-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-white ${product.accentClass}`}>
                          <Landmark size={16} />
                        </div>
                        <span className="text-xs font-medium text-slate-500">{product.coverage}</span>
                      </div>
                      <p className="mt-3 text-sm font-semibold text-slate-900">{product.title}</p>
                      <p className="mt-2 text-xs text-slate-500">{product.limitText}</p>
                    </button>
                  )
                })}
              </div>

              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">계산 결과</p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs text-slate-500">대출 가능 추정</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{formatManwon(estimatedLoan)}만원</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs text-slate-500">월 이자 추정</p>
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
              <CardDescription>자주 묻는 질문과 준비 항목을 바로 볼 수 있어요.</CardDescription>
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
                  <li>• 계약서 상 보증금과 실제 입력값이 같은지 확인하기</li>
                  <li>• 중개보수, 이사비, 인지세 같은 부대비용도 함께 보기</li>
                  <li>• 대출 금리는 공고와 시점에 따라 달라질 수 있어요</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
