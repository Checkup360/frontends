import { AuthLoadingSkeleton } from "@workspace/auth/components/auth-loading-skeleton"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { SettingsPage } from "@workspace/components/components/settings/settings-page"
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
import { fetchMemberProfile, updateMemberProfile } from "@workspace/api"
import { useEffect, useState } from "react"

export function MemberSettingsPage() {
  const { user, isLoading } = useCurrentUser()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [profileLoading, setProfileLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadProfile() {
      setProfileLoading(true)
      const profile = await fetchMemberProfile()
      if (!cancelled && profile) {
        setFirstName(profile.first_name)
        setLastName(profile.last_name)
        setPhone(profile.phone_number ?? "")
      }
      if (!cancelled) setProfileLoading(false)
    }
    void loadProfile()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaveError(null)
    setSaveSuccess(false)

    const trimmedPhone = phone.trim()
    if (trimmedPhone && !/^\+[\d\s\-(). ]{7,19}$/.test(trimmedPhone)) {
      setSaveError(
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
      })

      if (result.error) {
        setSaveError(result.error.message)
      } else {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
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
      accountAction={
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Profile</CardTitle>
              <CardDescription>
                Your personal and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                  </>
                )}

                {saveError && (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {saveError}
                  </p>
                )}

                {saveSuccess && (
                  <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400">
                    Changes saved successfully.
                  </p>
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
