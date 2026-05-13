import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  FileText,
  Landmark,
  LayoutDashboard,
  Megaphone,
  Pencil,
  Search,
  Settings,
  ShieldCheck,
  Users,
  ListChecks,
  ChevronRight,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

type AdminSection =
  | "overview"
  | "users"
  | "subscription"
  | "loan"
  | "announcement"
  | "asset"
  | "community"
  | "simulation"
  | "settings"

type MenuItem = {
  key: AdminSection
  label: string
  description: string
  icon: LucideIcon
  href: string
}

type SectionMeta = {
  title: string
  description: string
  tableTitle: string
  rows: Array<{ name: string; detail: string; status: string }>
}

type PageProps = {
  searchParams?: {
    section?: string
  }
}

const menuItems: MenuItem[] = [
  {
    key: "overview",
    label: "관리자 메인",
    description: "전체 현황 확인",
    icon: LayoutDashboard,
    href: "/admin",
  },
  {
    key: "users",
    label: "유저",
    description: "유저 리스트",
    icon: Users,
    href: "/admin?section=users",
  },
  {
    key: "subscription",
    label: "청약",
    description: "청약 리스트",
    icon: FileText,
    href: "/admin?section=subscription",
  },
  {
    key: "loan",
    label: "대출",
    description: "대출 리스트",
    icon: Landmark,
    href: "/admin?section=loan",
  },
  {
    key: "announcement",
    label: "공고",
    description: "공고 리스트",
    icon: Megaphone,
    href: "/admin?section=announcement",
  },
  {
    key: "asset",
    label: "자산",
    description: "첨부 파일 관리",
    icon: Building2,
    href: "/admin?section=asset",
  },
  {
    key: "community",
    label: "커뮤니티",
    description: "문의 / 게시글 관리",
    icon: ListChecks,
    href: "/admin?section=community",
  },
  {
    key: "simulation",
    label: "시뮬레이션",
    description: "조건 진단 / 계산",
    icon: BarChart3,
    href: "/admin?section=simulation",
  },
  {
    key: "settings",
    label: "설정",
    description: "권한 / 시스템 설정",
    icon: Settings,
    href: "/admin?section=settings",
  },
]

const stats = [
  { label: "오늘 가입", value: "128", hint: "+24% from yesterday" },
  { label: "진행 계약", value: "43", hint: "심사 대기 9건" },
  { label: "공고 등록", value: "76", hint: "금일 처리 31건" },
  { label: "문의 처리", value: "18", hint: "미답변 4건" },
]

const overviewActions = [
  {
    title: "유저 관리",
    desc: "가입 유저의 기본 정보와 상태를 확인합니다.",
    href: "/admin?section=users",
  },
  {
    title: "청약 관리",
    desc: "청약 신청 현황과 서류 상태를 확인합니다.",
    href: "/admin?section=subscription",
  },
  {
    title: "대출 관리",
    desc: "대출 계약, 전자서명, PDF 저장 상태를 확인합니다.",
    href: "/admin?section=loan",
  },
  {
    title: "공고 관리",
    desc: "게시된 공고와 승인 대기 항목을 확인합니다.",
    href: "/admin?section=announcement",
  },
]

const recentLogs = [
  { title: "대출 계약서 생성 완료", detail: "전자서명 완료 대기" },
  { title: "신규 유저 가입 요청", detail: "이메일 인증 확인 필요" },
  { title: "청약 공고 2건 검수", detail: "오후 확인 예정" },
  { title: "자산 이미지 12개 정리", detail: "썸네일 재생성 완료" },
]

function normalizeSection(section?: string): AdminSection {
  switch (section) {
    case "users":
    case "subscription":
    case "loan":
    case "announcement":
    case "asset":
    case "community":
    case "simulation":
    case "settings":
      return section
    default:
      return "overview"
  }
}

function getSectionMeta(section: AdminSection): SectionMeta {
  switch (section) {
    case "users":
      return {
        title: "유저 리스트",
        description: "가입 유저와 상태를 확인하고 필요한 항목만 빠르게 관리합니다.",
        tableTitle: "가입 유저 목록",
        rows: [
          { name: "홍길동", detail: "sign-in completed", status: "활성" },
          { name: "김유저", detail: "phone verification pending", status: "대기" },
          { name: "이청년", detail: "profile updated", status: "활성" },
        ],
      }
    case "subscription":
      return {
        title: "청약 리스트",
        description: "신청 현황, 조건 진단, 서류 상태를 한 번에 확인합니다.",
        tableTitle: "청약 신청 목록",
        rows: [
          { name: "청약 A", detail: "1순위 / 서류 확인 중", status: "검토" },
          { name: "청약 B", detail: "특별공급 / 접수 완료", status: "접수" },
          { name: "청약 C", detail: "조건 미달 재확인 필요", status: "보류" },
        ],
      }
    case "loan":
      return {
        title: "대출 리스트",
        description: "계약 확인과 전자서명, PDF 생성 상태를 관리합니다.",
        tableTitle: "대출 계약 목록",
        rows: [
          { name: "신생아 특례 버팀목", detail: "계약서 확인 대기", status: "진행" },
          { name: "청년 버팀목", detail: "전자서명 완료", status: "완료" },
          { name: "신혼부부 전세자금", detail: "PDF 생성 대기", status: "대기" },
        ],
      }
    case "announcement":
      return {
        title: "공고 리스트",
        description: "게시 중인 공고와 승인 대기 항목을 관리합니다.",
        tableTitle: "공고 목록",
        rows: [
          { name: "서울시 청약 공고", detail: "게시 중 / 마감 D-3", status: "게시" },
          { name: "경기도 대출 공고", detail: "검수 요청", status: "검토" },
          { name: "부산시 자산 공고", detail: "예약 게시 예정", status: "대기" },
        ],
      }
    case "asset":
      return {
        title: "자산 리스트",
        description: "이미지, 첨부 파일, 배너 리소스를 관리합니다.",
        tableTitle: "자산 목록",
        rows: [
          { name: "hero-main.png", detail: "메인 배너", status: "사용" },
          { name: "loan-guide.pdf", detail: "대출 안내 PDF", status: "등록" },
          { name: "signature.png", detail: "전자서명 결과", status: "저장" },
        ],
      }
    case "community":
      return {
        title: "커뮤니티 리스트",
        description: "문의, 댓글, 게시글을 운영 관점에서 관리합니다.",
        tableTitle: "커뮤니티 항목",
        rows: [
          { name: "문의 #1204", detail: "답변 대기", status: "대기" },
          { name: "게시글 #892", detail: "신고 검토", status: "검토" },
          { name: "댓글 #331", detail: "비속어 필터", status: "보류" },
        ],
      }
    case "simulation":
      return {
        title: "시뮬레이션 리스트",
        description: "조건 진단과 계산기 시나리오를 확인합니다.",
        tableTitle: "시뮬레이션 항목",
        rows: [
          { name: "조건 진단", detail: "3단계 흐름", status: "활성" },
          { name: "대출 계산", detail: "전세자금 예시", status: "활성" },
          { name: "계약 흐름", detail: "전자서명 포함", status: "활성" },
        ],
      }
    case "settings":
      return {
        title: "설정",
        description: "권한, 배너, 시스템 기본값을 관리합니다.",
        tableTitle: "설정 항목",
        rows: [
          { name: "권한 관리", detail: "admin / editor", status: "활성" },
          { name: "배너 노출", detail: "홈 메인 적용", status: "활성" },
          { name: "로그 보관", detail: "30일", status: "설정" },
        ],
      }
    case "overview":
    default:
      return {
        title: "관리자 메인",
        description: "전체 현황을 먼저 확인하고, 아래 메뉴로 리스트 화면으로 이동합니다.",
        tableTitle: "최근 작업",
        rows: [
          { name: "대출 계약서 생성", detail: "전자서명 완료 대기", status: "진행" },
          { name: "신규 유저 가입", detail: "이메일 인증 확인", status: "검토" },
          { name: "청약 공고 등록", detail: "게시 일정 설정", status: "대기" },
        ],
      }
  }
}

export default function AdminPage({ searchParams }: PageProps) {
  const activeSection = normalizeSection(searchParams?.section)
  const isOverview = activeSection === "overview"
  const meta = getSectionMeta(activeSection)

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-6 lg:px-6">
        <aside className="hidden w-[280px] shrink-0 lg:block">
          <div className="sticky top-6 rounded-[32px] border border-slate-200 bg-slate-950 p-5 text-white shadow-2xl">
            <div className="flex items-center gap-3 px-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-white">
                <LayoutDashboard size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-400">관리자 메인</p>
                <h1 className="text-xl font-black text-white">Youth Homes Admin</h1>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const active = item.key === activeSection
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                      active
                        ? "bg-sky-500 text-white shadow-lg shadow-sky-500/25"
                        : "bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon size={18} />
                    <span className="flex-1">
                      <span className="block">{item.label}</span>
                      <span className="mt-1 block text-xs font-medium opacity-75">{item.description}</span>
                    </span>
                  </Link>
                )
              })}
            </div>

            <Separator className="my-5 bg-slate-800" />

            <div className="rounded-3xl bg-slate-900 p-4 ring-1 ring-slate-800">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">운영 상태</p>
              <div className="mt-3 grid gap-3">
                <div className="flex items-center justify-between rounded-2xl bg-slate-800 px-4 py-3">
                  <span className="text-sm text-slate-300">대기 중</span>
                  <Badge className="bg-amber-500 text-amber-950 hover:bg-amber-500">9</Badge>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-800 px-4 py-3">
                  <span className="text-sm text-slate-300">승인 완료</span>
                  <Badge className="bg-emerald-500 text-emerald-950 hover:bg-emerald-500">31</Badge>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex-1 space-y-6">
          <Card className="overflow-hidden border-slate-200/80 bg-white shadow-sm">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-3xl space-y-5">
                  <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700">
                    <BarChart3 size={14} />
                    관리자 대시보드
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
                      관리자 메인
                      <span className="block text-sky-600">운영 현황과 리스트를 한번에</span>
                    </h2>
                    <p className="max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                      메인에서는 전체 현황을 먼저 보고, 메뉴를 누르면 유저·청약·대출·공고 리스트 화면으로 이동합니다.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button className="rounded-full bg-sky-600 px-5 text-white hover:bg-sky-700">
                      <Search className="mr-2 h-4 w-4" />
                      검색하기
                    </Button>
                    <Button variant="outline" className="rounded-full border-slate-300 px-5">
                      <Bell className="mr-2 h-4 w-4" />
                      알림 확인
                    </Button>
                    <Button variant="outline" className="rounded-full border-sky-200 bg-sky-50 px-5 text-sky-700 hover:bg-sky-100">
                      <Pencil className="mr-2 h-4 w-4" />
                      공지 작성
                    </Button>
                  </div>
                </div>

                <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">오늘의 관리자 현황</p>
                      <p className="text-xs text-slate-500">메인 대시보드에서 빠르게 확인할 수 있어요.</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      정상
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {stats.map((item) => (
                      <div key={item.label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                        <p className="text-xs font-semibold text-slate-400">{item.label}</p>
                        <div className="mt-2 text-2xl font-black text-slate-950">{item.value}</div>
                        <p className="mt-1 text-xs font-medium text-slate-500">{item.hint}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {isOverview ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {stats.map((item) => (
                  <Card key={item.label} className="border-slate-200/80 bg-white shadow-sm">
                    <CardContent className="p-5">
                      <p className="text-sm font-medium text-slate-500">{item.label}</p>
                      <div className="mt-3 text-4xl font-black text-slate-950">{item.value}</div>
                      <p className="mt-2 text-sm text-slate-500">{item.hint}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)]">
                <Card className="border-slate-200/80 bg-white shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-slate-900">관리 기능</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 px-6 pb-6">
                    {overviewActions.map((item, index) => (
                      <Link
                        key={item.title}
                        href={item.href}
                        className="flex flex-col gap-4 rounded-[26px] border border-slate-200 bg-slate-50 p-5 lg:flex-row lg:items-center lg:justify-between"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                            {index === 0 ? <Users size={18} /> : index === 1 ? <FileText size={18} /> : index === 2 ? <Landmark size={18} /> : <Megaphone size={18} />}
                          </div>
                          <div className="space-y-1">
                            <p className="text-base font-black text-slate-950">{item.title}</p>
                            <p className="text-sm leading-6 text-slate-500">{item.desc}</p>
                          </div>
                        </div>
                        <Button className="rounded-full bg-sky-600 px-5 text-white hover:bg-sky-700">
                          이동
                        </Button>
                      </Link>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-slate-200/80 bg-white shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-slate-900">최근 작업</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 px-6 pb-6">
                    {recentLogs.map((log) => (
                      <div key={log.title} className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="font-semibold text-slate-900">{log.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">{log.detail}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card className="border-slate-200/80 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-slate-900">{meta.title}</CardTitle>
                <p className="text-sm text-slate-500">{meta.description}</p>
              </CardHeader>
              <CardContent className="space-y-4 px-6 pb-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Input placeholder="검색어를 입력하세요" className="max-w-md" />
                  <Button className="rounded-full bg-sky-600 px-5 text-white hover:bg-sky-700">
                    <Search className="mr-2 h-4 w-4" />
                    검색
                  </Button>
                </div>

                <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50">
                  <div className="grid grid-cols-[1.3fr_2fr_0.7fr] gap-0 border-b border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-500">
                    <div>이름</div>
                    <div>상세</div>
                    <div>상태</div>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {meta.rows.map((row) => (
                      <div key={row.name} className="grid grid-cols-[1.3fr_2fr_0.7fr] items-center gap-0 px-5 py-4">
                        <div className="font-semibold text-slate-950">{row.name}</div>
                        <div className="text-sm text-slate-600">{row.detail}</div>
                        <div>
                          <Badge className="rounded-full bg-sky-100 text-sky-700 hover:bg-sky-100">{row.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4">
                  <div>
                    <p className="font-semibold text-slate-900">관리자 메인으로 돌아가기</p>
                    <p className="text-sm text-slate-500">관리자 메인에서 다른 리스트를 선택할 수 있어요.</p>
                  </div>
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
                  >
                    관리자 메인
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-200/80 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-900">빠른 이동</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className="flex items-center justify-between rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-sky-300 hover:bg-sky-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm ring-1 ring-slate-200">
                          <Icon size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-950">{item.label}</p>
                          <p className="text-xs text-slate-500">{item.description}</p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-slate-400" />
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
