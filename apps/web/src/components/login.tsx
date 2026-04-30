import {
  AuthRequestError,
  fetchGoogleAuthorizationUrl,
  getPostLoginRedirectUrl,
  loginWithPassword,
  resolveVitePublicApiBaseUrl,
  savePostLoginRedirectUrl,
} from "@workspace/auth/api"
import { Button } from "@workspace/ui/components/button"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { AuthOAuthDivider } from "./auth/auth-oauth-divider"
import { AuthShell } from "./auth/auth-shell"
import { EmailPasswordFields } from "./auth/email-password-fields"
import { formatAuthFormError } from "./auth/format-auth-detail"
import { GoogleSignInButton } from "./auth/google-sign-in-button"

type LoginProps = {
  googleAuthorizeUrl?: string
  apiBaseUrl?: string
}

export default function Login({ googleAuthorizeUrl, apiBaseUrl }: LoginProps) {
  const resolvedApi = apiBaseUrl ?? resolveVitePublicApiBaseUrl(import.meta.env)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState<string | null>(null)

  const postLoginRedirectUrl = getPostLoginRedirectUrl(new URL(window.location.href))

  useEffect(() => {
    savePostLoginRedirectUrl(postLoginRedirectUrl)
  }, [postLoginRedirectUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormLoading(true)
    savePostLoginRedirectUrl(postLoginRedirectUrl)
    try {
      await loginWithPassword(email, password, resolvedApi)
    } catch (err) {
      if (err instanceof AuthRequestError) {
        setFormError(formatAuthFormError(err.detail))
      } else {
        setFormError("Error al conectar con el servidor.")
      }
    } finally {
      setFormLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setGoogleError(null)
      setGoogleLoading(true)
      savePostLoginRedirectUrl(postLoginRedirectUrl)
      const payload =
        googleAuthorizeUrl ?
          { authorization_url: googleAuthorizeUrl }
        : await fetchGoogleAuthorizationUrl(resolvedApi)

      window.location.assign(payload.authorization_url)
    } catch (error) {
      setGoogleError(error instanceof Error ? error.message : "No se pudo iniciar sesión con Google.")
      setGoogleLoading(false)
    }
  }

  return (
    <AuthShell
      title="Iniciar sesión"
      description="Entrá con tu email y contraseña o con Google. Para una cuenta nueva necesitás un enlace de invitación."
      footer={
        <p className="text-pretty text-xs text-muted-foreground">
          Al continuar aceptás los términos y la política de privacidad del servicio.
        </p>
      }
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        {formError ? (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{formError}</div>
        ) : null}

        <EmailPasswordFields
          email={email}
          password={password}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          disabled={formLoading}
          passwordAutocomplete="current-password"
        />

        <Button type="submit" className="w-full" disabled={formLoading}>
          {formLoading ? "Entrando…" : "Iniciar sesión"}
        </Button>
      </form>

      <AuthOAuthDivider />

      <GoogleSignInButton
        onClick={handleGoogleSignIn}
        loading={googleLoading}
        label="Continuar con Google"
        loadingLabel="Redirigiendo a Google…"
      />
      {googleError ? <p className="mt-3 text-center text-xs text-destructive">{googleError}</p> : null}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Tenés invitación?{" "}
        <span className="text-foreground/80">Abrí el enlace que te enviaron.</span>{" "}
        <Link to="/" className="font-medium text-primary underline underline-offset-4">
          Inicio
        </Link>
      </p>
    </AuthShell>
  )
}
