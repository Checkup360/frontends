import { fetchDashboardSummary } from "@workspace/api"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Activity, Building2, ShieldCheck, Users } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { AreaScores } from "@/components/area-scores"
import { EmployeesTable } from "@/components/employees-table"

export function EmployeesPage() {
  const [totalEmployees, setTotalEmployees] = useState<string>("...")

  useEffect(() => {
    let active = true

    async function loadSummary() {
      const summary = await fetchDashboardSummary()
      if (!active) return
      setTotalEmployees(summary ? summary.total_employees.toString() : "0")
    }

    void loadSummary()

    return () => {
      active = false
    }
  }, [])

  const peopleStats = useMemo(
    () => [
      { label: "Total employees", value: totalEmployees, icon: Users },
      { label: "Evaluated this cycle", value: "551", icon: ShieldCheck },
      { label: "Active areas", value: "6", icon: Building2 },
      { label: "Follow-ups", value: "42", icon: Activity },
    ],
    [totalEmployees]
  )

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {peopleStats.map((stat) => (
          <Card key={stat.label} size="sm">
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {stat.value}
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <stat.icon className="size-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <EmployeesTable />
        <Card>
          <CardHeader>
            <CardTitle>Employee access</CardTitle>
            <CardDescription>
              Front-end states for role assignment and rollout.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
              <div>
                <p className="text-sm font-medium">Org admins</p>
                <p className="text-xs text-muted-foreground">
                  Can invite and manage people
                </p>
              </div>
              <Badge variant="secondary">8 users</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
              <div>
                <p className="text-sm font-medium">Employees</p>
                <p className="text-xs text-muted-foreground">
                  Can complete personal checkups
                </p>
              </div>
              <Badge variant="secondary">{totalEmployees} users</Badge>
            </div>
          </CardContent>
        </Card>
      </section>

      <AreaScores />
    </div>
  )
}
