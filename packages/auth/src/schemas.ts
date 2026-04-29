export type AuthMeResponse = {
  email: string
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

  return { email: maybeEmail }
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
