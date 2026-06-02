"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { ChangeEvent, ReactNode } from "react"

import type { SignContractDocument } from "@/lib/sign-api"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const CONTRACT_PDF_NAME = "contract.pdf"
const maxWonDigitLength = 16
const PDF_PAGE_WIDTH = 794
const PDF_PAGE_HEIGHT = 1123
const PDF_PAGE_PADDING_X = 56
const PDF_PAGE_PADDING_Y = 48
const PDF_PAGE_CONTENT_HEIGHT = PDF_PAGE_HEIGHT - PDF_PAGE_PADDING_Y * 2
const PDF_BLOCK_GAP = 16

export type ContractDocumentDraft = {
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
  customerSignature?: string | null
  brokerSignUrl: string | null
}

export type ContractDocumentField =
  | "buildingDong"
  | "unitHo"
  | "rentedPart"
  | "leaseEndDate"
  | "contractAmount"
  | "interimAmount1"
  | "interimAmount2"
  | "balanceAmount"
  | "interimPaymentDate1"
  | "interimPaymentDate2"
  | "balancePaymentDate"
  | "specialTerms"

type ContractDocumentProps = {
  contract: SignContractDocument
  draft: ContractDocumentDraft
  readOnly: boolean
  mode?: "screen" | "pdf"
  onFieldChange?: (field: ContractDocumentField, value: string) => void
  onProviderSign?: () => void
  providerSignDisabled?: boolean
  onCustomerSign?: () => void
  customerSignDisabled?: boolean
  actions?: ReactNode
}

type ContractPartyWithBirthDate = SignContractDocument["provider"] & {
  birthDate?: string | null
}

export function createContractDocumentDraft(
  contract: SignContractDocument,
  overrides: Partial<ContractDocumentDraft> = {},
): ContractDocumentDraft {
  const property = contract.property
  const leaseEndDate = overrides.leaseEndDate ?? getDefaultLeaseEndDate(property.moveInDate)
  const depositWon =
    overrides.depositWon ??
    formatWonInput(
      property.depositAmount === null || property.depositAmount === undefined
        ? ""
        : String(property.depositAmount * 10000),
    )

  return {
    buildingDong: "",
    unitHo: "",
    rentedPart: "",
    leaseEndDate,
    leaseMonthCount: calculateMonthCount(property.moveInDate, leaseEndDate),
    contractAmount: "",
    interimAmount1: "",
    interimAmount2: "",
    balanceAmount: "",
    interimPaymentDate1: "",
    interimPaymentDate2: "",
    balancePaymentDate: "",
    specialTerms: "",
    depositWon,
    providerSignature: null,
    customerSignature: null,
    brokerSignUrl: null,
    ...overrides,
  }
}

export function createContractDocumentDraftFromSavedContract(
  contract: SignContractDocument,
  overrides: Partial<ContractDocumentDraft> = {},
): ContractDocumentDraft {
  const savedContract = contract.contract

  if (!savedContract) {
    throw new Error("Saved contract terms are required to build the contract document.")
  }

  return createContractDocumentDraft(contract, {
    buildingDong: savedContract.buildingDong ?? "",
    unitHo: savedContract.unitHo ?? "",
    rentedPart: savedContract.rentedPart ?? "",
    leaseEndDate: savedContract.leaseEndDate ?? "",
    contractAmount: formatNullableWon(savedContract.contractAmount),
    interimAmount1: formatNullableWon(savedContract.interimAmount1),
    interimAmount2: formatNullableWon(savedContract.interimAmount2),
    balanceAmount: formatNullableWon(savedContract.balanceAmount),
    interimPaymentDate1: savedContract.interimAmount1Date ?? "",
    interimPaymentDate2: savedContract.interimAmount2Date ?? "",
    balancePaymentDate: savedContract.balanceDate ?? "",
    specialTerms: savedContract.specialTerms ?? "",
    ...overrides,
  })
}

export function dataUrlToFile(dataUrl: string | null, filename: string) {
  if (!dataUrl) {
    throw new Error("Signature image is required.")
  }

  const [metadata, base64Data] = dataUrl.split(",")
  const contentType = metadata.match(/^data:(.*?);base64$/)?.[1] ?? "image/png"
  const binary = window.atob(base64Data ?? "")
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new File([bytes], filename, { type: contentType })
}

export function ContractDocument({
  contract,
  draft,
  readOnly,
  mode = "screen",
  onFieldChange,
  onProviderSign,
  providerSignDisabled = false,
  onCustomerSign,
  customerSignDisabled = false,
  actions,
}: ContractDocumentProps) {
  if (mode === "pdf") {
    return <PdfContractDocument contract={contract} draft={draft} />
  }

  const property = contract.property

  return (
    <article className="mx-auto max-w-5xl overflow-hidden rounded-lg border border-slate-300 bg-white text-slate-950 shadow-sm">
      <div className="space-y-6 p-5 md:p-8">
        <ContractSection title="1. 부동산 표시">
          <DocumentRow label="소재지">
            <div className="grid gap-2 md:grid-cols-[1fr_74px_74px]">
              <ReadOnlyField label="소재지 주소" value={property.address} hideLabel />
              <DraftField
                label="동"
                value={draft.buildingDong}
                readOnly={readOnly}
                hideLabel
                suffix="동"
                onChange={(value) => onFieldChange?.("buildingDong", value)}
              />
              <DraftField
                label="호"
                value={draft.unitHo}
                readOnly={readOnly}
                hideLabel
                suffix="호"
                onChange={(value) => onFieldChange?.("unitHo", value)}
              />
            </div>
          </DocumentRow>
          <DocumentRow label="건물">
            <div className="grid gap-2 md:grid-cols-[1fr_1fr]">
              <ReadOnlyField label="용도" value={property.buildingUse} />
              <ReadOnlyField label="면적" value={formatArea(property.supplyAreaM2)} />
            </div>
          </DocumentRow>
          <DocumentRow label="임차 부분">
            <div className="grid gap-2 md:grid-cols-[1fr_180px]">
              <DraftField
                label="임차 부분"
                value={draft.rentedPart}
                readOnly={readOnly}
                onChange={(value) => onFieldChange?.("rentedPart", value)}
              />
              <ReadOnlyField label="전용 면적" value={formatArea(property.exclusiveAreaM2)} />
            </div>
          </DocumentRow>
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
                  <MoneyField className="min-w-0 flex-1" label="보증금" value={draft.depositWon} readOnly />
                  <MoneyText>원정</MoneyText>
                </MoneyLine>
              </DocumentRow>
              <DocumentRow label="계약금">
                <MoneyLine>
                  <MoneyText>일금</MoneyText>
                  <MoneyField
                    className="min-w-0 flex-1"
                    label="계약금"
                    value={draft.contractAmount}
                    readOnly={readOnly}
                    onChange={(value) => onFieldChange?.("contractAmount", value)}
                  />
                  <MoneyText>원정</MoneyText>
                  <MoneyText>은 계약시에 지급하고 영수함.</MoneyText>
                </MoneyLine>
              </DocumentRow>
              <DocumentRow label="중도금">
                <div className="space-y-2">
                  <PaymentLine
                    label="중도금 1"
                    dateLabel="중도금 1 지급일"
                    value={draft.interimAmount1}
                    readOnly={readOnly}
                    onChange={(value) => onFieldChange?.("interimAmount1", value)}
                    dateValue={draft.interimPaymentDate1}
                    onDateChange={(value) => onFieldChange?.("interimPaymentDate1", value)}
                  />
                  <PaymentLine
                    label="중도금 2"
                    dateLabel="중도금 2 지급일"
                    value={draft.interimAmount2}
                    readOnly={readOnly}
                    onChange={(value) => onFieldChange?.("interimAmount2", value)}
                    dateValue={draft.interimPaymentDate2}
                    onDateChange={(value) => onFieldChange?.("interimPaymentDate2", value)}
                  />
                </div>
              </DocumentRow>
              <DocumentRow label="잔금">
                <PaymentLine
                  label="잔금"
                  dateLabel="잔금 지급일"
                  value={draft.balanceAmount}
                  readOnly={readOnly}
                  onChange={(value) => onFieldChange?.("balanceAmount", value)}
                  dateValue={draft.balancePaymentDate}
                  onDateChange={(value) => onFieldChange?.("balancePaymentDate", value)}
                />
              </DocumentRow>
            </DocumentTable>

            <Clause title="제2조 [존속기간]">
              <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
                <span>임대인은 위 부동산을 임대차 목적대로 사용할 수 있는 상태로</span>
                <ReadOnlyField className="w-full md:w-44" label="임차인 인도일" value={formatDate(property.moveInDate)} hideLabel />
                <span>일까지 임차인에게 인도하며, 임대차 기간은 인도일로부터</span>
                <DraftField
                  className="w-full md:w-44"
                  label="임대 종료일"
                  type="date"
                  value={draft.leaseEndDate}
                  readOnly={readOnly}
                  onChange={(value) => onFieldChange?.("leaseEndDate", value)}
                  hideLabel
                />
                <span>일</span>
                <ReadOnlyField className="w-full md:w-32" label="임대차 기간" value={draft.leaseMonthCount} hideLabel />
                <span>개월까지로 한다.</span>
              </div>
            </Clause>

            <Clause title="제3조 [용도변경 및 전대 등]">
              임차인은 임대인의 동의 없이 위 부동산의 용도나 구조를 변경하거나 전대, 임차권 양도 또는 담보제공을 하지 못하며 임대차 목적 이외의 용도로 사용할 수 없다.
            </Clause>
            <Clause title="제4조 [계약의 해지]">
              임차인이 제3조를 위반했을 때 임대인은 즉시 본 계약을 해지할 수 있다.
            </Clause>
            <Clause title="제5조 [계약의 종료]">
              임대차계약이 종료된 경우 임차인은 위 부동산을 원상으로 회복하여 임대인에게 반환한다. 이러한 경우 임대인은 보증금을 임차인에게 반환하고,
              연체 임대료 또는 손해배상금이 있을 때는 이들을 제하고 그 잔액을 반환한다.
            </Clause>
            <Clause title="제6조 [계약의 해제]">
              임차인이 임대인에게 중도금이 없을 때는 잔금을 지급하기 전까지 임대인은 계약금의 배액을 상환하고, 임차인은 계약금을 포기하고 이 계약을 해제할 수 있다.
            </Clause>
            <Clause title="제7조 [채무불이행과 손해배상]">
              임대인 또는 임차인은 본 계약상의 내용에 대하여 불이행이 있을 경우 그 상대방은 불이행한 자에 대하여 서면으로 최고하고 계약을 해제할 수 있다.
              그리고 계약 당사자는 계약해제에 따른 손해배상을 각각 상대방에게 청구할 수 있으며, 손해배상에 대하여 별도의 약정이 없는 한 계약금을 손해배상의 기준으로 본다.
            </Clause>
            <Clause title="제8조 [중개보수]">
              개업공인중개사는 임대인 또는 임차인의 본 계약 불이행에 대하여 책임을 지지 않는다. 또한 중개보수는 본 계약 체결에 따라 계약 당사자 쌍방이 각각 지급하며,
              개업공인중개사의 고의나 과실 없이 본 계약이 무효, 취소 또는 해제되어도 중개보수는 지급한다.
            </Clause>
            <Clause title="제9조 [중개대상물확인설명서 교부 등]">
              개업공인중개사는 중개대상물확인설명서를 작성하고 업무보증관계증서 사본을 첨부하여 거래당사자 쌍방에게 교부한다.
            </Clause>
          </div>
        </ContractSection>

        <ContractSection title="3. 특약사항">
          <label>
            <span className="sr-only">특약사항</span>
            <Textarea
              className={`min-h-64 resize-y leading-6 ${readOnly ? "bg-slate-100" : "bg-white"}`}
              value={draft.specialTerms}
              readOnly={readOnly}
              onChange={(event) => onFieldChange?.("specialTerms", event.target.value)}
            />
          </label>
        </ContractSection>

        <ContractSection title="4. 임대인 정보">
          <PartyFields
            party={contract.provider}
            signature={draft.providerSignature}
            pendingLabel="임대인 서명 대기"
            action={
              !readOnly && onProviderSign ? (
                <Button type="button" variant="outline" onClick={onProviderSign} disabled={providerSignDisabled}>
                  서명 입력
                </Button>
              ) : null
            }
          />
        </ContractSection>

        <ContractSection title="5. 임차인 정보">
          <PartyFields
            party={contract.customer}
            signature={draft.customerSignature ?? null}
            pendingLabel="임차인 서명 예정"
            action={
              readOnly && onCustomerSign ? (
                <Button type="button" variant="outline" onClick={onCustomerSign} disabled={customerSignDisabled}>
                  서명 입력
                </Button>
              ) : null
            }
          />
        </ContractSection>

        <ContractSection title="6. 개업 공인중개사">
          <BrokerOfficeBlock brokerSignUrl={draft.brokerSignUrl} />
        </ContractSection>
      </div>

      {actions ? <div className="border-t border-slate-300 px-5 py-4 md:px-8">{actions}</div> : null}
    </article>
  )
}

function PdfContractDocument({ contract, draft }: { contract: SignContractDocument; draft: ContractDocumentDraft }) {
  const measureRef = useRef<HTMLDivElement>(null)
  const [splitSpecialTerms, setSplitSpecialTerms] = useState(false)
  const blocks = useMemo(() => createPdfFlowBlocks(contract, draft, splitSpecialTerms), [contract, draft, splitSpecialTerms])
  const [pages, setPages] = useState<number[][]>(() => [blocks.map((_, index) => index)])

  useEffect(() => {
    setSplitSpecialTerms(false)
  }, [draft.specialTerms])

  useEffect(() => {
    const measureRoot = measureRef.current

    if (!measureRoot) {
      return
    }

    const updatePages = () => {
      const blockElements = Array.from(measureRoot.querySelectorAll<HTMLElement>("[data-pdf-block]"))

      if (blockElements.length === 0) {
        setPages([[]])
        return
      }

      const specialTermsIndex = blocks.findIndex((block) => block.key === "special-full")
      const specialTermsHeight = specialTermsIndex >= 0 ? blockElements[specialTermsIndex]?.offsetHeight ?? 0 : 0

      if (!splitSpecialTerms && specialTermsHeight > PDF_PAGE_CONTENT_HEIGHT) {
        setSplitSpecialTerms(true)
        return
      }

      setPages(paginatePdfBlocks(blockElements.map((element) => element.offsetHeight), blocks))
    }

    updatePages()

    if (document.fonts?.ready) {
      document.fonts.ready.then(updatePages).catch(() => undefined)
    }

    const images = Array.from(measureRoot.querySelectorAll("img"))
    images.forEach((image) => {
      if (!image.complete || image.naturalWidth === 0) {
        image.addEventListener("load", updatePages, { once: true })
        image.addEventListener("error", updatePages, { once: true })
      }
    })

    return () => {
      images.forEach((image) => {
        image.removeEventListener("load", updatePages)
        image.removeEventListener("error", updatePages)
      })
    }
  }, [blocks, splitSpecialTerms])

  return (
    <div className="relative text-slate-950" style={{ width: PDF_PAGE_WIDTH }}>
      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none absolute left-[-10000px] top-0 box-border opacity-0"
        style={{ width: PDF_PAGE_WIDTH, padding: `${PDF_PAGE_PADDING_Y}px ${PDF_PAGE_PADDING_X}px` }}
      >
        <PdfBlockList blocks={blocks} />
      </div>

      <div className="space-y-4">
        {pages.map((pageBlocks, pageIndex) => (
          <PdfPage key={`pdf-page-${pageIndex}`}>
            <PdfBlockList blocks={pageBlocks.map((blockIndex) => blocks[blockIndex]).filter((block): block is PdfFlowBlock => Boolean(block))} />
          </PdfPage>
        ))}
      </div>
    </div>
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

function DocumentRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2 md:grid-cols-[96px_1fr] md:items-start">
      <div className="pt-1 text-sm font-semibold text-slate-500">{label}</div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function DocumentTable({ children }: { children: ReactNode }) {
  return <div className="space-y-3 text-sm">{children}</div>
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
      {!hideLabel ? <span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span> : null}
      <Input aria-label={hideLabel ? label : undefined} readOnly value={value == null ? "" : String(value)} className="bg-slate-100" />
    </label>
  )
}

function DraftField({
  label,
  type = "text",
  value,
  readOnly,
  onChange,
  suffix,
  className,
  hideLabel = false,
}: {
  label: string
  type?: string
  value?: string
  readOnly: boolean
  onChange?: (value: string) => void
  suffix?: string
  className?: string
  hideLabel?: boolean
}) {
  return (
    <label className={className}>
      {!hideLabel ? <span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span> : null}
      <div className="flex items-center gap-2">
        <Input
          aria-label={hideLabel ? label : undefined}
          type={type}
          readOnly={readOnly}
          value={value}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange?.(event.target.value)}
          className={readOnly ? "bg-slate-100" : "bg-white"}
        />
        {suffix ? <span className="shrink-0 text-xs font-semibold text-slate-500">{suffix}</span> : null}
      </div>
    </label>
  )
}

function MoneyField({
  label,
  value,
  readOnly,
  onChange,
  className,
}: {
  label: string
  value: string
  readOnly: boolean
  onChange?: (value: string) => void
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
      <span className="mt-1 block min-h-5 text-xs font-medium text-slate-500">{formatKoreanWon(value)}</span>
    </label>
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
  readOnly,
  onChange,
  dateValue,
  onDateChange,
}: {
  label: string
  dateLabel: string
  value: string
  readOnly: boolean
  onChange?: (value: string) => void
  dateValue: string
  onDateChange?: (value: string) => void
}) {
  return (
    <MoneyLine>
      <MoneyText>일금</MoneyText>
      <MoneyField className="min-w-0 flex-1" label={label} value={value} readOnly={readOnly} onChange={onChange} />
      <MoneyText>원정은</MoneyText>
      <DraftField
        className="w-full md:w-44"
        label={dateLabel}
        type="date"
        value={dateValue}
        readOnly={readOnly}
        onChange={onDateChange}
        hideLabel
      />
      <MoneyText>에 지급한다.</MoneyText>
    </MoneyLine>
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

function PartyFields({
  party,
  signature,
  pendingLabel,
  action,
}: {
  party: ContractPartyWithBirthDate
  signature: string | null
  pendingLabel: string
  action?: ReactNode
}) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <ReadOnlyField className="md:col-span-2" label="이름" value={party.realName} />
      <ReadOnlyField label="연락처" value={party.phone} />
      <ReadOnlyField label="생년월일" value={formatDate(party.birthDate)} />
      <ReadOnlyField className="md:col-span-3" label="주소" value={party.address} />
      <div>
        <span className="mb-1 block text-xs font-semibold text-slate-500">서명</span>
        <div className="flex items-center gap-3">
          <SignatureMark signature={signature} pendingLabel={pendingLabel} />
          {action}
        </div>
      </div>
    </div>
  )
}

function SignatureMark({ signature, pendingLabel }: { signature: string | null; pendingLabel: string }) {
  if (signature) {
    return <img src={signature} alt="전자서명" className="h-8 w-auto object-contain" />
  }

  return <span className="whitespace-nowrap text-sm text-slate-400">{pendingLabel}</span>
}

function BrokerOfficeBlock({ brokerSignUrl }: { brokerSignUrl?: string | null }) {
  return (
    <div className="space-y-2 text-sm">
      <ReadOnlyField label="사무소 소재지" value="서울 마포구 백범로 23" />
      <div className="grid gap-3 md:grid-cols-[1fr_180px_160px]">
        <ReadOnlyField label="사무소 명칭" value="한국ICT인재개발원" />
        <ReadOnlyField label="대표자 명" value="쟈스민" />
        <div>
          <span className="mb-1 block text-xs font-semibold text-slate-500">중개사 서명</span>
          <div className="flex min-h-10 items-center rounded-md border border-slate-200 bg-slate-100 px-3 py-2">
            {brokerSignUrl ? (
              <img src={brokerSignUrl} alt="공인중개사 서명" crossOrigin="anonymous" className="h-9 max-w-32 object-contain" />
            ) : (
              <span className="text-xs text-slate-400">서명 없음</span>
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
  )
}

function PdfPage({ children }: { children: ReactNode }) {
  return (
    <section
      data-pdf-page
      className="box-border bg-white"
      style={{
        width: PDF_PAGE_WIDTH,
        height: PDF_PAGE_HEIGHT,
        padding: `${PDF_PAGE_PADDING_Y}px ${PDF_PAGE_PADDING_X}px`,
      }}
    >
      {children}
    </section>
  )
}

type PdfFlowBlock = {
  key: string
  node: ReactNode
  keepWithNext?: boolean
}

function PdfBlockList({ blocks }: { blocks: PdfFlowBlock[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((block) => (
        <div key={block.key} data-pdf-block>
          {block.node}
        </div>
      ))}
    </div>
  )
}

function PdfSectionHeading({ title }: { title: string }) {
  return <h3 className="border-b border-slate-300 pb-2 text-[15px] font-bold text-slate-950">{title}</h3>
}

function createPdfFlowBlocks(contract: SignContractDocument, draft: ContractDocumentDraft, splitSpecialTerms: boolean): PdfFlowBlock[] {
  const property = contract.property
  const specialTermBlocks = splitSpecialTerms ? splitPdfFreeText(draft.specialTerms) : [draft.specialTerms]

  return [
    { key: "title", node: <PdfTitle /> },
    { key: "section-property", keepWithNext: true, node: <PdfSectionHeading title="1. 부동산 표시" /> },
    {
      key: "property-address",
      node: (
        <PdfRow label="소재지">
          <div className="grid grid-cols-[1fr_90px_90px] gap-2">
            <PdfBox value={property.address} />
            <PdfAddressUnitBox value={draft.buildingDong} unit="동" />
            <PdfAddressUnitBox value={draft.unitHo} unit="호" />
          </div>
        </PdfRow>
      ),
    },
    {
      key: "property-building",
      node: (
        <PdfRow label="건물">
          <div className="grid grid-cols-[1fr_1fr_120px] gap-2">
            <PdfBox label="용도" value={property.buildingUse} />
            <PdfBox label="면적" value={formatArea(property.supplyAreaM2)} />
          </div>
        </PdfRow>
      ),
    },
    {
      key: "property-rented",
      node: (
        <PdfRow label="">
          <div className="grid grid-cols-[1fr_180px] gap-2">
            <PdfBox label="임대할 부분" value={draft.rentedPart} />
            <PdfBox label="면적" value={formatArea(property.exclusiveAreaM2)} />
          </div>
        </PdfRow>
      ),
    },
    { key: "section-contract", keepWithNext: true, node: <PdfSectionHeading title="2. 계약 내용" /> },
    {
      key: "contract-purpose",
      node: (
        <PdfClause title="제1조[목적]">
          위 부동산의 임대차에 관하여 임대인과 임차인은 합의에 의하여 임대차보증금 및 차임을 아래와 같이 지급하기로 한다.
        </PdfClause>
      ),
    },
    {
      key: "contract-deposit",
      node: (
        <PdfRow label="보증금">
          <PdfMoneyLine amount={draft.depositWon} tail="은 계약시에 지급하고 영수함" />
        </PdfRow>
      ),
    },
    {
      key: "contract-amount",
      node: (
        <PdfRow label="계약금">
          <PdfMoneyLine amount={draft.contractAmount} tail="은 계약시에 지급하고 영수함" />
        </PdfRow>
      ),
    },
    {
      key: "contract-interim",
      node: (
        <PdfRow label="중도금">
          <div className="space-y-2">
            <PdfPaymentLine label="중도금1" amount={draft.interimAmount1} date={draft.interimPaymentDate1} />
            <PdfPaymentLine label="중도금2" amount={draft.interimAmount2} date={draft.interimPaymentDate2} />
          </div>
        </PdfRow>
      ),
    },
    {
      key: "contract-balance",
      node: (
        <PdfRow label="잔금">
          <PdfPaymentLine label="잔금" amount={draft.balanceAmount} date={draft.balancePaymentDate} />
        </PdfRow>
      ),
    },
    {
      key: "contract-period",
      node: (
        <PdfClause title="제2조[존속기간]">
          임대인은 위 부동산을 임대차 목적대로 사용할 수 있는 상태로 {formatDate(property.moveInDate)}일까지 임차인에게 인도하며, 임대차 기간은 인도일로부터{" "}
          {formatDate(draft.leaseEndDate)}까지 {draft.leaseMonthCount}개월까지로 한다.
        </PdfClause>
      ),
    },
    {
      key: "contract-use-change",
      node: (
        <PdfClause title="제3조[용도변경 및 전대 등]">
          임차인은 임대인의 동의 없이 위 부동산의 용도나 구조를 변경하거나 전대, 임차권 양도 또는 담보제공을 하지 못하며 임대차 목적 이외의 용도로 사용할 수 없다.
        </PdfClause>
      ),
    },
    { key: "contract-maintenance", node: <PdfClause title="제4조[계약의 해지]">임차인이 제3조를 위반했을 때 임대인은 즉시 본 계약을 해지할 수 있다.</PdfClause> },
    {
      key: "contract-end",
      node: (
        <PdfClause title="제5조[계약의 종료]">
          임대차계약이 종료된 경우 임차인은 위 부동산을 원상으로 회복하여 임대인에게 반환한다. 이러한 경우 임대인은 보증금을 임차인에게 반환하고, 연체 임대료 또는
          손해배상금이 있을 때는 이들을 제하고 그 잔액을 반환한다.
        </PdfClause>
      ),
    },
    {
      key: "contract-cancel",
      node: (
        <PdfClause title="제6조[계약의 해제]">
          임차인이 임대인에게 중도금이 없을 때는 잔금을 지급하기 전까지 임대인은 계약금의 배액을 상환하고, 임차인은 계약금을 포기하고 이 계약을 해제할 수 있다.
        </PdfClause>
      ),
    },
    {
      key: "contract-default",
      node: (
        <PdfClause title="제7조[채무불이행과 손해배상]">
          임대인 또는 임차인은 본 계약상의 내용에 대하여 불이행이 있을 경우 그 상대방은 불이행한 자에 대하여 서면으로 최고하고 계약을 해제할 수 있다. 그리고 계약
          당사자는 계약해제에 따른 손해배상을 각각 상대방에게 청구할 수 있으며, 손해배상에 대하여 별도의 약정이 없는 한 계약금을 손해배상의 기준으로 본다.
        </PdfClause>
      ),
    },
    {
      key: "contract-broker-fee",
      node: (
        <PdfClause title="제8조[중개보수]">
          개업공인중개사는 임대인 또는 임차인의 본 계약 불이행에 대하여 책임을 지지 않는다. 또한 중개보수는 본 계약 체결에 따라 계약 당사자 쌍방이 각각 지급하며,
          개업공인중개사의 고의나 과실 없이 본 계약이 무효, 취소 또는 해제되어도 중개보수는 지급한다.
        </PdfClause>
      ),
    },
    {
      key: "contract-confirmation",
      node: (
        <PdfClause title="제9조[중개대상물확인설명서 교부 등]">
          개업공인중개사는 중개대상물확인설명서를 작성하고 업무보증관계증서 사본을 첨부하여 거래당사자 쌍방에게 교부한다.
        </PdfClause>
      ),
    },
    { key: "section-special", keepWithNext: true, node: <PdfSectionHeading title="3. 특약사항" /> },
    ...specialTermBlocks.map((line, index) => ({
      key: splitSpecialTerms ? `special-${index}` : "special-full",
      node: <PdfSpecialTermsBlock>{line}</PdfSpecialTermsBlock>,
    })),
    { key: "section-provider", keepWithNext: true, node: <PdfSectionHeading title="4. 임대인 정보" /> },
    { key: "provider", node: <PdfPartyFields party={contract.provider} signature={draft.providerSignature} /> },
    { key: "section-customer", keepWithNext: true, node: <PdfSectionHeading title="5. 임차인 정보" /> },
    { key: "customer", node: <PdfPartyFields party={contract.customer} signature={draft.customerSignature} pendingLabel="임차인 서명 예정" /> },
    { key: "section-broker", keepWithNext: true, node: <PdfSectionHeading title="6. 개업 공인중개사" /> },
    { key: "broker", node: <PdfBrokerOfficeBlock brokerSignUrl={draft.brokerSignUrl} /> },
  ]
}

function paginatePdfBlocks(blockHeights: number[], blocks: PdfFlowBlock[]) {
  const pages: number[][] = []
  let currentPage: number[] = []
  let currentHeight = 0

  blocks.forEach((block, index) => {
    const blockHeight = blockHeights[index] ?? 0
    const nextBlockHeight = block.keepWithNext ? blockHeights[index + 1] ?? 0 : 0
    const gap = currentPage.length > 0 ? PDF_BLOCK_GAP : 0
    const keepWithNextHeight = block.keepWithNext && nextBlockHeight > 0 ? PDF_BLOCK_GAP + nextBlockHeight : 0
    const requiredHeight = blockHeight + keepWithNextHeight

    if (currentPage.length > 0 && currentHeight + gap + requiredHeight > PDF_PAGE_CONTENT_HEIGHT) {
      pages.push(currentPage)
      currentPage = []
      currentHeight = 0
    }

    currentPage.push(index)
    currentHeight += (currentPage.length > 1 ? PDF_BLOCK_GAP : 0) + blockHeight
  })

  if (currentPage.length > 0) {
    pages.push(currentPage)
  }

  return pages.length > 0 ? pages : [[]]
}

function splitPdfFreeText(value: string) {
  const maxChunkLength = 450
  const chunks = value.split(/\r?\n/).flatMap((line) => {
    if (line.length <= maxChunkLength) {
      return [line]
    }

    const lineChunks: string[] = []

    for (let index = 0; index < line.length; index += maxChunkLength) {
      lineChunks.push(line.slice(index, index + maxChunkLength))
    }

    return lineChunks
  })

  return chunks.length > 0 ? chunks : [""]
}

function PdfTitle() {
  return (
    <header className="border-b-2 border-slate-900 pb-4 text-center">
      <h2 className="text-2xl font-bold">부동산(다세대주택) 전세 계약서</h2>
    </header>
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

function PdfBox({ label, value, suffix }: { label?: string; value?: string | number | null; suffix?: string }) {
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

function PdfAddressUnitBox({ value, unit }: { value?: string | number | null; unit: string }) {
  return (
    <div className="flex min-w-0 items-start gap-1">
      <div className="min-w-0 flex-1">
        <PdfBox value={value} />
      </div>
      <span className="flex h-9 shrink-0 items-center text-[11px] font-semibold text-slate-500">{unit}</span>
    </div>
  )
}

function PdfClause({ title, children }: { title: string; children: ReactNode }) {
  return (
    <p className="text-[12px] leading-5 text-slate-700">
      <span className="font-semibold text-slate-950">{title}</span> {children}
    </p>
  )
}

function PdfSpecialTermsBlock({ children }: { children: ReactNode }) {
  return <div className="whitespace-pre-wrap rounded border border-slate-300 bg-white p-3 text-[12px] leading-5 text-slate-700">{children || "\u00a0"}</div>
}

function PdfMoneyLine({ amount, tail }: { amount: string; tail?: string }) {
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
              <img src={brokerSignUrl} alt="공인중개사 서명" crossOrigin="anonymous" className="h-9 max-w-32 object-contain" />
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

export async function buildContractPdf(article: HTMLElement) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")])

  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  if (document.fonts?.ready) {
    await document.fonts.ready
  }

  await waitForPdfImages(article)
  await waitForPdfPagination()

  const pdfPages = Array.from(article.querySelectorAll<HTMLElement>("[data-pdf-page]"))

  if (pdfPages.length === 0) {
    throw new Error("PDF page elements were not found.")
  }

  for (const [pageIndex, pdfPage] of pdfPages.entries()) {
    if (pageIndex > 0) {
      pdf.addPage()
    }

    const canvas = await html2canvas(pdfPage, {
      backgroundColor: "#ffffff",
      scale: 1.5,
      useCORS: true,
      allowTaint: false,
      scrollX: 0,
      scrollY: 0,
      width: pdfPage.scrollWidth,
      height: pdfPage.scrollHeight,
      windowWidth: article.scrollWidth,
      windowHeight: article.scrollHeight,
    })
    const imageData = canvas.toDataURL("image/jpeg", 0.82)

    pdf.addImage(imageData, "JPEG", 0, 0, pageWidth, pageHeight)
  }

  const pdfBlob = pdf.output("blob")
  return new File([pdfBlob], CONTRACT_PDF_NAME, { type: "application/pdf" })
}

async function waitForPdfPagination() {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
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

export function getDefaultLeaseEndDate(startValue?: string | null) {
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

export function calculateMonthCount(startValue?: string | null, endValue?: string | null) {
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

export function formatWonInput(value: string) {
  const digits = value
    .replace(/[^\d]/g, "")
    .replace(/^0+(?=\d)/, "")
    .slice(0, maxWonDigitLength)

  if (!digits) {
    return ""
  }

  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

export function parseOptionalWon(value: string) {
  const digits = value.replace(/[^\d]/g, "")
  return digits ? Number(digits) : null
}

function formatNullableWon(value?: number | null) {
  if (value === null || value === undefined) {
    return ""
  }

  return formatWonInput(String(value))
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
