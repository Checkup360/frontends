import { Card } from "@workspace/ui/components/card"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface HealthEvolutionChartProps {
  data: Array<{
    month: string
    score: number
  }>
}

export function HealthEvolutionChart({ data }: HealthEvolutionChartProps) {
  return (
    <Card className="border-border/60 p-6 shadow-[var(--shadow-card)]">
      <div>
        <h3 className="text-base font-semibold text-foreground">
          Health score trend
        </h3>
        <p className="text-sm text-muted-foreground">
          Monthly evolution of your preventive health score
        </p>
      </div>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="memberHealthScoreGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="oklch(0.55 0.16 35)"
                  stopOpacity={0.35}
                />
                <stop
                  offset="100%"
                  stopColor="oklch(0.55 0.16 35)"
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
            />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="score"
              name="Health score"
              stroke="oklch(0.55 0.16 35)"
              fill="url(#memberHealthScoreGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: "oklch(0.55 0.16 35)" }}
          />
          Health score
        </span>
      </div>
    </Card>
  )
}
