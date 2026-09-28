import { Card } from "@workspace/ui/components/card"
import type { RiskTrendPoint } from "@workspace/api"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface RiskTrendProps {
  trends?: RiskTrendPoint[]
  loading?: boolean
}

export function RiskTrend({ trends, loading }: RiskTrendProps) {
  const chartData =
    trends && trends.length > 0
      ? trends
          .filter((t) => typeof t.average_score === "number")
          .map((t) => ({
            month: t.month_label,
            score: Math.round(t.average_score as number),
          }))
      : []

  return (
    <Card className="border-border/60 p-6 shadow-[var(--shadow-card)]">
      <div>
        <h3 className="text-base font-semibold text-foreground">
          Health score trends
        </h3>
        <p className="text-sm text-muted-foreground">
          Monthly evolution of the aggregated health index (higher is healthier)
        </p>
      </div>
      <div className="mt-4 h-64">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading trends...
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No health trend data available yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="oklch(0.65 0.18 250)"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="100%"
                    stopColor="oklch(0.65 0.18 250)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.92 0.015 210)"
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
                fontSize={12}
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
                formatter={(value: number) => [`${value}%`, "Health index"]}
              />
              <Area
                type="monotone"
                dataKey="score"
                name="Health index"
                stroke="oklch(0.65 0.18 250)"
                fill="url(#g1)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: "oklch(0.65 0.18 250)" }}
          />
          Health index
        </span>
      </div>
    </Card>
  )
}
