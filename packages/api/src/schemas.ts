import { resolveMediaUrl } from "./config"

export type OrganizationMembership = {
  organization_id: string
  organization_name: string
  organization_logo_url?: string | null
  roles: string[]
}

export type AuthMeResponse = {
  email: string
  first_name?: string | null
  last_name?: string | null
  avatar_url?: string | null
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
  avatar_url?: string | null
  priority_topics?: string[]
}

export type InviteCreateResponse = {
  token: string
  invite_url: string
}

export type OrgRole = "superadmin" | "admin" | "member" | "content_manager"

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
  is_superadmin?: boolean
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

  const maybeFirstName = (payload as { first_name?: unknown }).first_name
  const first_name = typeof maybeFirstName === "string" ? maybeFirstName : null

  const maybeLastName = (payload as { last_name?: unknown }).last_name
  const last_name = typeof maybeLastName === "string" ? maybeLastName : null

  const maybeAvatarUrl = (payload as { avatar_url?: unknown }).avatar_url
  const avatar_url =
    typeof maybeAvatarUrl === "string" ? resolveMediaUrl(maybeAvatarUrl) : null

  const maybeIsSysadmin = (payload as { is_sysadmin?: unknown }).is_sysadmin
  if (typeof maybeIsSysadmin !== "boolean") return null

  const maybeRequiresOnboarding = (payload as { requires_onboarding?: unknown })
    .requires_onboarding
  if (typeof maybeRequiresOnboarding !== "boolean") return null

  const maybeMembership = (payload as { membership?: unknown }).membership
  let membership: OrganizationMembership | null = null

  if (maybeMembership !== null && typeof maybeMembership === "object") {
    const rawLogo = (maybeMembership as { organization_logo_url?: unknown })
      .organization_logo_url
    membership = {
      organization_id: (maybeMembership as { organization_id?: unknown })
        .organization_id as string,
      organization_name: (maybeMembership as { organization_name?: unknown })
        .organization_name as string,
      organization_logo_url:
        typeof rawLogo === "string" ? resolveMediaUrl(rawLogo) : null,
      roles: (maybeMembership as { roles?: unknown }).roles as string[],
    }
  }

  return {
    email: maybeEmail,
    first_name,
    last_name,
    avatar_url,
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
  attention_flags: Record<string, boolean>
  evaluated_at?: string | null
}

export type AssessmentSessionResponse = {
  id: string
  evaluated_at: string
  overall_score?: number | null
  overall_risk_level?: string | null
  results: AssessmentResultResponse[]
}

export type AssessmentsResponse = {
  overall_score?: number | null
  overall_risk_level?: string | null
  total_sessions?: number
  page?: number
  limit?: number
  sessions?: AssessmentSessionResponse[]
  results: AssessmentResultResponse[]
}

export type AssessmentSubmissionSummary = {
  id: string
  form_type: string
  form_version: string
  status: string
  submitted_at: string
}

export type AssessmentSubmissionListResponse = {
  items: AssessmentSubmissionSummary[]
  page: number
  limit: number
  total: number
  has_next: boolean
}

export type AssessmentSubmissionDetail = AssessmentSubmissionSummary & {
  answers: Record<string, unknown>
  scores: AssessmentResultResponse[]
}

export type MemberFormResponse = {
  form_type: string
  data: Record<string, unknown>
}

export type EvaluatedScoreSummary = {
  score_name: string
  risk_level: string | null
  raw_value: number | null
  explanation: string | null
}

export type MemberFormSubmissionResponse = {
  form_type: string
  status: string
  updated_fields: string[]
  recalculated_scores: EvaluatedScoreSummary[]
}

export type RiskTrendPoint = {
  period: string
  month_label: string
  average_score: number | null
  risk_index: number | null
  total_assessments: number
  scores_by_study?: Record<string, number>
}

export type DepartmentAnalyticsSummary = {
  department_id: string
  name: string
  average_score: number | null
  total_workers: number
  high_risk_count: number
}

export interface SysadminUser {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  is_active: boolean
}

export interface SysadminStats {
  total_sysadmins: number
  active_sysadmins: number
  pending_invites: number
}

export type MemberRiskPriorities = {
  user_id: string
  risk_weights: Record<string, number>
  highest_risk: string | null
}

export type ConsentType =
  | "TERMS_AND_CONDITIONS"
  | "PRIVACY_POLICY"
  | "HEALTH_DATA_PROCESSING_CONSENT"
  | "FORM_CONSENT"

export interface UserConsent {
  id: string
  user_id: string
  consent_type: ConsentType
  form_type: string | null
  document_version: string
  accepted_at: string
  revoked_at: string | null
  document_id?: string | null
  document_hash?: string | null
}

export interface AcceptConsentPayload {
  consent_type: ConsentType
  form_type?: string
  document_version?: string
  ip_address?: string
  user_agent?: string
}

export interface ActiveConsentsResponse {
  terms_and_conditions: UserConsent | null
  privacy_policy: UserConsent | null
  health_data_processing: UserConsent | null
  form_consents: Record<string, UserConsent>
}

export interface ExportedProfile {
  email: string
  first_name: string | null
  last_name: string | null
  phone_number: string | null
  date_of_birth: string | null
  avatar_url: string | null
  organization: string | null
  roles: string[]
}

export interface ExportedConsent {
  type: string
  version: string | null
  accepted_at: string
  revoked_at: string | null
  status: string
}

export interface ExportedSubmission {
  form_type: string
  form_name: string
  form_version: string
  status: string
  submitted_at: string | null
  answers: Record<string, unknown>
}

export interface ExportedEvaluation {
  indicator: string
  risk_level: string | null
  evaluated_at: string | null
}

export interface MemberDataExport {
  profile: ExportedProfile
  consents: ExportedConsent[]
  health_measurements: Record<string, unknown>
  assessment_history: ExportedSubmission[]
  health_evaluations: ExportedEvaluation[]
  exported_at: string
  compliance_notice: string
}




