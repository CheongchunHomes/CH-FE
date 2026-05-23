"use client"

import { useEffect, useState } from "react"

import { getFileSignedUrl } from "@/lib/api"
import type { FileSignedUrlResponse } from "@/lib/api"

export type PrivateFileUrlState = {
  data: FileSignedUrlResponse | null
  signedUrl: string | null
  isLoading: boolean
  error: Error | null
}

export function usePrivateFileUrl(fileId: number | null): PrivateFileUrlState {
  const [data, setData] = useState<FileSignedUrlResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let canceled = false

    if (fileId === null) {
      setData(null)
      setIsLoading(false)
      setError(null)
      return () => {
        canceled = true
      }
    }

    setIsLoading(true)
    setError(null)

    getFileSignedUrl(fileId)
      .then((response) => {
        if (!canceled) {
          setData(response)
        }
      })
      .catch((err: unknown) => {
        if (!canceled) {
          setData(null)
          setError(err instanceof Error ? err : new Error("Failed to load private file URL."))
        }
      })
      .finally(() => {
        if (!canceled) {
          setIsLoading(false)
        }
      })

    return () => {
      canceled = true
    }
  }, [fileId])

  return {
    data,
    signedUrl: data?.signedUrl ?? null,
    isLoading,
    error,
  }
}
