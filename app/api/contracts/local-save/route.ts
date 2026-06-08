import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

export const runtime = "nodejs";

type SavedFile = {
  field: string;
  name: string;
  path: string;
};

function sanitizeFileNamePart(value: string) {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
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

function buildSavedFileName(originalName: string) {
  const pageMatch = originalName.match(/^page-(\d+)\.png$/);
  if (pageMatch) {
    return `page-${pageMatch[1]}.png`;
  }

  if (originalName === "contract.pdf") {
    return "contract.pdf";
  }

  const ext = path.extname(originalName);
  const stem = path.basename(originalName, ext);
  const safeStem = sanitizeFileNamePart(stem || "file");
  return `${safeStem}${ext}`;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const userIdRaw = String(formData.get("userId") ?? "guest");
  const userId = sanitizeFileNamePart(userIdRaw) || "guest";
  const dateStamp = formatKoreanDateStamp();
  const fileBaseName = `${userId}_대출_${dateStamp}`;
  const contractId = String(formData.get("contractId") ?? `loan-${userId}-${dateStamp}-${Date.now()}`);
  const storageRoot = path.join(process.cwd(), "storage", "contracts", fileBaseName);

  await mkdir(storageRoot, { recursive: true });

  const savedFiles: SavedFile[] = [];

  for (const [field, value] of formData.entries()) {
    if (!(value instanceof File)) continue;

    const safeName = buildSavedFileName(value.name || `${field}.bin`);
    const targetPath = path.join(storageRoot, safeName);
    const bytes = Buffer.from(await value.arrayBuffer());
    await writeFile(targetPath, bytes);

    savedFiles.push({
      field,
      name: safeName,
      path: targetPath,
    });
  }

  const metadata = {
    contractId,
    userId,
    fileBaseName,
    createdAt: new Date().toISOString(),
    savedFiles,
  };

  await writeFile(path.join(storageRoot, "metadata.json"), JSON.stringify(metadata, null, 2), "utf8");

  return NextResponse.json({
    ok: true,
    contractId,
    userId,
    fileBaseName,
    storageRoot,
    savedFiles,
  });
}
