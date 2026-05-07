
export function reasonFromFastApiDetail(detail: unknown): string {
  if (typeof detail === "string") {
    return detail
  }
  if (detail && typeof detail === "object" && "code" in detail) {
    const c = (detail as { code?: unknown }).code
    if (typeof c === "string") {
      return c
    }
  }
  return "invalid_invite"
}

const LOGIN_MESSAGES: Record<string, string> = {
  LOGIN_BAD_CREDENTIALS: "Email or password are incorrect.",
  LOGIN_USER_NOT_VERIFIED: "Your account is not verified yet.",
}

const INVITE_MESSAGES: Record<string, string> = {
  no_invite: "You need a valid invitation.",
  invalid_invite: "This invitation is not valid.",
  invite_used: "This invitation has already been used.",
  invite_expired: "This invitation has expired.",
  email_mismatch: "The email does not match the invitation.",
}

export function formatAuthFormError(detail: unknown): string {
  if (typeof detail === "string") {
    if (detail === "REGISTER_USER_ALREADY_EXISTS") {
      return "An account with that email already exists."
    }
    if (LOGIN_MESSAGES[detail]) {
      return LOGIN_MESSAGES[detail]
    }
    if (INVITE_MESSAGES[detail]) {
      return INVITE_MESSAGES[detail]
    }
    return detail
  }
  if (detail && typeof detail === "object" && "code" in detail) {
    const o = detail as { code?: string; reason?: string }
    if (o.code === "REGISTER_INVALID_PASSWORD" && typeof o.reason === "string") {
      return o.reason
    }
    if (typeof o.code === "string") {
      return (
        LOGIN_MESSAGES[o.code] ?? INVITE_MESSAGES[o.code] ?? o.code
      )
    }
  }
  return "Failed to complete the operation."
}
