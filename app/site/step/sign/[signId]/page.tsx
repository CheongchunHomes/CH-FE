"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react"

import { ApiError } from "@/lib/api"
import { useStepBar } from "@/app/site/step/components/StepLayoutShell"
import { useAuth } from "@/lib/auth-context"
import { getSignContract, getSignFileSignedUrl, type SignContractDocument } from "@/lib/sign-api"
import { PdfPreviewPanel, TenantPdfSigningDocument } from "@/components/sign/contract-pdf-panels"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function SignContractPage() {
  useStepBar(5)
  const router = useRouter()
  const params = useParams<{ signId: string }>()
  const signId = useMemo(() => Number(params.signId), [params.signId])
  const { status, refresh, user } = useAuth()

  const [contract, setContract] = useState<SignContractDocument | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  const viewerRole = useMemo(() => {
    if (!contract || !user) return null
    if (contract.provider.userId === user.id) return "provider"
    if (contract.customer.userId === user.id) return "customer"
    return "other"
  }, [contract, user])

  useEffect(() => {
    if (viewerRole === "provider" && contract) {
      router.replace(`/site/my-page/sign/${contract.signId}`)
    }
  }, [contract, router, viewerRole])

  useEffect(() => {
    if (status === "loading") {
      setIsLoading(true)
      return
    }
    if (status === "reauthRequired") {
      setIsAuthenticated(true)
      setIsLoading(false)
      return
    }
    if (status !== "authenticated") {
      setIsAuthenticated(false)
      setIsLoading(false)
      setContract(null)
      return
    }
    if (!Number.isFinite(signId)) {
      setIsAuthenticated(true)
      setIsLoading(false)
      setContract(null)
      setErrorMessage("올바르지 않은 계약 번호입니다.")
      return
    }

    setIsAuthenticated(true)
    setIsLoading(true)
    setErrorMessage("")

    async function loadContract() {
      try {
        const data = await getSignContract(signId)
        setContract(data)
      } catch (error) {
        const code = getApiErrorCode(error)
        if (code === "REAUTH_REQUIRED") {
          await refresh()
          return
        }
        setErrorMessage(error instanceof Error ? error.message : "계약서를 불러오지 못했습니다.")
      } finally {
        setIsLoading(false)
      }
    }

    loadContract()
  }, [refresh, reloadToken, signId, status])

  if (!isAuthenticated && !isLoading) {
    return (
      <Card className="border-slate-200/80 bg-white shadow-sm">
        <CardContent className="flex min-h-[360px] flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <AlertCircle size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-950">로그인이 필요합니다.</h1>
            <p className="mt-2 text-sm text-slate-500">계약서를 확인하려면 먼저 로그인해 주세요.</p>
          </div>
          <Button asChild className="rounded-lg bg-sky-600 text-white hover:bg-sky-700">
            <Link href="/login">로그인으로 이동</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (viewerRole === "provider") {
    return (
      <Card className="border-slate-200/80 bg-white shadow-sm">
        <CardContent className="flex min-h-[360px] flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-sky-600">
            <Loader2 className="animate-spin" size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-950">마이페이지 계약서로 이동 중입니다.</h1>
            <p className="mt-2 text-sm text-slate-500">임대인 계약서는 마이페이지에서 작성합니다.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleRefresh = () => setReloadToken((current) => current + 1)

  return (
    <div className="space-y-4">
      <Card className="border-slate-200/80 bg-white shadow-sm">
        <CardContent className="space-y-4 p-4 md:p-8">
          <div className="mx-auto max-w-5xl">
            <Button asChild variant="ghost" className="w-fit px-0 text-slate-600 hover:bg-transparent hover:text-slate-950">
              <Link href="/site/my-page/activity/documents">
                <ArrowLeft className="mr-2 h-4 w-4" />
                목록으로 돌아가기
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="flex min-h-[360px] items-center gap-2 text-sm font-medium text-slate-500">
              <Loader2 className="animate-spin" size={16} />
              계약서를 불러오는 중입니다.
            </div>
          ) : errorMessage ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm font-medium text-rose-700">{errorMessage}</div>
          ) : contract ? (
            viewerRole === "customer" ? (
              contract.status === "ISSUED" ? (
                <StatusMessageCard title="계약 대기" message="임대인 확인이 끝나면 여기에서 계약서를 볼 수 있습니다." />
              ) : contract.status === "PROVIDER_SIGNED" ? (
                contract.contract ? (
                  <TenantPdfSigningDocument contract={contract} onRefresh={handleRefresh} />
                ) : (
                  <StatusMessageCard title="계약 정보를 불러올 수 없습니다." message="저장된 임대인 확정 계약 조건이 없어 서명 화면을 표시할 수 없습니다." tone="destructive" />
                )
              ) : contract.status === "COMPLETED" ? (
                contract.contract?.completedPdfFileId != null ? (
                  <PdfPreviewPanel
                    title="완료된 계약서"
                    description="최종 계약 PDF를 확인하고 다운로드할 수 있습니다."
                    fileId={contract.contract.completedPdfFileId}
                    loadSignedUrl={() => getSignFileSignedUrl(contract.signId, contract.contract!.completedPdfFileId!)}
                  />
                ) : (
                  <StatusMessageCard title="계약 정보를 불러올 수 없습니다." message="완료된 계약서 정보가 없어 PDF를 표시할 수 없습니다." tone="destructive" />
                )
              ) : (
                <StatusMessageCard title="계약 취소" message="취소된 계약입니다." tone="destructive" />
              )
            ) : (
              <StatusMessageCard title="접근 권한" message="이 계약서는 현재 사용자에게 공개되지 않습니다." tone="destructive" />
            )
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function StatusMessageCard({ title, message, tone = "default" }: { title: string; message: string; tone?: "default" | "destructive" }) {
  return (
    <Card className={`border-slate-200/80 bg-white shadow-sm ${tone === "destructive" ? "border-rose-200" : ""}`}>
      <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-3 p-8 text-center">
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${tone === "destructive" ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-600"}`}>
          <AlertCircle size={22} />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
          <p className="text-sm text-slate-500">{message}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function getApiErrorCode(error: unknown) {
  return error instanceof ApiError && error.payload && typeof error.payload === "object" && "code" in error.payload
    ? (error.payload as { code?: string }).code
    : undefined
}
