import { AreaScores } from "@/components/area-scores"
import { EmployeesTable } from "@/components/employees-table"
import { RiskTrend } from "@/components/risk-trend"
import { StatCard } from "@/components/stat-card"
import { AlertTriangle, TrendingUp, Users } from "lucide-react"

export function DashboardPage() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total employees"
          value="551"
          delta={12}
          icon={Users}
          tone="primary"
        />
        <StatCard
          label="Average score"
          value="76.8"
          delta={-2}
          hint="Last 30 days"
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="High risk"
          value="24"
          delta={3}
          icon={AlertTriangle}
          tone="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
