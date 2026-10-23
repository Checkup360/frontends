import { useState, useEffect, type FormEvent } from "react"
import {
  deleteOrganizationLogo,
  updateOrganization,
  uploadOrganizationLogo,
  MAX_ORGANIZATION_NAME_LENGTH,
} from "@workspace/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { toast } from "@workspace/ui/components/sonner"
import { AvatarUpload } from "./file-upload"
import { getInitials } from "./employee-profile-card"

export interface EditOrganizationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  currentName: string
  currentLogoUrl?: string | null
  onSuccess?: (updated: { name: string; logoUrl: string | null }) => void | Promise<void>
}

export function EditOrganizationDialog({
  open,
  onOpenChange,
  organizationId,
  currentName,
  currentLogoUrl = null,
  onSuccess,
}: EditOrganizationDialogProps) {
  const [name, setName] = useState(currentName)
  const [logoUrl, setLogoUrl] = useState<string | null>(currentLogoUrl)
  const [isSavingName, setIsSavingName] = useState(false)
  const [isUpdatingLogo, setIsUpdatingLogo] = useState(false)

  // Synchronize state whenever dialog opens
  useEffect(() => {
    if (open) {
      setName(currentName)
      setLogoUrl(currentLogoUrl ?? null)
    }
  }, [open, currentName, currentLogoUrl])

  const handleSaveLogo = async (file: Blob | null) => {
    if (!organizationId) return
    setIsUpdatingLogo(true)
    try {
      if (file) {
        const result = await uploadOrganizationLogo(organizationId, file)
        if (result.error) {
          toast.error(result.error.message || "Failed to upload logo.")
          return
        }
        setLogoUrl(result.success.logo_url)
        toast.success("Organization logo updated.")
        await onSuccess?.({ name, logoUrl: result.success.logo_url })
      } else {
        const result = await deleteOrganizationLogo(organizationId)
        if (result.error) {
          toast.error(result.error.message || "Failed to remove logo.")
          return
        }
        setLogoUrl(null)
        toast.success("Organization logo removed.")
        await onSuccess?.({ name, logoUrl: null })
      }
    } catch {
      toast.error("An error occurred while updating the logo.")
    } finally {
      setIsUpdatingLogo(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!organizationId) return

    const trimmed = name.trim()
    if (!trimmed) {
      toast.error("Organization name cannot be empty.")
      return
    }

    if (trimmed !== currentName) {
      setIsSavingName(true)
      try {
        const result = await updateOrganization(organizationId, { name: trimmed })
        if (result.error) {
          toast.error(result.error.message || "Failed to update organization name.")
          return
        }
        toast.success("Organization name updated.")
        await onSuccess?.({ name: result.success.name, logoUrl })
      } catch {
        toast.error("An error occurred while updating the name.")
        return
      } finally {
        setIsSavingName(false)
      }
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Organization</DialogTitle>
          <DialogDescription>
            Update your company's logo, brand identity, and display name.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Logo upload using AvatarUpload */}
          <AvatarUpload
            currentAvatarUrl={logoUrl}
            initials={getInitials(name || currentName || "Organization")}
            title="Organization Logo"
            description="JPG, PNG or WEBP. Max size 5MB. Pan, zoom and crop to fit your company brand."
            onSave={handleSaveLogo}
            isUpdating={isUpdatingLogo}
          />

          {/* Organization Name form */}
          <form id="edit-organization-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-organization-name">Organization Name</Label>
              <Input
                id="edit-organization-name"
                type="text"
                placeholder="Company Name"
                maxLength={MAX_ORGANIZATION_NAME_LENGTH}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSavingName}
                autoFocus
              />
            </div>
          </form>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSavingName || isUpdatingLogo}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-organization-form"
            disabled={isSavingName || isUpdatingLogo || !name.trim()}
          >
            {isSavingName ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
