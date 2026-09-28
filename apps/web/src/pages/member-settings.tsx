import { AuthLoadingSkeleton } from "@workspace/auth/components/auth-loading-skeleton"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { SettingsPage } from "@workspace/components/components/settings/settings-page"
import { AvatarUpload } from "@workspace/components/components/file-upload"
import { getInitials } from "@workspace/components/components/employee-profile-card"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { toast } from "@workspace/ui/components/sonner"
import {
  fetchMemberProfile,
  updateMemberProfile,
  uploadMemberAvatar,
  deleteMemberAvatar,
} from "@workspace/api"
import { useEffect, useState } from "react"

export function MemberSettingsPage() {
  const { user, isLoading, refresh } = useCurrentUser()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isAvatarUpdating, setIsAvatarUpdating] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadProfile() {
      setProfileLoading(true)
      const profile = await fetchMemberProfile()

      if (!cancelled && profile) {
        setFirstName(profile.first_name)
        setLastName(profile.last_name)
        setPhone(profile.phone_number ?? "")
        setDateOfBirth(profile.date_of_birth)
        setAvatarUrl(profile.avatar_url ?? null)
      }

      if (!cancelled) {
        setProfileLoading(false)
      }
    }
    void loadProfile()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSaveAvatar = async (file: Blob | null) => {
    setIsAvatarUpdating(true)
    try {
      if (file) {
        const result = await uploadMemberAvatar(file)
        if (result.error) {
          toast.error(result.error.message || "Failed to update profile photo.")
          return
        }
        setAvatarUrl(result.success.avatar_url)
        toast.success("Profile photo updated successfully.")
      } else {
        const result = await deleteMemberAvatar()
        if (result.error) {
          toast.error(result.error.message || "Failed to remove profile photo.")
          return
        }
        setAvatarUrl(null)
        toast.success("Profile photo removed.")
      }

      await refresh()
    } catch {
      toast.error("Failed to update profile photo. Please try again.")
    } finally {
      setIsAvatarUpdating(false)
    }
  }

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault()

    const trimmedPhone = phone.trim()
    if (trimmedPhone && !/^\+[\d\s\-(). ]{7,19}$/.test(trimmedPhone)) {
      toast.error(
        "Phone number must start with + and country code (e.g. +54 11 1234-5678)."
      )
      return
    }

    setIsSaving(true)

    try {
      const result = await updateMemberProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: trimmedPhone || null,
        date_of_birth: dateOfBirth,
        avatar_url: avatarUrl,
      })

      if (result.error) {
        toast.error(result.error.message || "Failed to update profile.")
      } else {
        await refresh()
        toast.success("Profile updated successfully.")
      }
    } catch {
      toast.error("An error occurred while saving your profile.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <AuthLoadingSkeleton />
  }

  return (
    <SettingsPage
      email={user?.email ?? ""}
      organizationName={user?.membership?.organization_name}
      avatarAction={
        <AvatarUpload
          currentAvatarUrl={avatarUrl}
          initials={getInitials(
            firstName && lastName
              ? `${firstName} ${lastName}`
              : user?.first_name && user?.last_name
                ? `${user.first_name} ${user.last_name}`
                : (user?.email ?? "")
          )}
          onSave={handleSaveAvatar}
          isUpdating={isAvatarUpdating}
        />
      }
      accountAction={
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Profile</CardTitle>
              <CardDescription>
                Your personal and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form
                onSubmit={(e) => void handleSaveProfile(e)}
                className="space-y-6"
              >
                {profileLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-10 rounded-md bg-muted" />
                    <div className="h-10 rounded-md bg-muted" />
                    <div className="h-10 rounded-md bg-muted" />
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="first-name">First Name</Label>
                        <Input
                          id="first-name"
                          type="text"
                          placeholder="John"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          disabled={isSaving}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-name">Last Name</Label>
                        <Input
                          id="last-name"
                          type="text"
                          placeholder="Doe"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          disabled={isSaving}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+54 11 1234-5678"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          disabled={isSaving}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date-of-birth">Date of birth</Label>
                        <Input
                          id="date-of-birth"
                          type="date"
                          max={new Date().toISOString().slice(0, 10)}
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                  </>
                )}

                <Button type="submit" disabled={isSaving || profileLoading}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      }
    />
  )
}
