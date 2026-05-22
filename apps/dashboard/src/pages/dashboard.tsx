import { AreaScores } from "@/components/area-scores"
import { EmployeesTable } from "@/components/employees-table"
import { RiskTrend } from "@/components/risk-trend"
import { fetchDashboardSummary } from "@workspace/api"
import { OverviewStatCard } from "@workspace/components/components/card"
import { AlertTriangle, TrendingUp, Users } from "lucide-react"
import { useEffect, useState } from "react"

export function DashboardPage() {
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

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <OverviewStatCard
          label="Total employees"
          value={totalEmployees}
          delta={12}
          icon={Users}
          iconVariant="icon"
          tone="primary"
        />
        <OverviewStatCard
          label="Average score"
          value="76.8"
          delta={-2}
          hint="Last 30 days"
          icon={TrendingUp}
          iconVariant="icon"
          tone="success"
        />
        <OverviewStatCard
          label="High risk"
          value="24"
          delta={3}
          icon={AlertTriangle}
          iconVariant="icon"
          tone="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RiskTrend />
        </div>
        <div>
          <AreaScores />
        </div>
      </div>

      <EmployeesTable />
    </div>
  )
}
