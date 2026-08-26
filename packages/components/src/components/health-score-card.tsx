import type { CSSProperties } from "react"
import type { LucideIcon } from "lucide-react"
import { Activity, ChevronRight } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Card } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"

export interface HealthScoreRow {
  label: string
  value: number
  icon?: LucideIcon
  tone?: "blue" | "green" | "amber"
}

interface HealthScoreCardProps {
  title: string
  score: number
  scoreLabel?: string
  deltaLabel?: string
  rows: HealthScoreRow[]
  loading?: boolean
  className?: string
  compact?: boolean
}

const toneClasses = {
  blue: {
    icon: "bg-blue-500/15 text-blue-400",
    bar: "bg-blue-500",
  },
  green: {
    icon: "bg-emerald-500/15 text-emerald-400",
    bar: "bg-emerald-500",
  },
  amber: {
    icon: "bg-amber-500/15 text-amber-400",
    bar: "bg-amber-500",
  },
}

export function HealthScoreCard({
  title,
  score,
  scoreLabel = "Good",
  deltaLabel,
  rows,
  loading = false,
  className,
  compact = false,
}: HealthScoreCardProps) {
  const safeScore = Math.min(Math.max(score, 0), 100)
  const gaugeDegrees = Math.round((safeScore / 100) * 180)

  return (
    <Card className={cn("relative overflow-visible rounded-3xl border-border/80 bg-card/85 p-6 shadow-sm flex flex-col justify-between", compact && "p-5", className)}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <Badge
          variant="outline"
          className="h-8 rounded-full border-border bg-background px-4 shadow-sm"
        >
          <Activity className="size-3.5" />
          {title}
        </Badge>
      </div>

      <div className="flex items-start justify-between gap-4 pt-1">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
        {deltaLabel && (
          <Badge className="rounded-full bg-emerald-500/15 text-emerald-400">
            {deltaLabel}
          </Badge>
        )}
      </div>

      <div className={cn("mx-auto mt-7 flex w-56 flex-col items-center", compact && "mt-3")}>
        {loading ? (
          <Skeleton className="h-28 w-56 rounded-t-full" />
        ) : (
          <>
            <div
              className="relative h-28 w-56 overflow-hidden"
              style={
                {
                  "--gauge-deg": `${gaugeDegrees}deg`,
                } as CSSProperties
              }
            >
              <div className="absolute inset-x-0 top-0 h-56 rounded-full bg-[conic-gradient(from_270deg,var(--primary)_0deg,var(--primary)_var(--gauge-deg),var(--muted)_var(--gauge-deg),var(--muted)_180deg,transparent_180deg)]" />
              <div className="absolute inset-x-5 top-5 h-[184px] rounded-full bg-card" />
              <div className="absolute inset-x-0 bottom-0 text-center">
                <p className="text-4xl font-semibold text-foreground tabular-nums">
                  {safeScore}
                </p>
                <p className="text-sm text-muted-foreground">{scoreLabel}</p>
              </div>
            </div>
            <div className="mt-1 flex w-full justify-between px-1 text-xs text-muted-foreground">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </>
        )}
      </div>

      <div className={cn("mt-8 space-y-5", compact && "mt-4 space-y-3")}>
        {loading
          ? Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-lg" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-2 w-24 rounded-full" />
                <Skeleton className="h-4 w-8" />
              </div>
            ))
          : rows.map((row, index) => {
              const tone = toneClasses[row.tone ?? "green"]
              const Icon = row.icon ?? Activity
              const value = Math.min(Math.max(row.value, 0), 100)

              return (
                <div
                  key={`${row.label}-${index}`}
                  className="flex items-center gap-3"
                >
                  <span
                    className={cn(
                      "inline-flex size-8 shrink-0 items-center justify-center rounded-lg",
                      tone.icon
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {row.label}
                  </p>
                  <div className="hidden h-2 w-24 overflow-hidden rounded-full bg-muted sm:block">
                    <div
                      className={cn("h-full rounded-full", tone.bar)}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-semibold text-foreground tabular-nums">
                    {value}
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              )
            })}
      </div>
    </Card>
  )
}
