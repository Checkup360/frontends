import * as React from "react"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react"

export type RiskLevel = "low" | "moderate" | "high"

export interface RiskBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  level?: RiskLevel | string | null
  score?: number | null
  showIcon?: boolean
  showScore?: boolean
  customLabel?: string
  size?: "default" | "sm" | "xs"
}

export function normalizeRiskLevel(
  level?: string | null,
  score?: number | null,
  thresholds?: { low?: number; moderate?: number } | null
): RiskLevel {
  if (level) {
    const lower = level.toLowerCase()
    if (
      lower.includes("high") ||
      lower.includes("attention") ||
      lower.includes("severe") ||
      lower.includes("critical")
    ) {
      return "high"
    }
    if (
      lower.includes("mod") ||
      lower.includes("elevated") ||
      lower.includes("medium") ||
      lower.includes("mild")
    ) {
      return "moderate"
    }
    if (
      lower.includes("low") ||
      lower.includes("optimal") ||
      lower.includes("good") ||
      lower.includes("normal")
    ) {
      return "low"
    }
  }

  if (typeof score === "number" && !isNaN(score)) {
    const lowCutoff = thresholds?.low ?? 80
    const moderateCutoff = thresholds?.moderate ?? 50
    if (score >= lowCutoff) return "low"
    if (score >= moderateCutoff) return "moderate"
    return "high"
  }

  return "low"
}

export const RISK_CONFIG: Record<
  RiskLevel,
  {
    label: string
    shortLabel: string
    variant: "risk-low" | "risk-moderate" | "risk-high"
    dotClass: string
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  low: {
    label: "Low Risk",
    shortLabel: "Low",
    variant: "risk-low",
    dotClass: "bg-emerald-500",
    icon: CheckCircle2,
  },
  moderate: {
    label: "Moderate Risk",
    shortLabel: "Moderate",
    variant: "risk-moderate",
    dotClass: "bg-amber-400",
    icon: AlertTriangle,
  },
  high: {
    label: "Needs Attention",
    shortLabel: "High",
    variant: "risk-high",
    dotClass: "bg-rose-500",
    icon: AlertCircle,
  },
}

export function RiskBadge({
  level,
  score,
  showIcon = true,
  showScore = false,
  customLabel,
  size = "default",
  className,
  ...props
}: RiskBadgeProps) {
  const normalized = normalizeRiskLevel(level, score)
  const config = RISK_CONFIG[normalized]
  const Icon = config.icon

  const displayLabel = customLabel ?? (size === "xs" ? config.shortLabel : config.label)

  return (
    <Badge
      variant={config.variant}
      size={size}
      className={cn("font-medium select-none", className)}
      {...props}
    >
      {showIcon && <Icon className="size-3 shrink-0" />}
      <span>{displayLabel}</span>
      {showScore && typeof score === "number" && (
        <span className="font-semibold tabular-nums opacity-90">({score})</span>
      )}
    </Badge>
  )
}
