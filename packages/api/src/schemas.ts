export type OrganizationMembership = {
  organization_id: string
  organization_name: string
  roles: string[]
}

export type AuthMeResponse = {
  email: string
  is_sysadmin: boolean
  membership: OrganizationMembership | null
  requires_onboarding: boolean
}

export type OAuthAuthorizeResponse = {
  authorization_url: string
}

export type MemberProfileResponse = {
  first_name: string
  last_name: string
  phone_number: string | null
  date_of_birth: string
  priority_topics?: string[]
}

export type InviteCreateResponse = {
  token: string
  invite_url: string
}

export type OrgRole = "admin" | "member"

export type OrganizationInvite = {
  id: string
  token: string
  email: string | null
  role: string | null
  organization_id: string | null
  organization_name: string | null
  department_id: string | null
  department_name: string | null
  max_uses: number
  uses: number
  expires_at: string
  invite_url: string
}

export type SysadminInvite = {
  id: string
  token: string
  email: string | null
  max_uses: number
  uses: number
  expires_at: string
  invite_url: string
}


export interface CreateSysadminInvitationPayload {
  email?: string
  expires_in_hours?: number
  is_sysadmin: true
}

export interface CreateOrgInvitationPayload {
  organization_id?: string
  department_id?: string
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

  const maybeRequiresOnboarding = (payload as { requires_onboarding?: unknown })
    .requires_onboarding
  if (typeof maybeRequiresOnboarding !== "boolean") return null

  const maybeMembership = (payload as { membership?: unknown }).membership
  let membership: OrganizationMembership | null = null

  if (maybeMembership !== null && typeof maybeMembership === "object") {
    membership = {
      organization_id: (maybeMembership as { organization_id?: unknown })
        .organization_id as string,
      organization_name: (maybeMembership as { organization_name?: unknown })
        .organization_name as string,
      roles: (maybeMembership as { roles?: unknown }).roles as string[],
    }
  }

  return {
    email: maybeEmail,
    is_sysadmin: maybeIsSysadmin,
    membership,
    requires_onboarding: maybeRequiresOnboarding,
  }
}

export function parseOAuthAuthorizeResponse(
  payload: unknown
): OAuthAuthorizeResponse | null {
  if (!payload || typeof payload !== "object") return null

  const maybeUrl = (payload as { authorization_url?: unknown })
    .authorization_url
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

export function parseInviteCreateResponse(
  payload: unknown
): InviteCreateResponse | null {
  if (!payload || typeof payload !== "object") return null

  const maybeToken = (payload as { token?: unknown }).token
  const maybeUrl = (payload as { invite_url?: unknown }).invite_url

  if (typeof maybeToken !== "string" || typeof maybeUrl !== "string")
    return null

  return { token: maybeToken, invite_url: maybeUrl }
}

export function parseInviteMetadataResponse(
  payload: unknown
): InviteMetadataResponse | null {
  if (!payload || typeof payload !== "object") return null
  const o = payload as Record<string, unknown>
  if (typeof o.organization_id !== "string" && o.organization_id !== null)
    return null
  if (typeof o.organization_name !== "string" && o.organization_name !== null)
    return null
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

export type AssessmentResultResponse = {
  score_id: string
  score_name: string
  risk_level: string | null
  raw_value: number | null
  normalized_value: number | null
  explanation: string | null
  contributing_factors: Record<string, unknown>
}

export type AssessmentsResponse = {
  results: AssessmentResultResponse[]
}

export type ClinicalAssessmentRequest = {
  age?: number
  height?: number
  weight?: number
  waist_circumference?: number
  neck_circumference?: number
  sex?: string
  snoring?: boolean
  tired?: boolean
  observed_apnea?: boolean
  hypertension_medication?: boolean
  daily_physical_activity?: boolean
  fruits_vegetables?: boolean
  previous_high_glucose?: boolean
  family_diabetes?: string
}
