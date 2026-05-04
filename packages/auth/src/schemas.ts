export type OrganizationMembership = {
  organization_id: string
  organization_name: string
  role: string
}

export type AuthMeResponse = {
  email: string
  is_sysadmin: boolean
  memberships: OrganizationMembership[]
}

export type OAuthAuthorizeResponse = {
  authorization_url: string
}

export type InviteCreateResponse = {
  token: string
  invite_url: string
}

export function parseAuthMeResponse(payload: unknown): AuthMeResponse | null {
  if (!payload || typeof payload !== "object") return null

  const maybeEmail = (payload as { email?: unknown }).email
  if (typeof maybeEmail !== "string" || maybeEmail.length === 0) return null

  const maybeIsSysadmin = (payload as { is_sysadmin?: unknown }).is_sysadmin
  if (typeof maybeIsSysadmin !== "boolean") return null

  const maybeMemberships = (payload as { memberships?: unknown }).memberships
  if (!Array.isArray(maybeMemberships)) return null

  const memberships = maybeMemberships.map((m) => ({
    organization_id: (m as { organization_id?: unknown }).organization_id as string,
    organization_name: (m as { organization_name?: unknown }).organization_name as string,
    role: (m as { role?: unknown }).role as string,
  }))

  return {
    email: maybeEmail,
    is_sysadmin: maybeIsSysadmin,
    memberships,
  }
}

export function parseOAuthAuthorizeResponse(
  payload: unknown
): OAuthAuthorizeResponse | null {
  if (!payload || typeof payload !== "object") return null

  const maybeUrl = (payload as { authorization_url?: unknown }).authorization_url
  if (typeof maybeUrl !== "string" || maybeUrl.length === 0) return null

  return { authorization_url: maybeUrl }
}

export function parseInviteCreateResponse(payload: unknown): InviteCreateResponse | null {
  if (!payload || typeof payload !== "object") return null

  const maybeToken = (payload as { token?: unknown }).token
  const maybeUrl = (payload as { invite_url?: unknown }).invite_url

  if (typeof maybeToken !== "string" || typeof maybeUrl !== "string") return null

  return { token: maybeToken, invite_url: maybeUrl }
}
