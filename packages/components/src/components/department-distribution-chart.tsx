import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { Card } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { CHART_PALETTE } from "./score-evolution-chart"

export interface DepartmentDistributionItem {
  name: string
  value: number
  members: number
  color?: string
}

interface DepartmentDistributionChartProps {
  data: DepartmentDistributionItem[]
  loading?: boolean
  title?: string
  description?: string
  className?: string
}

export function DepartmentDistributionChart({
  data,
  loading = false,
  title = "Assigned by department",
  description = "Members vs. total assigned across departments",
  className,
}: DepartmentDistributionChartProps) {
  const chartData = data.filter((item) => item.value > 0)
  const total = chartData.reduce((sum, item) => sum + item.value, 0)
  const totalMembers = chartData.reduce((sum, item) => sum + item.members, 0)

  const colorFor = (index: number) =>
    CHART_PALETTE[index % CHART_PALETTE.length]

  return (
    <Card
      className={cn(
        "flex h-full flex-col rounded-xl border border-border/60 bg-card p-6 shadow-xs",
        className
      )}
    >
      <div className="pb-2">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {loading ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-6">
          <Skeleton className="size-40 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No members assigned to departments yet.
          </p>
        </div>
      ) : (
        <>
          <div className="relative mx-auto h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={95}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={entry.color ?? colorFor(index)}
                    />
                  ))}
                </Pie>
                <Tooltip
                  wrapperStyle={{ zIndex: 50 }}
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) {
                      return null
                    }
                    const entry = payload[0]
                    const value = Number(entry.value ?? 0)
                    const item = entry.payload as
                      | DepartmentDistributionItem
                      | undefined
                    const members = item?.members ?? 0
                    return (
                      <div
                        className="space-y-0.5 rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md"
                        style={{
                          backgroundColor: "var(--popover)",
                          opacity: 1,
                        }}
                      >
                        <div className="font-medium text-foreground">
                          {entry.name}
                        </div>
                        <div className="text-muted-foreground">
                          {members} {members === 1 ? "member" : "members"}
                        </div>
                        <div className="text-muted-foreground">
                          {value} total
                        </div>
                      </div>
                    )
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {total}
              </span>
              <span className="text-xs text-muted-foreground">assigned</span>
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {totalMembers} {totalMembers === 1 ? "member" : "members"}
              </span>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {chartData.map((item, index) => (
              <li
                key={item.name}
                className="flex items-center justify-between gap-3 text-xs"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: item.color ?? colorFor(index) }}
                  />
                  <span className="truncate text-foreground">{item.name}</span>
                </span>
                <span className="shrink-0 font-medium tabular-nums text-muted-foreground">
                  {item.value}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  )
}
