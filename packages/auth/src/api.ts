import {
  parseAuthMeResponse,
  parseOAuthAuthorizeResponse,
  type AuthMeResponse,
  type OAuthAuthorizeResponse,
} from "@workspace/auth/schemas"
import { publicDevDefaults } from "../../../apps.config"

const DEFAULT_API_BASE_URL = publicDevDefaults.apiOrigin
const DEFAULT_WEB_BASE_URL = publicDevDefaults.webOrigin
const POST_LOGIN_REDIRECT_STORAGE_KEY = "auth.postLoginRedirectUrl"

export function resolveApiBaseUrl(apiBaseUrl?: string): string {
  const raw = apiBaseUrl?.trim() || DEFAULT_API_BASE_URL
  return raw.replace(/\/$/, "")
}

/** Reads `VITE_PUBLIC_API_ORIGIN`, then legacy `VITE_API_URL`, then dev default. */
export function resolveVitePublicApiBaseUrl(env: Record<string, unknown>): string {
  const raw =
    typeof env.VITE_PUBLIC_API_ORIGIN === "string"
      ? env.VITE_PUBLIC_API_ORIGIN
      : typeof env.VITE_API_URL === "string"
        ? env.VITE_API_URL
        : undefined
  return resolveApiBaseUrl(raw)
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


export class AuthRequestError extends Error {
  readonly detail: unknown

  constructor(detail: unknown) {
    super("AuthRequestError")
    this.name = "AuthRequestError"
    this.detail = detail
  }
}


export function tryFollowAuthRedirectResponse(response: Response): boolean {
  const fallback = `${window.location.origin}/login/complete`

  if (response.type === "opaqueredirect") {
    window.location.assign(fallback)
    return true
  }

  if (response.status !== 301 && response.status !== 302 && response.status !== 303) {
    return false
  }

  const raw = response.headers.get("Location")?.trim()
  if (!raw) {
    window.location.assign(fallback)
    return true
  }
  try {
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      window.location.assign(raw)
    } else if (raw.startsWith("/")) {
      window.location.assign(new URL(raw, window.location.origin).toString())
    } else {
      window.location.assign(fallback)
    }
  } catch {
    window.location.assign(fallback)
  }
  return true
}


export async function loginWithPassword(
  email: string,
  password: string,
  apiBaseUrl?: string
): Promise<void> {
  const base = resolveApiBaseUrl(apiBaseUrl)
  const body = new URLSearchParams()
  body.set("username", email.trim())
  body.set("password", password)

  const response = await fetch(`${base}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    redirect: "manual",
    body: body.toString(),
  })

  if (tryFollowAuthRedirectResponse(response)) {
    return
  }

  const text = await response.text()
  const trimmed = text.trim()
  let detail: unknown = response.statusText
  if (trimmed) {
    try {
      const json = JSON.parse(trimmed) as { detail?: unknown }
      detail = json.detail ?? json
    } catch {
      detail = trimmed
    }
  }
  throw new AuthRequestError(detail)
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

export interface InviteCreatePayload {
  email?: string
  expires_in_hours?: number
}

export interface InviteCreateResponse {
  token: string
  invite_url: string
}

export async function createInvite(
  payload: InviteCreatePayload,
  apiBaseUrl?: string
): Promise<InviteCreateResponse | null> {
  try {
    const response = await fetch(`${resolveApiBaseUrl(apiBaseUrl)}/admin/invites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        email: payload.email || null,
        expires_in_hours: payload.expires_in_hours || 24,
      }),
    })

    if (!response.ok) {
      return null
    }

    return (await response.json()) as InviteCreateResponse
  } catch (error) {
    console.error("Error creating invite:", error)
    return null
  }
}
