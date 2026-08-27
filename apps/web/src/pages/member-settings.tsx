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
import {
  fetchMemberProfile,
  updateMemberProfile,
  fetchMemberForm,
  submitMemberForm,
} from "@workspace/api"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { useEffect, useState } from "react"

export function MemberSettingsPage() {
  const { user, isLoading } = useCurrentUser()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [profileLoading, setProfileLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [biologicalSex, setBiologicalSex] = useState<string>("")
  const [height, setHeight] = useState<string>("")
  const [weight, setWeight] = useState<string>("")
  const [biometricsLoading, setBiometricsLoading] = useState(true)
  const [isSavingBiometrics, setIsSavingBiometrics] = useState(false)
  const [saveBiometricsError, setSaveBiometricsError] = useState<string | null>(null)
  const [saveBiometricsSuccess, setSaveBiometricsSuccess] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadProfile() {
      setProfileLoading(true)
      setBiometricsLoading(true)

      const [profile, biometricsForm] = await Promise.all([
        fetchMemberProfile(),
        fetchMemberForm("biometrics"),
      ])

      if (!cancelled && profile) {
        setFirstName(profile.first_name)
        setLastName(profile.last_name)
        setPhone(profile.phone_number ?? "")
        setDateOfBirth(profile.date_of_birth)
      }

      if (!cancelled && biometricsForm?.data) {
        const d = biometricsForm.data
        setBiologicalSex((d.biological_sex as string) ?? "")
        setHeight(d.height ? String(d.height) : "")
        setWeight(d.weight ? String(d.weight) : "")
      }

      if (!cancelled) {
        setProfileLoading(false)
        setBiometricsLoading(false)
      }
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
        date_of_birth: dateOfBirth,
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

  const handleSaveBiometrics = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaveBiometricsError(null)
    setSaveBiometricsSuccess(false)
    setIsSavingBiometrics(true)

    try {
      const payload: Record<string, unknown> = {}
      if (biologicalSex) payload.biological_sex = biologicalSex
      if (height) payload.height = parseFloat(height)
      if (weight) payload.weight = parseFloat(weight)

      const result = await submitMemberForm("biometrics", payload)

      if (result.error) {
        setSaveBiometricsError(result.error.message)
      } else {
        setSaveBiometricsSuccess(true)
        setTimeout(() => setSaveBiometricsSuccess(false), 3000)
      }
    } finally {
      setIsSavingBiometrics(false)
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
          <Card>
            <CardHeader>
              <CardTitle>Biometrics</CardTitle>
              <CardDescription>
                Your basic physical attributes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => void handleSaveBiometrics(e)}
                className="space-y-6"
              >
                {biometricsLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-10 rounded-md bg-muted" />
                    <div className="h-10 rounded-md bg-muted" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="biological-sex">Biological Sex</Label>
                      <Select
                        value={biologicalSex}
                        onValueChange={setBiologicalSex}
                        disabled={isSavingBiometrics}
                      >
                        <SelectTrigger id="biological-sex">
                          <SelectValue placeholder="Select sex" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="height">Height (cm)</Label>
                        <Input
                          id="height"
                          type="number"
                          placeholder="170"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          disabled={isSavingBiometrics}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weight">Weight (kg)</Label>
                        <Input
                          id="weight"
                          type="number"
                          placeholder="70"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          disabled={isSavingBiometrics}
                        />
                      </div>
                    </div>
                  </>
                )}

                {saveBiometricsError && (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {saveBiometricsError}
                  </p>
                )}

                {saveBiometricsSuccess && (
                  <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400">
                    Changes saved successfully.
                  </p>
                )}

                <Button type="submit" disabled={isSavingBiometrics || biometricsLoading}>
                  {isSavingBiometrics ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      }
    />
  )
}
