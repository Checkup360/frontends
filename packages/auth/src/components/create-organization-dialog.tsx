import { useState } from "react"
import { createOrganization, type CreateOrganizationError } from "@workspace/api"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Building2 } from "lucide-react"

interface CreateOrganizationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
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
}: CreateOrganizationDialogProps) {
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<CreateOrganizationError | null>(null)
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
      )

      if ("error" in result) {
        setError(result.error || { code: "unknown_error", message: "Unknown error" })
        return
      }

      setName("")
      setSlug("")
      setTouched(false)
      onOpenChange(false)
      onSuccess?.()
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName("")
      setSlug("")
      setError(null)
      setTouched(false)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[340px] w-[calc(100%-2rem)] p-6 gap-5 rounded-2xl">
        <DialogHeader className="gap-2.5 text-left">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="size-5" />
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-base font-semibold text-foreground">
              Create organization
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Set up a new company environment and invite collaborators.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
              {error.message}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="org-name" className="text-xs font-medium text-foreground">
              Organization name
            </Label>
            <Input
              id="org-name"
              placeholder="Acme Inc"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onFocus={() => setTouched(true)}
              disabled={loading}
              className="h-10 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="org-slug" className="text-xs font-medium text-foreground">
              URL identifier
            </Label>
            <Input
              id="org-slug"
              placeholder="acme-inc"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              disabled={loading}
              className="h-10 text-sm font-mono"
            />
            <p className="text-[11px] text-muted-foreground leading-normal">
              URL-friendly identifier for the organization
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
              className="flex-1 h-9 text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-9 text-xs font-medium"
            >
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
