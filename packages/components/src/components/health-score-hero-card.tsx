import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import { Sparkles } from "lucide-react"

export const heroLevelConfig = {
  low: {
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    label: "Low risk",
    ringColor: "stroke-emerald-500",
    variant: "risk-low" as const,
  },
  moderate: {
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    label: "Moderate risk",
    ringColor: "stroke-amber-400",
    variant: "risk-moderate" as const,
  },
  high: {
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10",
    label: "Needs Attention",
    ringColor: "stroke-rose-500",
    variant: "risk-high" as const,
  },
} as const

export interface HealthScoreHeroCardProps {
  score: number | null
  riskLevel?: "low" | "moderate" | "high" | string | null
  riskThresholds?:
    | { low?: number; moderate?: number; low_risk?: number; moderate_risk?: number }
    | Record<string, number>
    | null
  explanation?: string
  title?: string
  description?: string
  className?: string
}

export function HealthScoreHeroCard({
  score,
  riskLevel,
  riskThresholds,
  explanation = "Evaluations within optimal and healthy parameters.",
  title = "Health Score",
  description = "Evaluated from your latest clinical studies & health forms",
  className,
}: HealthScoreHeroCardProps) {
  const lowThreshold =
    typeof riskThresholds?.low === "number"
      ? riskThresholds.low
      : typeof riskThresholds?.low_risk === "number"
        ? riskThresholds.low_risk
        : 80
  const moderateThreshold =
    typeof riskThresholds?.moderate === "number"
      ? riskThresholds.moderate
      : typeof riskThresholds?.moderate_risk === "number"
        ? riskThresholds.moderate_risk
        : 50
  const hasScore = typeof score === "number"

  const normalizedLevel = ((): keyof typeof heroLevelConfig => {
    if (riskLevel) {
      const lower = riskLevel.toLowerCase()
      if (
        lower.includes("high") ||
        lower.includes("attention") ||
        lower.includes("severe")
      ) {
        return "high"
      }
      if (
        lower.includes("mod") ||
        lower.includes("elevated") ||
        lower.includes("inter") ||
        lower.includes("mild")
      ) {
        return "moderate"
      }
      if (
        lower.includes("low") ||
        lower.includes("optimal") ||
        lower.includes("good")
      ) {
        return "low"
      }
    }
    if (hasScore) {
      if (score >= lowThreshold) return "low"
      if (score >= moderateThreshold) return "moderate"
      return "high"
    }
    return "low"
  })()

  const config = hasScore
    ? heroLevelConfig[normalizedLevel] || heroLevelConfig.low
    : {
        bg: "bg-muted/50",
        color: "text-muted-foreground",
        ringColor: "stroke-muted",
        label: "Incomplete",
        variant: "secondary" as const,
      }

  const radius = 70
  const circumference = 2 * Math.PI * radius
  const safeScore = hasScore ? Math.min(Math.max(score, 0), 100) : 0
  const offset = hasScore ? circumference - (safeScore / 100) * circumference : circumference

  return (
    <Card className={cn("border border-border/60 rounded-xl shadow-xs", className)}>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
          <Badge
            variant={config.variant}
            className="font-medium"
          >
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center justify-center gap-6 py-4 md:flex-row md:justify-between">
          <div className="relative flex items-center justify-center">
            <svg
              className="size-40 -rotate-90 transform md:size-48"
              viewBox="0 0 160 160"
              aria-hidden="true"
            >
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className={`${config.ringColor} transition-all duration-1000 ease-out`}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span
                className={`text-5xl font-bold tabular-nums ${config.color}`}
              >
                {hasScore ? safeScore : "—"}
              </span>
              <span className="text-sm text-muted-foreground">out of 100</span>
            </div>
          </div>

          <div className="w-full max-w-md space-y-3 text-center md:text-left">
            <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-4 text-left">
              <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed font-medium">
                  Evaluated Status Summary
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {explanation}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="font-medium text-destructive">&lt;{moderateThreshold}</p>
                <p className="text-xs text-muted-foreground">
                  Attention Needed
                </p>
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="font-medium text-[color:var(--warning)]">
                  {moderateThreshold}–{lowThreshold - 1}
                </p>
                <p className="text-xs text-muted-foreground">Moderate Risk</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="font-medium text-[color:var(--success)]">
                  {lowThreshold}–100
                </p>
                <p className="text-xs text-muted-foreground">Low Risk</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
