import {
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
import {
  Building2,
  FileText,
  MailPlus,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { EmployeesTable } from "@/components/employees-table"

export function OrganizationPage() {
  const { user } = useCurrentUser()
  const navigate = useNavigate()
  const organizationId = user?.membership?.organization_id

  // ── Overall Stats Data ──
  const [allMembers, setAllMembers] = useState<OrganizationEmployee[]>([])
  const [loadingMeta, setLoadingMeta] = useState(true)

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
        const memRes = await listOrganizationEmployees(organizationId)
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
  }, [organizationId])

  const roleCounts = useMemo(() => {
    let admins = 0
    let contentManagers = 0
    let regularMembers = 0

    allMembers.forEach((m) => {
      if (m.roles.includes("admin")) admins++
      if (m.roles.includes("content_manager")) contentManagers++
      if (m.roles.includes("member")) regularMembers++
    })

    return { admins, contentManagers, regularMembers }
  }, [allMembers])

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* ── Organization Information Header Card ── */}
      <Card className="rounded-3xl border-border/70 bg-card/80 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
              <Building2 className="size-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  {user?.membership?.organization_name || "Organization"}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Overview of company members, roles, and administrative access.
              </p>
            </div>
          </div>

          <ActionButton
            type="button"
            variant="default"
            icon={MailPlus}
            onClick={() => navigate("/invitations")}
          >
            Invite People
          </ActionButton>
        </div>
      </Card>

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
              label="Total members"
              value={allMembers.length.toString()}
              hint="Active organization users"
            />
            <OverviewStatCard
              icon={ShieldCheck}
              iconVariant="icon"
              tone="success"
              label="Administrators"
              value={roleCounts.admins.toString()}
              hint="Full access users"
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
              label="Regular Members"
              value={roleCounts.regularMembers.toString()}
              hint="App & health form users"
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
        title="Organization Members & Roles"
        description="Detailed list of all accounts registered in this organization and their assigned roles."
      />
    </div>
  )
}
