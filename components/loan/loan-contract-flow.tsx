"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { FileText, Landmark, PenTool, ShieldCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

type ProductKey =
  | "newborn"
  | "newlywed"
  | "youthSmallBiz"
  | "youthDeposit"
  | "youthMonthly"
  | "generalBalance";

type SignatureTarget = "name" | "amount" | "paymentDay" | "confirmTop" | "confirmBottom";
type InterestMode = "fixed" | "fiveYear" | "variable" | "newborn";
type Page3Mode = "basic" | "newlywed" | "newborn";

type Product = {
  key: ProductKey;
  title: string;
  shortTitle: string;
  summary: string;
  contractTitle: string;
  contractSubtitle: string;
  rateLabel: string;
};

type DateParts = {
  year: string;
  month: string;
  day: string;
};

type Page3Item = {
  label: string;
  note: string;
  rate: string;
};

type Page3ModeContent = {
  title: string;
  intro: string;
  items: Page3Item[];
};

const PRODUCTS: Product[] = [
  {
    key: "newborn",
    title: "신생아 특례 버팀목대출",
    shortTitle: "신생아 버팀목",
    summary: "신생아 출산 가구의 주거안정을 위해 특례로 주택구입자금을 대출해 드리는 상품입니다.",
    contractTitle: "주택도시기금 내집마련 디딤돌 대출거래약정서",
    contractSubtitle: "출산·양육 가구를 위한 전세자금 지원",
    rateLabel: "1.8% ~ 4.5%",
  },
  {
    key: "newlywed",
    title: "신혼부부전용 전세자금대출",
    shortTitle: "신혼부부 전세",
    summary: "신혼부부의 전세 계약과 초기 주거비 부담을 줄이기 위한 전세자금 대출입니다.",
    contractTitle: "주택도시기금 내집마련 디딤돌 대출거래약정서",
    contractSubtitle: "신혼부부를 위한 전세자금 지원",
    rateLabel: "2.0% ~ 4.8%",
  },
  {
    key: "youthSmallBiz",
    title: "중소기업취업청년 전월세 보증금 대출",
    shortTitle: "중기취업청년",
    summary: "중소기업에 취업한 청년의 전월세 보증금 마련을 지원하는 대출입니다.",
    contractTitle: "주택도시기금 내집마련 디딤돌 대출거래약정서",
    contractSubtitle: "중기취업 청년을 위한 전세자금 지원",
    rateLabel: "1.5% ~ 3.5%",
  },
  {
    key: "youthDeposit",
    title: "청년전용 버팀목전세자금 대출",
    shortTitle: "청년 버팀목",
    summary: "청년층의 전세보증금 마련을 돕는 대표적인 주거지원 대출입니다.",
    contractTitle: "주택도시기금 내집마련 디딤돌 대출거래약정서",
    contractSubtitle: "청년을 위한 전세자금 지원",
    rateLabel: "2.1% ~ 4.2%",
  },
  {
    key: "youthMonthly",
    title: "청년전용 보증부월세대출",
    shortTitle: "청년 보증부월세",
    summary: "청년의 보증금과 월세 부담을 함께 줄여주는 전용 대출입니다.",
    contractTitle: "주택도시기금 내집마련 디딤돌 대출거래약정서",
    contractSubtitle: "청년 보증부월세 지원",
    rateLabel: "2.5% ~ 4.9%",
  },
  {
    key: "generalBalance",
    title: "일반 버팀목전세자금대출",
    shortTitle: "일반 버팀목",
    summary: "전세 계약 시 일반적으로 많이 사용하는 기본형 전세자금 대출입니다.",
    contractTitle: "주택도시기금 내집마련 디딤돌 대출거래약정서",
    contractSubtitle: "일반 전세자금 지원",
    rateLabel: "2.3% ~ 5.1%",
  },
];

const INTEREST_OPTIONS: Array<{ id: InterestMode; label: string }> = [
  { id: "fixed", label: "만기까지 고정금리" },
  { id: "fiveYear", label: "5년 주기 변동" },
  { id: "variable", label: "변동금리" },
  { id: "newborn", label: "신생아 특례대출" },
];

const PAGE3_MODE_OPTIONS: Array<{ key: Page3Mode; label: string; description: string }> = [
  { key: "basic", label: "기본", description: "기본 우대금리 적용" },
  { key: "newlywed", label: "신혼가구", description: "신혼부부 추가 우대" },
  { key: "newborn", label: "신생아특례", description: "출산가구 특례 우대" },
];

const PAGE3_MODE_CONTENT: Record<Page3Mode, Page3ModeContent> = {
  basic: {
    title: "기본 금리우대",
    intro: "기본 체크 상태에서 적용되는 우대금리 예시입니다.",
    items: [
      { label: "기본 금리우대", note: "기본 조건 충족 시 적용", rate: "0.20%p" },
      { label: "추가 우대 1", note: "중복 적용 가능", rate: "0.10%p" },
      { label: "추가 우대 2", note: "세부 조건 충족 시 적용", rate: "0.05%p" },
    ],
  },
  newlywed: {
    title: "신혼가구 금리우대",
    intro: "신혼가구 선택 시 우대 항목과 고정 비율 예시입니다.",
    items: [
      { label: "신혼부부 기본 우대", note: "혼인기간 및 세대요건 충족", rate: "0.30%p" },
      { label: "자녀 우대", note: "자녀 보유 또는 출산 예정", rate: "0.15%p" },
      { label: "추가 우대", note: "중복 적용 가능", rate: "0.10%p" },
    ],
  },
  newborn: {
    title: "신생아특례 금리우대",
    intro: "신생아특례 선택 시 우대 항목과 고정 비율 예시입니다.",
    items: [
      { label: "신생아 기본 우대", note: "출산 가구 기본 조건 충족", rate: "0.40%p" },
      { label: "추가 출산 우대", note: "추가 출산 시 연장 가능", rate: "0.20%p" },
      { label: "특례 추가 우대", note: "특례 조건 충족", rate: "0.15%p" },
    ],
  },
};

const PAGE2_CLAUSES = [
  {
    title: "제2조 인지세의 부담",
    body: [
      "이 약정서 작성에 따른 인지세는 각 50%씩 본인과 은행이 부담합니다.",
      "본인이 부담할 인지세를 은행이 대신 지급한 경우에는 은행여신거래기본약관(가계용) 제4조에 준하여 곧 갚기로 합니다.",
    ],
  },
  {
    title: "제3조 대출이자율, 지연배상금률의 변동 및 지연배상금",
    body: [
      "대출이자율, 지연배상금률, 대출기간, 호당대출한도 등에 관한 사항은 국토교통부의 기금 운용계획에 따릅니다.",
      "기금 운용계획변경 등으로 제1조에서 정한 이자율 또는 지연배상금률이 변경되는 경우에는 기본약관에 따릅니다.",
      "이자 또는 분할상환금을 기일에 상환하지 아니한 때에는 납입기일 다음날부터 실제 납입일 전일까지 지연배상금을 지급합니다.",
    ],
  },
  {
    title: "제4조 대출금의 분할실행",
    body: [
      "분할실행하는 대출의 경우 채무총액은 최종의 실행 후에 확정되며, 실행내역표 등 증빙자료에 의합니다.",
      "대출기간은 최초 분할실행일부터 대출기간 만료일까지로 하며, 거치기간과 약정납입일을 기준에 따라 정합니다.",
    ],
  },
  {
    title: "제5조 추가 담보",
    body: [
      "본인이 은행의 대출을 받아 건설 또는 구입하는 시설물과 건물은 은행의 승인 없이 권리 설정을 하지 않기로 합니다.",
      "은행이 요청하는 경우 보험에 가입하고, 보험금 청구권에 은행을 위하여 질권설정하기로 합니다.",
    ],
  },
  {
    title: "제6조 기한전의 채무변제의무 등",
    body: [
      "다음 각 호의 사유 중 하나라도 발생한 경우에는 은행은 서면으로 독촉하고, 통지 도달일로부터 10일 이상 경과하면 기한의 이익을 상실합니다.",
      "주택건설사업계획승인 취소, 건축법령 위반, 공사기간내 미준공, 담보부족, 전월세자금대출 요건 위반, 입양아 파양 등의 사유가 포함됩니다.",
    ],
  },
  {
    title: "제7조 무주택 및 입주자앞대환대출 등에 대한 특약사항",
    body: [
      "본인 및 세대원 전원의 무주택 또는 소득 확인을 위하여 행정전산망 이용에 동의합니다.",
      "주택도시기금 운용 및 관리규정에 따라 무주택자 요건을 확인하며, 허위로 판명되면 기한의 이익을 상실합니다.",
    ],
  },
  {
    title: "제8조 소유권 이전·임차계약 해지시 상환 또는 채무인수 의무",
    body: [
      "대출 후 해당 시설물과 건물 또는 토지의 소유권을 이전한 경우에는 양수인으로 하여금 채무를 인수하게 하거나 대출금 전액을 상환합니다.",
      "전세자금대출을 받은 후 임대차계약이 종료되고 새로운 임대차계약이 체결되지 아니한 경우에는 곧 전액 상환합니다.",
    ],
  },
  {
    title: "제9조 자산기준 초과 시 가산금리 적용 및 조건변경 제한",
    body: [
      "자산심사 결과에 따라 자산기준이 초과된 경우 가산금리 또는 금리를 변경 적용합니다.",
      "자산 기준은 국토교통부 주택도시기금포털에서 확인 가능하며, 채무인수·기한연장·상환방법·우대금리 변경이 제한될 수 있습니다.",
    ],
  },
  {
    title: "제10조 기한연장",
    body: [
      "오피스텔구입자금, 전세자금 기한연장시에는 일정 비율을 상환하여야 하며, 불가한 경우 가산금리가 적용됩니다.",
      "기초생활수급자, 차상위계층, 한부모가정으로 우대받은 경우 기한연장 시에도 해당 사항을 다시 확인합니다.",
    ],
  },
  {
    title: "제11조 대출금 수령위임",
    body: [
      "이 약정서에 의해 대출을 받음에 있어 대출금 수령계좌의 금액 청구·수령할 일체의 권한을 위임합니다.",
      "이에 따르는 법적분쟁 등이 있을 경우 은행의 고의·과실이 없는 한 본인이 책임을 부담합니다.",
    ],
  },
  {
    title: "제12조 자산기준 초과 시 대출계약의 철회",
    body: [
      "자산기준을 초과하는 경우 대출계약서류를 제공받은 날, 대출계약체결일, 대출실행일 또는 최초 사후자산 심사 결과 부적격 확정 통지일 중 늦은 날로부터 14일 이내 계약 철회가 가능합니다.",
      "그 외 사항은 은행여신거래기본약관(가계용) 제4조의2를 적용합니다.",
    ],
  },
];

function todayParts(): DateParts {
  const today = new Date();
  return {
    year: String(today.getFullYear()),
    month: String(today.getMonth() + 1).padStart(2, "0"),
    day: String(today.getDate()).padStart(2, "0"),
  };
}

function formatKoreanDateStamp(date = new Date()) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replace(/\D/g, "");
}

function sanitizeFileNamePart(value: string) {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function emptySignatureMap(): Record<SignatureTarget, string | null> {
  return {
    name: null,
    amount: null,
    paymentDay: null,
    confirmTop: null,
    confirmBottom: null,
  };
}

function SignatureMark({
  signature,
  pendingLabel = "전자서명 대기",
}: {
  signature: string | null;
  pendingLabel?: string;
}) {
  if (signature) {
    return <img src={signature} alt="전자서명" className="h-8 w-auto object-contain" />;
  }

  return <span className="whitespace-nowrap text-slate-400">{pendingLabel}</span>;
}

function DateTriplet({
  value,
  onChange,
}: {
  value: DateParts;
  onChange: (value: DateParts) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        value={value.year}
        onChange={(event) => onChange({ ...value, year: event.target.value })}
        className="h-11 w-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold leading-6 text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
      <span className="text-slate-500">년</span>
      <input
        value={value.month}
        onChange={(event) => onChange({ ...value, month: event.target.value })}
        className="h-11 w-16 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold leading-6 text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
      <span className="text-slate-500">월</span>
      <input
        value={value.day}
        onChange={(event) => onChange({ ...value, day: event.target.value })}
        className="h-11 w-16 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold leading-6 text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
      <span className="text-slate-500">일</span>
    </div>
  );
}

function SignatureDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!open) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const width = 720;
    const height = 320;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#1d4ed8";
    context.lineWidth = 3;

    drawingRef.current = false;
    lastPointRef.current = null;
  }, [open]);

  const getPoint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const startDraw = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const point = getPoint(event);
    if (!point) return;
    drawingRef.current = true;
    lastPointRef.current = point;
  };

  const moveDraw = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const point = getPoint(event);
    if (!canvas || !context || !point || !lastPointRef.current) return;

    context.beginPath();
    context.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    lastPointRef.current = point;
  };

  const endDraw = () => {
    drawingRef.current = false;
    lastPointRef.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 px-4 py-6">
      <div className="w-full max-w-3xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-[0.22em] text-blue-600">전자결제</p>
            <h3 className="mt-2 text-2xl font-black text-slate-950">자필 서명</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 rounded-[24px] border border-dashed border-blue-200 bg-blue-50/40 p-4">
          <canvas
            ref={canvasRef}
            onPointerDown={startDraw}
            onPointerMove={moveDraw}
            onPointerUp={endDraw}
            onPointerLeave={endDraw}
            className="h-[320px] w-full rounded-[20px] bg-white touch-none"
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={clearCanvas}>
            초기화
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button
            type="button"
            onClick={() => {
              const canvas = canvasRef.current;
              if (!canvas) return;
              onConfirm(canvas.toDataURL("image/png"));
            }}
          >
            확인
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function LoanContractFlow() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedKey, setSelectedKey] = useState<ProductKey>("newborn");
  const [page3Mode, setPage3Mode] = useState<Page3Mode>("basic");
  const [signatureTarget, setSignatureTarget] = useState<SignatureTarget | null>(null);
  const [contractOpen, setContractOpen] = useState(false);
  const [savingContract, setSavingContract] = useState(false);
  const [signatures, setSignatures] = useState<Record<SignatureTarget, string | null>>(
    emptySignatureMap(),
  );
  const [name, setName] = useState("홍길동");
  const [address, setAddress] = useState("서울시 ...");
  const [amount, setAmount] = useState("1억원");
  const [term, setTerm] = useState("20");
  const [confirmName, setConfirmName] = useState("홍길동");
  const [gracePeriod, setGracePeriod] = useState("0");
  const [paymentDay, setPaymentDay] = useState("10");
  const [executionDate, setExecutionDate] = useState<DateParts>(todayParts());
  const [maturityDate, setMaturityDate] = useState<DateParts>(todayParts());
  const [interestMode, setInterestMode] = useState<InterestMode>("fixed");
  const page1Ref = useRef<HTMLElement | null>(null);
  const page2Ref = useRef<HTMLElement | null>(null);
  const page3Ref = useRef<HTMLElement | null>(null);

  const selected = useMemo(
    () => PRODUCTS.find((product) => product.key === selectedKey) ?? PRODUCTS[0],
    [selectedKey],
  );

  const requestSignature = (target: SignatureTarget) => {
    setSignatureTarget(target);
  };

  const applySignature = (dataUrl: string) => {
    if (!signatureTarget) return;
    setSignatures((current) => ({ ...current, [signatureTarget]: dataUrl }));
    setSignatureTarget(null);
  };

  const page3 = PAGE3_MODE_CONTENT[page3Mode];

  const handleSaveContract = async () => {
    if (savingContract) return;

    const sections = [page1Ref.current, page2Ref.current, page3Ref.current].filter(Boolean) as HTMLElement[];
    if (!sections.length) {
      router.push("/site/map");
      return;
    }

    setSavingContract(true);
    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const marginX = 8;
      const marginY = 8;
      const usableWidth = pageWidth - marginX * 2;
      const contractId = `loan-contract-${selectedKey}-${Date.now()}`;
      const userId = user?.id != null ? String(user.id) : "guest";
      const files: File[] = [];

      for (let index = 0; index < sections.length; index += 1) {
        const element = sections[index];
        const captureKey = element.dataset.contractCapture ?? "";
        const canvas = await html2canvas(element, {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
          allowTaint: true,
          scrollX: 0,
          scrollY: -window.scrollY,
          width: element.scrollWidth,
          height: element.scrollHeight,
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight,
          onclone: (clonedDocument) => {
            const cloned = clonedDocument.querySelector(
              `[data-contract-capture="${captureKey}"]`,
            ) as HTMLElement | null;
            if (!cloned) return;
            const captureScale = 0.92;
            let current: HTMLElement | null = cloned;
            while (current) {
              current.style.maxHeight = "none";
              current.style.height = "auto";
              current.style.overflow = "visible";
              current.style.overflowX = "visible";
              current.style.overflowY = "visible";
              current.style.transform = "none";
              current.style.position = "static";
              current.style.clipPath = "none";
              current = current.parentElement;
            }
            cloned.style.transform = `scale(${captureScale})`;
            cloned.style.transformOrigin = "top left";
            cloned.style.width = `${100 / captureScale}%`;
            cloned.style.paddingTop = "24px";
            cloned.style.paddingBottom = "24px";

            cloned.querySelectorAll("input, textarea, select").forEach((node) => {
              const element = node as HTMLElement;
              const computed = window.getComputedStyle(element);
              const value = (element as HTMLInputElement).value ?? element.textContent ?? "";
              const replacement = clonedDocument.createElement("span");
              replacement.textContent = value;
              replacement.style.display = "inline-flex";
              replacement.style.alignItems = "center";
              replacement.style.minWidth = computed.width;
              replacement.style.minHeight = computed.height;
              replacement.style.padding = computed.padding;
              replacement.style.font = computed.font;
              replacement.style.lineHeight = computed.lineHeight;
              replacement.style.color = computed.color;
              replacement.style.background = computed.backgroundColor;
              replacement.style.border = computed.border;
              replacement.style.borderRadius = computed.borderRadius;
              replacement.style.boxSizing = "border-box";
              replacement.style.whiteSpace = "nowrap";
              replacement.style.overflow = "hidden";
              replacement.style.textOverflow = "clip";
              replacement.style.verticalAlign = "middle";

              if (element.parentElement) {
                element.parentElement.replaceChild(replacement, element);
              }
            });

            cloned.querySelectorAll("button").forEach((node) => {
              const element = node as HTMLElement;
              element.style.lineHeight = "1.2";
              element.style.overflow = "visible";
            });
          },
        });

        const imageData = canvas.toDataURL("image/png");
        if (index > 0) {
          pdf.addPage();
        }
        const imgProps = pdf.getImageProperties(imageData);
        const imgHeight = (imgProps.height * usableWidth) / imgProps.width;
        const maxHeight = pageHeight - marginY * 2;
        const fitScale = Math.min(1, maxHeight / imgHeight);
        const drawWidth = usableWidth * fitScale;
        const drawHeight = imgHeight * fitScale;
        const drawX = marginX + (usableWidth - drawWidth) / 2;
        pdf.addImage(imageData, "PNG", drawX, marginY, drawWidth, drawHeight);

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((value) => {
            if (!value) {
              reject(new Error("Failed to export contract page"));
              return;
            }
            resolve(value);
          }, "image/png");
        });
        files.push(new File([blob], `page-${index + 1}.png`, { type: "image/png" }));
      }

      const pdfBlob = pdf.output("blob");
      files.push(new File([pdfBlob], "contract.pdf", { type: "application/pdf" }));

      const formData = new FormData();
      formData.append("contractId", contractId);
      formData.append("userId", userId);
      formData.append("selectedKey", selectedKey);
      formData.append("productTitle", selected.title);
      formData.append("shortTitle", selected.shortTitle);
      formData.append("name", name);
      formData.append("address", address);
      formData.append("amount", amount);
      formData.append("term", term);
      formData.append("executionDate", `${executionDate.year}-${executionDate.month}-${executionDate.day}`);
      formData.append("maturityDate", `${maturityDate.year}-${maturityDate.month}-${maturityDate.day}`);
      formData.append("page3Mode", page3Mode);
      files.forEach((file, index) => {
        formData.append(`file-${index + 1}`, file);
      });

      await fetch("/api/contracts/local-save", {
        method: "POST",
        body: formData,
      });

      router.push("/site/map");
    } catch (error) {
      console.error(error);
      router.push("/site/map");
    } finally {
      setSavingContract(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 text-slate-900">
      <div className="mx-auto max-w-[1440px] space-y-8 px-4 lg:px-6">
        <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center justify-between gap-2">
              {[
                { step: "1", label: "내 조건 진단" },
                { step: "2", label: "제도 추천" },
                { step: "3", label: "대출 계산" },
                { step: "4", label: "집공고 확인" },
                { step: "5", label: "계약" },
              ].map((item, index, array) => {
                const active = index === 2;
                return (
                  <div key={item.step} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black ${
                          active ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {item.step}
                      </div>
                      <div className="mt-3 text-xs font-semibold text-slate-400">Step {item.step}</div>
                      <div className={`mt-1 text-sm font-bold ${active ? "text-blue-600" : "text-slate-500"}`}>
                        {item.label}
                      </div>
                    </div>
                    {index < array.length - 1 ? (
                      <div className="mx-4 h-px flex-1 bg-slate-200" />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <p className="text-sm font-semibold tracking-[0.32em] text-blue-600">LOAN CONTRACT</p>
              <h2 className="mt-3 text-[2.3rem] font-black leading-tight text-slate-950">
                주택도시기금 내집마련 디딤돌 대출거래약정서
              </h2>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-500">
                선택한 상품 기준으로 계약서 문구와 거래조건이 자동 반영됩니다.
              </p>
            </div>

            <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">현재 선택</p>
                  <div className="mt-2 text-2xl font-black text-slate-950">{selected.shortTitle}</div>
                </div>
                <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  금리 정보 확인
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">{selected.summary}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-semibold text-slate-400">금리</div>
                  <div className="mt-1 text-sm font-black text-slate-900">{selected.rateLabel}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-semibold text-slate-400">계약 안내</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">계약서보기 버튼으로 상세 모달을 엽니다.</div>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <Button type="button" onClick={() => setContractOpen(true)}>
                  계약서보기
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {PRODUCTS.map((product) => {
              const active = selectedKey === product.key;
              return (
                <button
                  key={product.key}
                  type="button"
                  onClick={() => setSelectedKey(product.key)}
                  className={`rounded-[24px] border p-5 text-left transition ${
                    active ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-blue-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <Landmark className="h-5 w-5" />
                    </div>
                    <div className="text-xs font-semibold text-slate-400">계약 상품</div>
                  </div>
                  <div className="mt-5 text-xl font-black text-slate-950">{product.title}</div>
                  <div className="mt-2 text-sm font-semibold text-blue-600">{product.shortTitle}</div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{product.summary}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      대출과목
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {product.rateLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">현재 선택</p>
              <h3 className="mt-2 text-2xl font-black text-slate-950">{selected.shortTitle}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{selected.summary}</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold text-slate-400">금리</div>
                  <div className="mt-1 text-lg font-black text-slate-950">{selected.rateLabel}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold text-slate-400">계약서 제목</div>
                  <div className="mt-1 text-lg font-black text-slate-950">{selected.contractTitle}</div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-sm font-bold text-slate-950">이 상품으로 진행하면</div>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
                  <li>• 선택한 상품 기준으로 계약서 문구가 자동 반영됩니다.</li>
                  <li>• 계약서보기 버튼을 누르면 상세 약정 모달이 열립니다.</li>
                  <li>• 전자서명 후 입력값이 계약서에 반영됩니다.</li>
                </ul>
              </div>
            </div>

            <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">계약 상태</p>
                  <div className="mt-2 text-xl font-black text-slate-950">문구 자동 반영 중</div>
                </div>
                <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  계약서 확인 대기
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-semibold text-slate-400">다음 단계</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">계약서보기 버튼으로 상세 약정을 확인합니다.</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-semibold text-slate-400">안내</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">선택 상품에 따라 금리와 조건이 함께 바뀝니다.</div>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <Button type="button" onClick={() => setContractOpen(true)}>
                  계약서보기
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className={contractOpen ? "fixed inset-0 z-[100] overflow-y-auto bg-slate-950/45 p-4" : "hidden"}>
          <div className="mx-auto my-4 w-full max-w-[1440px] rounded-[32px] bg-white p-6 shadow-2xl">
            <div className="mb-4 flex justify-end">
              <Button type="button" variant="outline" onClick={() => setContractOpen(false)}>
                닫기
              </Button>
            </div>

            <section
              ref={page1Ref}
              data-contract-capture="page-1"
              className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm"
            >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-5xl">
              <p className="text-sm font-semibold tracking-[0.3em] text-blue-600">PAGE 1</p>
              <h3 className="mt-2 text-3xl font-black text-slate-950">
                주택도시기금 내집마련 디딤돌 대출거래약정서
              </h3>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-500">
                본인은 주식회사 우리은행(이하 "은행")과 아래의 조건에 따라 여신거래를 함에 있어 은행여신거래기본약관(가계용)(이하 "기본약관")이
                적용됨을 승인하고 다음 각 조항을 준수할 것을 확약합니다.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="grid gap-3 lg:grid-cols-[120px_minmax(0,1fr)]">
              <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-lg font-bold text-slate-800">
                본인
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex min-w-0 flex-nowrap items-center gap-3">
                  <span className="whitespace-nowrap text-sm font-semibold text-slate-900">성명 (인)</span>
                  <input
                    value={name}
                    onFocus={() => {
                      if (name === "홍길동") setName("");
                    }}
                    onChange={(event) => setName(event.target.value)}
                    className="min-w-0 flex-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold leading-6 text-slate-900 outline-none placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  <span className="whitespace-nowrap text-sm font-semibold text-slate-900">자필확인</span>
                  <div className="flex shrink-0 items-center gap-2">
                    <SignatureMark signature={signatures.confirmTop} />
                  </div>
                  <Button type="button" onClick={() => requestSignature("confirmTop")} className="ml-auto">
                    <PenTool className="mr-2 h-4 w-4" />
                    전자결제
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[120px_minmax(0,1fr)]">
              <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-lg font-bold text-slate-800">
                본인
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex min-w-0 flex-nowrap items-center gap-3">
                  <span className="whitespace-nowrap text-sm font-semibold text-slate-900">주소</span>
                  <input
                    value={address}
                    onFocus={() => {
                      if (address === "서울시 ...") setAddress("");
                    }}
                    onChange={(event) => setAddress(event.target.value)}
                    className="min-w-0 flex-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold leading-6 text-slate-900 outline-none placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-[28px] border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h4 className="text-xl font-black text-slate-950">제1조 거래조건</h4>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                거래조건은 아래 표와 같습니다. 필요한 항목은 체크박스와 빈칸을 채워주세요.
              </p>
            </div>

            <table className="w-full border-collapse text-sm">
              <tbody>
                <tr>
                  <th className="w-[120px] border-b border-r border-slate-200 bg-slate-50 px-4 py-4 text-left font-semibold text-slate-800">
                    대출과목
                  </th>
                  <td className="border-b border-r border-slate-200 px-4 py-4 text-slate-700">{selected.shortTitle}</td>
                  <th className="w-[120px] border-b border-r border-slate-200 bg-slate-50 px-4 py-4 text-left font-semibold text-slate-800">
                    대출용도
                  </th>
                  <td className="border-b border-slate-200 px-4 py-4 text-slate-700">구입</td>
                </tr>

                <tr>
                  <th className="border-b border-r border-slate-200 bg-slate-50 px-4 py-4 text-left font-semibold text-slate-800">
                    대출금액
                  </th>
                  <td className="border-b border-r border-slate-200 px-4 py-4" colSpan={1}>
                    <div className="flex min-w-0 flex-nowrap items-center gap-3">
                      <span className="whitespace-nowrap font-semibold text-slate-900">금</span>
                      <input
                        value={amount}
                        onFocus={() => {
                          if (amount === "1억원") setAmount("");
                        }}
                        onChange={(event) => setAmount(event.target.value)}
                        className="min-w-0 flex-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold leading-6 text-slate-900 outline-none placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                      <span className="whitespace-nowrap font-semibold text-slate-900">원정</span>
                      <SignatureMark signature={signatures.amount} />
                      <Button type="button" variant="outline" onClick={() => requestSignature("amount")}>
                        <PenTool className="mr-2 h-4 w-4" />
                        전자결제
                      </Button>
                    </div>
                  </td>
                  <th className="border-b border-r border-slate-200 bg-slate-50 px-4 py-4 text-left font-semibold text-slate-800">
                    대출기간
                  </th>
                  <td className="border-b border-slate-200 px-4 py-4">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="whitespace-nowrap text-slate-500">(</span>
                      <input
                        value={term}
                        onFocus={() => {
                          if (term === "20") setTerm("");
                        }}
                        onChange={(event) => setTerm(event.target.value)}
                        className="h-11 w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-sm font-semibold leading-6 text-slate-900 outline-none placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                      <span className="whitespace-nowrap text-slate-500">)년</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <th className="border-b border-r border-slate-200 bg-slate-50 px-4 py-4 text-left font-semibold text-slate-800">
                    대출실행일
                  </th>
                  <td className="border-b border-r border-slate-200 px-4 py-4" colSpan={3}>
                    <DateTriplet value={executionDate} onChange={setExecutionDate} />
                  </td>
                </tr>

                <tr>
                  <th className="border-b border-r border-slate-200 bg-slate-50 px-4 py-4 text-left font-semibold text-slate-800">
                    대출만료일
                  </th>
                  <td className="border-b border-r border-slate-200 px-4 py-4" colSpan={3}>
                    <DateTriplet value={maturityDate} onChange={setMaturityDate} />
                  </td>
                </tr>

                <tr>
                  <th className="border-b border-r border-slate-200 bg-slate-50 px-4 py-4 text-left font-semibold text-slate-800">
                    이자율
                  </th>
                  <td className="border-b border-slate-200 px-4 py-4" colSpan={3}>
                    <div className="grid gap-3 md:grid-cols-2">
                      {INTEREST_OPTIONS.map((option) => {
                        const active = interestMode === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setInterestMode(option.id)}
                            className={`rounded-2xl border px-4 py-4 text-left transition ${
                              active
                                ? "border-blue-500 bg-blue-50 shadow-sm"
                                : "border-slate-200 bg-white hover:border-blue-200"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                                  active ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-white"
                                }`}
                              >
                                {active ? <span className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
                              </span>
                              <div>
                                <p className="text-sm font-black text-slate-950">{option.label}</p>
                                <p className="mt-1 text-xs text-slate-500">선택 후 계약서에 반영됩니다.</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>

                <tr>
                  <th className="border-b border-r border-slate-200 bg-slate-50 px-4 py-4 text-left font-semibold text-slate-800">
                    대출실행방법
                  </th>
                  <td className="border-b border-slate-200 px-4 py-4" colSpan={3}>
                    <p className="text-slate-700">대출실행일에 전액 실행합니다.</p>
                  </td>
                </tr>

                <tr>
                  <th className="border-b border-r border-slate-200 bg-slate-50 px-4 py-4 text-left font-semibold text-slate-800">
                    상환방법 및 거치기간
                  </th>
                  <td className="border-b border-slate-200 px-4 py-4" colSpan={3}>
                  <div className="flex flex-wrap items-center gap-3">
                      <span className="whitespace-nowrap text-slate-700">대출실행일로부터</span>
                      <input
                        value={gracePeriod}
                        onFocus={() => {
                          if (gracePeriod === "0") setGracePeriod("");
                        }}
                        onChange={(event) => setGracePeriod(event.target.value)}
                        className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                      <span className="whitespace-nowrap text-slate-700">년 동안 거치하고, 이후 매 1개월마다 원리금균등 / 원금균등 / 체증식 분할상환합니다.</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <th className="border-b border-r border-slate-200 bg-slate-50 px-4 py-4 text-left font-semibold text-slate-800">
                    원금 및 이자납입방법
                  </th>
                  <td className="border-b border-slate-200 px-4 py-4" colSpan={3}>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="whitespace-nowrap text-slate-700">매월 납입일</span>
                      <input
                        value={paymentDay}
                        onFocus={() => {
                          if (paymentDay === "10") setPaymentDay("");
                        }}
                        onChange={(event) => setPaymentDay(event.target.value)}
                        className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                      <span className="whitespace-nowrap text-slate-700">일에 원금과 이자를 납입합니다.</span>
                      <SignatureMark signature={signatures.paymentDay} />
                      <Button type="button" variant="outline" onClick={() => requestSignature("paymentDay")}>
                        <PenTool className="mr-2 h-4 w-4" />
                        전자결제
                      </Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section
          ref={page2Ref}
          data-contract-capture="page-2"
          className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <p className="text-sm font-semibold tracking-[0.3em] text-blue-600">PAGE 2</p>
          <h3 className="mt-2 text-2xl font-black text-slate-950">약정 부속조항</h3>
          <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-500">
            세부 조항은 계약의 중요한 내용을 담고 있으므로, 항목별 문구를 확인한 뒤 전자결제를 진행합니다.
          </p>

          <div className="mt-6 grid gap-4">
            {PAGE2_CLAUSES.map((clause, index) => (
              <article
                key={clause.title}
                className={`rounded-[24px] border p-5 shadow-sm ${
                  index % 2 === 0 ? "border-slate-200 bg-slate-50" : "border-slate-200 bg-white"
                }`}
              >
                <h4 className="text-lg font-black text-slate-950">{clause.title}</h4>
                <div className="mt-3 space-y-2">
                  {clause.body.map((line) => (
                    <p key={line} className="whitespace-pre-line leading-8 text-slate-700">
                      {line}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          ref={page3Ref}
          data-contract-capture="page-3"
          className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold tracking-[0.3em] text-blue-600">PAGE 3</p>
              <h3 className="mt-2 text-2xl font-black text-slate-950">금리우대 추가약정서</h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                기본 / 신혼가구 / 신생아특례 중 하나를 선택하면 아래 표의 우대금리가 바뀝니다. 기본은 디폴트로 선택되어 있습니다.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <div className="grid gap-3 md:grid-cols-3">
              {PAGE3_MODE_OPTIONS.map((option) => {
                const active = page3Mode === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setPage3Mode(option.key)}
                    className={`rounded-[22px] border p-4 text-left transition ${
                      active ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                          active ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-white"
                        }`}
                      >
                        {active ? <span className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
                      </span>
                      <div>
                        <p className="text-base font-black text-slate-950">{option.label}</p>
                        <p className="text-xs text-slate-500">{option.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-[18px] border border-slate-200 bg-white">
              <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h4 className="text-lg font-black text-slate-950">{page3.title}</h4>
                  <p className="mt-1 text-sm leading-7 text-slate-500">{page3.intro}</p>
                </div>
                <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  기본 체크: 기본
                </div>
              </div>

              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-600">
                    <th className="w-[42%] border-b border-slate-200 px-4 py-3 text-left font-semibold">구분</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">내용</th>
                    <th className="w-[140px] border-b border-slate-200 px-4 py-3 text-left font-semibold">우대금리</th>
                  </tr>
                </thead>
                <tbody>
                  {page3.items.map((item, index) => (
                    <tr key={item.label} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-900">
                        {item.label}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3 text-slate-600">{item.note}</td>
                      <td className="border-b border-slate-200 px-4 py-3 font-bold text-blue-600">{item.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 flex-nowrap items-center gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="whitespace-nowrap text-sm font-semibold text-slate-900">본인</span>
                </div>
                <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <input
                    value={confirmName}
                    onFocus={() => {
                      if (confirmName === "홍길동") setConfirmName("");
                    }}
                    onChange={(event) => setConfirmName(event.target.value)}
                    className="min-w-0 flex-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  <span className="whitespace-nowrap text-sm font-semibold text-slate-900">자필서명</span>
                  <SignatureMark signature={signatures.confirmBottom} />
                  <Button type="button" onClick={() => requestSignature("confirmBottom")}>
                    <PenTool className="mr-2 h-4 w-4" />
                    전자결제
                  </Button>
                </div>
              </div>
              <div className="text-sm text-slate-500">
                선택한 우대 조건에 맞게 계약서에 반영됩니다.
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <Button type="button" onClick={() => void handleSaveContract()} disabled={savingContract}>
                {savingContract ? "저장 중..." : "다음 페이지로 이동"}
              </Button>
            </div>
          </div>
            </section>
          </div>
        </div>
      </div>

      <SignatureDialog
        open={signatureTarget !== null}
        onClose={() => setSignatureTarget(null)}
        onConfirm={applySignature}
      />
    </div>
  );
}
