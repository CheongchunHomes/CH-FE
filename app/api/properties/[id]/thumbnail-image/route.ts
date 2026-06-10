import { NextResponse } from "next/server";
import { buildBackendUrl, fetchBackend } from "@/lib/api/server";

export const dynamic = "force-dynamic";

const PROPERTY_ID_PATTERN = /^\d+$/;

function isValidPropertyId(propertyId: string) {
  return PROPERTY_ID_PATTERN.test(propertyId);
}

function getThumbnailUrl(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const thumbnailUrl = (payload as { thumbnailUrl?: unknown }).thumbnailUrl;

  if (typeof thumbnailUrl !== "string") {
    return null;
  }

  const trimmed = thumbnailUrl.trim();

  return trimmed ? trimmed : null;
}

async function relayImage(url: string) {
  const response = await fetch(url, { cache: "no-store" }).catch(() => null);

  if (!response || !response.ok) {
    return null;
  }

  const contentType = response.headers.get("content-type");

  if (!contentType) {
    return null;
  }

  const body = await response.arrayBuffer().catch(() => null);

  if (!body) {
    return null;
  }

  return new Response(body, {
    status: 200,
    headers: {
      "content-type": contentType,
    },
  });
}

function tryBuildBackendImageUrl(thumbnailUrl: string) {
  try {
    return buildBackendUrl(thumbnailUrl);
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!isValidPropertyId(id)) {
    return new NextResponse(null, { status: 404 });
  }

  const metadataResponse = await fetchBackend(`/properties/${id}/thumbnail`, {
    method: "GET",
  }).catch(() => null);

  if (!metadataResponse || !metadataResponse.ok) {
    return new NextResponse(null, { status: 404 });
  }

  const thumbnailUrl = getThumbnailUrl(await metadataResponse.json().catch(() => null));

  if (!thumbnailUrl) {
    return new NextResponse(null, { status: 404 });
  }

  if (thumbnailUrl.startsWith("https://")) {
    return NextResponse.redirect(thumbnailUrl);
  }

  if (thumbnailUrl.startsWith("/")) {
    const backendImageUrl = tryBuildBackendImageUrl(thumbnailUrl);

    if (!backendImageUrl) {
      return new NextResponse(null, { status: 404 });
    }

    const relayed = await relayImage(backendImageUrl);

    if (relayed) {
      return relayed;
    }

    return new NextResponse(null, { status: 404 });
  }

  if (thumbnailUrl.startsWith("http://")) {
    const relayed = await relayImage(thumbnailUrl);

    if (relayed) {
      return relayed;
    }

    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(null, { status: 404 });
}
