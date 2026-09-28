import { AreaScores, type AreaScoreItem } from "@/components/area-scores"
import { EmployeesTable } from "@/components/employees-table"
import { RiskTrend } from "@/components/risk-trend"
import {
  getOrganizationDepartmentAnalytics,
  getOrganizationRiskTrends,
  listDepartments,
  listOrganizationEmployees,
  type DepartmentAnalyticsSummary,
  type DepartmentResponse,
  type OrganizationEmployee,
  type RiskTrendPoint,
} from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import {
  OverviewStatCard,
  OverviewStatCardSkeleton,
} from "@workspace/components/components/card"
import { AlertTriangle, TrendingUp, Users } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

export function DashboardPage() {
  const { user } = useCurrentUser()
  const organizationId = user?.membership?.organization_id

  const [employees, setEmployees] = useState<OrganizationEmployee[]>([])
  const [departments, setDepartments] = useState<DepartmentResponse[]>([])
  const [trends, setTrends] = useState<RiskTrendPoint[]>([])
  const [deptAnalytics, setDeptAnalytics] = useState<
    DepartmentAnalyticsSummary[]
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadData() {
      if (!organizationId) {
        setEmployees([])
        setDepartments([])
        setTrends([])
        setDeptAnalytics([])
        setLoading(false)
        return
      }

      setLoading(true)
      const [depts, emps, trendData, deptAnalyticsData] = await Promise.all([
        listDepartments(organizationId),
        listOrganizationEmployees(organizationId, ["member"]),
        getOrganizationRiskTrends(organizationId, 12),
        getOrganizationDepartmentAnalytics(organizationId),
      ])
      if (!active) return
      setDepartments(depts)
      setEmployees(emps)
      setTrends(trendData || [])
      setDeptAnalytics(deptAnalyticsData || [])
      setLoading(false)
    }

    void loadData()
    return () => {
      active = false
    }
  }, [organizationId])

  // Derive per-department scores from real analytics data
  const areas = useMemo<AreaScoreItem[]>(() => {
    if (deptAnalytics.length > 0) {
      return deptAnalytics.map((dept) => ({
        id: dept.department_id,
        name: dept.name,
        score:
          typeof dept.average_score === "number"
            ? Math.round(dept.average_score)
            : null,
        workers: dept.total_workers,
      }))
    }
    return departments.map((dept) => {
      const members = employees.filter((emp) => emp.department?.id === dept.id)
      return {
        id: dept.id,
        name: dept.name,
        score: null,
        workers: members.length,
      }
    })
  }, [deptAnalytics, departments, employees])

  // Summary stats derived from real data
  const totalEmployees = employees.length.toString()
  const evaluatedAreas = areas.filter((a) => a.score !== null)
  const sortedTrends = useMemo(() => {
    return [...trends].sort((a, b) => a.period.localeCompare(b.period))
  }, [trends])
  const latestTrend =
    sortedTrends.length > 0 ? sortedTrends[sortedTrends.length - 1] : null

  const averageScore =
    latestTrend !== null && typeof latestTrend.average_score === "number"
      ? `${Math.round(latestTrend.average_score)}%`
      : evaluatedAreas.length > 0
        ? `${Math.round(
            evaluatedAreas.reduce((sum, a) => sum + (a.score ?? 0), 0) /
              evaluatedAreas.length
          )}%`
        : "—"

  const highRiskCount = areas
    .filter((a) => a.score !== null && a.score < 60)
    .length.toString()

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {loading ? (
          <OverviewStatCardSkeleton />
        ) : (
          <OverviewStatCard
            label="Total employees"
            value={totalEmployees}
            icon={Users}
            iconVariant="icon"
            tone="primary"
          />
        )}
        {loading ? (
          <OverviewStatCardSkeleton />
        ) : (
          <OverviewStatCard
            label="Average score"
            value={averageScore}
            hint="Aggregated health index"
            icon={TrendingUp}
            iconVariant="icon"
            tone={averageScore === "—" ? "primary" : "success"}
          />
        )}
        {loading ? (
          <OverviewStatCardSkeleton />
        ) : (
          <OverviewStatCard
            label="High risk departments"
            value={highRiskCount}
            hint="Score below 60%"
            icon={AlertTriangle}
            iconVariant="icon"
            tone="warning"
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RiskTrend trends={trends} loading={loading} />
        </div>
        <div className="h-full">
          <AreaScores areas={areas} loading={loading} />
        </div>
      </div>

      <EmployeesTable organizationId={organizationId} />
    </div>
  )
}
