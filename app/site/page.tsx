import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  Building2,
  CircleHelp,
  Coins,
  House,
  MapPin,
  MessageCircleQuestion,
  Sparkles,
  Ticket,
  Wallet,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getPageSampleHref } from "@/lib/page-samples"

const quickMenus = [
  { icon: House, label: "내 조건 진단", href: getPageSampleHref("condition-check") },
  { icon: Ticket, label: "제도 추천", href: getPageSampleHref("guide-center") },
  { icon: Coins, label: "대출 계산", href: getPageSampleHref("loan") },
  { icon: MapPin, label: "집·공고 확인", href: "site/map" },
  { icon: Building2, label: "계약", href: getPageSampleHref("contract") },
]

const homeTips = [
  { title: "청약 자격 진단", desc: "내 조건에 맞는 청약을 한 번에 확인", href: getPageSampleHref("subscription") },
  { title: "대출 가능 금액 계산", desc: "전세·구매 대출 한도를 간단히 계산", href: "/loan" },
  { title: "시뮬레이션", desc: "가상의 조건으로 계산해 보기", href: getPageSampleHref("simulator") },
  { title: "자주 묻는 질문", desc: "사용자들이 궁금해하는 것들", href: getPageSampleHref("faq") },
]

export default function SitePage() {
  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
        <section className="grid gap-4">
          <Card className="overflow-hidden border-slate-200/80 bg-white shadow-sm">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl space-y-5">
                  <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700">
                    <Sparkles size={14} />
                    AI가 청년 주거 준비를 도와드려요
                  </div>
                  <div className="space-y-3">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">
                      청약부터 대출, 계약까지
                      <span className="block text-sky-600">청년 주거 준비를 한 번에</span>
                    </h1>
                    <p className="max-w-xl text-base leading-7 text-slate-600 md:text-lg">
                      내 조건에 맞는 청약, 대출, 계약 정보를 한 곳에서 빠르게 확인하세요.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button asChild className="rounded-full bg-sky-600 px-6 text-white hover:bg-sky-700">
                      <Link href={getPageSampleHref("condition-check")}>내 조건 진단</Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-full border-slate-300 px-6">
                      <Link href={getPageSampleHref("notice")}>오늘 공고 보기</Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="rounded-full border-sky-200 bg-sky-50 px-6 text-sky-700 hover:bg-sky-100"
                    >
                      <Link href="/live2d">
                        AI에게 물어보기
                        <MessageCircleQuestion className="ml-2" size={16} />
                      </Link>
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {["내 조건에 맞는 청약", "대출 한도 계산", "집 찾는 기준", "계약 체크리스트"].map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-[#f8fbff] p-5 shadow-sm">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">내 주거 AI 비서</p>
                      <p className="text-xs text-slate-500">청약, 대출, 계약 현황을 한눈에</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
                      준비됨
                    </span>
                  </div>

                  <div className="space-y-3">
                    {[
                      ["신청 가능 청약", "2"],
                      ["주택 대출 상품", "3"],
                      ["오늘 확인할 항목", "1"],
                      ["계약 진행률", "40%"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                            <CircleHelp size={16} />
                          </div>
                          <span className="text-sm font-medium text-slate-700">{label}</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{value}</span>
                      </div>
                    ))}
                  </div>

                  <Button className="mt-4 w-full rounded-full bg-sky-600 text-white hover:bg-sky-700">
                    준비 상태 확인
                    <ArrowRight className="ml-2" size={16} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-4">
          <Card className="border-slate-200/80 bg-sky-600 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white">청년 주거 원스텝</CardTitle>
                <span className="text-sm text-sky-600">더보기</span>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {quickMenus.map(({ icon: Icon, label, href }) => (
                  <Link key={label} href={href} className="rounded-3xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-sky-600">
                      <Icon size={18} />
                    </div>
                    <p className="text-sm font-medium text-slate-800">{label}</p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-4">
          <Link href={getPageSampleHref("subscription")} className="block">
            <Card className="border-slate-200/80 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-slate-900">오늘의 청약</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-6 pb-6">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-3xl bg-sky-600 p-5 text-white shadow-sm">
                    <p className="text-sm/none font-medium">청약 진행 중 공고</p>
                    <p className="mt-4 text-4xl font-bold">7</p>
                    <p className="mt-3 text-sm text-sky-100">신청 시간 09:00-17:30</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">당첨자 발표</p>
                    <p className="mt-4 text-4xl font-bold text-slate-900">4</p>
                    <p className="mt-3 text-sm text-slate-500">오늘 발표를 확인하세요</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-2">
          {homeTips.map((item) => (
            <Link key={item.title} href={item.href} className="block">
              <Card className="border-slate-200/80 bg-white shadow-sm">
                <CardContent className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
                  </div>
                  <ArrowRight className="shrink-0 text-slate-300" size={18} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>
      </div>
    </main>
  )
}
