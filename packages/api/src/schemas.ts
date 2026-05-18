export type OrganizationMembership = {
  organization_id: string
  organization_name: string
  role: string
}

export type AuthMeResponse = {
  email: string
  is_sysadmin: boolean
  memberships: OrganizationMembership[]
  requires_onboarding: boolean
}

export type OAuthAuthorizeResponse = {
  authorization_url: string
}

export type InviteCreateResponse = {
  token: string
  invite_url: string
}

export type OrgRole = "admin" | "member"

export interface CreateSysadminInvitationPayload {
  email?: string
  expires_in_hours?: number
  is_sysadmin: true
}

export interface CreateOrgInvitationPayload {
  organization_id: string
  role: OrgRole
  email?: string
  max_uses?: number
  expires_in_hours?: number
}

export interface InviteError {
  code: string
  message: string
}

export function parseAuthMeResponse(payload: unknown): AuthMeResponse | null {
  if (!payload || typeof payload !== "object") return null

  const maybeEmail = (payload as { email?: unknown }).email
  if (typeof maybeEmail !== "string" || maybeEmail.length === 0) return null

  const maybeIsSysadmin = (payload as { is_sysadmin?: unknown }).is_sysadmin
  if (typeof maybeIsSysadmin !== "boolean") return null

  const maybeMemberships = (payload as { memberships?: unknown }).memberships
  if (!Array.isArray(maybeMemberships)) return null

  const maybeRequiresOnboarding = (payload as { requires_onboarding?: unknown })
    .requires_onboarding
  if (typeof maybeRequiresOnboarding !== "boolean") return null

  const memberships = maybeMemberships.map((m) => ({
    organization_id: (m as { organization_id?: unknown }).organization_id as string,
    organization_name: (m as { organization_name?: unknown }).organization_name as string,
    role: (m as { role?: unknown }).role as string,
  }))

  return {
    email: maybeEmail,
    is_sysadmin: maybeIsSysadmin,
    memberships,
    requires_onboarding: maybeRequiresOnboarding,
  }
}

export function parseOAuthAuthorizeResponse(payload: unknown): OAuthAuthorizeResponse | null {
  if (!payload || typeof payload !== "object") return null

  const maybeUrl = (payload as { authorization_url?: unknown }).authorization_url
  if (typeof maybeUrl !== "string" || maybeUrl.length === 0) return null

  return { authorization_url: maybeUrl }
}

export type InviteMetadataResponse = {
  organization_id: string | null
  organization_name: string | null
  role: string | null
  is_sysadmin: boolean
}

export type RedeemResponse = {
  ok: boolean
}

export function parseInviteCreateResponse(payload: unknown): InviteCreateResponse | null {
  if (!payload || typeof payload !== "object") return null

  const maybeToken = (payload as { token?: unknown }).token
  const maybeUrl = (payload as { invite_url?: unknown }).invite_url

  if (typeof maybeToken !== "string" || typeof maybeUrl !== "string") return null

  return { token: maybeToken, invite_url: maybeUrl }
}

export function parseInviteMetadataResponse(payload: unknown): InviteMetadataResponse | null {
  if (!payload || typeof payload !== "object") return null
  const o = payload as Record<string, unknown>
  if (typeof o.organization_id !== "string" && o.organization_id !== null) return null
  if (typeof o.organization_name !== "string" && o.organization_name !== null) return null
  if (typeof o.role !== "string" && o.role !== null) return null
  if (typeof o.is_sysadmin !== "boolean") return null
  return {
    organization_id: o.organization_id as string | null,
    organization_name: o.organization_name as string | null,
    role: o.role as string | null,
    is_sysadmin: o.is_sysadmin as boolean,
  }
}

export function parseRedeemResponse(payload: unknown): RedeemResponse | null {
  if (!payload || typeof payload !== "object") return null
  const o = payload as Record<string, unknown>
  if (typeof o.ok !== "boolean") return null
  return { ok: o.ok }
}
