"use client"

import Navbar from "@/components/navbar"
import { ReauthDialog } from "@/components/reauth-dialog"
import { useAuth } from "@/lib/auth-context"

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { status } = useAuth()

  return (
    <>
      <Navbar />
      {status === "reauthRequired" && <ReauthDialog />}
      {children}
    </>
  )
}
