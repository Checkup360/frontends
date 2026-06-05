import { useMemo, useState } from "react"
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
import type { DepartmentResponse, OrganizationEmployee } from "@workspace/api"

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DepartmentTrendsChartProps {
  departments: DepartmentResponse[]
  employees: OrganizationEmployee[]
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

// ─── Synthetic trend generation ───────────────────────────────────────────────
// Generates a plausible 6-month trend from the current risk snapshot.
// Replace with real API data when available.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]

function generateTrend(currentRisk: number, seed: number): number[] {
  const pts: number[] = []
  let v = Math.max(0, currentRisk + (((seed * 7) % 30) - 15))
  for (let i = 0; i < MONTHS.length - 1; i++) {
    v = Math.min(100, Math.max(0, v + (((seed * (i + 3)) % 14) - 6)))
    pts.push(Math.round(v))
  }
  pts.push(currentRisk)
  return pts
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DepartmentTrendsChart({
  departments,
  employees,
}: DepartmentTrendsChartProps) {
  const insights = useMemo(() => {
    return departments.map((dept, idx) => {
      const members = employees.filter(
        (emp) => emp.department?.id === dept.id
      )
      const onboarding = members.filter(
        (emp) => emp.status.toLowerCase() === "onboarding"
      ).length
      const risk =
        members.length === 0
          ? 0
          : Math.round((onboarding / members.length) * 100)
      return {
        id: dept.id,
        name: dept.name,
        risk,
        trend: generateTrend(risk, idx + 1),
        color: PALETTE[idx % PALETTE.length] as string,
      }
    })
  }, [departments, employees])

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(departments.map((d) => d.id))
  )

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
  const chartData = MONTHS.map((month, mIdx) => {
    const row: Record<string, string | number> = { month }
    insights.forEach((dept) => {
      row[dept.id] = dept.trend[mIdx] ?? 0
    })
    return row
  })

  if (departments.length === 0) return null

  return (
    <Card className="rounded-3xl border-border/70 bg-card/80 p-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-1 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
            Department Risk Trends
            <Badge variant="success-light" className="gap-1">
              <TrendingUp className="size-3" aria-hidden="true" />
              Last 6 months
            </Badge>
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Onboarding risk rate per department over time.
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

      {/* Chart — same pattern as MemberOverview & RadarAssessmentCard */}
      <div className="h-[280px]">
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
              formatter={(value: number, name: string) => {
                const dept = insights.find((d) => d.id === name)
                return [`${value}%`, dept?.name ?? name]
              }}
              labelFormatter={(label: string) => `${label} 2025`}
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
                activeDot={{ r: 4, strokeWidth: 0, fill: dept.color }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
        {activeInsights.map((dept) => (
          <span key={dept.id} className="inline-flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-sm"
              style={{ backgroundColor: dept.color }}
            />
            {dept.name}
          </span>
        ))}
      </div>
    </Card>
  )
}
