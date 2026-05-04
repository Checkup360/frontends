import { useState } from "react"
import { createSysadminInvitation } from "@workspace/auth/api"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Copy, Check, AlertCircle } from "lucide-react"
import type { InviteError } from "@workspace/auth/schemas"

interface SysadminInvitationFormProps {
  onBack?: () => void
  apiBaseUrl?: string
}

export function SysadminInvitationForm({ onBack, apiBaseUrl }: SysadminInvitationFormProps) {
  const [email, setEmail] = useState("")
  const [expiresInHours, setExpiresInHours] = useState("24")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<InviteError | null>(null)
  const [success, setSuccess] = useState(false)
  const [inviteUrl, setInviteUrl] = useState("")
  const [copied, setCopied] = useState(false)

  const isSingleUse = email.trim().length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const expiresInHoursNum = parseInt(expiresInHours, 10)
    if (isNaN(expiresInHoursNum) || expiresInHoursNum < 1 || expiresInHoursNum > 168) {
      setError({
        code: "invalid_expires",
        message: "Expiration must be between 1 and 168 hours",
      })
      return
    }

    setLoading(true)
    try {
      const result = await createSysadminInvitation(
        {
          email: email.trim() || undefined,
          expires_in_hours: expiresInHoursNum,
          is_sysadmin: true,
        },
        apiBaseUrl,
      )

      if ("error" in result) {
        setError(result.error || { code: "unknown_error", message: "Unknown error" })
        return
      }

      setSuccess(true)
      setInviteUrl(result.success.invite_url)
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
    setInviteUrl("")
    setEmail("")
    setExpiresInHours("24")
    setError(null)
  }

  if (success && inviteUrl) {
    return (
      <div className="w-full max-w-3xl mx-auto">
        {/* Success State */}
        <div className="mb-8">
          <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-50/50 p-8">
            <div className="flex gap-4 mb-6">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-emerald-600/10">
                  <Check className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-emerald-900">Invitation link generated!</h3>
                <p className="text-sm text-emerald-700 mt-1">
                  {email ? "This link is single-use and restricted to the specified email address." : "Share this link with anyone who should register as a sysadmin."}
                </p>
              </div>
            </div>

            {/* URL Copy Section */}
            <div className="bg-white rounded-xl border border-emerald-200 p-4 mb-6">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Invitation URL</p>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm font-mono text-slate-600 break-all pr-12">
                    {inviteUrl}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    aria-label="Copy link"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
              {copied && (
                <div className="mt-3 text-sm text-emerald-700 flex items-center gap-2">
                  <Check className="w-4 h-4" /> Copied to clipboard!
                </div>
              )}
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-lg p-3 border border-emerald-100">
                <p className="text-xs text-slate-500 font-medium mb-1">Type</p>
                <p className="text-sm font-semibold text-slate-900">Sysadmin Access</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-emerald-100">
                <p className="text-xs text-slate-500 font-medium mb-1">Uses</p>
                <p className="text-sm font-semibold text-slate-900">Single-use</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          {onBack && (
            <Button onClick={onBack} variant="outline" className="px-6">
              Back
            </Button>
          )}
          <Button onClick={handleCreateAnother} className="px-6 bg-emerald-600 hover:bg-emerald-700">
            Create Another Link
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Sysadmin Registration Link</h2>
        <p className="text-slate-600">Generate a secure invitation link for superuser account creation</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">{error.message}</p>
            </div>
          </div>
        )}

        {/* Email Field */}
        <div className="space-y-3">
          <Label htmlFor="email" className="text-sm font-semibold">
            Email Address <span className="text-slate-400 font-normal">(optional)</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="h-11 text-base"
          />
          <p className="text-xs text-slate-600">
            Restrict this link to a specific email address. If left blank, the link will work for any email.
          </p>
          {isSingleUse && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 flex gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-600/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600">i</span>
              </div>
              <p className="text-sm text-blue-700">This link will be <strong>single-use</strong> when restricted to an email</p>
            </div>
          )}
        </div>

        {/* Expiration Field */}
        <div className="space-y-3">
          <Label htmlFor="expires" className="text-sm font-semibold">
            Expires In
          </Label>
          <div className="flex gap-3">
            <Input
              id="expires"
              type="number"
              min="1"
              max="168"
              value={expiresInHours}
              onChange={(e) => setExpiresInHours(e.target.value)}
              disabled={loading}
              className="h-11 text-base flex-1"
            />
            <div className="flex items-center px-4 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 font-medium">
              hours
            </div>
          </div>
          <p className="text-xs text-slate-600">
            Link will expire after the specified duration (1-168 hours, or up to 7 days)
          </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-6 border-t">
          {onBack && (
            <Button type="button" onClick={onBack} variant="outline" disabled={loading} className="px-6">
              Back
            </Button>
          )}
          <Button type="submit" disabled={loading} className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-base font-medium">
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </div>
            ) : (
              "Generate Link"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

