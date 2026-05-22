"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { get } from "@/lib/api"

export type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "reauthRequired"

export type AuthUser = {
  id: number
  email: string
  nickname: string
  role: string
  hasPersonalInfo: boolean
}

type AuthContextValue = {
  status: AuthStatus
  user: AuthUser | null
  refresh: () => Promise<AuthUser | null>
  clear: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading")
  const [user, setUser] = useState<AuthUser | null>(null)

  const clear = useCallback(() => {
    setUser(null)
    setStatus("unauthenticated")
  }, [])

  const refresh = useCallback(async () => {
    setStatus("loading")
    try {
      const data = await get<AuthUser>("/api/auth/me", {
        auth: false,
        retryOnUnauthorized: false,
        cache: "no-store",
        suppressGlobalError: true,
      })
      setUser(data)
      setStatus("authenticated")
      return data
    } catch (error: unknown) {
      setUser(null)
      const code =
        error &&
        typeof error === "object" &&
        "payload" in error &&
        error.payload &&
        typeof error.payload === "object" &&
        "code" in error.payload
          ? (error.payload as { code?: string }).code
          : undefined

      if (code === "REAUTH_REQUIRED") {
        setStatus("reauthRequired")
      } else {
        setStatus("unauthenticated")
      }
      return null
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return <AuthContext.Provider value={{ status, user, refresh, clear }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}
