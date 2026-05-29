"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { createPortal } from "react-dom"
import { useEffect, useMemo, useRef, useState } from "react"
import type { ChangeEvent, ReactNode } from "react"
import { AlertCircle, ArrowLeft, FileText, Loader2, PenTool } from "lucide-react"

import { ApiError, uploadPrivateFile } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import {
  getBrokerSign,
  getCompletedPdfSignedUrl,
  getProviderSignedPdfSignedUrl,
  getSignContract,
  providerSign,
  type BrokerSignDocument,
  type SignContractDocument,
  type SignStatus,
} from "@/lib/sign-api"
import {
  PdfPreviewPanel,
  SignatureDialog,
  SignatureMark,
  TenantPdfSigningDocument,
} from "@/components/sign/contract-pdf-panels"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const statusLabels: Record<SignStatus, string> = {
  ISSUED: "신청",
  PROVIDER_SIGNED: "임대인 서명",
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

const maxWonDigitLength = 16
const CONTRACT_PDF_NAME = "contract.pdf"

type SignatureTarget = "provider" | "customer"

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
    if (!contract || !user) {
      return null
    }

    if (contract.provider.userId === user.id) {
      return "provider"
    }

    if (contract.customer.userId === user.id) {
      return "customer"
    }

    return "other"
  }, [contract, user])

  const isLandlordMode = true

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
      setErrorMessage("올바르지 않은 결제 서류 번호입니다.")
      return
    }

    setIsAuthenticated(true)
    setIsLoading(true)
    setErrorMessage("")

    async function loadContract() {
      try {
        const data = await getSignContract(signId)
        setContract(data)
        setErrorMessage("")
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
            <h1 className="text-xl font-bold text-slate-950">로그인이 필요합니다</h1>
            <p className="mt-2 text-sm text-slate-500">계약서를 확인하려면 먼저 로그인해 주세요.</p>
          </div>

          <Button asChild className="rounded-lg bg-sky-600 text-white hover:bg-sky-700">
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
              <Link href="/site/my-page/sign">
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
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm font-medium text-rose-700">
              {errorMessage}
            </div>
          ) : contract ? (
            isLandlordMode ? (
              viewerRole === "provider" ? (
                contract.status === "ISSUED" ? (
                  <ProviderContractDocument contract={contract} onRefresh={handleRefresh} />
                ) : contract.providerSignedPdfFileId != null ? (
                  <PdfPreviewPanel
                    title={contract.completedPdfFileId != null ? "완료된 계약서" : "임대인 서명 완료 계약서"}
                    description={
                      contract.completedPdfFileId != null
                        ? "최종 계약 PDF를 확인하고 다운로드할 수 있습니다."
                        : "임대인 서명 후 생성된 PDF를 확인할 수 있습니다."
                    }
                    fileId={contract.completedPdfFileId ?? contract.providerSignedPdfFileId}
                    loadSignedUrl={() =>
                      contract.completedPdfFileId != null
                        ? getCompletedPdfSignedUrl(contract.signId)
                        : getProviderSignedPdfSignedUrl(contract.signId)
                    }
                  />
                ) : (
                  <StatusMessageCard title="계약 상태" message="계약서가 아직 생성되지 않았습니다." />
                )
              ) : (
                <StatusMessageCard
                  title="접근 제한"
                  message="이 계약서는 현재 사용자에게 공개되지 않았습니다."
                  tone="destructive"
                />
              )
            ) : viewerRole === "customer" ? (
              contract.status === "ISSUED" ? (
                <StatusMessageCard
                  title="계약 대기"
                  message="임대인이 계약서 PDF를 생성할 때까지 기다려 주세요."
                />
              ) : contract.status === "PROVIDER_SIGNED" ? (
                <TenantPdfSigningDocument contract={contract} onRefresh={handleRefresh} />
              ) : contract.status === "COMPLETED" ? (
                <PdfPreviewPanel
                  title="완료된 계약서"
                  description="최종 계약 PDF를 확인하고 다운로드할 수 있습니다."
                  fileId={contract.completedPdfFileId}
                  loadSignedUrl={() => getCompletedPdfSignedUrl(contract.signId)}
                />
              ) : (
                <StatusMessageCard title="계약 취소" message="취소된 계약서입니다." tone="destructive" />
              )
            ) : (
              <StatusMessageCard
                title="접근 제한"
                message="이 계약서는 현재 사용자에게 공개되지 않았습니다."
                tone="destructive"
              />
            )
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function ProviderContractDocument({
  contract,
  onRefresh,
}: {
  contract: SignContractDocument
  onRefresh: () => void
}) {
  const property = contract.property
  const [buildingDong, setBuildingDong] = useState("")
  const [unitHo, setUnitHo] = useState("")
  const [rentedPart, setRentedPart] = useState("")
  const [leaseEndDate, setLeaseEndDate] = useState(() => getDefaultLeaseEndDate(property.moveInDate))
  const [contractAmount, setContractAmount] = useState("")
  const [interimAmount1, setInterimAmount1] = useState("")
  const [interimAmount2, setInterimAmount2] = useState("")
  const [balanceAmount, setBalanceAmount] = useState("")
  const [interimPaymentDate1, setInterimPaymentDate1] = useState("")
  const [interimPaymentDate2, setInterimPaymentDate2] = useState("")
  const [balancePaymentDate, setBalancePaymentDate] = useState("")
  const [specialTerms, setSpecialTerms] = useState(defaultSpecialTerms)
  const [signatureTarget, setSignatureTarget] = useState<SignatureTarget | null>(null)
  const [brokerSign, setBrokerSign] = useState<BrokerSignDocument | null>(null)
  const [isBrokerSignLoading, setIsBrokerSignLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [signatures, setSignatures] = useState<Record<SignatureTarget, string | null>>({
    provider: null,
    customer: null,
  })
  const depositWon = formatWonInput(property.depositAmount === null || property.depositAmount === undefined ? "" : String(property.depositAmount * 10000))
  const leaseMonthCount = useMemo(
    () => calculateMonthCount(property.moveInDate, leaseEndDate),
    [leaseEndDate, property.moveInDate]
  )
  const pdfDraft: ProviderContractPdfDraft = {
    buildingDong,
    unitHo,
    rentedPart,
    leaseEndDate,
    leaseMonthCount,
    contractAmount,
    interimAmount1,
    interimAmount2,
    balanceAmount,
    interimPaymentDate1,
    interimPaymentDate2,
    balancePaymentDate,
    specialTerms,
    depositWon,
    providerSignature: signatures.provider,
    brokerSignUrl: brokerSign?.signedUrl ?? null,
  }

  useEffect(() => {
    let canceled = false

    async function loadBrokerSign() {
      try {
        setIsBrokerSignLoading(true)
        const data = await getBrokerSign()
        if (!canceled) {
          setBrokerSign(data)
          setSubmitError("")
        }
      } catch (error) {
        if (!canceled) {
          setSubmitError(error instanceof Error ? error.message : "공인중개사 서명을 불러오지 못했습니다.")
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

  const requestSignature = (target: SignatureTarget) => {
    setSignatureTarget(target)
  }

  const applySignature = (dataUrl: string) => {
    if (!signatureTarget) return
    setSignatures((current) => ({ ...current, [signatureTarget]: dataUrl }))
    setSignatureTarget(null)
  }

  const openPdfPreview = () => {
    const providerSignature = signatures.provider

    if (!providerSignature) {
      setSubmitError("임대인 서명을 먼저 완료해 주세요.")
      return
    }

    if (isBrokerSignLoading || !brokerSign?.signedUrl) {
      setSubmitError("공인중개사 서명을 불러오는 중입니다.")
      return
    }

    setSubmitError("")
    setIsPdfPreviewOpen(true)
  }

  const handleConfirmPdf = async (container: HTMLElement) => {
    setIsSubmitting(true)
    setSubmitError("")

    try {
      const pdfFile = await buildContractPdf(container)
      const fileId = await uploadPrivateFile(pdfFile)
      await providerSign(contract.signId, { providerSignedPdfFileId: fileId })
      setIsPdfPreviewOpen(false)
      onRefresh()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "임대인 서명 완료 처리에 실패했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <article className="mx-auto max-w-5xl overflow-hidden rounded-lg border border-slate-300 bg-white text-slate-950 shadow-sm">
        <header className="border-b border-slate-300 bg-slate-950 px-5 py-4 text-white md:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <FileText size={22} className="text-sky-300" />
              <div>
                <h2 className="text-xl font-bold">부동산(다세대주택) 전세 계약서</h2>
              </div>
            </div>

            <Badge variant={contract.status === "CANCELED" ? "destructive" : "secondary"} className="w-fit">
              {statusLabels[contract.status]}
            </Badge>
          </div>
        </header>

        <div className="space-y-6 p-5 md:p-8">
          <ContractSection title="1. 부동산 표시">
            <DocumentTable>
              <DocumentRow label="소재지">
                <div className="grid gap-2 md:grid-cols-[1fr_74px_74px]">
                  <ReadOnlyField label="소재지 주소" value={property.address} hideLabel />
                  <BlankField label="동" hideLabel suffix="동" value={buildingDong} onValueChange={setBuildingDong} />
                  <BlankField label="호" hideLabel suffix="호" value={unitHo} onValueChange={setUnitHo} />
                </div>
              </DocumentRow>
              <DocumentRow label="건물">
                <div className="grid gap-2 md:grid-cols-[1fr_1fr_120px]">
                  <ReadOnlyField label="용도" value={property.buildingUse} />
                  <ReadOnlyField label="면적" value={formatArea(property.supplyAreaM2)} />
                </div>
              </DocumentRow>
              <DocumentRow label="">
                <div className="grid gap-2 md:grid-cols-[1fr_180px]">
                  <BlankField label="임대할 부분" value={rentedPart} onValueChange={setRentedPart} />
                  <ReadOnlyField label="면적" value={formatArea(property.exclusiveAreaM2)} />
                </div>
              </DocumentRow>
            </DocumentTable>
          </ContractSection>

          <ContractSection title="2. 계약 내용">
            <div className="space-y-4 text-sm leading-6 text-slate-700">
              <Clause title="제1조 [목적]">
                위 부동산의 임대차에 관하여 임대인과 임차인은 합의에 의하여 임차보증금 및 차임을 아래와 같이 지급하기로 한다.
              </Clause>

              <DocumentTable>
                <DocumentRow label="보증금">
                  <MoneyLine>
                    <MoneyText>일금</MoneyText>
                    <MoneyField className="min-w-0 flex-1" label="보증금" value={depositWon} readOnly />
                    <MoneyText>원정</MoneyText>
                  </MoneyLine>
                </DocumentRow>
                <DocumentRow label="계약금">
                  <MoneyLine>
                    <MoneyText>일금</MoneyText>
                    <MoneyField className="min-w-0 flex-1" label="계약금" value={contractAmount} onChange={setContractAmount} />
                    <MoneyText>원정</MoneyText>
                    <MoneyText>은 계약시에 지급하고 영수함.</MoneyText>
                  </MoneyLine>
                </DocumentRow>
                <DocumentRow label="중도금">
                  <div className="space-y-2">
                    <PaymentLine
                      label="중도금 1"
                      dateLabel="중도금 1 지급일"
                      value={interimAmount1}
                      onChange={setInterimAmount1}
                      dateValue={interimPaymentDate1}
                      onDateChange={setInterimPaymentDate1}
                    />
                    <PaymentLine
                      label="중도금 2"
                      dateLabel="중도금 2 지급일"
                      value={interimAmount2}
                      onChange={setInterimAmount2}
                      dateValue={interimPaymentDate2}
                      onDateChange={setInterimPaymentDate2}
                    />
                  </div>
                </DocumentRow>
                <DocumentRow label="잔금">
                  <PaymentLine
                    label="잔금"
                    dateLabel="잔금 지급일"
                    value={balanceAmount}
                    onChange={setBalanceAmount}
                    dateValue={balancePaymentDate}
                    onDateChange={setBalancePaymentDate}
                  />
                </DocumentRow>
              </DocumentTable>

              <Clause title="제2조 [존속기간]">
                <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
                  <span>임대인은 위 부동산을 임대차 목적대로 사용할 수 있는 상태로</span>
                  <ReadOnlyField className="w-full md:w-44" label="임차인 인도일" value={formatDate(property.moveInDate)} hideLabel />
                  <span>일까지 임차인에게 인도하며, 임대차 기간은 인도일로부터</span>
                  <BlankField
                    className="w-full md:w-44"
                    label="임대차 종료일"
                    type="date"
                    value={leaseEndDate}
                    onChange={(event) => setLeaseEndDate(event.target.value)}
                    hideLabel
                  />
                  <span>일</span>
                  <ReadOnlyField className="w-full md:w-32" label="임대차 기간" value={leaseMonthCount} hideLabel />
                  <span>개월</span>
                  <span>까지로 한다.</span>
                </div>
              </Clause>

              <Clause title="제3조 [용도변경 및 전대 등]">
                임차인은 임대인의 동의없이 위 부동산의 용도나 구조를 변경하거나 전대, 임차권 양도 또는 담보제공을 하지 못하며 임대차 목적 이외의 용도로 사용할 수 없다.
              </Clause>
              <Clause title="제4조 [계약의 해지]">임차인이 제3조를 위반했을 때 임대인은 즉시 본 계약을 해지 할 수 있다.</Clause>
              <Clause title="제5조 [계약의 종료]">
                임대차계약이 종료된 경우 임차인은 위 부동산을 원상으로 회복하여 임대인에게 반환한다. 이러한 경우 임대인은 보증금을 임차인에게 반환하고, 연체 임대료 또는 손해배상금이 있을 때는 이들을 제하고 그 잔액을 반환한다.
              </Clause>
              <Clause title="제6조 [계약의 해제]">
                임차인이 임대인에게 중도금이 없을때는 잔금을 지급하기 전까지 임대인은 계약금의 배액을 상환하고, 임차인은 계약금을 포기하고 이 계약을 해제할 수 있다.
              </Clause>
              <Clause title="제7조 [채무불이행과 손해배상]">
                임대인 또는 임차인은 본 계약상의 내용에 대하여 불이행이 있을 경우 그 상대방은 불이행 한 자에 대하여 서면으로 최고하고 계약을 해제 할 수 있다. 그리고 계약 당사자는 계약해제에 따른 손해배상을 각각 상대방에게 청구할 수 있으며, 손해배상에 대하여 별도의 약정이 없는 한 계약금을 손해배상의 기준으로 본다.
              </Clause>
              <Clause title="제8조 [중개보수]">
                개업공인중개사는 임대인 또는 임차인의 본 계약 불이행에 대하여 책임을 지지 않는다. 또한 중개보수는 본 계약 체결에 따라 계약 당사자 쌍방이 각각 지급하며, 개업공인중개사의 고의나 과실 없이 본 계약이 무효, 취소 또는 해제되어도 중개보수는 지급한다. 공동중개인 경우에 임대인과 임차인은 자신이 중개의뢰한 개업공인중개사에게 각각 중개보수를 지급한다.
              </Clause>
              <Clause title="제9조 [중개대상물확인설명서 교부 등]">
                개업공인중개사는 중개대상물확인설명서를 작성하고 업무보증관계증서(공제증서 등) 사본을 첨부하여 거래당사자 쌍방에게 교부한다.
              </Clause>
            </div>
          </ContractSection>

          <ContractSection title="3. 특약사항">
            <Textarea
              className="min-h-96 resize-y bg-white leading-6"
              value={specialTerms}
              onChange={(event) => setSpecialTerms(event.target.value)}
            />
          </ContractSection>

          <ContractSection title="4. 임대인 정보">
            <PartyFields
              party={contract.provider}
              signature={signatures.provider}
              onSign={() => requestSignature("provider")}
              canSign
              pendingLabel="임대인 서명 대기"
            />
          </ContractSection>

          <ContractSection title="5. 임차인 정보">
            <PartyFields
              party={contract.customer}
              signature={signatures.customer}
              canSign={false}
              pendingLabel="임차인 서명 대기"
            />
          </ContractSection>

          <ContractSection title="6. 개업 공인중개사">
            <AgentFields brokerSignUrl={brokerSign?.signedUrl} isLoading={isBrokerSignLoading} />
          </ContractSection>
        </div>
        <div className="border-t border-slate-300 px-5 py-4 md:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-slate-500">
              임대인 서명과 공인중개사 서명을 포함한 PDF를 생성한 뒤 임대인 서명 완료로 저장합니다.
            </div>
            <div className="flex items-center gap-3">
              {submitError ? <span className="text-sm font-medium text-rose-600">{submitError}</span> : null}
              <Button
                type="button"
                onClick={openPdfPreview}
                disabled={isSubmitting || isBrokerSignLoading || !brokerSign?.signedUrl}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={16} />
                    PDF 생성 중
                  </>
                ) : (
                  "임대인 서명 완료"
                )}
              </Button>
            </div>
          </div>
        </div>
      </article>

      <SignatureDialog
        open={signatureTarget !== null}
        onClose={() => setSignatureTarget(null)}
        onConfirm={applySignature}
      />
      <ProviderContractPdfPreviewModal
        open={isPdfPreviewOpen}
        contract={contract}
        draft={pdfDraft}
        onClose={() => setIsPdfPreviewOpen(false)}
        onConfirm={handleConfirmPdf}
        isSubmitting={isSubmitting}
        errorMessage={submitError}
      />
    </>
  )
}

type ProviderContractPdfDraft = {
  buildingDong: string
  unitHo: string
  rentedPart: string
  leaseEndDate: string
  leaseMonthCount: string
  contractAmount: string
  interimAmount1: string
  interimAmount2: string
  balanceAmount: string
  interimPaymentDate1: string
  interimPaymentDate2: string
  balancePaymentDate: string
  specialTerms: string
  depositWon: string
  providerSignature: string | null
  brokerSignUrl: string | null
}

function ProviderContractPdfPreviewModal({
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
  draft: ProviderContractPdfDraft
  onClose: () => void
  onConfirm: (container: HTMLElement) => void
  isSubmitting: boolean
  errorMessage?: string
}) {
  const previewRef = useRef<HTMLDivElement | null>(null)

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[120] bg-slate-950/60 px-3 py-5">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-950">PDF 생성 전 미리보기</h3>
            <p className="mt-1 text-sm text-slate-500">입력란과 버튼을 제거한 최종 문서 화면입니다.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {errorMessage ? <span className="text-sm font-medium text-rose-600">{errorMessage}</span> : null}
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              취소
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (previewRef.current) {
                  onConfirm(previewRef.current)
                }
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={16} />
                  PDF 생성 중
                </>
              ) : (
                "이 미리보기로 PDF 생성"
              )}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-100 p-4 md:p-8">
          <div ref={previewRef} className="mx-auto w-fit">
            <ProviderContractPdfDocument contract={contract} draft={draft} />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function ProviderContractPdfDocument({
  contract,
  draft,
}: {
  contract: SignContractDocument
  draft: ProviderContractPdfDraft
}) {
  const property = contract.property

  return (
    <div className="w-[794px] space-y-4 bg-white px-14 py-12 text-slate-950">
      <PdfPage>
        <PdfTitle />
        <PdfSection title="1. 부동산 표시">
          <PdfRow label="소재지">
            <div className="grid grid-cols-[1fr_70px_70px] gap-2">
              <PdfBox value={property.address} />
              <PdfBox value={draft.buildingDong} suffix="동" />
              <PdfBox value={draft.unitHo} suffix="호" />
            </div>
          </PdfRow>
          <PdfRow label="건물">
            <div className="grid grid-cols-[1fr_1fr_120px] gap-2">
              <PdfBox label="용도" value={property.buildingUse} />
              <PdfBox label="면적" value={formatArea(property.supplyAreaM2)} />
            </div>
          </PdfRow>
          <PdfRow label="">
            <div className="grid grid-cols-[1fr_180px] gap-2">
              <PdfBox label="임대할 부분" value={draft.rentedPart} />
              <PdfBox label="면적" value={formatArea(property.exclusiveAreaM2)} />
            </div>
          </PdfRow>
        </PdfSection>

        <PdfSection title="2. 계약 내용">
          <div className="space-y-1.5 text-[12px] leading-5 text-slate-700">
            <PdfClause title="제1조 [목적]">
              위 부동산의 임대차에 관하여 임대인과 임차인은 합의에 의하여 임차보증금 및 차임을 아래와 같이 지급하기로 한다.
            </PdfClause>
            <PdfRow label="보증금">
              <PdfMoneyLine amount={draft.depositWon} tail="은 계약시에 지급하고 영수함." readOnly />
            </PdfRow>
            <PdfRow label="계약금">
              <PdfMoneyLine amount={draft.contractAmount} tail="은 계약시에 지급하고 영수함." />
            </PdfRow>
            <PdfRow label="중도금">
              <div className="space-y-2">
                <PdfPaymentLine label="중도금 1" amount={draft.interimAmount1} date={draft.interimPaymentDate1} />
                <PdfPaymentLine label="중도금 2" amount={draft.interimAmount2} date={draft.interimPaymentDate2} />
              </div>
            </PdfRow>
            <PdfRow label="잔금">
              <PdfPaymentLine label="잔금" amount={draft.balanceAmount} date={draft.balancePaymentDate} />
            </PdfRow>
            <PdfClause title="제2조 [존속기간]">
              임대인은 위 부동산을 임대차 목적대로 사용할 수 있는 상태로 {formatDate(property.moveInDate)}일까지 임차인에게 인도하며,
              임대차 기간은 인도일로부터 {formatDate(draft.leaseEndDate)}일 {draft.leaseMonthCount}개월까지로 한다.
            </PdfClause>
          </div>
        </PdfSection>
      </PdfPage>

      <PdfPage>
        <PdfSection title="2. 계약 내용">
          <div className="space-y-1.5 text-[12px] leading-5 text-slate-700">
            <PdfClause title="제3조 [용도변경 및 전대 등]">
              임차인은 임대인의 동의없이 위 부동산의 용도나 구조를 변경하거나 전대, 임차권 양도 또는 담보제공을 하지 못하며 임대차 목적 이외의 용도로 사용할 수 없다.
            </PdfClause>
            <PdfClause title="제4조 [계약의 해지]">임차인이 제3조를 위반했을 때 임대인은 즉시 본 계약을 해지 할 수 있다.</PdfClause>
            <PdfClause title="제5조 [계약의 종료]">
              임대차계약이 종료된 경우 임차인은 위 부동산을 원상으로 회복하여 임대인에게 반환한다. 이러한 경우 임대인은 보증금을 임차인에게 반환하고,
              연체 임대료 또는 손해배상금이 있을 때는 이들을 제하고 그 잔액을 반환한다.
            </PdfClause>
            <PdfClause title="제6조 [계약의 해제]">
              임차인이 임대인에게 중도금이 없을때는 잔금을 지급하기 전까지 임대인은 계약금의 배액을 상환하고, 임차인은 계약금을 포기하고 이 계약을 해제할 수 있다.
            </PdfClause>
            <PdfClause title="제7조 [채무불이행과 손해배상]">
              임대인 또는 임차인은 본 계약상의 내용에 대하여 불이행이 있을 경우 그 상대방은 불이행 한 자에 대하여 서면으로 최고하고 계약을 해제 할 수 있다.
              그리고 계약 당사자는 계약해제에 따른 손해배상을 각각 상대방에게 청구할 수 있으며, 손해배상에 대하여 별도의 약정이 없는 한 계약금을 손해배상의 기준으로 본다.
            </PdfClause>
            <PdfClause title="제8조 [중개보수]">
              개업공인중개사는 임대인 또는 임차인의 본 계약 불이행에 대하여 책임을 지지 않는다. 또한 중개보수는 본 계약 체결에 따라 계약 당사자 쌍방이 각각 지급하며,
              개업공인중개사의 고의나 과실 없이 본 계약이 무효, 취소 또는 해제되어도 중개보수는 지급한다.
            </PdfClause>
            <PdfClause title="제9조 [중개대상물확인설명서 교부 등]">
              개업공인중개사는 중개대상물확인설명서를 작성하고 업무보증관계증서 사본을 첨부하여 거래당사자 쌍방에게 교부한다.
            </PdfClause>
          </div>
        </PdfSection>

      </PdfPage>

      <PdfPage>
        <PdfSection title="3. 특약사항">
          <div className="whitespace-pre-wrap rounded border border-slate-300 bg-white p-3 text-[12px] leading-5 text-slate-700">
            {draft.specialTerms}
          </div>
        </PdfSection>
      </PdfPage>

      <PdfPage>
        <PdfSection title="4. 임대인 정보">
          <PdfPartyFields party={contract.provider} signature={draft.providerSignature} />
        </PdfSection>
        <PdfSection title="5. 임차인 정보">
          <PdfPartyFields party={contract.customer} pendingLabel="임차인 서명 예정" />
        </PdfSection>
        <PdfSection title="6. 개업 공인중개사">
          <PdfBrokerOfficeBlock brokerSignUrl={draft.brokerSignUrl} />
        </PdfSection>
      </PdfPage>
    </div>
  )
}

function PdfPage({ children }: { children: ReactNode }) {
  return <section className="space-y-4">{children}</section>
}

function PdfTitle() {
  return (
    <header className="border-b-2 border-slate-900 pb-4 text-center">
      <h2 className="text-2xl font-bold">부동산(다세대주택) 전세 계약서</h2>
    </header>
  )
}

function PdfSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="border-b border-slate-300 pb-2 text-[15px] font-bold text-slate-950">{title}</h3>
      {children}
    </section>
  )
}

function PdfRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[84px_1fr] gap-2 text-[12px]">
      <div className="pt-2 font-semibold text-slate-500">{label}</div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function PdfBox({
  label,
  value,
  suffix,
}: {
  label?: string
  value?: string | number | null
  suffix?: string
}) {
  const displayValue = value === null || value === undefined ? "" : String(value)

  return (
    <div>
      {label ? <span className="mb-1 block text-[11px] font-semibold text-slate-500">{label}</span> : null}
      <div className="rounded border border-slate-300 bg-white px-2 py-2 text-[12px] leading-4 text-slate-950">
        <span className="whitespace-pre-wrap break-words">{displayValue || "\u00a0"}</span>
        {suffix ? <span className="ml-1 text-[11px] font-semibold text-slate-500">{suffix}</span> : null}
      </div>
    </div>
  )
}

function PdfClause({ title, children }: { title: string; children: ReactNode }) {
  return (
    <p>
      <span className="font-semibold text-slate-950">{title}</span> {children}
    </p>
  )
}

function PdfMoneyLine({
  amount,
  tail,
}: {
  amount: string
  tail?: string
  readOnly?: boolean
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="flex h-9 shrink-0 items-center">일금</span>
      <div className="min-w-0 flex-1">
        <PdfBox value={amount} />
        <span className="mt-1 block min-h-4 text-[11px] font-medium text-slate-500">{formatKoreanWon(amount)}</span>
      </div>
      <span className="flex h-9 shrink-0 items-center">원정</span>
      {tail ? <span className="flex h-9 shrink-0 items-center">{tail}</span> : null}
    </div>
  )
}

function PdfPaymentLine({ label, amount, date }: { label: string; amount: string; date: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="flex h-9 shrink-0 items-center">일금</span>
      <div className="min-w-0 flex-1">
        <PdfBox label={label} value={amount} />
        <span className="mt-1 block min-h-4 text-[11px] font-medium text-slate-500">{formatKoreanWon(amount)}</span>
      </div>
      <span className="flex h-9 shrink-0 items-center">원정은</span>
      <div className="w-36">
        <PdfBox value={formatDate(date)} />
      </div>
      <span className="flex h-9 shrink-0 items-center">에 지급한다.</span>
    </div>
  )
}

function PdfPartyFields({
  party,
  signature,
  pendingLabel = "서명 예정",
}: {
  party: ContractPartyWithBirthDate
  signature?: string | null
  pendingLabel?: string
}) {
  return (
    <div className="grid grid-cols-4 gap-3 text-[12px]">
      <PdfBox label="주소" value={party.address} />
      <PdfBox label="생년월일" value={formatDate(party.birthDate)} />
      <PdfBox label="전화번호" value={party.phone} />
      <div>
        <span className="mb-1 block text-[11px] font-semibold text-slate-500">성명 / 서명</span>
        <div className="flex items-center gap-2 rounded border border-slate-300 bg-white px-2 py-2 text-[12px] leading-4 text-slate-950">
          <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">{party.realName ?? "\u00a0"}</span>
          {signature ? (
            <img src={signature} alt="전자서명" className="h-8 max-w-28 object-contain" />
          ) : (
            <span className="shrink-0 text-[11px] text-slate-400">{pendingLabel}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function PdfBrokerOfficeBlock({ brokerSignUrl }: { brokerSignUrl?: string | null }) {
  return (
    <div className="space-y-2 text-[12px]">
      <PdfBox label="사무소 소재지" value="서울 마포구 백범로 23" />
      <div className="grid grid-cols-[1fr_180px_160px] gap-3">
        <PdfBox label="사무소 명칭" value="한국ICT인재개발원" />
        <PdfBox label="대표자 명" value="쟈스민" />
        <div>
          <span className="mb-1 block text-[11px] font-semibold text-slate-500">중개사 서명</span>
          <div className="flex items-center rounded border border-slate-300 bg-white px-2 py-2">
            {brokerSignUrl ? (
              <img
                src={brokerSignUrl}
                alt="공인중개사 서명"
                crossOrigin="anonymous"
                className="h-9 max-w-32 object-contain"
              />
            ) : (
              <span className="text-[11px] text-slate-400">서명 없음</span>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_1fr_1.2fr] gap-3">
        <PdfBox label="전화 번호" value="01011110000" />
        <PdfBox label="등록 번호" value="12345-2026-00123" />
        <PdfBox label="소속공인중개사" value="청춘홈즈공인중개사" />
      </div>
    </div>
  )
}

function StatusMessageCard({
  title,
  message,
  tone = "default",
}: {
  title: string
  message: string
  tone?: "default" | "destructive"
}) {
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

async function buildContractPdf(article: HTMLElement) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")])

  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  if (document.fonts?.ready) {
    await document.fonts.ready
  }

  await waitForPdfImages(article)

  const canvas = await html2canvas(article, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
    allowTaint: false,
    scrollX: 0,
    scrollY: 0,
    width: article.scrollWidth,
    height: article.scrollHeight,
    windowWidth: article.scrollWidth,
    windowHeight: article.scrollHeight,
  })
  const pageCanvasHeight = Math.floor(canvas.width * (pageHeight / pageWidth))
  const pageCanvas = document.createElement("canvas")
  pageCanvas.width = canvas.width
  pageCanvas.height = pageCanvasHeight
  const context = pageCanvas.getContext("2d")

  if (!context) {
    throw new Error("PDF 캔버스를 생성할 수 없습니다.")
  }

  for (let offsetY = 0, pageIndex = 0; offsetY < canvas.height; offsetY += pageCanvasHeight, pageIndex += 1) {
    context.fillStyle = "#ffffff"
    context.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
    context.drawImage(
      canvas,
      0,
      offsetY,
      canvas.width,
      Math.min(pageCanvasHeight, canvas.height - offsetY),
      0,
      0,
      pageCanvas.width,
      Math.min(pageCanvasHeight, canvas.height - offsetY),
    )

    if (pageIndex > 0) {
      pdf.addPage()
    }

    const imageData = pageCanvas.toDataURL("image/png")
    pdf.addImage(imageData, "PNG", 0, 0, pageWidth, pageHeight)
  }

  const pdfBlob = pdf.output("blob")
  return new File([pdfBlob], CONTRACT_PDF_NAME, { type: "application/pdf" })
}

async function waitForPdfImages(container: HTMLElement) {
  const images = Array.from(container.querySelectorAll("img"))

  await Promise.all(
    images.map(async (image) => {
      if (!image.complete || image.naturalWidth === 0) {
        await new Promise<void>((resolve) => {
          image.addEventListener("load", () => resolve(), { once: true })
          image.addEventListener("error", () => resolve(), { once: true })
        })
      }

      await image.decode?.().catch(() => undefined)
    }),
  )
}

function ContractSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="border-b border-slate-300 pb-2 text-base font-bold text-slate-950">{title}</h3>
      {children}
    </section>
  )
}

function SignatureField({
  signature,
  onSign,
  canSign = true,
  pendingLabel,
}: {
  signature: string | null
  onSign?: () => void
  canSign?: boolean
  pendingLabel?: string
}) {
  return (
    <div className="flex min-w-0 flex-nowrap items-center gap-3">
      <SignatureMark signature={signature} pendingLabel={pendingLabel} />
      {canSign ? (
        <Button type="button" variant="outline" onClick={onSign} className="shrink-0">
          <PenTool className="mr-2 h-4 w-4" />
          전자결제
        </Button>
      ) : null}
    </div>
  )
}

function Clause({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <span className="font-semibold text-slate-950">{title}</span>{" "}
      {children}
    </div>
  )
}

function DocumentTable({ children }: { children: ReactNode }) {
  return <div className="space-y-3 text-sm">{children}</div>
}

function DocumentRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2 md:grid-cols-[84px_1fr] md:items-start">
      <div className="pt-1 text-balance font-semibold text-slate-500">
        {label}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function MoneyLine({ children }: { children: ReactNode }) {
  return <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-start">{children}</div>
}

function MoneyText({ children }: { children: ReactNode }) {
  return <span className="flex h-10 shrink-0 items-center">{children}</span>
}

function PaymentLine({
  label,
  dateLabel,
  value,
  onChange,
  dateValue,
  onDateChange,
}: {
  label: string
  dateLabel: string
  value: string
  onChange: (value: string) => void
  dateValue: string
  onDateChange: (value: string) => void
}) {
  return (
    <MoneyLine>
      <MoneyText>일금</MoneyText>
      <MoneyField className="min-w-0 flex-1" label={label} value={value} onChange={onChange} />
      <MoneyText>원정</MoneyText>
      <MoneyText>은</MoneyText>
      <BlankField
        className="w-full md:w-44"
        label={dateLabel}
        type="date"
        value={dateValue}
        onValueChange={onDateChange}
        hideLabel
      />
      <MoneyText>에 지급한다.</MoneyText>
    </MoneyLine>
  )
}

function MoneyField({
  label,
  value,
  onChange,
  readOnly = false,
  className,
}: {
  label: string
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  className?: string
}) {
  return (
    <label className={className}>
      <span className="sr-only">{label}</span>
      <Input
        inputMode="numeric"
        readOnly={readOnly}
        value={value}
        onChange={(event) => onChange?.(formatWonInput(event.target.value))}
        className={readOnly ? "bg-slate-100" : "bg-white"}
      />
      <span className="mt-1 block min-h-5 text-xs font-medium text-slate-500">
        {formatKoreanWon(value)}
      </span>
    </label>
  )
}

type ContractPartyWithBirthDate = SignContractDocument["provider"] & {
  birthDate?: string | null
}

function PartyFields({
  party,
  signature,
  onSign,
  canSign,
  pendingLabel,
}: {
  party: ContractPartyWithBirthDate
  signature: string | null
  onSign?: () => void
  canSign: boolean
  pendingLabel?: string
}) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <ReadOnlyField className="md:col-span-3" label="주소" value={party.address} />
      <ReadOnlyField label="생년월일" value={formatDate(party.birthDate)} />
      <ReadOnlyField label="전화번호" value={party.phone} />
      <div className="md:col-span-3">
        <span className="mb-1 block text-xs font-semibold text-slate-500">성명 / 서명</span>
        <div className="flex min-w-0 flex-nowrap items-center gap-3">
          <ReadOnlyField className="sm:w-44" label="성명" value={party.realName} hideLabel />
          <SignatureField signature={signature} onSign={onSign} canSign={canSign} pendingLabel={pendingLabel} />
        </div>
      </div>
    </div>
  )
}

function AgentFields({
  brokerSignUrl,
  isLoading,
}: {
  brokerSignUrl?: string | null
  isLoading?: boolean
}) {
  return (
    <BrokerOfficeBlock title="개업 공인중개사" brokerSignUrl={brokerSignUrl} isLoading={isLoading} />
  )
}

function BrokerOfficeBlock({
  title,
  brokerSignUrl,
  isLoading,
}: {
  title: string
  brokerSignUrl?: string | null
  isLoading?: boolean
}) {
  return (
    <div className="grid gap-2 md:grid-cols-[112px_1fr]">
      <div className="flex items-center text-xs font-semibold text-slate-500 md:pb-2">{title}</div>
      <div className="space-y-3">
        <ReadOnlyField label="사무소 소재지" value="서울 마포구 백범로 23" />
        <div className="grid gap-3 md:grid-cols-[1fr_180px_160px]">
          <ReadOnlyField label="사무소 명칭" value="한국ICT인재개발원" />
          <ReadOnlyField label="대표자 명" value="쟈스민" />
          <div>
            <span className="mb-1 block text-xs font-semibold text-slate-500">중개사 서명</span>
            <div className="flex h-10 items-center">
              {isLoading ? (
                <span className="text-sm text-slate-400">서명 불러오는 중</span>
              ) : brokerSignUrl ? (
                <img src={brokerSignUrl} alt="공인중개사 서명" className="h-10 w-auto object-contain" />
              ) : (
                <span className="text-sm text-slate-400">서명 없음</span>
              )}
            </div>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1.2fr]">
          <ReadOnlyField label="전화 번호" value="01011110000" />
          <ReadOnlyField label="등록 번호" value="12345-2026-00123" />
          <ReadOnlyField label="소속공인중개사" value="청춘홈즈공인중개사" />
        </div>
      </div>
    </div>
  )
}

function ReadOnlyField({
  label,
  value,
  className,
  hideLabel = false,
}: {
  label: string
  value?: string | number | null
  className?: string
  hideLabel?: boolean
}) {
  return (
    <label className={className}>
      {!hideLabel && <span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span>}
      <Input
        aria-label={hideLabel ? label : undefined}
        readOnly
        value={value === null || value === undefined || value === "" ? "" : String(value)}
        className="bg-slate-100"
      />
    </label>
  )
}

function BlankField({
  label,
  type = "text",
  placeholder,
  suffix,
  className,
  hideLabel = false,
  value,
  onChange,
  onValueChange,
}: {
  label: string
  type?: string
  placeholder?: string
  suffix?: string
  className?: string
  hideLabel?: boolean
  value?: string
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
  onValueChange?: (value: string) => void
}) {
  return (
    <label className={className}>
      {!hideLabel && <span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span>}
      <div className="flex items-center gap-2">
        <Input
          aria-label={hideLabel ? label : undefined}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(event) => {
            onChange?.(event)
            onValueChange?.(event.target.value)
          }}
          className="bg-white"
        />
        {suffix && <span className="shrink-0 text-xs font-semibold text-slate-500">{suffix}</span>}
      </div>
    </label>
  )
}

function formatDate(value?: string | null) {
  if (!value) {
    return ""
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

function formatArea(value?: number | null) {
  if (value === null || value === undefined) {
    return ""
  }

  return `${value}㎡`
}

function calculateMonthCount(startValue?: string | null, endValue?: string | null) {
  if (!startValue || !endValue) {
    return ""
  }

  const startDate = new Date(startValue)
  const endDate = new Date(endValue)

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) {
    return ""
  }

  const monthCount =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    endDate.getMonth() -
    startDate.getMonth()

  return String(endDate.getDate() < startDate.getDate() ? monthCount - 1 : monthCount)
}

function getDefaultLeaseEndDate(startValue?: string | null) {
  if (!startValue) {
    return ""
  }

  const startDate = new Date(startValue)

  if (Number.isNaN(startDate.getTime())) {
    return ""
  }

  const endDate = new Date(startDate)
  endDate.setMonth(endDate.getMonth() + 24)

  const year = endDate.getFullYear()
  const month = String(endDate.getMonth() + 1).padStart(2, "0")
  const day = String(endDate.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function formatWonInput(value: string) {
  const digits = value
    .replace(/[^\d]/g, "")
    .replace(/^0+(?=\d)/, "")
    .slice(0, maxWonDigitLength)

  if (!digits) {
    return ""
  }

  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

function formatKoreanWon(value: string) {
  const digits = value
    .replace(/[^\d]/g, "")
    .replace(/^0+(?=\d)/, "")
    .slice(0, maxWonDigitLength)

  if (!digits) {
    return ""
  }

  return `${toKoreanNumber(digits)}원`
}

function toKoreanNumber(digits: string) {
  const digitLabels = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"]
  const unitLabels = ["", "십", "백", "천"]
  const groupLabels = ["", "만", "억", "조", "경"]
  const groups: string[] = []

  for (let end = digits.length; end > 0; end -= 4) {
    groups.unshift(digits.slice(Math.max(0, end - 4), end))
  }

  return groups
    .map((group, groupIndex) => {
      const groupNumber = Number(group)

      if (groupNumber === 0) {
        return ""
      }

      const groupText = group
        .padStart(4, "0")
        .split("")
        .map((digit, digitIndex) => {
          const digitNumber = Number(digit)

          if (digitNumber === 0) {
            return ""
          }

          return `${digitLabels[digitNumber]}${unitLabels[3 - digitIndex]}`
        })
        .join("")

      return `${groupText}${groupLabels[groups.length - groupIndex - 1]}`
    })
    .filter(Boolean)
    .join(" ")
}

function getApiErrorCode(error: unknown) {
  return error instanceof ApiError &&
    error.payload &&
    typeof error.payload === "object" &&
    "code" in error.payload
    ? (error.payload as { code?: string }).code
    : undefined
}
