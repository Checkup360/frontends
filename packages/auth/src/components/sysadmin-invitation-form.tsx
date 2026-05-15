import { useState, type FormEvent } from "react"
import { createSysadminInvitation } from "@workspace/api"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Copy,
  Check,
  AlertCircle,
  Clock,
  Mail,
  ShieldCheck,
} from "lucide-react"
import type { InviteError } from "@workspace/api"

interface SysadminInvitationFormProps {
  onBack?: () => void
  onSuccessChange?: (success: boolean) => void
}

export function SysadminInvitationForm({
  onBack,
  onSuccessChange,
}: SysadminInvitationFormProps) {
  const [email, setEmail] = useState("")
  const [expiresInHours, setExpiresInHours] = useState("24")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<InviteError | null>(null)
  const [success, setSuccess] = useState(false)
  const [inviteUrl, setInviteUrl] = useState("")
  const [generatedEmail, setGeneratedEmail] = useState("")
  const [copied, setCopied] = useState(false)

  const isSingleUse = email.trim().length > 0

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    onSuccessChange?.(false)

    const expiresInHoursNum = parseInt(expiresInHours, 10)
    if (
      isNaN(expiresInHoursNum) ||
      expiresInHoursNum < 1 ||
      expiresInHoursNum > 168
    ) {
      setError({
        code: "invalid_expires",
        message: "Expiration must be between 1 and 168 hours",
      })
      return
    }

    setLoading(true)
    try {
      const result = await createSysadminInvitation({
        email: email.trim() || undefined,
        expires_in_hours: expiresInHoursNum,
        is_sysadmin: true,
      })

      if ("error" in result) {
        setError(
          result.error || { code: "unknown_error", message: "Unknown error" }
        )
        return
      }

      setSuccess(true)
      onSuccessChange?.(true)
      setInviteUrl(result.success.invite_url)
      setGeneratedEmail(email.trim())
      setEmail("")
      setExpiresInHours("24")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleCreateAnother = () => {
    setSuccess(false)
    onSuccessChange?.(false)
    setInviteUrl("")
    setGeneratedEmail("")
    setEmail("")
    setExpiresInHours("24")
    setError(null)
  }

  if (success && inviteUrl) {
    return (
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--success)]/15 text-[color:var(--success)]">
            <Check className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Invitation created</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {generatedEmail
                ? "The link is restricted to the specified email."
                : "The sysadmin invitation link is ready."}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Invitation URL</Label>
          <div className="flex gap-2">
            <Input readOnly value={inviteUrl} className="font-mono text-xs" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCopy}
              aria-label="Copy link"
            >
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
          {copied && (
            <p className="text-sm text-[color:var(--success)]">
              Copied to clipboard.
            </p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Type</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              Sysadmin access
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="mt-1 truncate text-sm font-medium text-foreground">
              {generatedEmail || "Any email"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-5">
          {onBack && (
            <Button type="button" onClick={onBack} variant="outline">
              Back
            </Button>
          )}
          <Button type="button" onClick={handleCreateAnother}>
            Create another link
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[430px] flex-col space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Sysadmin registration</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Create an invitation for platform administration access.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <div className="space-y-5">
          {error && (
            <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium">{error.message}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">
              Email address{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="pl-8"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty to allow any email to use the link.
            </p>
            {isSingleUse && (
              <div className="flex gap-2 rounded-lg border border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                <p>This link will be single-use when restricted to an email.</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expires">Expires in</Label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Clock className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="expires"
                  type="number"
                  min="1"
                  max="168"
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(e.target.value)}
                  disabled={loading}
                  className="pl-8"
                />
              </div>
              <div className="flex h-9 items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground">
                hours
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Allowed range: 1 to 168 hours.
            </p>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t pt-5">
          {onBack && (
            <Button
              type="button"
              onClick={onBack}
              variant="outline"
              disabled={loading}
            >
              Back
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                Generating...
              </>
            ) : (
              "Generate link"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
