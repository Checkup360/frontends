const DEFAULT_API_BASE_URL = "http://localhost:8000"

export function resolveApiBaseUrl(envApiUrl?: string): string {
  const baseUrl = envApiUrl?.trim() || DEFAULT_API_BASE_URL
  return baseUrl.replace(/\/$/, "")
}

export function resolvePostLoginRedirectUrl(currentUrl: URL): string {
  const next = currentUrl.searchParams.get("next")
  if (next && next.startsWith("/")) {
    return `${currentUrl.origin}${next}`
  }
  return `${currentUrl.origin}/`
}

export function buildGoogleAuthorizeUrl(
  apiBaseUrl: string,
  _postLoginRedirectUrl: string
): string {
  return `${apiBaseUrl}/auth/google/authorize`
}
