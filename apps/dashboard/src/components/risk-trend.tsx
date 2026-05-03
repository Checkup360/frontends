import { Card } from "@workspace/ui/components/card";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { month: "Jan", cardio: 68, stress: 52, activity: 41 },
  { month: "Feb", cardio: 70, stress: 54, activity: 43 },
  { month: "Mar", cardio: 71, stress: 58, activity: 42 },
  { month: "Apr", cardio: 69, stress: 60, activity: 45 },
  { month: "May", cardio: 73, stress: 57, activity: 48 },
  { month: "Jun", cardio: 72, stress: 58, activity: 44 },
];

export function RiskTrend() {
  return (
    <Card className="p-6 border-border/60 shadow-[var(--shadow-card)]">
      <div>
        <h3 className="text-base font-semibold text-foreground">Risk trends</h3>
        <p className="text-sm text-muted-foreground">Monthly evolution of key indicators</p>
      </div>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.45 0.05 120)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="oklch(0.45 0.05 120)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.65 0.08 60)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="oklch(0.65 0.08 60)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.5 0.03 220)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="oklch(0.5 0.03 220)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.015 210)" vertical={false} />
            <XAxis dataKey="month" stroke="oklch(0.5 0.03 220)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="oklch(0.5 0.03 220)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Area type="monotone" dataKey="cardio" name="Cardiometabolic" stroke="oklch(0.45 0.05 120)" fill="url(#g1)" strokeWidth={2} />
            <Area type="monotone" dataKey="stress" name="Stress" stroke="oklch(0.65 0.08 60)" fill="url(#g2)" strokeWidth={2} />
            <Area type="monotone" dataKey="activity" name="Physical activity" stroke="oklch(0.5 0.03 220)" fill="url(#g3)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: "oklch(0.45 0.05 120)" }} />Cardiometabolic</span>
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: "oklch(0.65 0.08 60)" }} />Stress</span>
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: "oklch(0.5 0.03 220)" }} />Physical activity</span>
      </div>
    </Card>
  );
}
