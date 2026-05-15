import { Link, useSearchParams } from "react-router-dom"

export default function AuthError() {
  const [searchParams] = useSearchParams()
  const reason = searchParams.get("reason")

  const errorMessages: Record<string, { title: string; message: string }> = {
    no_invite: {
      title: "An invitation is required",
      message:
        "You need a valid invitation. Please ask an administrator to send you an invitation link.",
    },
    invalid_invite: {
      title: "Invalid invitation",
      message: "The invitation does not exist or is incorrect.",
    },
    invalid_token: {
      title: "Invalid invitation link",
      message:
        "The invitation link is not valid. Please ask an administrator to send you a new invitation link.",
    },
    invite_used: {
      title: "Invitation already used",
      message:
        "This invitation has already been used by another user. Please ask an administrator to send you a new invitation.",
    },
    invite_expired: {
      title: "Invitation expired",
      message:
        "The invitation has expired. Please ask an administrator to send you a new invitation.",
    },
    email_mismatch: {
      title: "Email does not match",
      message:
        "The email of your Google account does not match the email associated with this invitation. Try with the correct account.",
    },
    no_request: {
      title: "Error in the request",
      message:
        "An error occurred while processing your request. Please try again.",
    },
  }

  const error = errorMessages[reason || ""] || {
    title: "Authentication error",
    message: "An unknown error occurred. Please try again.",
  }

  return (
    <div className="mx-auto mt-20 max-w-xl rounded-lg border border-red-200 bg-red-50 p-6">
      <h1 className="text-lg font-semibold text-red-900">{error.title}</h1>
      <p className="mt-2 text-sm text-red-800">{error.message}</p>
      <div className="mt-4 flex gap-2">
        <Link
          to="/login"
          className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Back to login
        </Link>
      </div>
    </div>
  )
}
