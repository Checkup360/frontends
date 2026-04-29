import {
  parseAuthMeResponse,
  parseOAuthAuthorizeResponse,
  type AuthMeResponse,
  type OAuthAuthorizeResponse,
} from "@workspace/auth/schemas"

const DEFAULT_API_BASE_URL = "http://localhost:8000"
const DEFAULT_WEB_BASE_URL = "http://localhost:5173"
const POST_LOGIN_REDIRECT_STORAGE_KEY = "auth.postLoginRedirectUrl"

export function resolveApiBaseUrl(apiBaseUrl?: string): string {
  const raw = apiBaseUrl?.trim() || DEFAULT_API_BASE_URL
  return raw.replace(/\/$/, "")
}

export function resolveWebBaseUrl(webBaseUrl?: string): string {
  const raw = webBaseUrl?.trim() || DEFAULT_WEB_BASE_URL
  return raw.replace(/\/$/, "")
}

export function buildLoginUrl({
  webBaseUrl,
  nextUrl,
}: {
  webBaseUrl?: string
  nextUrl: string
}): string {
  const url = new URL("/login", resolveWebBaseUrl(webBaseUrl))
  url.searchParams.set("next", nextUrl)
  return url.toString()
}

export function getPostLoginRedirectUrl(currentUrl: URL): string {
  const next = currentUrl.searchParams.get("next")
  if (!next) return `${currentUrl.origin}/`

  try {
    return new URL(next, currentUrl.origin).toString()
  } catch {
    return `${currentUrl.origin}/`
  }
}

export function savePostLoginRedirectUrl(redirectUrl: string): void {
  window.sessionStorage.setItem(POST_LOGIN_REDIRECT_STORAGE_KEY, redirectUrl)
  window.localStorage.setItem(POST_LOGIN_REDIRECT_STORAGE_KEY, redirectUrl)
}

export function readPostLoginRedirectUrl(fallbackUrl: string): string {
  return (
    window.sessionStorage.getItem(POST_LOGIN_REDIRECT_STORAGE_KEY) ||
    window.localStorage.getItem(POST_LOGIN_REDIRECT_STORAGE_KEY) ||
    fallbackUrl
  )
}

export function clearPostLoginRedirectUrl(): void {
  window.sessionStorage.removeItem(POST_LOGIN_REDIRECT_STORAGE_KEY)
  window.localStorage.removeItem(POST_LOGIN_REDIRECT_STORAGE_KEY)
}

export function consumePostLoginRedirectUrl(fallbackUrl: string): string {
  const url = readPostLoginRedirectUrl(fallbackUrl)
  clearPostLoginRedirectUrl()
  return url
}

export async function fetchCurrentUser(
  apiBaseUrl?: string
): Promise<AuthMeResponse | null> {
  const response = await fetch(`${resolveApiBaseUrl(apiBaseUrl)}/auth/me`, {
    credentials: "include",
  })
  if (!response.ok) return null

  return parseAuthMeResponse(await response.json())
}

export async function logout(apiBaseUrl?: string): Promise<void> {
  const response = await fetch(`${resolveApiBaseUrl(apiBaseUrl)}/auth/logout`, {
    method: "POST",
    credentials: "include",
  })
  if (!response.ok) {
    throw new Error("No se pudo cerrar sesion")
  }
}

export async function fetchGoogleAuthorizationUrl(
  apiBaseUrl?: string
): Promise<OAuthAuthorizeResponse> {
  const response = await fetch(`${resolveApiBaseUrl(apiBaseUrl)}/auth/google/authorize`, {
    credentials: "include",
  })
  if (!response.ok) {
    throw new Error("No se pudo iniciar el login con Google")
  }

  const payload = parseOAuthAuthorizeResponse(await response.json())
  if (!payload) {
    throw new Error("Respuesta invalida del backend")
  }

  return payload
}
