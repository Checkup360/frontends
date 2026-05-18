import { publicDevDefaults } from "../../../apps.config"
import {
  parseAuthMeResponse,
  parseOAuthAuthorizeResponse,
  parseInviteMetadataResponse,
  type AuthMeResponse,
  type OAuthAuthorizeResponse,
  type CreateSysadminInvitationPayload,
  type CreateOrgInvitationPayload,
  type InviteError,
  type InviteCreateResponse,
  type InviteMetadataResponse,
} from "./schemas"
import { apiRoutes } from "./routes"

const POST_LOGIN_REDIRECT_STORAGE_KEY = "auth.postLoginRedirectUrl"

function resolveUrl(configKey: string, defaultValue: string): string {
  if (typeof window !== "undefined" && (window as any).__CONFIG__?.[configKey]) {
    return ((window as any).__CONFIG__[configKey] as string).replace(/\/$/, "")
  }
  return defaultValue
}

function resolveApiBaseUrl(): string {
  return resolveUrl("apiOrigin", publicDevDefaults.apiOrigin)
}

export function resolveWebUrl(): string {
  return resolveUrl("webOrigin", publicDevDefaults.webOrigin)
}

export function resolveDashboardUrl(): string {
  return resolveUrl("dashboardOrigin", publicDevDefaults.dashboardOrigin)
}

export function resolveBackofficeUrl(): string {
  return resolveUrl("backofficeOrigin", publicDevDefaults.backofficeOrigin)
}

export function getRedirectUrlByUserRole(user: AuthMeResponse | null | undefined): string {
  if (!user) {
    return `${resolveWebUrl()}/`
  }

  if (user.requires_onboarding) {
    return `${resolveWebUrl()}/onboarding`
  }

  if (user.is_sysadmin) {
    return `${resolveBackofficeUrl()}/`
  }

  if (user.memberships?.some((m) => m.role === "admin")) {
    return `${resolveDashboardUrl()}/`
  }

  return `${resolveWebUrl()}/`
}

export function buildLoginUrl({ nextUrl }: { nextUrl: string }): string {
  const url = new URL("/login", resolveWebUrl())
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

async function fetchWithAuth(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init)
  if (res.status === 401) {
    document.cookie = "auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    window.dispatchEvent(new Event("auth-logout"))
  }
  return res
}

export async function fetchCurrentUser(): Promise<AuthMeResponse | null> {
  const response = await fetchWithAuth(`${resolveApiBaseUrl()}${apiRoutes.auth.me}`, {
    credentials: "include",
  })
  if (response.status === 401) return null
  if (!response.ok) return null
  return parseAuthMeResponse(await response.json())
}

export interface SubmitMemberDetailsError {
  code: string
  message: string
}

export async function submitMemberDetails(payload: {
  date_of_birth: string
}): Promise<{ success: true; error?: never } | { success?: never; error: SubmitMemberDetailsError }> {
  try {
    const response = await fetchWithAuth(`${resolveApiBaseUrl()}${apiRoutes.members.myDetails}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    })

    if (response.status === 401) {
      return {
        error: {
          code: "unauthorized",
          message: "Session expired. Please log in again.",
        },
      }
    }

    if (!response.ok) {
      return {
        error: {
          code: "invalid_date_of_birth",
          message:
            response.status === 403
              ? "This onboarding is only available for members."
              : "Enter a valid birth date that is not in the future.",
        },
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error submitting member details:", error)
    return {
      error: {
        code: "network_error",
        message: "Network error. Please try again.",
      },
    }
  }
}

export async function logout(): Promise<void> {
  const response = await fetchWithAuth(`${resolveApiBaseUrl()}${apiRoutes.auth.logout}`, {
    method: "POST",
    credentials: "include",
  })
  if (!response.ok) {
    throw new Error("Failed to close session")
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

export async function loginWithPassword(email: string, password: string): Promise<void> {
  const body = new URLSearchParams()
  body.set("username", email.trim())
  body.set("password", password)

  const response = await fetch(`${resolveApiBaseUrl()}${apiRoutes.auth.login}`, {
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

export async function fetchGoogleAuthorizationUrl(): Promise<OAuthAuthorizeResponse> {
  const response = await fetch(`${resolveApiBaseUrl()}${apiRoutes.auth.googleAuthorize}`, {
    credentials: "include",
  })
  if (!response.ok) {
    throw new Error("Failed to start login with Google")
  }

  const payload = parseOAuthAuthorizeResponse(await response.json())
  if (!payload) {
    throw new Error("Invalid response from server")
  }

  return payload
}

export interface InviteCreatePayload {
  email?: string
  expires_in_hours?: number
}

export interface CreateOrganizationPayload {
  name: string
  slug: string
}

export interface OrganizationResponse {
  id: string
  name: string
  slug: string
}

export async function createInvite(
  payload: InviteCreatePayload
): Promise<InviteCreateResponse | null> {
  try {
    const response = await fetchWithAuth(`${resolveApiBaseUrl()}${apiRoutes.invites.admin}`, {
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

    if (response.status === 401) return null
    if (!response.ok) {
      return null
    }

    return (await response.json()) as InviteCreateResponse
  } catch (error) {
    console.error("Error creating invite:", error)
    return null
  }
}

export interface CreateOrganizationError {
  code: string
  message: string
}

export async function createOrganization(
  payload: CreateOrganizationPayload
): Promise<{ success: OrganizationResponse; error?: never } | { success?: never; error: CreateOrganizationError }> {
  try {
    const response = await fetchWithAuth(`${resolveApiBaseUrl()}${apiRoutes.organizations}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    })

    if (response.status === 401) {
      return {
        error: {
          code: "unauthorized",
          message: "Session expired. Please log in again.",
        },
      }
    }
    if (!response.ok) {
      try {
        const data = (await response.json()) as { detail?: string }
        const detail = data.detail || "Unknown error"
        return {
          error: {
            code: detail,
            message: getOrganizationErrorMessage(detail),
          },
        }
      } catch {
        return {
          error: {
            code: "unknown_error",
            message: "Failed to create organization",
          },
        }
      }
    }

    return { success: (await response.json()) as OrganizationResponse }
  } catch (error) {
    console.error("Error creating organization:", error)
    return {
      error: {
        code: "network_error",
        message: "Network error. Please try again.",
      },
    }
  }
}

function getOrganizationErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    organization_slug_already_exists: "This URL identifier is already taken. Please choose another.",
    invalid_slug_format: "URL identifier can only contain lowercase letters, numbers, and hyphens.",
    slug_required: "URL identifier is required.",
    name_required: "Organization name is required.",
    unknown_error: "Failed to create organization. Please try again.",
    network_error: "Network error. Please try again.",
  }
  return messages[code] || "An error occurred. Please try again."
}

export async function listOrganizations(): Promise<OrganizationResponse[]> {
  try {
    const response = await fetchWithAuth(`${resolveApiBaseUrl()}${apiRoutes.organizations}`, {
      credentials: "include",
    })

    if (response.status === 401) return []
    if (!response.ok) {
      return []
    }

    return (await response.json()) as OrganizationResponse[]
  } catch (error) {
    console.error("Error listing organizations:", error)
    return []
  }
}

function getInvitationErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    organization_not_found: "Organization not found.",
    role_requires_organization: "Role requires an organization to be selected.",
    invalid_invite: "Invalid invitation link.",
    invite_used: "This invitation link has already been used.",
    invite_expired: "This invitation link has expired.",
    email_mismatch: "The email does not match the invitation.",
    unknown_error: "Failed to create invitation. Please try again.",
    network_error: "Network error. Please try again.",
  }
  return messages[code] || "An error occurred. Please try again."
}

export async function createSysadminInvitation(
  payload: CreateSysadminInvitationPayload
): Promise<{ success: InviteCreateResponse; error?: never } | { success?: never; error: InviteError }> {
  try {
    const response = await fetchWithAuth(`${resolveApiBaseUrl()}${apiRoutes.invites.admin}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    })

    if (response.status === 401) {
      return {
        error: {
          code: "unauthorized",
          message: getInvitationErrorMessage("unknown_error"),
        },
      }
    }

    if (!response.ok) {
      try {
        const data = (await response.json()) as { detail?: string }
        const detail = data.detail || "Unknown error"
        return {
          error: {
            code: detail,
            message: getInvitationErrorMessage(detail),
          },
        }
      } catch {
        return {
          error: {
            code: "unknown_error",
            message: getInvitationErrorMessage("unknown_error"),
          },
        }
      }
    }

    return { success: (await response.json()) as InviteCreateResponse }
  } catch (error) {
    console.error("Error creating sysadmin invitation:", error)
    return {
      error: {
        code: "network_error",
        message: getInvitationErrorMessage("network_error"),
      },
    }
  }
}

export async function createOrgInvitation(
  payload: CreateOrgInvitationPayload
): Promise<{ success: InviteCreateResponse; error?: never } | { success?: never; error: InviteError }> {
  try {
    const response = await fetchWithAuth(`${resolveApiBaseUrl()}${apiRoutes.invites.organization}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    })

    if (response.status === 401) {
      return {
        error: {
          code: "unauthorized",
          message: getInvitationErrorMessage("unknown_error"),
        },
      }
    }

    if (!response.ok) {
      try {
        const data = (await response.json()) as { detail?: string }
        const detail = data.detail || "Unknown error"
        return {
          error: {
            code: detail,
            message: getInvitationErrorMessage(detail),
          },
        }
      } catch {
        return {
          error: {
            code: "unknown_error",
            message: getInvitationErrorMessage("unknown_error"),
          },
        }
      }
    }

    return { success: (await response.json()) as InviteCreateResponse }
  } catch (error) {
    console.error("Error creating organization invitation:", error)
    return {
      error: {
        code: "network_error",
        message: getInvitationErrorMessage("network_error"),
      },
    }
  }
}

export async function startInviteGoogleSession(token: string): Promise<Response> {
  return fetchWithAuth(`${resolveApiBaseUrl()}${apiRoutes.invites.googleSession(token)}`, {
    method: "POST",
    credentials: "include",
  })
}

export async function getInviteMetadata(
  token: string
): Promise<InviteMetadataResponse | null> {
  try {
    const response = await fetch(`${resolveApiBaseUrl()}${apiRoutes.invites.metadata(token)}`, {
      credentials: "include",
    })
    if (!response.ok) return null
    return parseInviteMetadataResponse(await response.json())
  } catch {
    return null
  }
}

export async function redeemInvite(
  token: string,
  payload: { email: string; password: string }
): Promise<Response> {
  return fetch(`${resolveApiBaseUrl()}${apiRoutes.invites.redeem(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    redirect: "manual",
    body: JSON.stringify(payload),
  })
}
