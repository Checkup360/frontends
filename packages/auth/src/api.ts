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

export interface RegisterPayload {
  email: string
  password: string
  invite_token: string
}

export async function registerWithEmailPassword(
  payload: RegisterPayload,
  apiBaseUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${resolveApiBaseUrl(apiBaseUrl)}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const data = await response.json()
      return {
        success: false,
        error: data.detail || "Error al registrarse",
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: "Error al conectar con el servidor",
    }
  }
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
