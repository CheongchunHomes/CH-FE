const DEFAULT_BACKEND_IMAGE_BASE_URL = "";

function getBackendImageBaseUrl() {
  const configuredBaseUrl = (
    process.env.NEXT_PUBLIC_BACKEND_IMAGE_BASE_URL ??
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    DEFAULT_BACKEND_IMAGE_BASE_URL
  ).trim();

  if (configuredBaseUrl.startsWith("/")) {
    return configuredBaseUrl.replace(/\/+$/, "");
  }

  if (!/^https?:\/\//i.test(configuredBaseUrl)) {
    return DEFAULT_BACKEND_IMAGE_BASE_URL;
  }

  return configuredBaseUrl.replace(/\/+$/, "");
}

export function resolveMapImageUrl(url?: string | null) {
  const trimmedUrl = url?.trim();

  if (!trimmedUrl) {
    return null;
  }

  if (
    /^https?:\/\//i.test(trimmedUrl) ||
    trimmedUrl.startsWith("data:") ||
    trimmedUrl.startsWith("blob:")
  ) {
    return trimmedUrl;
  }

  const backendBaseUrl = getBackendImageBaseUrl();

  if (!backendBaseUrl) {
    return trimmedUrl;
  }

  if (backendBaseUrl === "/api" && trimmedUrl.startsWith("/api/")) {
    return trimmedUrl;
  }

  if (trimmedUrl.startsWith("/")) {
    return `${backendBaseUrl}${trimmedUrl}`;
  }

  return `${backendBaseUrl}/${trimmedUrl}`;
}
