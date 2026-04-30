import {
  fetchGoogleAuthorizationUrl,
  resolveVitePublicApiBaseUrl,
  tryFollowAuthRedirectResponse,
} from "@workspace/auth/api"
import { Button } from "@workspace/ui/components/button"
import { useCallback, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { AuthOAuthDivider } from "./auth/auth-oauth-divider"
import { AuthShell } from "./auth/auth-shell"
import { EmailPasswordFields } from "./auth/email-password-fields"
import { formatAuthFormError, reasonFromFastApiDetail } from "./auth/format-auth-detail"
import { readFastApiErrorDetail } from "./auth/read-fastapi-detail"
import { GoogleSignInButton } from "./auth/google-sign-in-button"

export default function Invite() {
  const { token = "" } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const apiBaseUrl = resolveVitePublicApiBaseUrl(import.meta.env)

  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState<string | null>(null)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [registerError, setRegisterError] = useState("")
  const [registerLoading, setRegisterLoading] = useState(false)

  const goToError = useCallback(
    (reason: string) => {
      navigate(`/auth/error?reason=${encodeURIComponent(reason)}`, { replace: true })
    },
    [navigate],
  )

  const startGoogle = async () => {
    if (!token) {
      goToError("invalid_token")
      return
    }
    setGoogleError(null)
    setGoogleLoading(true)
    try {
      const pending = await fetch(
        `${apiBaseUrl}/invites/${encodeURIComponent(token)}/google-session`,
        {
          method: "POST",
          credentials: "include",
        },
      )
      if (!pending.ok) {
        const detail = await readFastApiErrorDetail(pending)
        goToError(reasonFromFastApiDetail(detail))
        return
      }

      const payload = await fetchGoogleAuthorizationUrl(apiBaseUrl)
      window.location.assign(payload.authorization_url)
    } catch (e) {
      setGoogleError(
        e instanceof Error ? e.message : "No se pudo iniciar el registro con Google.",
      )
    } finally {
      setGoogleLoading(false)
    }
  }

  const handlePasswordRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      goToError("invalid_token")
      return
    }
    setRegisterLoading(true)
    setRegisterError("")
    try {
      const response = await fetch(
        `${apiBaseUrl}/invites/${encodeURIComponent(token)}/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          redirect: "manual",
          body: JSON.stringify({ email, password }),
        },
      )

      if (tryFollowAuthRedirectResponse(response)) {
        return
      }

      if (!response.ok) {
        const detail = await readFastApiErrorDetail(response)
        setRegisterError(formatAuthFormError(detail))
        return
      }
    } catch (err) {
      setRegisterError("Error al conectar con el servidor")
      console.error(err)
    } finally {
      setRegisterLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <p className="text-center text-sm text-muted-foreground">Invitación inválida.</p>
      </div>
    )
  }

  return (
    <AuthShell
      title="Crear cuenta"
      description="Completá los datos y tocá Crear cuenta, o continuá con Google."
      footer={
        <p className="text-pretty text-xs text-muted-foreground">
          Al registrarte aceptás los términos y la política de privacidad del servicio.
        </p>
      }
    >
      <form onSubmit={(e) => void handlePasswordRegister(e)} className="space-y-4">
        {registerError ? (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{registerError}</div>
        ) : null}

        <EmailPasswordFields
          email={email}
          password={password}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          disabled={registerLoading}
          emailId="invite-email"
          passwordId="invite-password"
          passwordAutocomplete="new-password"
        />

        <Button type="submit" className="w-full" disabled={registerLoading || googleLoading}>
          {registerLoading ? "Creando cuenta…" : "Crear cuenta"}
        </Button>
      </form>

      <AuthOAuthDivider />

      <GoogleSignInButton
        onClick={startGoogle}
        loading={googleLoading}
        label="Continuar con Google"
        loadingLabel="Redirigiendo a Google…"
        disabled={registerLoading}
      />
      {googleError ? (
        <p className="mt-3 text-center text-xs text-destructive">{googleError}</p>
      ) : null}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Ya tenés cuenta?{" "}
        <Link to="/login" className="font-medium text-primary underline underline-offset-4">
          Iniciar sesión
        </Link>
      </p>
    </AuthShell>
  )
}
