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
import { HeartPulse, Activity, type LucideIcon } from "lucide-react"
import { Card } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

export interface ChartSeries {
  key: string
  label: string
  color?: string
  strokeWidth?: number
}

export interface ScoreEvolutionChartProps {
  title?: string
  description?: string
  badgeLabel?: string
  icon?: LucideIcon
  /** Chronological rows: e.g. [{ month: "Jan", overall: 82, Diabetes: 88 }, ...] */
  data: Array<Record<string, any>>
  /** Available series definitions to plot and toggle */
  series: ChartSeries[]
  /** Data key used for the X-axis (default: "month") */
  xAxisKey?: string
  /** Custom domain for the Y-axis (default: [0, 100] when showPercentages is true, else [0, "auto"]) */
  yAxisDomain?: [number | string, number | string]
  /** Custom ticks for the Y-axis */
  yAxisTicks?: number[]
  /** Whether decimal values are allowed on the Y-axis */
  allowDecimals?: boolean
  /** Whether to show visible dots on each data point */
  showDots?: boolean
  /** Whether to append % symbol to Y-axis and tooltip values */
  showPercentages?: boolean
  loading?: boolean
  emptyTitle?: string
  emptyMessage?: string
  className?: string
  height?: number | string
}

export const CHART_PALETTE = [
  "oklch(0.65 0.18 250)", // Blue / Brand Primary
  "oklch(0.62 0.20 145)", // Green / Emerald
  "oklch(0.60 0.22 320)", // Purple / Violet
  "oklch(0.68 0.20 55)",  // Amber / Yellow
  "oklch(0.62 0.18 195)", // Cyan / Teal
  "oklch(0.60 0.20 30)",  // Orange
  "oklch(0.55 0.18 280)", // Indigo
  "oklch(0.58 0.20 10)",  // Rose
]

export function ScoreEvolutionChart({
  title = "Health score evolution",
  description = "Score progression across medical assessments (higher is healthier)",
  badgeLabel,
  icon: Icon = HeartPulse,
  data,
  series,
  xAxisKey = "month",
  yAxisDomain,
  yAxisTicks,
  allowDecimals,
  showDots = true,
  showPercentages = false,
  loading = false,
  emptyTitle = "No evaluation trends yet",
  emptyMessage = "History will be plotted as new evaluations are completed.",
  className,
  height = 240,
}: ScoreEvolutionChartProps) {
  const effectiveDomain: [number | string, number | string] =
    yAxisDomain ?? (showPercentages ? [0, 100] : [0, "auto"])
  const effectiveTicks =
    yAxisTicks ?? (showPercentages ? [0, 25, 50, 75, 100] : undefined)

  // Enrich series with color palette if not provided
  const enrichedSeries = useMemo(() => {
    return series.map((s, idx) => ({
      ...s,
      color: s.color || CHART_PALETTE[idx % CHART_PALETTE.length],
      gradientId: `grad_${s.key.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
    }))
  }, [series])

  // Active series toggle state
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    () => new Set(series.map((s) => s.key))
  )

  // Sync selected keys when series list changes
  useEffect(() => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      enrichedSeries.forEach((s) => next.add(s.key))
      return next
    })
  }, [enrichedSeries])

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        if (next.size === 1) return prev // always keep at least one active
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  return (
    <Card
      className={cn(
        "rounded-3xl border-border/80 bg-card/85 p-6 shadow-sm flex flex-col justify-between space-y-4",
        className
      )}
    >
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Icon className="size-5 text-primary" />
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              {title}
            </h3>
          </div>
          {badgeLabel && (
            <Badge variant="success-light" className="text-xs self-start sm:self-auto">
              {badgeLabel}
            </Badge>
          )}
        </div>

        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}

        {/* Dynamic Series Toggle Pills */}
        {enrichedSeries.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {enrichedSeries.map((s) => {
              const active = selectedKeys.has(s.key)
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => toggleKey(s.key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium border transition-all cursor-pointer",
                    active
                      ? "bg-card shadow-xs ring-1"
                      : "bg-muted/40 text-muted-foreground/80 opacity-60 hover:opacity-100"
                  )}
                  style={{
                    borderColor: active ? s.color : "transparent",
                    color: active ? "var(--foreground)" : undefined,
                  }}
                >
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: s.color,
                      boxShadow: active ? `0 0 6px ${s.color}` : "none",
                    }}
                  />
                  <span>{s.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {loading ? (
        <div
          className="flex w-full items-center justify-center text-xs text-muted-foreground"
          style={{ height }}
        >
          <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
          Loading score trends...
        </div>
      ) : data.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border border-dashed text-center p-4"
          style={{ height }}
        >
          <Activity className="size-8 text-muted-foreground/40 mb-2" />
          <p className="text-xs font-semibold text-foreground">{emptyTitle}</p>
          <p className="text-xs text-muted-foreground max-w-sm mt-0.5">
            {emptyMessage}
          </p>
        </div>
      ) : (
        <div className="w-full mt-2" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 20, right: 16, left: -10, bottom: 0 }}
            >
              <defs>
                {enrichedSeries.map((s) => (
                  <linearGradient
                    key={s.gradientId}
                    id={s.gradientId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor={s.color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={s.color} stopOpacity={0.0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                className="stroke-muted"
                opacity={0.6}
              />
              <XAxis
                dataKey={xAxisKey}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs text-muted-foreground"
              />
              <YAxis
                domain={effectiveDomain}
                ticks={effectiveTicks}
                allowDecimals={allowDecimals ?? showPercentages}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs text-muted-foreground"
                tickFormatter={(v: number) =>
                  showPercentages ? `${v}%` : `${v}`
                }
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null
                  const isCarried = payload[0]?.payload?._isCarried
                  const measuredDate = payload[0]?.payload?._measuredDate
                  return (
                    <div className="rounded-xl border border-border bg-card p-3 shadow-lg text-xs space-y-2 min-w-[180px]">
                      <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-1.5">
                        <span className="font-semibold text-foreground">{label}</span>
                        {isCarried ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 px-1.5 font-normal text-muted-foreground border-muted-foreground/30"
                          >
                            Active score
                          </Badge>
                        ) : (
                          <Badge variant="success-light" className="text-[10px] py-0 px-1.5 font-normal">
                            Evaluation
                          </Badge>
                        )}
                      </div>
                      {isCarried && measuredDate && (
                        <p className="text-[10px] text-muted-foreground">
                          Latest eval: {measuredDate}
                        </p>
                      )}
                      <div className="space-y-1">
                        {payload.map((item: any) => {
                          const val = item.value
                          return (
                            <div
                              key={item.dataKey}
                              className="flex items-center justify-between gap-4"
                            >
                              <span className="flex items-center gap-1.5 text-muted-foreground">
                                <span
                                  className="size-2 rounded-full shrink-0"
                                  style={{ backgroundColor: item.color }}
                                />
                                <span className="truncate max-w-[130px]">
                                  {item.name}
                                </span>
                              </span>
                              <span className="font-bold tabular-nums text-foreground">
                                {typeof val === "number"
                                  ? showPercentages
                                    ? `${val}%`
                                    : val
                                  : "—"}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                }}
              />
              {enrichedSeries.map((s) => {
                if (!selectedKeys.has(s.key)) return null
                return (
                  <Area
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.label}
                    stroke={s.color}
                    strokeWidth={s.strokeWidth || 2}
                    fill={`url(#${s.gradientId})`}
                    connectNulls={true}
                    dot={(dotProps: any) => {
                      const { cx, cy, payload, index } = dotProps
                      if (!showDots || typeof cx !== "number" || typeof cy !== "number") {
                        return <g key={`dot-${s.key}-${index}`} />
                      }
                      // Hide dot on carried points so only real evaluations are marked
                      if (payload?._isCarried) {
                        return <g key={`dot-${s.key}-${index}`} />
                      }
                      return (
                        <circle
                          key={`dot-${s.key}-${index}`}
                          cx={cx}
                          cy={cy}
                          r={4}
                          stroke={s.color}
                          strokeWidth={2}
                          fill="var(--card)"
                        />
                      )
                    }}
                    activeDot={{
                      r: 6,
                      stroke: s.color,
                      strokeWidth: 2,
                      fill: s.color,
                    }}
                  />
                )
              })}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
