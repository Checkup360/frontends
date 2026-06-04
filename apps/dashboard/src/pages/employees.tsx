import { listOrganizationEmployees, listDepartments } from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { Activity, Building2, ShieldCheck, Users } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { EmployeesTable } from "@/components/employees-table"
import {
  OverviewStatCard,
  OverviewStatCardSkeleton,
} from "@workspace/components/components/card"

export function EmployeesPage() {
  const { user } = useCurrentUser()
  const organizationId = user?.membership?.organization_id
  const [totalEmployees, setTotalEmployees] = useState<string>("...")
  const [totalDepartments, setTotalDepartments] = useState<string>("...")

  useEffect(() => {
    let active = true

    async function loadSummary() {
      if (!organizationId) {
        setTotalEmployees("0")
        setTotalDepartments("0")
        return
      }
      const members = await listOrganizationEmployees(organizationId, [
        "member",
      ])
      const departments = await listDepartments(organizationId)
      if (!active) return
      setTotalEmployees(members.length.toString())
      setTotalDepartments(departments.length.toString())
    }

    void loadSummary()

    return () => {
      active = false
    }
  }, [organizationId])

  const peopleStats = useMemo(
    () => [
      { label: "Total employees", value: totalEmployees, icon: Users },
      { label: "Evaluated this cycle", value: "551", icon: ShieldCheck },
      { label: "Active areas", value: totalDepartments, icon: Building2 },
      { label: "Follow-ups", value: "42", icon: Activity },
    ],
    [totalEmployees, totalDepartments]
  )

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {totalEmployees === "..." || totalDepartments === "..."
          ? Array.from({ length: 4 }).map((_, index) => (
              <OverviewStatCardSkeleton key={index} />
            ))
          : peopleStats.map((stat) => (
              <OverviewStatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
                iconVariant="icon"
                tone="primary"
              />
            ))}
      </section>

      <section>
        <EmployeesTable organizationId={organizationId} />
      </section>
    </div>
  )
}
