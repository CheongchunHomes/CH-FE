"use client"

import Navbar from "@/components/navbar"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const router = useRouter()
  const { status, user } = useAuth()

  useEffect(() => {
    if (status === "authenticated" && user?.hasPersonalInfo === false) {
      router.replace("/personal")
    }
  }, [router, status, user?.hasPersonalInfo])

  if (status === "authenticated" && user?.hasPersonalInfo === false) {
    return null
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  )
}
