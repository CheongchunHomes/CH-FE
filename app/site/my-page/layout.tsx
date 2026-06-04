"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const menuItems = [
  { label: "내 정보", href: "/site/my-page/info" },
  { label: "결제 서류", href: "/site/my-page/sign" },
  { label: "내 스크랩", href: "/site/my-page/scraps" },
]

export default function MyPageLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()

  return (
    <main className="min-h-[calc(100vh-7rem)] bg-[#f4f7fb] px-4 pb-8 text-slate-900 md:px-6">
      <div className="mx-auto max-w-7xl">
        <p className="mb-4 text-sm font-semibold text-slate-500">마이페이지</p>

        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <aside>
            <Card className="border-slate-200/80 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                  <UserRound size={18} className="text-[#2563EB]" />
                  메뉴 리스트
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Separator />

                {menuItems.map((item) => {
                  const isActive = item.href
                    ? pathname === item.href || pathname.startsWith(`${item.href}/`)
                    : false

                  return item.href ? (
                    <Button
                      key={item.label}
                      asChild
                      className={`h-12 w-full justify-start rounded-lg ${
                        isActive
                          ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                          : "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                      }`}
                    >
                      <Link href={item.href}>{item.label}</Link>
                    </Button>
                  ) : (
                    <Button
                      key={item.label}
                      type="button"
                      className="h-12 w-full justify-start rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      {item.label}
                    </Button>
                  )
                })}
              </CardContent>
            </Card>
          </aside>

          <section>{children}</section>
        </div>
      </div>
    </main>
  )
}
