"use client"

import Link from "next/link"
import {
  ArrowLeft,
  BadgeInfo,
  Banknote,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileText,
  House,
  Landmark,
  Sparkles,
  Truck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const productCards = [
  {
    title: "HF 전월세보증금 대출",
    maxRate: "최대 80%",
    limit: "한도 4.44억원까지",
  },
  {
    title: "청년 전월세보증금 대출",
    maxRate: "최대 90%",
    limit: "한도 2억원까지",
  },
  {
    title: "SGI 전월세보증금 대출",
    maxRate: "최대 80%",
    limit: "한도 5억원까지",
  },
]

const helpTopics = [
  {
    title: "전월세보증금 대출 신청은 언제 해야 하나요?",
    description:
      "입대차계약서와 잔금일 기준으로 준비 시점을 확인하고, 신청 가능 시기와 필요한 서류를 먼저 확인해 주세요.",
  },
  {
    title: "전월세보증금 대출 기간 연장이나 증액도 가능한가요?",
    description:
      "계약이 연장되거나 보증금이 바뀌는 경우, 현재 조건을 먼저 확인한 뒤 연장 또는 증액 가능 여부를 검토할 수 있어요.",
  },
  {
    title: "대출을 받기 위해 주민등록이 필요할까요?",
    description:
      "실제 거주 요건과 세대 구성 기준이 중요한 경우가 많아서, 등본과 전입 예정일 기준을 함께 확인하는 것이 좋아요.",
  },
]

const menuItems = [
  "상품안내",
  "금리정보",
  "이용시간 안내",
  "갈아타기 안내",
  "기간연장 안내",
  "기타사항",
  "상품설명서 및 이용약관",
]

export default function LoanPage() {
  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-4 md:px-6">
        <header className="rounded-3xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <Button asChild variant="ghost" className="-ml-2 rounded-full text-slate-600">
              <Link href="/main">
                <ArrowLeft className="mr-2" size={16} />
                메인으로 돌아가기
              </Link>
            </Button>

            <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700">
              <Sparkles size={14} />
              대출 정보 한눈에 보기
            </div>
          </div>
        </header>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700">
                <Landmark size={14} />
                대출 정보를 한눈에
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">
                  똑똑한 전세관리로
                  <span className="block text-sky-600">대출부터 계약까지</span>
                </h1>
                <p className="max-w-xl text-base leading-7 text-slate-600 md:text-lg">
                  대출 종류, 금리, 이용시간, 기간연장 정보를 한 곳에서 확인하고 계약 준비까지 이어가세요.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button className="rounded-full bg-sky-600 px-6 text-white hover:bg-sky-700">
                  대출 상품 보기
                </Button>
                <Button variant="outline" className="rounded-full border-slate-300 px-6">
                  대출 가능성 확인
                </Button>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="rounded-[2rem] bg-sky-50/80 p-10 shadow-inner ring-1 ring-sky-100">
                <div className="flex items-center gap-6">
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                    <Truck size={56} />
                  </div>
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 size={56} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {productCards.map((card) => (
            <Card key={card.title} className="rounded-[1.5rem] border-slate-200 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-sky-700">{card.title}</CardTitle>
                <CardDescription className="text-slate-500">주요 보증금 대출 상품</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">최대</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">{card.maxRate}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">한도</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">{card.limit}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-[2rem] border-slate-200 bg-white shadow-sm">
            <CardContent className="p-6 md:p-8">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight text-slate-950 md:text-4xl">
                  대출부터 계약까지
                  <span className="block text-slate-500">놓치기 쉬운 순서를 한 번에 정리</span>
                </h2>
                <p className="max-w-xl text-sm leading-6 text-slate-500 md:text-base">
                  이사 전후에 확인할 일과 준비할 서류를 순서대로 정리해서, 입주와 계약이 더 편해지도록 도와드려요.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-900">자주 묻는 질문</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {helpTopics.map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-[2rem] border-slate-200 bg-white shadow-sm">
            <CardContent className="grid gap-3 p-4">
              {menuItems.slice(0, 4).map((item) => {
                if (item === "금리정보") {
                  return (
                    <Dialog key={item}>
                      <DialogTrigger asChild>
                        <button className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-4 py-4 text-left text-sm font-medium text-slate-800 transition hover:bg-slate-100">
                          {item}
                          <ChevronRight size={16} className="text-slate-400" />
                        </button>
                      </DialogTrigger>

                      <DialogContent className="max-w-4xl rounded-[1.75rem] border-0 p-0">
                        <div className="max-h-[82vh] overflow-y-auto rounded-[1.75rem] bg-white p-6 md:p-8">
                          <DialogHeader className="text-left">
                            <DialogTitle className="text-2xl font-bold text-slate-950">대출금리</DialogTitle>
                            <DialogDescription className="text-slate-500">
                              아래 값은 UI 예시입니다. 실제 금리는 공시 데이터나 API 연동 값으로 교체하면 돼요.
                            </DialogDescription>
                          </DialogHeader>

                          <div className="mt-6 space-y-6">
                            <section className="space-y-3">
                              <h3 className="text-base font-semibold text-slate-900">6개월 변동금리</h3>
                              <ul className="space-y-2 text-sm text-slate-700">
                                <li>HF 전월세보증금 대출: 연 3.x% ~ 5.x%</li>
                                <li>청년 전월세보증금 대출: 연 3.x% ~ 5.x%</li>
                                <li>SGI 전월세보증금 대출: 연 3.x% ~ 6.x%</li>
                              </ul>
                              <p className="text-xs text-slate-400">2026.04.28 기준 예시</p>
                            </section>

                            <section className="space-y-3">
                              <h3 className="text-base font-semibold text-slate-900">2년 변동금리</h3>
                              <ul className="space-y-2 text-sm text-slate-700">
                                <li>HF 전월세보증금 대출: 연 4.x% ~ 6.x%</li>
                                <li>청년 전월세보증금 대출: 연 3.x% ~ 4.x%</li>
                                <li>SGI 전월세보증금 대출: 연 4.x% ~ 6.x%</li>
                              </ul>
                              <p className="text-xs text-slate-400">2026.04.28 기준 예시</p>
                            </section>

                            <section className="space-y-3">
                              <h3 className="text-base font-semibold text-slate-900">혼합형 금리</h3>
                              <div className="overflow-hidden rounded-2xl border border-slate-200">
                                <table className="w-full text-left text-sm">
                                  <thead className="bg-slate-50 text-slate-500">
                                    <tr>
                                      <th className="px-4 py-3 font-medium">종류</th>
                                      <th className="px-4 py-3 font-medium">기준금리</th>
                                      <th className="px-4 py-3 font-medium">가산금리</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200 bg-white">
                                    <tr>
                                      <td className="px-4 py-4 text-slate-700">HF 전월세보증금 대출</td>
                                      <td className="px-4 py-4 text-sky-600">연 2.x%</td>
                                      <td className="px-4 py-4 text-sky-600">연 0.x% ~ 2.x%</td>
                                    </tr>
                                    <tr>
                                      <td className="px-4 py-4 text-slate-700">청년 전월세보증금 대출</td>
                                      <td className="px-4 py-4 text-sky-600">연 2.x%</td>
                                      <td className="px-4 py-4 text-sky-600">연 0.x% ~ 1.x%</td>
                                    </tr>
                                    <tr>
                                      <td className="px-4 py-4 text-slate-700">SGI 전월세보증금 대출</td>
                                      <td className="px-4 py-4 text-sky-600">연 2.x%</td>
                                      <td className="px-4 py-4 text-sky-600">연 0.x% ~ 3.x%</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </section>

                            <p className="text-xs leading-5 text-slate-400">
                              실제 금리는 상품 조건, 보증기관, 우대금리, 시점에 따라 달라질 수 있어요. 나중에 공공데이터나
                              금융기관 API를 붙이면 이 영역을 자동 갱신할 수 있습니다.
                            </p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )
                }

                return (
                  <button
                    key={item}
                    className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-4 py-4 text-left text-sm font-medium text-slate-800 transition hover:bg-slate-100"
                    type="button"
                  >
                    {item}
                    <ChevronRight size={16} className="text-slate-400" />
                  </button>
                )
              })}
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-slate-200 bg-white shadow-sm">
            <CardContent className="grid gap-3 p-4">
              {menuItems.slice(4).map((item) => (
                <button
                  key={item}
                  className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-4 py-4 text-left text-sm font-medium text-slate-800 transition hover:bg-slate-100"
                  type="button"
                >
                  {item}
                  <ChevronRight size={16} className="text-slate-400" />
                </button>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">대출 진행 순서</h2>
              <p className="mt-1 text-sm text-slate-500">대출 준비부터 계약까지 필요한 흐름을 단계별로 보여줘요.</p>
            </div>
            <BadgeInfo className="text-slate-400" />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "1. 조건 확인",
                desc: "소득, 자산, 연령, 무주택 요건을 먼저 확인해요.",
              },
              {
                title: "2. 서류 준비",
                desc: "등본, 계약서, 소득 증빙, 보증 관련 서류를 모아요.",
              },
              {
                title: "3. 신청 및 확인",
                desc: "신청 후 금리와 한도를 다시 확인하고 진행해요.",
              },
            ].map((step) => (
              <div key={step.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-sky-700">{step.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
