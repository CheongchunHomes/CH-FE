import { readFile } from "node:fs/promises"
import path from "node:path"

type TypecastConfig = {
  apiKey: string
  voiceId: string
  model?: string
  language?: string
  volume?: number
  audioPitch?: number
  audioTempo?: number
  audioFormat?: "wav" | "mp3"
}

const DEFAULT_MODEL = "ssfm-v21"
const DEFAULT_LANGUAGE = "KOR"
const DEFAULT_VOLUME = 100
const DEFAULT_PITCH = 0
const DEFAULT_TEMPO = 1
const DEFAULT_FORMAT = "wav"

function stripBom(text: string) {
  return text.replace(/^\uFEFF/, "")
}

function resolveConfigPath() {
  return path.join(process.cwd(), "config", "typecast.json")
}

async function loadConfig(): Promise<TypecastConfig> {
  const raw = stripBom(await readFile(resolveConfigPath(), "utf8"))
  const parsed = JSON.parse(raw) as Partial<TypecastConfig>

  if (typeof parsed.apiKey !== "string" || !parsed.apiKey.trim()) {
    throw new Error("config/typecast.json에 apiKey가 없습니다.")
  }

  if (typeof parsed.voiceId !== "string" || !parsed.voiceId.trim()) {
    throw new Error("config/typecast.json에 voiceId가 없습니다.")
  }

  return {
    apiKey: parsed.apiKey.trim(),
    voiceId: parsed.voiceId.trim(),
    model: typeof parsed.model === "string" && parsed.model.trim() ? parsed.model.trim() : DEFAULT_MODEL,
    language: typeof parsed.language === "string" && parsed.language.trim() ? parsed.language.trim() : DEFAULT_LANGUAGE,
    volume: typeof parsed.volume === "number" ? parsed.volume : DEFAULT_VOLUME,
    audioPitch: typeof parsed.audioPitch === "number" ? parsed.audioPitch : DEFAULT_PITCH,
    audioTempo: typeof parsed.audioTempo === "number" ? parsed.audioTempo : DEFAULT_TEMPO,
    audioFormat: parsed.audioFormat === "mp3" || parsed.audioFormat === "wav" ? parsed.audioFormat : DEFAULT_FORMAT,
  }
}

export async function createTypecastSpeech(text: string): Promise<Buffer> {
  const config = await loadConfig()
  const speechText = text.trim().replace(/\s+/g, " ")
  const normalizedText = speechText.length > 1900 ? `${speechText.slice(0, 1900).trimEnd()}...` : speechText

  const response = await fetch("https://api.typecast.ai/v1/text-to-speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": config.apiKey,
    },
    body: JSON.stringify({
      voice_id: config.voiceId,
      text: normalizedText,
      model: config.model,
      language: config.language,
      output: {
        volume: config.volume,
        audio_pitch: config.audioPitch,
        audio_tempo: config.audioTempo,
        audio_format: config.audioFormat,
      },
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(
      `Typecast TTS 요청 실패: ${response.status} ${response.statusText}${detail ? ` - ${detail.slice(0, 300)}` : ""}`
    )
  }

  return Buffer.from(await response.arrayBuffer())
}
