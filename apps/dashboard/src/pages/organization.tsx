import {
  getOrganization,
  listOrganizationEmployees,
  type OrganizationEmployee,
} from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { ActionButton } from "@workspace/components/components/action-button"
import {
  OverviewStatCard,
  OverviewStatCardSkeleton,
} from "@workspace/components/components/card"
import { Card } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { EditOrganizationDialog } from "@workspace/components/components/edit-organization-dialog"
import {
  Building2,
  FileText,
  MailPlus,
  Pencil,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { EmployeesTable } from "@/components/employees-table"
import { normalizeRoles } from "@/lib/role-utils"

export function OrganizationPage() {
  const { user, refresh } = useCurrentUser()
  const navigate = useNavigate()
  const organizationId = user?.membership?.organization_id

  // ── Overall Stats Data ──
  const [allMembers, setAllMembers] = useState<OrganizationEmployee[]>([])
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [statsRefreshKey, setStatsRefreshKey] = useState(0)

  // ── Organization Profile Edit Modal State ──
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [orgName, setOrgName] = useState(
    user?.membership?.organization_name || ""
  )
  const [orgLogoUrl, setOrgLogoUrl] = useState<string | null>(
    user?.membership?.organization_logo_url || null
  )

  // Load organization details from API
  useEffect(() => {
    let active = true

    async function loadOrg() {
      if (!organizationId) return
      try {
        const org = await getOrganization(organizationId)
        if (!active || !org) return
        setOrgName(org.name)
        setOrgLogoUrl(org.logo_url ?? null)
      } catch {
        // keep fallback from user.membership
      }
    }

    void loadOrg()

    return () => {
      active = false
    }
  }, [organizationId])

  // Load overall member count stats
  useEffect(() => {
    let active = true

    async function loadStats() {
      if (!organizationId) {
        setAllMembers([])
        setLoadingMeta(false)
        return
      }

      setLoadingMeta(true)
      try {
        const memRes = await listOrganizationEmployees(
          organizationId,
          undefined,
          { includeInactive: true }
        )
        if (!active) return
        setAllMembers(memRes)
      } catch {
        if (!active) return
      } finally {
        if (active) setLoadingMeta(false)
      }
    }

    void loadStats()

    return () => {
      active = false
    }
  }, [organizationId, statsRefreshKey])

  const roleCounts = useMemo(() => {
    let superadmins = 0
    let admins = 0
    let contentManagers = 0
    let regularMembers = 0

    allMembers.forEach((m) => {
      const normalized = normalizeRoles(m.roles)
      if (normalized.includes("superadmin")) superadmins++
      if (normalized.includes("admin")) admins++
      if (normalized.includes("content_manager")) contentManagers++
      if (normalized.includes("member")) regularMembers++
    })

    return { superadmins, admins, contentManagers, regularMembers }
  }, [allMembers])


  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* ── Organization Information Header Card ── */}
      <Card className="rounded-3xl border-border/70 bg-card/80 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary/20 bg-primary/10 text-primary">
              {orgLogoUrl ? (
                <img
                  src={orgLogoUrl}
                  alt={orgName}
                  className="size-full object-cover"
                />
              ) : (
                <Building2 className="size-7" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  {orgName || "Organization"}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Overview of company members, roles, and administrative access.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Pencil className="mr-1.5 size-4" />
              Edit Organization
            </Button>
            <ActionButton
              type="button"
              variant="default"
              icon={MailPlus}
              onClick={() => navigate("/invitations")}
            >
              Invite People
            </ActionButton>
          </div>
        </div>
      </Card>

      {/* ── Edit Organization Modal Dialog ── */}
      {organizationId && (
        <EditOrganizationDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          organizationId={organizationId}
          currentName={orgName}
          currentLogoUrl={orgLogoUrl}
          onSuccess={async (updated) => {
            setOrgName(updated.name)
            setOrgLogoUrl(updated.logoUrl)
            await refresh()
          }}
        />
      )}

      {/* ── Stats KPIs ── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loadingMeta ? (
          Array.from({ length: 4 }).map((_, index) => (
            <OverviewStatCardSkeleton key={index} />
          ))
        ) : (
          <>
            <OverviewStatCard
              icon={Users}
              iconVariant="icon"
              tone="primary"
              label="Total users"
              value={allMembers.length.toString()}
              hint="Organization users"
            />
            <OverviewStatCard
              icon={ShieldCheck}
              iconVariant="icon"
              tone="success"
              label="Admins & Superadmins"
              value={(roleCounts.admins + roleCounts.superadmins).toString()}
              hint={`${roleCounts.superadmins} superadmin${roleCounts.superadmins === 1 ? "" : "s"}, ${roleCounts.admins} admin${roleCounts.admins === 1 ? "" : "s"}`}
            />
            <OverviewStatCard
              icon={FileText}
              iconVariant="icon"
              tone="warning"
              label="Content Managers"
              value={roleCounts.contentManagers.toString()}
              hint="CMS article editors"
            />
            <OverviewStatCard
              icon={UserCheck}
              iconVariant="icon"
              tone="primary"
              label="Health Program Members"
              value={roleCounts.regularMembers.toString()}
              hint="Enrolled in health studies"
            />
          </>
        )}
      </section>


      {/* ── Reusable Employees / Members Table ── */}
      <EmployeesTable
        organizationId={organizationId}
        roles={undefined}
        showRoleFilter={true}
        showRolesColumn={true}
        showScoreColumn={false}
        allowRoleManagement={true}
        showInactiveToggle={false}
        defaultShowInactive={true}
        showStatusColumn={false}
        showAssessmentColumn={false}
        onDataChanged={() => {
          setStatsRefreshKey((k) => k + 1)
        }}
        title="Organization Users & Roles"
        description="Detailed list of all accounts registered in this organization and their assigned roles."
      />
    </div>
  )
}
