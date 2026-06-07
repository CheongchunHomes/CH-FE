"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { createPortal } from "react-dom"
import { useEffect, useMemo, useState } from "react"
import { AlertCircle, ArrowLeft, FileText, Loader2 } from "lucide-react"

import { ApiError, uploadPrivateFile } from "@/lib/api"
import {
  calculateMonthCount,
  ContractDocument,
  createContractDocumentDraft,
  createContractDocumentDraftFromSavedContract,
  dataUrlToFile,
  parseOptionalWon,
  type ContractDocumentDraft,
  type ContractDocumentField,
} from "@/components/sign/contract-document"
import { useAuth } from "@/lib/auth-context"
import {
  getBrokerSign,
  getSignContract,
  getSignFileSignedUrl,
  providerSign,
  type BrokerSignDocument,
  type SignContractDocument,
  type SignStatus,
} from "@/lib/sign-api"
import { PdfPreviewPanel, SignatureDialog, TenantPdfSigningDocument } from "@/components/sign/contract-pdf-panels"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const statusLabels: Record<SignStatus, string> = {
  ISSUED: "요청",
  PROVIDER_SIGNED: "임대인 서명 완료",
  COMPLETED: "완료",
  CANCELED: "취소",
}

const defaultSpecialTerms = `1.본 주택의 임대차에 관한 중개대상물확인·설명서 및 계약서상의 시설물 상태는 임대인이 고지한 사항과 임차인 및
  공인중개사의 현장 확인 사항을 기초로 한 것이다.
2.임대할 부분의 면적은 (공부상 전용면적 또는 연면적, 실측 면적)이다.
3.임대인은 본 계약체결 당시 국세·지방세 체납, 근저당권 이자체납 사실이 없음을 고지한다.
4.거래당사자는 본 계약과 관련하여 분쟁이 있는 경우 법원에 소를 제기하기 전에 먼저 주택임대차분쟁조정위원회에
  조정을 신청할 수 있다.
 ※ 주택임대차분쟁조정위원회 조정을 통할 경우 60일(최대 90일) 이내 신속하게 조정 결과를 받아볼 수 있습니다.
5.전세금반환보증 가입을 위해 임대인이 취해야 할 조치가 있는 경우 임대인은 성실히 협력하여야 하며, 임대인의
  미협조 또는 책임있는 사유로 임차인의 보증보험 가입이 불가능한 경우 임차인은 본 계약을 해제할 수 있다. 단,
  이 경우 본 계약의 해제에 따른 위약금 또는 별도의 손해배상책임을 묻지 아니하며, 수수된 금원은 원금으로
  상환하여야 한다.
6.주택임대차계약 신고는 계약체결일로부터 30일 이내 관할 주민센터를 방문 또는 부동산거래관리시스템
  (https//rtms.molit.go.kr)을 통해 임대인과 임차인이 신고서에 공동으로 서명·날인하여 신고하거나,
  임차인 또는 임대인이 계약서를 첨부하여 단독으로 신고도 가능합니다.
7.본 계약에 명시되지 않은 사항은 주택임대차보호법 및 민법과 주택임대차계약의 일반관례에 따른다.
8.첨부서류 : 중개대상물확인·설명서, 공제증서 사본 각 1부.`

export default function MyPageSignDetailPage() {
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
          <Button asChild className="rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
            <Link href="/login">로그인으로 이동</Link>
          </Button>
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
              <Link href="/site/my-page/activity?tab=documents">
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
            viewerRole === "provider" ? (
              contract.status === "ISSUED" ? (
                <ProviderContractDocument contract={contract} onRefresh={handleRefresh} />
              ) : contract.status === "PROVIDER_SIGNED" ? (
                <ProviderSignedContractView contract={contract} />
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
            ) : viewerRole === "customer" ? (
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

function ProviderContractDocument({ contract, onRefresh }: { contract: SignContractDocument; onRefresh: () => void }) {
  const [draft, setDraft] = useState<ContractDocumentDraft>(() => createEditableDraft(contract))
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false)
  const [brokerSign, setBrokerSign] = useState<BrokerSignDocument | null>(null)
  const [isBrokerSignLoading, setIsBrokerSignLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [submitError, setSubmitError] = useState("")

  useEffect(() => {
    setDraft(createEditableDraft(contract))
  }, [contract])

  useEffect(() => {
    let canceled = false

    async function loadBrokerSign() {
      try {
        setIsBrokerSignLoading(true)
        const data = await getBrokerSign()
        if (!canceled) {
          setBrokerSign(data)
          setDraft((current) => ({ ...current, brokerSignUrl: data.signedUrl }))
        }
      } catch (error) {
        if (!canceled) {
          setSubmitError(error instanceof Error ? error.message : "중개사 서명을 불러오지 못했습니다.")
        }
      } finally {
        if (!canceled) {
          setIsBrokerSignLoading(false)
        }
      }
    }

    loadBrokerSign()

    return () => {
      canceled = true
    }
  }, [])

  const handleFieldChange = (field: ContractDocumentField, value: string) => {
    setDraft((current) => {
      const next = { ...current, [field]: value }
      if (field === "leaseEndDate") {
        next.leaseMonthCount = calculateMonthCount(contract.property.moveInDate, value)
      }
      return next
    })
  }

  const openPreview = () => {
    if (!draft.providerSignature) {
      return
    }
    if (isBrokerSignLoading || !brokerSign?.signedUrl) {
      setSubmitError("중개사 서명을 아직 불러오는 중입니다.")
      return
    }
    setSubmitError("")
    setIsPreviewOpen(true)
  }

  const handleConfirm = async () => {
    setIsSubmitting(true)
    setSubmitError("")

    try {
      const providerSignatureFileId = await uploadPrivateFile(dataUrlToFile(draft.providerSignature, "provider-signature.png"))
      await providerSign(contract.signId, {
        leaseEndDate: draft.leaseEndDate,
        contractAmount: parseOptionalWon(draft.contractAmount),
        interimAmount1: parseOptionalWon(draft.interimAmount1),
        interimAmount1Date: draft.interimPaymentDate1 || null,
        interimAmount2: parseOptionalWon(draft.interimAmount2),
        interimAmount2Date: draft.interimPaymentDate2 || null,
        balanceAmount: parseOptionalWon(draft.balanceAmount),
        balanceDate: draft.balancePaymentDate || null,
        specialTerms: draft.specialTerms,
        buildingDong: draft.buildingDong,
        unitHo: draft.unitHo,
        rentedPart: draft.rentedPart,
        providerSignatureFileId,
      })
      setIsPreviewOpen(false)
      onRefresh()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "임대인 서명 처리에 실패했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="mx-auto max-w-5xl space-y-4">
        <header className="overflow-hidden rounded-lg border border-slate-300 bg-slate-950 px-5 py-4 text-white shadow-sm md:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <FileText size={22} className="text-blue-300" />
              <div>
                <h2 className="text-xl font-bold">부동산 전세 계약서</h2>
              </div>
            </div>
            <Badge variant={contract.status === "CANCELED" ? "destructive" : "secondary"} className="w-fit">
              {statusLabels[contract.status]}
            </Badge>
          </div>
        </header>

        <ContractDocument
          contract={contract}
          draft={draft}
          readOnly={false}
          onFieldChange={handleFieldChange}
          onProviderSign={() => setIsSignatureDialogOpen(true)}
          providerSignDisabled={isSubmitting}
          actions={
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-slate-500">미리보기는 저장될 최종 계약 내용을 그대로 보여줍니다.</p>
              <div className="flex items-center gap-3">
                {submitError ? <span className="text-sm font-medium text-rose-600">{submitError}</span> : null}
                <Button type="button" onClick={openPreview} disabled={isSubmitting || isBrokerSignLoading || !brokerSign?.signedUrl || !draft.providerSignature}>
                  {isSubmitting ? <><Loader2 className="mr-2 animate-spin" size={16} />처리 중</> : "임대인 서명 완료"}
                </Button>
              </div>
            </div>
          }
        />
      </div>

      <SignatureDialog
        open={isSignatureDialogOpen}
        onClose={() => setIsSignatureDialogOpen(false)}
        onConfirm={(dataUrl) => {
          setDraft((current) => ({ ...current, providerSignature: dataUrl }))
          setIsSignatureDialogOpen(false)
        }}
      />

      <ProviderContractPreviewModal
        open={isPreviewOpen}
        contract={contract}
        draft={draft}
        errorMessage={submitError}
        isSubmitting={isSubmitting}
        onClose={() => setIsPreviewOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  )
}

function ProviderSignedContractView({ contract }: { contract: SignContractDocument }) {
  const [providerSignatureUrl, setProviderSignatureUrl] = useState<string | null>(null)
  const [brokerSignatureUrl, setBrokerSignatureUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState("")

  const draft = useMemo(() => {
    if (!contract.contract) {
      return null
    }

    return createContractDocumentDraftFromSavedContract(contract, {
      providerSignature: providerSignatureUrl,
      brokerSignUrl: brokerSignatureUrl,
      customerSignature: null,
    })
  }, [brokerSignatureUrl, contract, providerSignatureUrl])

  useEffect(() => {
    let canceled = false

    async function loadAssets() {
      if (!contract.contract) {
        return
      }

      try {
        const [providerSignature, brokerSign] = await Promise.all([
          contract.contract.providerSignatureFileId != null
            ? getSignFileSignedUrl(contract.signId, contract.contract.providerSignatureFileId)
            : Promise.resolve(null),
          getBrokerSign(),
        ])

        if (canceled) {
          return
        }

        setProviderSignatureUrl(providerSignature?.signedUrl ?? null)
        setBrokerSignatureUrl(brokerSign.signedUrl)
      } catch (error) {
        if (!canceled) {
          setErrorMessage(error instanceof Error ? error.message : "서명 이미지를 불러오지 못했습니다.")
        }
      }
    }

    loadAssets()

    return () => {
      canceled = true
    }
  }, [contract])

  if (!contract.contract || !draft) {
    return <StatusMessageCard title="계약 정보를 불러올 수 없습니다." message="저장된 임대인 확정 계약 조건이 없습니다." tone="destructive" />
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <header className="overflow-hidden rounded-lg border border-slate-300 bg-slate-950 px-5 py-4 text-white shadow-sm md:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <FileText size={22} className="text-blue-300" />
            <div>
              <h2 className="text-xl font-bold">부동산 전세 계약서</h2>
            </div>
          </div>
          <Badge variant="secondary" className="w-fit">
            {statusLabels[contract.status]}
          </Badge>
        </div>
      </header>

      <ContractDocument contract={contract} draft={draft} readOnly actions={errorMessage ? <p className="text-sm font-medium text-rose-600">{errorMessage}</p> : null} />
    </div>
  )
}

function ProviderContractPreviewModal({
  open,
  contract,
  draft,
  onClose,
  onConfirm,
  isSubmitting,
  errorMessage,
}: {
  open: boolean
  contract: SignContractDocument
  draft: ContractDocumentDraft
  onClose: () => void
  onConfirm: () => void
  isSubmitting: boolean
  errorMessage?: string
}) {
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[120] bg-slate-950/60 px-3 py-5">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-950">계약서 미리보기</h3>
            <p className="mt-1 text-sm text-slate-500">이 화면과 같은 내용이 저장됩니다.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {errorMessage ? <span className="text-sm font-medium text-rose-600">{errorMessage}</span> : null}
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>취소</Button>
            <Button type="button" onClick={onConfirm} disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="mr-2 animate-spin" size={16} />저장 중</> : "확인 후 저장"}</Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-slate-100 p-4 md:p-8">
          <div className="mx-auto w-fit">
            <ContractDocument contract={contract} draft={draft} readOnly mode="pdf" />
          </div>
        </div>
      </div>
    </div>,
    document.body,
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

function createEditableDraft(contract: SignContractDocument) {
  return createContractDocumentDraft(contract, {
    specialTerms: defaultSpecialTerms,
  })
}

function getApiErrorCode(error: unknown) {
  return error instanceof ApiError && error.payload && typeof error.payload === "object" && "code" in error.payload
    ? (error.payload as { code?: string }).code
    : undefined
}
