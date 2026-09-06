import type { CSSProperties } from "react"
import type { LucideIcon } from "lucide-react"
import { Activity } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Card } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"

export interface HealthScoreRow {
  label: string
  value: number | null
  icon?: LucideIcon
  tone?: "blue" | "green" | "amber" | "red" | "muted"
  isPending?: boolean
}

interface HealthScoreCardProps {
  title: string
  score: number | null
  scoreLabel?: string
  riskLevel?: "low" | "moderate" | "high" | null
  deltaLabel?: string
  rows: HealthScoreRow[]
  loading?: boolean
  className?: string
  compact?: boolean
}

const toneClasses = {
  blue: {
    icon: "bg-blue-500/15 text-blue-500",
    bar: "bg-blue-500",
    text: "text-blue-500",
  },
  green: {
    icon: "bg-emerald-500/15 text-emerald-500",
    bar: "bg-emerald-500",
    text: "text-emerald-500",
  },
  amber: {
    icon: "bg-amber-500/15 text-amber-500",
    bar: "bg-amber-500",
    text: "text-amber-500",
  },
  red: {
    icon: "bg-rose-500/15 text-rose-500",
    bar: "bg-rose-500",
    text: "text-rose-500",
  },
  muted: {
    icon: "bg-muted text-muted-foreground/50",
    bar: "bg-muted/40",
    text: "text-muted-foreground",
  },
}

export function HealthScoreCard({
  title,
  score,
  scoreLabel = "Good",
  riskLevel,
  deltaLabel,
  rows,
  loading = false,
  className,
  compact = false,
}: HealthScoreCardProps) {
  const hasScore = typeof score === "number"
  const safeScore = hasScore ? Math.min(Math.max(score, 0), 100) : 0
  const gaugeDegrees = Math.round((safeScore / 100) * 180)

  // Determine dynamic risk color for gauge and score
  const computedRisk =
    riskLevel ?? (hasScore ? (safeScore >= 80 ? "low" : safeScore >= 60 ? "moderate" : "high") : null)

  const gaugeColor = !hasScore
    ? "var(--muted)"
    : computedRisk === "high"
    ? "#ef4444"
    : computedRisk === "moderate"
    ? "#f59e0b"
    : "#10b981"

  const scoreTextColor = !hasScore
    ? "text-muted-foreground"
    : computedRisk === "high"
    ? "text-rose-500"
    : computedRisk === "moderate"
    ? "text-amber-500"
    : "text-emerald-500"

  return (
    <Card
      className={cn(
        "relative overflow-visible rounded-3xl border-border/80 bg-card/85 p-6 shadow-sm flex flex-col justify-between",
        compact && "p-5",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-primary" />
          <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
        </div>
        {deltaLabel && (
          <Badge className="rounded-full bg-emerald-500/15 text-emerald-400">
            {deltaLabel}
          </Badge>
        )}
      </div>

      <div
        className={cn(
          "mx-auto mt-7 flex w-56 flex-col items-center",
          compact && "mt-3"
        )}
      >
        {loading ? (
          <Skeleton className="h-28 w-56 rounded-t-full" />
        ) : (
          <>
            <div
              className="relative h-28 w-56 overflow-hidden"
              style={
                {
                  "--gauge-deg": `${gaugeDegrees}deg`,
                  "--gauge-color": gaugeColor,
                } as CSSProperties
              }
            >
              <div className="absolute inset-x-0 top-0 h-56 rounded-full bg-[conic-gradient(from_270deg,var(--gauge-color)_0deg,var(--gauge-color)_var(--gauge-deg),var(--muted)_var(--gauge-deg),var(--muted)_180deg,transparent_180deg)]" />
              <div className="absolute inset-x-5 top-5 h-[184px] rounded-full bg-card" />
              <div className="absolute inset-x-0 bottom-0 text-center">
                <p
                  className={cn(
                    "text-4xl font-bold tracking-tight tabular-nums",
                    scoreTextColor
                  )}
                >
                  {hasScore ? safeScore : "—"}
                </p>
                <p className={cn("text-xs font-semibold capitalize mt-0.5", scoreTextColor)}>
                  {scoreLabel}
                </p>
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
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-lg" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-2 w-24 rounded-full" />
                <Skeleton className="h-4 w-8" />
              </div>
            ))
          : rows.map((row, index) => {
              const isPending =
                row.isPending || row.value === null || row.value === undefined
              const tone = isPending
                ? toneClasses.muted
                : toneClasses[row.tone ?? "green"]
              const Icon = row.icon ?? Activity
              const value = isPending
                ? 0
                : Math.min(Math.max(row.value ?? 0, 0), 100)

              return (
                <div
                  key={`${row.label}-${index}`}
                  className={cn(
                    "flex items-center gap-3 transition-opacity",
                    isPending && "opacity-60"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex size-8 shrink-0 items-center justify-center rounded-lg",
                      tone.icon
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <p
                    className={cn(
                      "min-w-0 flex-1 truncate text-sm font-medium",
                      isPending ? "text-muted-foreground" : "text-foreground"
                    )}
                  >
                    {row.label}
                  </p>
                  <div className="hidden h-2 w-24 overflow-hidden rounded-full bg-muted sm:block">
                    <div
                      className={cn("h-full rounded-full transition-all", tone.bar)}
                      style={{ width: isPending ? "0%" : `${value}%` }}
                    />
                  </div>
                  {isPending ? (
                    <Badge
                      variant="outline"
                      className="border-border/60 text-[10px] text-muted-foreground font-normal px-2 py-0 h-5"
                    >
                      Pending
                    </Badge>
                  ) : (
                    <span
                      className={cn(
                        "w-8 text-right text-sm font-semibold tabular-nums",
                        tone.text
                      )}
                    >
                      {value}
                    </span>
                  )}
                </div>
              )
            })}
      </div>
    </Card>
  )
}
