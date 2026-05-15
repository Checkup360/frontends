import { useState } from "react"
import { createInvite } from "@workspace/auth/api"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"


export function CreateInviteForm() {
  const [email, setEmail] = useState("")
  const [expiresInHours, setExpiresInHours] = useState("24")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [inviteUrl, setInviteUrl] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)
    setInviteUrl("")

    try {
      const response = await createInvite(
        {
          email: email || undefined,
          expires_in_hours: parseInt(expiresInHours),
        }
      )

      if (!response) {
        setError("Error creating the invitation")
        return
      }

      setSuccess(true)
      setInviteUrl(response.invite_url)
      setEmail("")
    } catch (err) {
      setError("Unexpected error creating the invitation")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold">Create invitation</h2>
      <p className="mt-2 text-sm text-gray-600">
        Generate an invitation link for a new user
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && inviteUrl && (
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm font-medium text-green-900">Invitation created!</p>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={inviteUrl}
                readOnly
                className="flex-1 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(inviteUrl)
                  alert("Invitation link copied to clipboard!")
                }}
              >
                Copy
              </Button>
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="email">Email (optional)</Label>
          <Input
            id="email"
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-500">
            If specified, the invitation will only be valid for this email
          </p>
        </div>

        <div>
          <Label htmlFor="expires_in_hours">Expires in (hours)</Label>
          <Input
            id="expires_in_hours"
            type="number"
            min="1"
            max="720"
            value={expiresInHours}
            onChange={(e) => setExpiresInHours(e.target.value)}
            disabled={loading}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating..." : "Create invitation"}
        </Button>
      </form>
    </div>
  )
}

export default CreateInviteForm
