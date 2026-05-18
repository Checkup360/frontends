import {
  fetchGoogleAuthorizationUrl,
  getRedirectUrlByUserRole,
  tryFollowAuthRedirectResponse,
  startInviteGoogleSession,
  getInviteMetadata,
  redeemInvite,
  type InviteMetadataResponse,
} from "@workspace/api"
import { Button } from "@workspace/ui/components/button"
import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { AuthOAuthDivider } from "./auth-oauth-divider"
import { AuthShell } from "./auth-shell"
import { EmailPasswordFields } from "./email-password-fields"
import {
  formatAuthFormError,
} from "./format-auth-detail"
import { readFastApiErrorDetail } from "./read-fastapi-detail"
import { GoogleSignInButton } from "./google-sign-in-button"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"

export default function Invite() {
  const { token = "" } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { user, isLoading: authLoading, refresh } = useCurrentUser()
  const userRef = useRef(user)
  useEffect(() => {
    userRef.current = user
  }, [user])

  const [metadata, setMetadata] = useState<InviteMetadataResponse | null>(null)
  const [metadataError, setMetadataError] = useState(false)
  const [navigating, setNavigating] = useState(false)

  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState<string | null>(null)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [formError, setFormError] = useState("")
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    if (!token) return
    getInviteMetadata(token).then((data) => {
      if (data) {
        setMetadata(data)
      } else {
        setMetadataError(true)
      }
    })
  }, [token])

  const goToError = useCallback(
    (reason: string) => {
      navigate(`/auth/error?reason=${encodeURIComponent(reason)}`, {
        replace: true,
      })
    },
    [navigate]
  )

  const redirectAfterAccept = useCallback(async () => {
    setNavigating(true)
    await refresh()
    const freshUser = userRef.current
    window.location.assign(getRedirectUrlByUserRole(freshUser))
  }, [refresh])

  useEffect(() => {
    const handler = () => setGoogleLoading(false)
    window.addEventListener("pageshow", handler)
    return () => window.removeEventListener("pageshow", handler)
  }, [])

  const startGoogle = async () => {
    if (!token) {
      goToError("invalid_token")
      return
    }
    setGoogleError(null)
    setGoogleLoading(true)
    try {
      await startInviteGoogleSession(token)

      const payload = await fetchGoogleAuthorizationUrl()
      window.location.assign(payload.authorization_url)
    } catch (e) {
      setGoogleError(
        e instanceof Error
          ? e.message
          : "Failed to start the registration with Google."
      )
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      goToError("invalid_token")
      return
    }
    setFormLoading(true)
    setFormError("")
    try {
      const response = await redeemInvite(token, { email, password })

      if (tryFollowAuthRedirectResponse(response)) {
        return
      }

      if (!response.ok) {
        const detail = await readFastApiErrorDetail(response)
        setFormError(formatAuthFormError(detail))
        return
      }
    } catch (err) {
      setFormError("Error al conectar con el servidor")
      console.error(err)
    } finally {
      setFormLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!token) return
    setFormLoading(true)
    setFormError("")
    try {
      const response = await redeemInvite(token, { email: "", password: "" })

      if (!response.ok) {
        const detail = await readFastApiErrorDetail(response)
        setFormError(formatAuthFormError(detail))
        setFormLoading(false)
        return
      }

      await redirectAfterAccept()
    } catch (err) {
      setFormError("Error al conectar con el servidor")
      console.error(err)
    } finally {
      setFormLoading(false)
    }
  }

  if (!token || metadataError) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <p className="text-center text-sm text-muted-foreground">
          Invalid invitation.
        </p>
      </div>
    )
  }

  if (metadata && user && navigating) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <p className="text-center text-sm text-muted-foreground">Redirecting…</p>
      </div>
    )
  }

  if (metadata && user) {
    return (
      <AuthShell
        title={
          metadata.organization_name
            ? `Join ${metadata.organization_name}`
            : "Accept invitation"
        }
        description={
          metadata.organization_name
            ? `You've been invited as ${metadata.role ?? "member"}.`
            : metadata.is_sysadmin
              ? "You've been invited as a system administrator."
              : undefined
        }
      >
        {formError ? (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {formError}
          </div>
        ) : null}

        <p className="mb-4 text-sm text-muted-foreground">
          Logged in as <span className="font-medium text-foreground">{user.email}</span>
        </p>

        <Button
          onClick={handleAccept}
          className="w-full"
          disabled={formLoading}
        >
          {formLoading ? "Accepting…" : "Accept invitation"}
        </Button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Not {user.email}?{" "}
          <Link
            to={`/login?next=${encodeURIComponent(window.location.pathname)}`}
            className="font-medium text-primary underline underline-offset-4"
          >
            Sign in with a different account
          </Link>
        </p>
      </AuthShell>
    )
  }

  if (authLoading || !metadata) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <p className="text-center text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  return (
    <AuthShell
      title={
        metadata.organization_name
          ? `Join ${metadata.organization_name}`
          : "Accept invitation"
      }
      description={
        metadata.organization_name
          ? `You've been invited as ${metadata.role ?? "member"}. Enter your email and password to continue. If you already have an account, you'll be signed in.`
          : metadata.is_sysadmin
            ? "You've been invited as a system administrator. Enter your email and password to continue."
            : "Enter your email and password to continue. If you already have an account, you'll be signed in."
      }
    >
      <form
        onSubmit={(e) => void handleRedeem(e)}
        className="space-y-4"
      >
        {formError ? (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {formError}
          </div>
        ) : null}

        <EmailPasswordFields
          email={email}
          password={password}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          disabled={formLoading}
          emailId="invite-email"
          passwordId="invite-password"
          passwordAutocomplete="new-password"
        />

        <Button
          type="submit"
          className="w-full"
          disabled={formLoading || googleLoading}
        >
          {formLoading ? "Continuing…" : "Continue"}
        </Button>
      </form>

      <AuthOAuthDivider />

      <GoogleSignInButton
        onClick={startGoogle}
        loading={googleLoading}
        label="Continue with Google"
        loadingLabel="Redirecting to Google…"
        disabled={formLoading}
      />
      {googleError ? (
        <p className="mt-3 text-center text-xs text-destructive">
          {googleError}
        </p>
      ) : null}
    </AuthShell>
  )
}
