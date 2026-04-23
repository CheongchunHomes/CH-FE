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

const quickMenus = [
  { icon: House, label: "내 조건 진단" },
  { icon: Ticket, label: "정책 추천" },
  { icon: Coins, label: "대출 계산" },
  { icon: MapPin, label: "집·공고 확인" },
  { icon: Building2, label: "계약 준비" },
  { icon: Wallet, label: "입주 관리" },
]

const homeTips = [
  { title: "청약 자격 진단", desc: "내 조건에 맞는 청약을 한 번에 확인" },
  { title: "대출 가능 금액 계산", desc: "전세·구매 대출 한도를 간단히 계산" },
  { title: "청년 주거지원 찾기", desc: "행정구역과 공공임대 정보를 지도처럼 탐색" },
  { title: "전자계약 시작", desc: "서류 확인부터 계약까지 간편하게" },
]

export default function SitePage() {
  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
        <section className="grid gap-4 lg:grid-cols-[1.45fr_0.95fr]">
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
                    <Button className="rounded-full bg-sky-600 px-6 text-white hover:bg-sky-700">내 조건 진단</Button>
                    <Button variant="outline" className="rounded-full border-slate-300 px-6">
                      오늘 공고 보기
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

          <Card className="border-slate-200/80 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-900">오늘의 청약</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6">
              <div className="grid grid-cols-2 gap-3">
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

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <BookOpen size={16} />
                    청약 캘린더 보기
                  </div>
                  <ArrowRight size={16} className="text-slate-400" />
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-500">아직 이번 주 일정이 없어요.</div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-semibold">청년 주거 원스텝</h3>
                  <span className="text-sm text-sky-600">더보기</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {quickMenus.map(({ icon: Icon, label }) => (
                    <div key={label} className="rounded-3xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-sky-600">
                        <Icon size={18} />
                      </div>
                      <p className="text-sm font-medium text-slate-800">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-2">
          {homeTips.map((item) => (
            <Card key={item.title} className="border-slate-200/80 bg-white shadow-sm">
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
                </div>
                <ArrowRight className="shrink-0 text-slate-300" size={18} />
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  )
}
