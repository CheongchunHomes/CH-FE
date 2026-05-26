import { get, post, request } from "@/lib/api/client"

export type FileContentType = "IMAGE" | "DOCUMENT" | "UNKNOWN"

export type FileUploadUrlRequest = {
  originalFilename: string
  contentType?: FileContentType
  sizeBytes: number
}

export type FileUploadUrlResponse = {
  fileId: number
  objectPath: string
  signedUploadUrl: string
  expiresInSeconds: number
}

export type FileSignedUrlResponse = {
  fileId: number
  signedUrl: string
  expiresInSeconds: number
  contentType: FileContentType
  originalFilename: string
  sizeBytes: number
}

const DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
])

function filePath(fileId: number) {
  return `/api/files/${encodeURIComponent(String(fileId))}`
}

export function resolveFileContentType(file: File): FileContentType {
  const mimeType = file.type.trim().toLowerCase()

  if (!mimeType) {
    return "UNKNOWN"
  }

  if (mimeType.startsWith("image/")) {
    return "IMAGE"
  }

  if (DOCUMENT_MIME_TYPES.has(mimeType)) {
    return "DOCUMENT"
  }

  return "UNKNOWN"
}

export function requestFileUploadUrl(input: FileUploadUrlRequest) {
  return post<FileUploadUrlResponse, FileUploadUrlRequest>("/api/files/upload-url", input)
}

export function completeFileUpload(fileId: number) {
  return post<void>(`${filePath(fileId)}/complete`)
}

export function getFileSignedUrl(fileId: number) {
  return get<FileSignedUrlResponse>(`${filePath(fileId)}/signed-url`, {
    cache: "no-store",
  })
}

export function deleteFile(fileId: number) {
  return request<void>("DELETE", filePath(fileId))
}

export async function uploadPrivateFile(file: File) {
  const uploadUrl = await requestFileUploadUrl({
    originalFilename: file.name,
    contentType: resolveFileContentType(file),
    sizeBytes: file.size,
  })

  const uploadResponse = await fetch(uploadUrl.signedUploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
  })

  if (!uploadResponse.ok) {
    const responseText = await uploadResponse.text().catch(() => "")
    const detail = responseText.trim() ? `: ${responseText.trim()}` : ""
    throw new Error(`File upload failed with status ${uploadResponse.status}${detail}`)
  }

  await completeFileUpload(uploadUrl.fileId)

  return uploadUrl.fileId
}
