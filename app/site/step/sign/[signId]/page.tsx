"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react"
import { AlertCircle, ArrowLeft, FileText, Loader2 } from "lucide-react"

import { ApiError } from "@/lib/api"
import { useStepBar } from "@/app/site/step/components/StepLayoutShell"
import { useAuth } from "@/lib/auth-context"
import { getSignContract, type SignContractDocument, type SignStatus } from "@/lib/sign-api"

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

export default function SignContractPage() {
  useStepBar(5)

  const params = useParams<{ signId: string }>()
  const signId = useMemo(() => Number(params.signId), [params.signId])
  const { status, refresh } = useAuth()

  const [contract, setContract] = useState<SignContractDocument | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)

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
  }, [refresh, signId, status])

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
            <ContractDocument contract={contract} />
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function ContractDocument({ contract }: { contract: SignContractDocument }) {
  const property = contract.property
  const [leaseEndDate, setLeaseEndDate] = useState(() => getDefaultLeaseEndDate(property.moveInDate))
  const [contractAmount, setContractAmount] = useState("")
  const [interimAmount1, setInterimAmount1] = useState("")
  const [interimAmount2, setInterimAmount2] = useState("")
  const [balanceAmount, setBalanceAmount] = useState("")
  const depositWon = formatWonInput(property.depositAmount === null || property.depositAmount === undefined ? "" : String(property.depositAmount * 10000))
  const leaseMonthCount = useMemo(
    () => calculateMonthCount(property.moveInDate, leaseEndDate),
    [leaseEndDate, property.moveInDate]
  )

  return (
    <article className="mx-auto max-w-5xl overflow-hidden rounded-lg border border-slate-300 bg-white text-slate-950 shadow-sm">
      <header className="border-b border-slate-300 bg-slate-950 px-5 py-4 text-white md:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <FileText size={22} className="text-sky-300" />
            <div>
              <h2 className="text-xl font-bold">부동산(다세대주택) 전세 계약서</h2>
              <p className="mt-1 text-xs text-slate-300">문서번호 #{contract.signId}</p>
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
                <BlankField label="동" hideLabel suffix="동" />
                <BlankField label="호" hideLabel suffix="호" />
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
                <BlankField label="임대할 부분" />
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
                  <PaymentLine label="중도금 1" dateLabel="중도금 1 지급일" value={interimAmount1} onChange={setInterimAmount1} />
                  <PaymentLine label="중도금 2" dateLabel="중도금 2 지급일" value={interimAmount2} onChange={setInterimAmount2} />
                </div>
              </DocumentRow>
              <DocumentRow label="잔금">
                <PaymentLine label="잔금" dateLabel="잔금 지급일" value={balanceAmount} onChange={setBalanceAmount} />
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
          <Textarea className="min-h-96 resize-y bg-white leading-6" defaultValue={defaultSpecialTerms} />
        </ContractSection>

        <ContractSection title="4. 임대인 정보">
          <PartyFields party={contract.provider} />
        </ContractSection>

        <ContractSection title="5. 임차인 정보">
          <PartyFields party={contract.customer} />
        </ContractSection>

        <ContractSection title="6. 개업 공인중개사">
          <AgentFields />
        </ContractSection>
      </div>
    </article>
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
}: {
  label: string
  dateLabel: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <MoneyLine>
      <MoneyText>일금</MoneyText>
      <MoneyField className="min-w-0 flex-1" label={label} value={value} onChange={onChange} />
      <MoneyText>원정</MoneyText>
      <MoneyText>은</MoneyText>
      <BlankField className="w-full md:w-44" label={dateLabel} type="date" hideLabel />
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

function PartyFields({ party }: { party: ContractPartyWithBirthDate }) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <ReadOnlyField className="md:col-span-3" label="주소" value={party.address} />
      <ReadOnlyField label="생년월일" value={formatDate(party.birthDate)} />
      <ReadOnlyField label="전화번호" value={party.phone} />
      <ReadOnlyField label="성명" value={party.realName} />
    </div>
  )
}

function AgentFields() {
  return (
    <BrokerOfficeBlock title="개업 공인중개사" />
  )
}

function BrokerOfficeBlock({ title }: { title: string }) {
  return (
    <div className="grid gap-2 md:grid-cols-[112px_1fr]">
      <div className="flex items-center text-xs font-semibold text-slate-500 md:pb-2">{title}</div>
      <div className="space-y-3">
        <ReadOnlyField label="사무소 소재지" value="서울 마포구 백범로 23" />
        <div className="grid gap-3 md:grid-cols-[1fr_180px]">
          <ReadOnlyField label="사무소 명칭" value="한국ICT인재개발원" />
          <ReadOnlyField label="대표자 명" value="쟈스민" />
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
}: {
  label: string
  type?: string
  placeholder?: string
  suffix?: string
  className?: string
  hideLabel?: boolean
  value?: string
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
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
          onChange={onChange}
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
