import { listOrganizationEmployees, listDepartments } from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { AlertTriangle, Building2, ShieldCheck, Users } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { EmployeesTable } from "@/components/employees-table"
import {
  OverviewStatCard,
  OverviewStatCardSkeleton,
} from "@workspace/components/components/card"

interface EmployeesSummary {
  total: number
  evaluated: number
  evaluatedPct: number
  departments: number
  atRisk: number
}

export function EmployeesPage() {
  const { user } = useCurrentUser()
  const organizationId = user?.membership?.organization_id
  const [summary, setSummary] = useState<EmployeesSummary | null>(null)

  useEffect(() => {
    let active = true

    async function loadSummary() {
      if (!organizationId) {
        setSummary({
          total: 0,
          evaluated: 0,
          evaluatedPct: 0,
          departments: 0,
          atRisk: 0,
        })
        return
      }

      try {
        const [members, departments] = await Promise.all([
          listOrganizationEmployees(organizationId, ["member"]),
          listDepartments(organizationId),
        ])
        if (!active) return

        const total = members.length
        const evaluated = members.filter(
          (m) => typeof m.overall_health_index === "number"
        ).length
        const evaluatedPct =
          total > 0 ? Math.round((evaluated / total) * 100) : 0
        const atRisk = members.filter(
          (m) => typeof m.overall_health_index === "number" && m.overall_health_index < 60
        ).length

        setSummary({
          total,
          evaluated,
          evaluatedPct,
          departments: departments.length,
          atRisk,
        })
      } catch (error) {
        console.error("Failed to load employees summary:", error)
        if (!active) return
        setSummary({
          total: 0,
          evaluated: 0,
          evaluatedPct: 0,
          departments: 0,
          atRisk: 0,
        })
      }
    }

    void loadSummary()

    return () => {
      active = false
    }
  }, [organizationId])

  const peopleStats = useMemo(() => {
    if (!summary) return []

    return [
      {
        label: "Total employees",
        value: summary.total.toString(),
        hint: "Enrolled members",
        icon: Users,
        tone: "primary" as const,
      },
      {
        label: "Evaluated",
        value: summary.evaluated.toString(),
        hint: `${summary.evaluatedPct}% of members`,
        icon: ShieldCheck,
        tone: "success" as const,
      },
      {
        label: "Active areas",
        value: summary.departments.toString(),
        hint:
          summary.departments === 1
            ? "1 department"
            : `${summary.departments} departments`,
        icon: Building2,
        tone: "primary" as const,
      },
      {
        label: "At risk",
        value: summary.atRisk.toString(),
        hint: "Score below 60%",
        icon: AlertTriangle,
        tone: summary.atRisk > 0 ? ("warning" as const) : ("primary" as const),
      },
    ]
  }, [summary])

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summary === null
          ? Array.from({ length: 4 }).map((_, index) => (
              <OverviewStatCardSkeleton key={index} />
            ))
          : peopleStats.map((stat) => (
              <OverviewStatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                hint={stat.hint}
                icon={stat.icon}
                iconVariant="icon"
                tone={stat.tone}
              />
            ))}
      </section>

      <section>
        <EmployeesTable organizationId={organizationId} />
      </section>
    </div>
  )
}
