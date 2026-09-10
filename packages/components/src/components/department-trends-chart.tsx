import { useEffect, useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { TrendingUp } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Card } from "@workspace/ui/components/card"
import {
  getOrganizationRiskTrends,
  type DepartmentResponse,
  type RiskTrendPoint,
} from "@workspace/api"

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DepartmentTrendsChartProps {
  organizationId?: string
  departments: DepartmentResponse[]
}

// ─── Colour palette ───────────────────────────────────────────────────────────

const PALETTE = [
  "oklch(0.65 0.18 250)",
  "oklch(0.62 0.20 145)",
  "oklch(0.68 0.20 55)",
  "oklch(0.60 0.22 320)",
  "oklch(0.60 0.20 30)",
  "oklch(0.55 0.18 280)",
  "oklch(0.62 0.18 195)",
  "oklch(0.58 0.20 10)",
]

// ─── Component ────────────────────────────────────────────────────────────────

export function DepartmentTrendsChart({
  organizationId,
  departments,
}: DepartmentTrendsChartProps) {
  const [trendsMap, setTrendsMap] = useState<Record<string, RiskTrendPoint[]>>(
    {}
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function loadTrends() {
      if (!organizationId || departments.length === 0) {
        setTrendsMap({})
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const results = await Promise.all(
          departments.map(async (dept) => {
            const pts = await getOrganizationRiskTrends(
              organizationId,
              6,
              dept.id
            )
            return { deptId: dept.id, pts }
          })
        )
        if (!active) return
        const map: Record<string, RiskTrendPoint[]> = {}
        results.forEach(({ deptId, pts }) => {
          map[deptId] = pts
        })
        setTrendsMap(map)
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadTrends()
    return () => {
      active = false
    }
  }, [organizationId, departments])

  // Extract chronological periods from all departments
  const periodList = useMemo(() => {
    const map = new Map<string, string>() // period -> month_label
    Object.values(trendsMap).forEach((points) => {
      points.forEach((p) => {
        map.set(p.period, p.month_label)
      })
    })
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([period, month_label]) => ({ period, month_label }))
  }, [trendsMap])

  const insights = useMemo(() => {
    return departments.map((dept, idx) => {
      const pts = trendsMap[dept.id] || []
      const latest = pts.length > 0 ? pts[pts.length - 1] : null
      return {
        id: dept.id,
        name: dept.name,
        latestScore:
          typeof latest?.average_score === "number"
            ? Math.round(latest.average_score)
            : null,
        latestRisk:
          typeof latest?.risk_index === "number"
            ? Math.round(latest.risk_index)
            : null,
        points: pts,
        color: PALETTE[idx % PALETTE.length] as string,
      }
    })
  }, [departments, trendsMap])

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(departments.map((d) => d.id))
  )

  useEffect(() => {
    setSelected(new Set(departments.map((d) => d.id)))
  }, [departments])

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        if (next.size === 1) return prev // always keep at least one
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })

  const activeInsights = insights.filter((d) => selected.has(d.id))

  // One row per month, keyed by department id
  const chartData = useMemo(() => {
    return periodList.map(({ period, month_label }) => {
      const row: Record<string, string | number | null> = { month: month_label }
      departments.forEach((dept) => {
        const pt = trendsMap[dept.id]?.find((p) => p.period === period)
        row[dept.id] =
          typeof pt?.average_score === "number"
            ? Math.round(pt.average_score)
            : null
      })
      return row
    })
  }, [periodList, departments, trendsMap])

  const periodBadgeText = useMemo(() => {
    if (periodList.length === 0) return null
    if (periodList.length === 1) return periodList[0]?.month_label ?? null
    return `${periodList[0]?.month_label} – ${periodList[periodList.length - 1]?.month_label}`
  }, [periodList])

  if (departments.length === 0) return null

  return (
    <Card className="rounded-3xl border-border/70 bg-card/80 p-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-1 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
            Department Health Trends
            {periodBadgeText && (
              <Badge variant="success-light" className="gap-1">
                <TrendingUp className="size-3" aria-hidden="true" />
                {periodBadgeText}
              </Badge>
            )}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Aggregated health score index per department over time (higher is healthier).
          </p>
        </div>
      </div>

      {/* Department toggle pills */}
      <div className="mb-4 flex flex-wrap gap-2">
        {insights.map((dept) => {
          const isActive = selected.has(dept.id)
          return (
            <button
              key={dept.id}
              type="button"
              onClick={() => toggle(dept.id)}
              className={[
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150",
                isActive
                  ? "border-transparent bg-muted/80 text-foreground shadow-sm"
                  : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground",
              ].join(" ")}
            >
              <span
                className="inline-block size-2 shrink-0 rounded-full transition-opacity"
                style={{
                  backgroundColor: dept.color,
                  opacity: isActive ? 1 : 0.35,
                }}
              />
              {dept.name}
              {isActive && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 12 12"
                  className="size-3 shrink-0 opacity-60"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M2 6l3 3 5-5" />
                </svg>
              )}
            </button>
          )
        })}
      </div>

      {/* Chart */}
      <div className="h-[280px]">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading department trends...
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              No historical evaluations yet
            </p>
            <p className="text-xs">
              As employees complete health evaluations, department trends will
              appear here.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 8, bottom: 0, left: -16 }}
            >
              <defs>
                {activeInsights.map((dept) => (
                  <linearGradient
                    key={dept.id}
                    id={`deptGrad-${dept.id}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={dept.color}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="100%"
                      stopColor={dept.color}
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                strokeOpacity={0.55}
                vertical={false}
              />
              <XAxis
                dataKey="month"
                stroke="oklch(0.5 0.03 220)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="oklch(0.5 0.03 220)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(value: any, name: string) => {
                  const dept = insights.find((d) => d.id === name)
                  return [
                    typeof value === "number" ? `${value}%` : "—",
                    dept?.name ?? name,
                  ]
                }}
              />
              {activeInsights.map((dept) => (
                <Area
                  key={dept.id}
                  type="natural"
                  dataKey={dept.id}
                  name={dept.id}
                  stroke={dept.color}
                  fill={`url(#deptGrad-${dept.id})`}
                  strokeWidth={2}
                  dot={false}
                  connectNulls={true}
                  activeDot={{ r: 4, strokeWidth: 0, fill: dept.color }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}
