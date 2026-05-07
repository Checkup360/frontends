import { Button } from "@workspace/ui/components/button"
import { GoogleIcon } from "./google-icon"

type GoogleSignInButtonProps = {
  onClick: () => void | Promise<void>
  disabled?: boolean
  loading?: boolean
  label?: string
  loadingLabel?: string
}

export function GoogleSignInButton({
  onClick,
  disabled,
  loading,
  label = "Continue with Google",
  loadingLabel = "Redirecting to Google…",
}: GoogleSignInButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="inline-flex w-full items-center justify-center gap-2"
      onClick={() => void onClick()}
      disabled={disabled || loading}
    >
      <GoogleIcon className="size-5 shrink-0" />
      <span className="text-sm font-medium">{loading ? loadingLabel : label}</span>
    </Button>
  )
}
