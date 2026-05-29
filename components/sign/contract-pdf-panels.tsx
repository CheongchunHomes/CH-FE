"use client"

import { createPortal } from "react-dom"
import { useEffect, useRef, useState } from "react"
import type { PointerEvent as ReactPointerEvent } from "react"
import { Loader2, PenTool, X } from "lucide-react"
import { PDFDocument } from "pdf-lib"

import { uploadPrivateFile } from "@/lib/api"
import type { FileSignedUrlResponse } from "@/lib/api"
import {
  customerSign,
  getProviderSignedPdfSignedUrl,
  type SignContractDocument,
} from "@/lib/sign-api"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const CONTRACT_PDF_NAME = "contract.pdf"
const TENANT_SIGNATURE_POSITION = {
  pageIndex: -1,
  x: 372,
  y: 92,
  width: 120,
  height: 42,
} as const

export function TenantPdfSigningDocument({
  contract,
  onRefresh,
}: {
  contract: SignContractDocument
  onRefresh: () => void
}) {
  const [providerPdfUrl, setProviderPdfUrl] = useState("")
  const [signature, setSignature] = useState<string | null>(null)
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false)
  const [isLoadingPreview, setIsLoadingPreview] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    let canceled = false

    async function loadPreview() {
      if (contract.providerSignedPdfFileId == null) {
        setErrorMessage("임대인이 생성한 계약서 PDF를 찾을 수 없습니다.")
        setIsLoadingPreview(false)
        return
      }

      setIsLoadingPreview(true)

      try {
        const response = await getProviderSignedPdfSignedUrl(contract.signId)
        if (!canceled) {
          setProviderPdfUrl(response.signedUrl)
          setErrorMessage("")
        }
      } catch (error) {
        if (!canceled) {
          setErrorMessage(error instanceof Error ? error.message : "계약서 PDF를 불러오지 못했습니다.")
        }
      } finally {
        if (!canceled) {
          setIsLoadingPreview(false)
        }
      }
    }

    loadPreview()

    return () => {
      canceled = true
    }
  }, [contract.providerSignedPdfFileId, contract.signId])

  const handleComplete = async () => {
    if (!providerPdfUrl) {
      setErrorMessage("계약서 PDF를 먼저 불러와 주세요.")
      return
    }

    if (!signature) {
      setErrorMessage("임차인 서명을 먼저 완료해 주세요.")
      return
    }

    setIsSubmitting(true)
    setErrorMessage("")

    try {
      const pdfBytes = await fetch(providerPdfUrl).then((response) => response.arrayBuffer())
      const pdfDoc = await PDFDocument.load(pdfBytes)
      const imageBytes = await fetch(signature).then((response) => response.arrayBuffer())
      const embeddedImage = await pdfDoc.embedPng(imageBytes)
      const pages = pdfDoc.getPages()
      const pageIndex =
        TENANT_SIGNATURE_POSITION.pageIndex < 0
          ? Math.max(0, pages.length + TENANT_SIGNATURE_POSITION.pageIndex)
          : TENANT_SIGNATURE_POSITION.pageIndex
      const page = pages[pageIndex]

      if (!page) {
        throw new Error("서명 위치를 찾을 수 없습니다.")
      }

      page.drawImage(embeddedImage, {
        x: TENANT_SIGNATURE_POSITION.x,
        y: TENANT_SIGNATURE_POSITION.y,
        width: TENANT_SIGNATURE_POSITION.width,
        height: TENANT_SIGNATURE_POSITION.height,
      })

      const completedPdfBytes = await pdfDoc.save()
      const completedPdfBuffer = new ArrayBuffer(completedPdfBytes.byteLength)
      new Uint8Array(completedPdfBuffer).set(completedPdfBytes)
      const completedFile = new File([completedPdfBuffer], CONTRACT_PDF_NAME, {
        type: "application/pdf",
      })
      const completedPdfFileId = await uploadPrivateFile(completedFile)
      await customerSign(contract.signId, { completedPdfFileId })
      onRefresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "임차인 서명 완료 처리에 실패했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PdfPreviewPanel
        title="임대인 서명 완료 계약서"
        description="계약서 PDF를 미리 보고 임차인 서명을 완료할 수 있습니다."
        fileId={contract.providerSignedPdfFileId}
        signedUrl={providerPdfUrl}
        isLoading={isLoadingPreview}
      />

      <Card className="border-slate-200/80 bg-white shadow-sm">
        <CardContent className="space-y-4 p-5 md:p-8">
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-950">임차인 서명</h3>
            <p className="text-sm text-slate-500">계약서의 고정된 서명 위치에 임차인 서명을 삽입합니다.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-sm font-semibold text-slate-500">서명 상태</span>
              <SignatureMark signature={signature} pendingLabel="임차인 서명 대기" />
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setSignatureDialogOpen(true)}>
                <PenTool className="mr-2 h-4 w-4" />
                서명 입력
              </Button>
              <Button type="button" onClick={handleComplete} disabled={isSubmitting || isLoadingPreview || !signature}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={16} />
                    완료 처리 중
                  </>
                ) : (
                  "서명 완료"
                )}
              </Button>
            </div>
          </div>

          {errorMessage ? <p className="text-sm font-medium text-rose-600">{errorMessage}</p> : null}
        </CardContent>
      </Card>

      <SignatureDialog
        open={signatureDialogOpen}
        onClose={() => setSignatureDialogOpen(false)}
        onConfirm={(dataUrl) => {
          setSignature(dataUrl)
          setSignatureDialogOpen(false)
        }}
      />
    </div>
  )
}

export function PdfPreviewPanel({
  title,
  description,
  fileId,
  signedUrl,
  loadSignedUrl,
  isLoading = false,
}: {
  title: string
  description: string
  fileId: number | null | undefined
  signedUrl?: string
  loadSignedUrl?: () => Promise<FileSignedUrlResponse>
  isLoading?: boolean
}) {
  const [resolvedUrl, setResolvedUrl] = useState(signedUrl ?? "")
  const [errorMessage, setErrorMessage] = useState("")
  const [loading, setLoading] = useState(Boolean(loadSignedUrl) && !signedUrl)

  useEffect(() => {
    if (signedUrl) {
      setResolvedUrl(signedUrl)
      setErrorMessage("")
      setLoading(false)
      return
    }

    if (isLoading) {
      setLoading(false)
      return
    }

    if (fileId == null || !loadSignedUrl) {
      setResolvedUrl("")
      setErrorMessage("파일을 찾을 수 없습니다.")
      setLoading(false)
      return
    }

    const loadPreviewSignedUrl: () => Promise<FileSignedUrlResponse> = loadSignedUrl
    let canceled = false

    async function loadPreview() {
      setLoading(true)
      try {
        const response = await loadPreviewSignedUrl()
        if (!canceled) {
          setResolvedUrl(response.signedUrl)
          setErrorMessage("")
        }
      } catch (error) {
        if (!canceled) {
          setErrorMessage(error instanceof Error ? error.message : "PDF 미리보기를 불러오지 못했습니다.")
        }
      } finally {
        if (!canceled) {
          setLoading(false)
        }
      }
    }

    loadPreview()

    return () => {
      canceled = true
    }
  }, [fileId, isLoading, loadSignedUrl, signedUrl])

  return (
    <Card className="border-slate-200/80 bg-white shadow-sm">
      <CardContent className="space-y-4 p-5 md:p-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>

          {fileId != null ? <span className="text-xs font-medium text-slate-400">fileId #{fileId}</span> : null}
        </div>

        {loading || isLoading ? (
          <div className="flex min-h-[420px] items-center justify-center gap-2 text-sm font-medium text-slate-500">
            <Loader2 className="animate-spin" size={16} />
            PDF를 불러오는 중입니다.
          </div>
        ) : errorMessage ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm font-medium text-rose-700">
            {errorMessage}
          </div>
        ) : resolvedUrl ? (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            <iframe title={title} src={resolvedUrl} className="h-[760px] w-full bg-white" />
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            미리보기를 표시할 수 없습니다.
          </div>
        )}

        {resolvedUrl ? (
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <a href={resolvedUrl} target="_blank" rel="noreferrer">
                새 탭에서 열기
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={resolvedUrl} download>
                다운로드
              </a>
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function SignatureMark({
  signature,
  pendingLabel = "전자서명 대기",
}: {
  signature: string | null
  pendingLabel?: string
}) {
  if (signature) {
    return <img src={signature} alt="전자서명" className="h-8 w-auto object-contain" />
  }

  return <span className="whitespace-nowrap text-sm text-slate-400">{pendingLabel}</span>
}

export function SignatureDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (dataUrl: string) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!open) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const width = rect.width || 720
    const height = 320
    canvas.width = width * dpr
    canvas.height = height * dpr

    const context = canvas.getContext("2d")
    if (!context) return

    context.setTransform(dpr, 0, 0, dpr, 0, 0)
    context.clearRect(0, 0, width, height)
    context.lineCap = "round"
    context.lineJoin = "round"
    context.strokeStyle = "#1d4ed8"
    context.lineWidth = 3

    drawingRef.current = false
    lastPointRef.current = null
  }, [open])

  const getPoint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  const startDraw = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const point = getPoint(event)
    if (!point) return

    drawingRef.current = true
    lastPointRef.current = point
  }

  const moveDraw = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return

    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    const point = getPoint(event)
    if (!canvas || !context || !point || !lastPointRef.current) return

    context.beginPath()
    context.moveTo(lastPointRef.current.x, lastPointRef.current.y)
    context.lineTo(point.x, point.y)
    context.stroke()
    lastPointRef.current = point
  }

  const endDraw = () => {
    drawingRef.current = false
    lastPointRef.current = null
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (!canvas || !context) return

    context.clearRect(0, 0, canvas.width, canvas.height)
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 px-4 py-6">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl md:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-[0.22em] text-blue-600">전자결제</p>
            <h3 className="mt-2 text-2xl font-black text-slate-950">자필 서명</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
            aria-label="서명 창 닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 p-3 md:p-4">
          <canvas
            ref={canvasRef}
            onPointerDown={startDraw}
            onPointerMove={moveDraw}
            onPointerUp={endDraw}
            onPointerLeave={endDraw}
            className="h-80 w-full touch-none rounded-xl bg-white"
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
              const canvas = canvasRef.current
              if (!canvas) return
              onConfirm(canvas.toDataURL("image/png"))
            }}
          >
            확인
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
