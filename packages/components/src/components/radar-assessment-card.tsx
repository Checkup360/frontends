import { Card } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts"

export interface RadarAssessmentPoint {
  subject: string
  current: number
  previous: number
}

interface RadarAssessmentCardProps {
  title: string
  description: string
  data: RadarAssessmentPoint[]
  currentLabel?: string
  previousLabel?: string
  loading?: boolean
}

export function RadarAssessmentCard({
  title,
  description,
  data,
  currentLabel = "Current",
  previousLabel = "Previous",
  loading = false,
}: RadarAssessmentCardProps) {
  return (
    <Card className="rounded-3xl border-border/70 bg-card/80 p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="mt-8 h-[300px]">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Skeleton className="size-56 rounded-full" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="72%">
              <PolarGrid
                gridType="polygon"
                stroke="var(--border)"
                strokeOpacity={0.55}
              />
              <PolarAngleAxis
                dataKey="subject"
                tick={{
                  fill: "var(--muted-foreground)",
                  fontSize: 12,
                }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{
                  fill: "var(--muted-foreground)",
                  fontSize: 10,
                }}
                tickCount={5}
                axisLine={false}
              />
              <Radar
                name={currentLabel}
                dataKey="current"
                stroke="#2563eb"
                fill="#2563eb"
                fillOpacity={0.18}
                strokeWidth={2}
              />
              <Radar
                name={previousLabel}
                dataKey="previous"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.08}
                strokeDasharray="5 5"
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-2 flex items-center justify-center gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5 text-blue-500">
          <span className="size-3 rounded-[2px] bg-blue-600" />
          {currentLabel}
        </span>
        <span className="inline-flex items-center gap-1.5 text-amber-500">
          <span className="size-3 rounded-[2px] bg-amber-500" />
          {previousLabel}
        </span>
      </div>
    </Card>
  )
}
