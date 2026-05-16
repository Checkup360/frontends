import { Button } from "@workspace/ui/components/button"
import { Link, useSearchParams } from "react-router-dom"

export default function AuthError() {
  const [searchParams] = useSearchParams()
  const reason = searchParams.get("reason")

  const errorMessages: Record<
    string,
    { code: string; title: string; message: string; action: string; to: string }
  > = {
    no_invite: {
      code: "403",
      title: "Invitation link required",
      message:
        "You need a valid invitation link to create an account. Ask your administrator to send you a new invitation.",
      action: "Go to home",
      to: "/",
    },
    invalid_invite: {
      code: "404",
      title: "Invalid invitation",
      message: "The invitation does not exist or is incorrect.",
      action: "Go to home",
      to: "/",
    },
    invalid_token: {
      code: "403",
      title: "Invalid invitation link",
      message:
        "The invitation link is not valid. Please ask an administrator to send you a new invitation link.",
      action: "Go to home",
      to: "/",
    },
    invite_used: {
      code: "403",
      title: "Invitation already used",
      message:
        "This invitation has already been used by another user. Please ask an administrator to send you a new invitation.",
      action: "Go to home",
      to: "/",
    },
    invite_expired: {
      code: "403",
      title: "Invitation expired",
      message:
        "The invitation has expired. Please ask an administrator to send you a new invitation.",
      action: "Go to home",
      to: "/",
    },
    email_mismatch: {
      code: "403",
      title: "Email does not match",
      message:
        "The email of your Google account does not match the email associated with this invitation. Try with the correct account.",
      action: "Back to login",
      to: "/login",
    },
    no_request: {
      code: "400",
      title: "Error in the request",
      message:
        "An error occurred while processing your request. Please try again.",
      action: "Back to login",
      to: "/login",
    },
  }

  const error = errorMessages[reason || ""] || {
    code: "400",
    title: "Authentication error",
    message: "An unknown error occurred. Please try again.",
    action: "Back to login",
    to: "/login",
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-semibold tracking-tight text-muted-foreground/40">
        {error.code}
      </p>
      <h1 className="mt-4 text-xl font-semibold text-foreground">
        {error.title}
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {error.message}
      </p>
      <Button asChild className="mt-8">
        <Link to={error.to}>{error.action}</Link>
      </Button>
    </div>
  )
}
