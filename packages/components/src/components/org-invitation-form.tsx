import { useState, useEffect, type FormEvent } from "react"
import {
  createOrgInvitation,
  listDepartments,
  listOrganizations,
} from "@workspace/api"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import {
  Copy,
  Check,
  AlertCircle,
  Clock,
  Mail,
  ShieldCheck,
  Users,
} from "lucide-react"
import { OrganizationCombobox } from "./organization-combobox"
import type {
  DepartmentResponse,
  OrganizationResponse,
  OrgRole,
  InviteError,
} from "@workspace/api"

interface OrgInvitationFormProps {
  onBack?: () => void
  onSuccessChange?: (success: boolean) => void
  fixedOrganization?: OrganizationResponse
  initialOrganizationId?: string
  canInviteSuperadmin?: boolean
  title?: string
  description?: string
}

export function OrgInvitationForm({
  onBack,
  onSuccessChange,
  fixedOrganization,
  initialOrganizationId,
  canInviteSuperadmin = false,
  title = "Organization registration",
  description = "Create an invitation for a user in an existing organization.",
}: OrgInvitationFormProps) {
  const [organizations, setOrganizations] = useState<OrganizationResponse[]>([])
  const [departments, setDepartments] = useState<DepartmentResponse[]>([])
  const [selected, setSelected] = useState<OrganizationResponse | null>(null)
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("")
  const [role, setRole] = useState<OrgRole>("member")
  const [email, setEmail] = useState("")
  const [maxUses, setMaxUses] = useState("1")
  const [expiresInHours, setExpiresInHours] = useState("24")
  const [loading, setLoading] = useState(false)
  const [orgsLoading, setOrgsLoading] = useState(true)
  const [departmentsLoading, setDepartmentsLoading] = useState(false)
  const [orgsError, setOrgsError] = useState("")
  const [error, setError] = useState<InviteError | null>(null)
  const [success, setSuccess] = useState(false)
  const [inviteUrl, setInviteUrl] = useState("")
  const [generatedOrganization, setGeneratedOrganization] =
    useState<OrganizationResponse | null>(null)
  const [generatedRole, setGeneratedRole] = useState<OrgRole>("member")
  const [generatedEmail, setGeneratedEmail] = useState("")
  const [copied, setCopied] = useState(false)

  const { user } = useCurrentUser()
  const isSysadmin = user?.is_sysadmin ?? false
  const isUserSuperadmin =
    user?.membership?.roles?.includes("superadmin") ?? false
  const canGrantSuperadmin =
    isSysadmin || isUserSuperadmin || canInviteSuperadmin

  const [isSuperadmin, setIsSuperadmin] = useState(false)
  const isSuperadminRole = role === "admin" && isSuperadmin
  const isAdminRole = role === "admin" && !isSuperadmin
  const isMemberRole = role === "member"
  const isContentManagerRole = role === "content_manager"
  const isEmailFilled = email.trim().length > 0
  const shouldBeSingleUse =
    isSuperadminRole || isAdminRole || isContentManagerRole || isEmailFilled
  const selectedOrganization = fixedOrganization ?? selected
  const selectedOrganizationId = selected?.id ?? fixedOrganization?.id ?? ""

  useEffect(() => {
    if (fixedOrganization) {
      setOrgsLoading(false)
      setOrganizations([])
      setSelected(null)
      return
    }

    const fetchOrganizations = async () => {
      setOrgsLoading(true)
      setOrgsError("")
      setSelected(null)
      try {
        const orgs = await listOrganizations()
        setOrganizations(orgs)
        if (initialOrganizationId) {
          const targetId = initialOrganizationId.trim().toLowerCase()
          const matched = orgs.find(
            (org) => org.id.trim().toLowerCase() === targetId
          )
          if (matched) {
            setSelected(matched)
          }
        }
      } catch (err) {
        setOrgsError("Failed to load organizations")
        console.error(err)
      } finally {
        setOrgsLoading(false)
      }
    }
    fetchOrganizations()
  }, [fixedOrganization, initialOrganizationId])

  useEffect(() => {
    if (initialOrganizationId && organizations.length > 0 && !selected) {
      const targetId = initialOrganizationId.trim().toLowerCase()
      const matched = organizations.find(
        (org) => org.id.trim().toLowerCase() === targetId
      )
      if (matched) {
        setSelected(matched)
      }
    }
  }, [initialOrganizationId, organizations, selected])

  useEffect(() => {
    const organizationId = selectedOrganization?.id
    setSelectedDepartmentId("")
    setDepartments([])
    if (!organizationId) return

    const fetchDepartments = async () => {
      setDepartmentsLoading(true)
      try {
        setDepartments(await listDepartments(organizationId))
      } finally {
        setDepartmentsLoading(false)
      }
    }

    void fetchDepartments()
  }, [selectedOrganization?.id])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    onSuccessChange?.(false)

    if (!selectedOrganization) {
      setError({
        code: "organization_required",
        message: "Please select an organization",
      })
      return
    }

    const maxUsesNum = parseInt(maxUses, 10)
    if (isNaN(maxUsesNum) || maxUsesNum < 1 || maxUsesNum > 100) {
      setError({
        code: "invalid_max_uses",
        message: "Max uses must be between 1 and 100",
      })
      return
    }

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
    const effectiveRole = isSuperadmin ? "superadmin" : role
    try {
      const result = await createOrgInvitation(
        !fixedOrganization
          ? {
              organization_id: selectedOrganization.id,
              department_id:
                isMemberRole && selectedDepartmentId
                  ? selectedDepartmentId
                  : undefined,
              role: effectiveRole,
              is_superadmin: isSuperadmin,
              email: email.trim() || undefined,
              max_uses: shouldBeSingleUse ? 1 : maxUsesNum,
              expires_in_hours: expiresInHoursNum,
            }
          : {
              role: effectiveRole,
              is_superadmin: isSuperadmin,
              department_id:
                isMemberRole && selectedDepartmentId
                  ? selectedDepartmentId
                  : undefined,
              email: email.trim() || undefined,
              max_uses: shouldBeSingleUse ? 1 : maxUsesNum,
              expires_in_hours: expiresInHoursNum,
            }
      )

      if ("error" in result) {
        setError(
          result.error || { code: "unknown_error", message: "Unknown error" }
        )
        return
      }

      setSuccess(true)
      onSuccessChange?.(true)
      setInviteUrl(result.success.invite_url)
      setGeneratedOrganization(selectedOrganization)
      setGeneratedRole(effectiveRole)
      setGeneratedEmail(email.trim())
      if (!fixedOrganization) {
        setSelected(null)
      }
      setRole("member")
      setIsSuperadmin(false)
      setSelectedDepartmentId("")
      setEmail("")
      setMaxUses("1")
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
    setGeneratedOrganization(null)
    setGeneratedRole("member")
    setGeneratedEmail("")
    if (!fixedOrganization) {
      setSelected(null)
    }
    setRole("member")
    setIsSuperadmin(false)
    setSelectedDepartmentId("")
    setEmail("")
    setMaxUses("1")
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
              {generatedRole === "admin"
                ? "The link grants organization admin access."
                : generatedEmail
                  ? "The link is restricted to the specified email."
                  : "The organization invitation link is ready."}
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

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Organization</p>
            <p className="mt-1 truncate text-sm font-medium text-foreground">
              {generatedOrganization?.name || "-"}
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Role</p>
            <p className="mt-1 text-sm font-medium text-foreground capitalize">
              {generatedRole}
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
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
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

          {fixedOrganization ? (
            <div className="space-y-2">
              <Label>Organization</Label>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <p className="text-sm font-medium text-foreground">
                  {fixedOrganization.name}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <OrganizationCombobox
                organizations={organizations}
                value={selectedOrganizationId}
                onValueChange={(organizationId) => {
                  const organization =
                    organizations.find((org) => org.id === organizationId) ??
                    null
                  setSelected(organization)
                }}
                disabled={loading || orgsLoading}
                loading={orgsLoading}
              />
              {orgsError && (
                <p className="text-xs text-destructive">{orgsError}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={(val: string) => {
                const nextRole = val as OrgRole
                setRole(nextRole)
                if (nextRole !== "admin") {
                  setIsSuperadmin(false)
                }
              }}
              disabled={loading}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="content_manager">Content Manager</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {isSuperadminRole
                ? "Superadmins have full governance over the organization, including roles, quorum decisions, and security settings."
                : isAdminRole
                  ? "Admins can manage organization settings, invite members, and have full access to organization data."
                  : isContentManagerRole
                    ? "Content managers can log in to the CMS and publish news articles for the organization."
                    : "Members can access organization data and collaborate with the team."}
            </p>

            {canGrantSuperadmin && role === "admin" && (
              <div className="flex items-start space-x-3 rounded-lg border border-border/60 bg-muted/20 p-3.5">
                <Checkbox
                  id="invite-superadmin"
                  checked={isSuperadmin}
                  onCheckedChange={(checked) =>
                    setIsSuperadmin(checked === true)
                  }
                  disabled={loading}
                />
                <div className="grid gap-1">
                  <Label
                    htmlFor="invite-superadmin"
                    className="cursor-pointer text-sm font-semibold text-foreground"
                  >
                    Superadmin
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Grants highest authority in the organization, including
                    managing other administrators and participating in removal
                    quorums.
                  </p>
                </div>
              </div>
            )}
          </div>

          {isMemberRole && (
            <div className="space-y-2">
              <Label htmlFor="department">
                Department{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Select
                value={selectedDepartmentId}
                onValueChange={setSelectedDepartmentId}
                disabled={
                  loading ||
                  departmentsLoading ||
                  !selectedOrganization ||
                  departments.length === 0
                }
              >
                <SelectTrigger id="department">
                  <SelectValue
                    placeholder={
                      departmentsLoading
                        ? "Loading departments..."
                        : "Select department"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!departmentsLoading && departments.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Members without a department will appear as Unassigned.
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">
              Email{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="member@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="pl-8"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty to allow any email to use the link.
            </p>
            {shouldBeSingleUse && (
              <div className="flex gap-2 rounded-lg border border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                <p>This link will be single-use.</p>
              </div>
            )}
          </div>

          {!shouldBeSingleUse && (
            <div className="space-y-2">
              <Label htmlFor="max-uses">Max uses</Label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Users className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="max-uses"
                    type="number"
                    min="1"
                    max="100"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    disabled={loading}
                    className="pl-8"
                  />
                </div>
                <div className="flex h-9 items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground">
                  uses
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Allowed range: 1 to 100 uses.
              </p>
            </div>
          )}

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
          <Button type="submit" disabled={loading || !selectedOrganization}>
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
