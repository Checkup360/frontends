import { useState } from "react"
import { createOrganization, resolveApiBaseUrl, type CreateOrganizationError } from "@workspace/auth/api"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"

interface CreateOrganizationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  apiBaseUrl?: string
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function isValidSlug(slug: string): boolean {
  if (!slug) return false
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

export function CreateOrganizationDialog({
  open,
  onOpenChange,
  onSuccess,
  apiBaseUrl,
}: CreateOrganizationDialogProps) {
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<CreateOrganizationError | null>(null)
  const [success, setSuccess] = useState(false)
  const [touched, setTouched] = useState(false)

  const handleNameChange = (value: string) => {
    setName(value)
    if (touched) {
      setSlug(generateSlug(value))
    }
  }

  const handleSlugChange = (value: string) => {
    setSlug(value.toLowerCase().replace(/\s+/g, "-"))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const trimmedName = name.trim()
    const trimmedSlug = slug.trim()

    if (!trimmedName) {
      setError({ code: "name_required", message: "Organization name is required." })
      return
    }

    if (!trimmedSlug) {
      setError({ code: "slug_required", message: "URL identifier is required." })
      return
    }

    if (!isValidSlug(trimmedSlug)) {
      setError({
        code: "invalid_slug_format",
        message: "URL identifier can only contain lowercase letters, numbers, and hyphens.",
      })
      return
    }

    setLoading(true)
    try {
      const result = await createOrganization(
        { name: trimmedName, slug: trimmedSlug },
        apiBaseUrl,
      )

      if ("error" in result) {
        setError(result.error)
        return
      }

      setSuccess(true)
      setName("")
      setSlug("")
      setTouched(false)
      setTimeout(() => {
        onOpenChange(false)
        onSuccess?.()
      }, 1000)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName("")
      setSlug("")
      setError(null)
      setSuccess(false)
      setTouched(false)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">Create new organization</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
              {error.message}
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-4 text-sm text-green-900">
              Organization created successfully!
            </div>
          )}

          <div className="space-y-3">
            <Label htmlFor="org-name" className="text-sm font-medium">
              Organization name
            </Label>
            <Input
              id="org-name"
              placeholder="Acme Inc"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onFocus={() => setTouched(true)}
              disabled={loading}
              className="h-10"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="org-slug" className="text-sm font-medium">
              URL identifier
            </Label>
            <Input
              id="org-slug"
              placeholder="acme-inc"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              disabled={loading}
              className="h-10"
            />
            <p className="text-xs text-muted-foreground">
              URL-friendly identifier for the organization
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
