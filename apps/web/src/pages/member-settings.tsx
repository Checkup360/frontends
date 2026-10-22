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
import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { toast } from "@workspace/ui/components/sonner"
import {
  fetchMemberProfile,
  updateMemberProfile,
  uploadMemberAvatar,
  deleteMemberAvatar,
  fetchCurrentConsents,
  revokeConsent,
  exportMemberData,
  type UserConsent,
} from "@workspace/api"
import { useEffect, useState } from "react"
import {
  Download,
  FileText,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react"
import { LegalDocumentModal } from "../components/legal/legal-document-modal"
import { MedicalNonDiagnosticDisclaimer } from "../components/legal/medical-disclaimer"

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

  const [consents, setConsents] = useState<UserConsent[]>([])
  const [consentsLoading, setConsentsLoading] = useState(true)
  const [selectedConsentToRevoke, setSelectedConsentToRevoke] = useState<UserConsent | null>(null)
  const [isRevoking, setIsRevoking] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [viewingDocKey, setViewingDocKey] = useState<string | null>(null)

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const res = await exportMemberData()
      if (!res.success) {
        toast.error(res.error.message || "Failed to export data.")
        return
      }

      const jsonString = JSON.stringify(res.data, null, 2)
      const blob = new Blob([jsonString], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `checkup360-my-data-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success("Your personal data export has been downloaded successfully.")
    } catch {
      toast.error("An error occurred while generating your data export.")
    } finally {
      setIsExporting(false)
    }
  }

  const loadConsents = async () => {
    setConsentsLoading(true)
    const res = await fetchCurrentConsents()
    if (res) {
      const list: UserConsent[] = []
      if (res.terms_and_conditions) list.push(res.terms_and_conditions)
      if (res.privacy_policy) list.push(res.privacy_policy)
      if (res.health_data_processing) list.push(res.health_data_processing)
      if (res.form_consents) {
        Object.values(res.form_consents).forEach((c) => {
          if (c) list.push(c)
        })
      }
      setConsents(list)
    }
    setConsentsLoading(false)
  }

  useEffect(() => {
    let cancelled = false
    async function loadProfile() {
      setProfileLoading(true)
      const [profile] = await Promise.all([
        fetchMemberProfile(),
        loadConsents(),
      ])

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

          {/* Privacy & Legal Consents Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <ShieldCheck className="size-5 text-primary" />
                    Privacy & Legal Consents
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Manage your legal agreements, informed consents, and privacy preferences.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {consentsLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-14 rounded-lg bg-muted" />
                  <div className="h-14 rounded-lg bg-muted" />
                  <div className="h-14 rounded-lg bg-muted" />
                </div>
              ) : consents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/80 p-6 text-center text-xs text-muted-foreground">
                  No active consent records found.
                </div>
              ) : (
                <div className="divide-y divide-border/40 rounded-xl border border-border/40 bg-background/30">
                  {consents.map((consent) => {
                    const isRevoked = Boolean(consent.revoked_at)
                    const docKey =
                      consent.consent_type === "FORM_CONSENT" && consent.form_type
                        ? `FORM:${consent.form_type}`
                        : consent.consent_type

                    const titles: Record<string, string> = {
                      TERMS_AND_CONDITIONS: "Terms and Conditions",
                      PRIVACY_POLICY: "Privacy Policy",
                      HEALTH_DATA_PROCESSING_CONSENT: "Health Data Processing Consent",
                      "FORM:biometrics": "Physical Biometrics Consent",
                      "FORM:sleep": "Sleep Quality Consent",
                      "FORM:habits": "Lifestyle & Habits Consent",
                      "FORM:mood": "Mood & Well-being Consent",
                      "FORM:metabolic": "Metabolic Health Consent",
                      "FORM:eoss": "Obesity Impact Consent",
                      "FORM:nordic_nmq": "Musculoskeletal Consent",
                      "FORM:audit_c": "Alcohol Habits Consent",
                      "FORM:pss10": "Stress & Burnout Consent",
                    }

                    const displayName =
                      titles[docKey] ||
                      (consent.form_type
                        ? `${consent.form_type.toUpperCase()} Form Consent`
                        : consent.consent_type)

                    return (
                      <div
                        key={consent.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/10"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {displayName}
                            </span>
                            <Badge
                              variant="outline"
                              className={
                                !isRevoked
                                  ? "border-success/40 bg-success/10 text-success text-[10px]"
                                  : "border-muted-foreground/30 bg-muted/20 text-muted-foreground text-[10px]"
                              }
                            >
                              {!isRevoked ? "Active" : "Revoked"}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">
                              v{consent.document_version}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Accepted on {new Date(consent.accepted_at).toLocaleDateString()}
                            {consent.revoked_at
                              ? ` • Revoked on ${new Date(consent.revoked_at).toLocaleDateString()}`
                              : ""}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingDocKey(docKey)}
                            className="h-8 gap-1 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <FileText className="size-3.5" />
                            <span>View</span>
                          </Button>

                          {!isRevoked && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedConsentToRevoke(consent)}
                              className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              Revoke
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <MedicalNonDiagnosticDisclaimer className="mt-4" />
            </CardContent>
          </Card>

          {/* Data Portability / Habeas Data Export Card */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Download className="size-5 text-primary" />
                <CardTitle className="text-base font-semibold">
                  Data Portability & Export
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Download a complete, machine-readable JSON copy of all your personal profile information, recorded health measurements, completed assessment forms, risk evaluations, and informed consent audit history.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/40 bg-background/30">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Personal & Health Data Archive
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Format: JSON • Includes full timestamped audit logs
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="gap-2 shrink-0 border-primary/30 hover:border-primary hover:bg-primary/5"
                >
                  <Download className="size-4 text-primary" />
                  <span>{isExporting ? "Generating Export..." : "Export My Data"}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Revoke Confirmation Dialog */}
          <AlertDialog
            open={selectedConsentToRevoke !== null}
            onOpenChange={(open) => {
              if (!open) setSelectedConsentToRevoke(null)
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <div className="flex items-center gap-2 text-destructive">
                  <ShieldAlert className="size-5" />
                  <AlertDialogTitle>Revoke Informed Consent?</AlertDialogTitle>
                </div>
                <AlertDialogDescription className="text-xs sm:text-sm leading-relaxed space-y-2 pt-2">
                  <p>
                    Are you sure you want to revoke your consent for{" "}
                    <strong>
                      {selectedConsentToRevoke?.form_type
                        ? `${selectedConsentToRevoke.form_type} health data`
                        : selectedConsentToRevoke?.consent_type}
                    </strong>
                    ?
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Revoking this consent will prevent Checkup360 from evaluating new submissions or generating health scores for this assessment. Previously submitted historical entries will remain archived for compliance.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async (e) => {
                    e.preventDefault()
                    if (!selectedConsentToRevoke) return
                    setIsRevoking(true)
                    try {
                      const res = await revokeConsent(selectedConsentToRevoke.id)
                      if (!res.success) {
                        toast.error(res.error || "Failed to revoke consent.")
                      } else {
                        toast.success("Consent successfully revoked.")
                        await loadConsents()
                      }
                    } catch {
                      toast.error("Failed to revoke consent.")
                    } finally {
                      setIsRevoking(false)
                      setSelectedConsentToRevoke(null)
                    }
                  }}
                  disabled={isRevoking}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isRevoking ? "Revoking..." : "Confirm Revocation"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Legal Document Viewer Modal */}
          <LegalDocumentModal
            open={viewingDocKey !== null}
            documentKey={viewingDocKey}
            onOpenChange={(open) => {
              if (!open) setViewingDocKey(null)
            }}
          />
        </div>
      }
    />
  )
}
