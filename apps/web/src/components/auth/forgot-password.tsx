import { AuthRequestError, requestPasswordReset } from "@workspace/api"
import { Button } from "@workspace/ui/components/button"
import { CheckCircle2Icon, ChevronLeftIcon } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { AuthShell } from "./auth-shell"
import { EmailField } from "./email-password-fields"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await requestPasswordReset(email)
      setSubmitted(true)
    } catch (requestError) {
      setError(
        requestError instanceof AuthRequestError
          ? "We couldn't send the reset link. Please try again."
          : "Error connecting to the server."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Forgot your password?"
      description="Enter your email and we'll send you instructions to reset your password."
    >
      {submitted ? (
        <div
          className="rounded-md bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-400"
          role="status"
        >
          <div className="flex items-start gap-2">
            <CheckCircle2Icon className="mt-0.5 size-4 shrink-0" />
            <p>
              If an account exists for that email, you'll receive a password
              reset link shortly.
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

          <EmailField
            email={email}
            onEmailChange={setEmail}
            disabled={loading}
            id="forgot-password-email"
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}

      <Button asChild variant="ghost" className="mt-4 w-full">
        <Link to="/login">
          <ChevronLeftIcon />
          Back to login
        </Link>
      </Button>
    </AuthShell>
  )
}
