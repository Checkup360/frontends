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

const data = [
  { month: "Jan", risk: 42 },
  { month: "Feb", risk: 45 },
  { month: "Mar", risk: 49 },
  { month: "Apr", risk: 53 },
  { month: "May", risk: 47 },
  { month: "Jun", risk: 44 },
]

export function RiskTrend() {
  return (
    <Card className="border-border/60 p-6 shadow-[var(--shadow-card)]">
      <div>
        <h3 className="text-base font-semibold text-foreground">Risk trends</h3>
        <p className="text-sm text-muted-foreground">
          Monthly evolution of the aggregated risk index
        </p>
      </div>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
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
              dataKey="risk"
              name="Risk index"
              stroke="oklch(0.55 0.16 35)"
              fill="url(#g1)"
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
          Risk index
        </span>
      </div>
    </Card>
  )
}
