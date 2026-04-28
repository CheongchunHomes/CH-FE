import { NextResponse } from "next/server"

import { createTypecastSpeech } from "@/lib/typecast"

export const runtime = "nodejs"

type TtsRequestBody = {
  text?: unknown
}

export async function POST(request: Request) {
  let body: TtsRequestBody

  try {
    body = (await request.json()) as TtsRequestBody
  } catch {
    return NextResponse.json({ error: "요청 본문을 읽을 수 없습니다." }, { status: 400 })
  }

  const text = typeof body.text === "string" ? body.text.trim() : ""

  if (!text) {
    return NextResponse.json({ error: "음성으로 변환할 텍스트가 없습니다." }, { status: 400 })
  }

  try {
    const audio = await createTypecastSpeech(text)

    return new NextResponse(audio, {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했어요."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
