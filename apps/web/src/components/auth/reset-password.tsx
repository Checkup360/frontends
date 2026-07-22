import { AuthRequestError, resetPassword } from "@workspace/api"
import { Button } from "@workspace/ui/components/button"
import { CheckCircle2Icon, LockIcon } from "lucide-react"
import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { AuthShell } from "./auth-shell"
import { PasswordField } from "./email-password-fields"

const PASSWORD_HELP =
  "Use at least 8 characters with uppercase, lowercase, and a number."

function getResetError(error: unknown): string {
  if (!(error instanceof AuthRequestError)) {
    return "Error connecting to the server."
  }
  if (error.detail === "RESET_PASSWORD_BAD_TOKEN") {
    return "This reset link is invalid or has expired. Request a new one."
  }
  if (
    error.detail &&
    typeof error.detail === "object" &&
    "reason" in error.detail &&
    typeof error.detail.reason === "string"
  ) {
    return error.detail.reason
  }
  return "We couldn't reset your password. Please try again."
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!token) {
      setError("This reset link is invalid. Request a new one.")
      return
    }
    if (password !== confirmation) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, password)
      setSubmitted(true)
    } catch (requestError) {
      setError(getResetError(requestError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Reset password"
      description="Create a new password for your account."
    >
      <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-primary/10">
        <LockIcon className="size-6 text-primary" />
      </div>

      {submitted ? (
        <div
          className="rounded-md bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-400"
          role="status"
        >
          <div className="flex items-start gap-2">
            <CheckCircle2Icon className="mt-0.5 size-4 shrink-0" />
            <p>
              Your password was reset successfully. You can now{" "}
              <Link to="/login" className="font-medium underline">
                sign in
              </Link>
              .
            </p>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-4"
        >
          {error ? (
            <div
              className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <PasswordField
            password={password}
            onPasswordChange={setPassword}
            label="New password"
            id="new-password"
            autocomplete="new-password"
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">{PASSWORD_HELP}</p>
          <PasswordField
            password={confirmation}
            onPasswordChange={setConfirmation}
            label="Confirm password"
            id="confirm-password"
            autocomplete="new-password"
            disabled={loading}
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Resetting…" : "Reset password"}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
