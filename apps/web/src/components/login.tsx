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
        setFormError("Error connecting to the server.")
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
      setGoogleError(error instanceof Error ? error.message : "Failed to sign in with Google.")
      setGoogleLoading(false)
    }
  }

  return (
    <AuthShell
      title="Sign in"
      description="Sign in with your email and password or with Google. For a new account you need an invitation link"
      footer={
        <p className="text-pretty text-xs text-muted-foreground">
          By continuing you accept the terms and privacy policy
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
          {formLoading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <AuthOAuthDivider />

      <GoogleSignInButton
        onClick={handleGoogleSignIn}
        loading={googleLoading}
        label="Continue with Google"
        loadingLabel="Redirecting to Google…"
      />
      {googleError ? <p className="mt-3 text-center text-xs text-destructive">{googleError}</p> : null}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Do you have an invitation?{" "}
        <span className="text-foreground/80">Open the link you received.</span>{" "}
        <Link to="/" className="font-medium text-primary underline underline-offset-4">
          Home
        </Link>
      </p>
    </AuthShell>
  )
}
