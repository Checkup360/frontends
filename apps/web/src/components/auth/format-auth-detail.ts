
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
  LOGIN_BAD_CREDENTIALS: "Email o contraseña incorrectos.",
  LOGIN_USER_NOT_VERIFIED: "Tu cuenta aún no está verificada.",
}

const INVITE_MESSAGES: Record<string, string> = {
  no_invite: "Necesitás una invitación válida.",
  invalid_invite: "Esta invitación no es válida.",
  invite_used: "Esta invitación ya fue usada.",
  invite_expired: "Esta invitación expiró.",
  email_mismatch: "El email no coincide con el de la invitación.",
}

export function formatAuthFormError(detail: unknown): string {
  if (typeof detail === "string") {
    if (detail === "REGISTER_USER_ALREADY_EXISTS") {
      return "Ya existe una cuenta con ese email."
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
  return "No se pudo completar la operación."
}
