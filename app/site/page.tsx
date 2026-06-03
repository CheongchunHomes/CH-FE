import Link from "next/link"
import {
  Building2,
  ChevronRight,
  Coins,
  House,
  MapPin,
  Search,
  Sparkles,
  Ticket,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { HomeQuickPanel } from "@/components/site/home-quick-panel"

const quickMenus = [
  { icon: House, label: "조건 진단", href: "/site/step/condition-check" },
  { icon: Ticket, label: "제도 추천", href: "/site/step/recommend" },
  { icon: Coins, label: "대출신청", href: "/site/loan-contract?product=newborn" },
  { icon: MapPin, label: "지도 확인", href: "/site/map" },
  { icon: Building2, label: "계약", href: "/site/contract" },
]

const serviceLinks = [
  {
    title: "시뮬레이션",
    description: "내 조건에 맞는 예상 지원 가능 여부를 미리 확인",
    href: "/site/simulator",
  },
  {
    title: "자주 묻는 질문",
    description: "자주 나오는 문의를 빠르게 찾아보기",
    href: "/site/faq",
  },
  {
    title: "공지사항",
    description: "최근 공지와 주요 안내를 한 번에 확인",
    href: "/site/notice",
  },
  {
    title: "가계부",
    description: "수입과 지출을 기록하고 관리하는 공간",
    href: "/site/ledger",
  },
  {
    title: "동네생활 커뮤니티",
    description: "지역·주거 후기와 생활 정보를 공유하는 공간",
    href: "/site/community",
  },
  {
    title: "용어 설명",
    description: "헷갈리는 주거·청약 용어를 쉽게 정리",
    href: "/site/terminology",
  },
  {
    title: "청약 가능 여부 퀴즈",
    description: "청약 가능성을 간단한 질문으로 점검",
    href: "/site/subscription-quiz",
  },
]

export default function SitePage() {
  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
        <section className="grid gap-4">
          <Card className="overflow-hidden border-slate-200/80 bg-white shadow-sm">
            <CardContent className="p-6 md:p-8">
              <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                <div className="space-y-5">
                  <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-[#2563EB]">
                    <Sparkles size={14} />
                    청년 주거 원스톱
                  </div>

                  <div className="space-y-3">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">
                      청년 주거와 대출,
                      <span className="block text-[#2563EB]">한 번에 확인하세요</span>
                    </h1>
                    <p className="max-w-xl text-base leading-7 text-slate-600 md:text-lg">
                      조건에 맞는 제도, 공고, 대출 정보를 한 화면에서 빠르게 확인할 수 있습니다.
                    </p>
                  </div>

                  <form action="/site/faq" method="get" className="relative max-w-2xl pt-2">
                    <Search
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <Input
                      name="q"
                      type="search"
                      placeholder="질문, 주제, 키워드로 검색"
                      className="h-14 rounded-2xl border-slate-200 bg-white pl-12 pr-24 shadow-sm focus-visible:ring-[#2563EB]"
                    />
                    <button
                      type="submit"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
                    >
                      검색
                    </button>
                  </form>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {["조건 확인", "대출 계산", "지도 탐색", "계약 준비"].map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <HomeQuickPanel />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-4">
          <Card className="border border-blue-100 bg-blue-50/60 shadow-[0_2px_4px_rgba(37,99,235,0.05)]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg text-slate-900">청년 주거 원스톱</CardTitle>
                  <span className="rounded-full border border-blue-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-[#2563EB]">
                    빠른 실행
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {quickMenus.map(({ icon: Icon, label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="group rounded-3xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:border-blue-200 hover:bg-blue-50/70 hover:shadow-md"
                  >
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-[#2563EB] transition group-hover:bg-blue-100">
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
          <div className="grid gap-4 md:grid-cols-2">
            {serviceLinks.map(({ title, description, href }) => (
              <Link key={title} href={href} className="block">
                <Card className="border-slate-200/80 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md">
                  <CardContent className="flex items-center justify-between gap-4 px-5 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">{title}</p>
                      <p className="mt-1 text-sm text-slate-500">{description}</p>
                    </div>
                    <ChevronRight className="shrink-0 text-slate-300" size={18} />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
