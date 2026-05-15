import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { TrendingDown, TrendingUp } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export interface OverviewStatCardProps {
  /** Main label/description for the card */
  label: string
  /** Large value to display */
  value: string | number
  /** Percentage change (positive or negative) */
  delta?: number
  /** Optional hint text below the value */
  hint?: string
  /** Footer text - main message */
  footerTitle?: ReactNode
  /** Footer text - secondary message */
  footerDescription?: string
  /** Icon to display in badge (if using icon variant) */
  icon?: LucideIcon
  /** Icon variant: "trending" | "icon" | "none" */
  iconVariant?: "trending" | "icon" | "none"
  /** Color tone for the badge */
  tone?: "primary" | "success" | "warning" | "destructive"
}

const toneMap: Record<string, string> = {
  primary:
    "border-transparent bg-primary/15 text-primary dark:bg-primary/20",
  success:
    "border-transparent bg-[color:var(--success)]/15 text-[color:var(--success)] dark:bg-[color:var(--success)]/20",
  warning:
    "border-transparent bg-[color:var(--warning)]/15 text-[color:var(--warning)] dark:bg-[color:var(--warning)]/20",
  destructive:
    "border-transparent bg-destructive/15 text-destructive dark:bg-destructive/20",
}

export function OverviewStatCard({
  label,
  value,
  delta,
  hint,
  footerTitle,
  footerDescription,
  icon: Icon,
  iconVariant = "trending",
  tone = "primary",
}: OverviewStatCardProps) {
  const positive = (delta ?? 0) >= 0
  const TrendIcon = positive ? TrendingUp : TrendingDown

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {value}
        </CardTitle>
        {hint && (
          <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
        )}
        <CardAction>
          {delta !== undefined && (
            <Badge variant="outline" className={toneMap[tone]}>
              <TrendIcon className="size-4" />
              {positive ? "+" : ""}
              {delta}%
            </Badge>
          )}
          {Icon && iconVariant === "icon" && (
            <Badge variant="outline" className={toneMap[tone]}>
              <Icon className="size-4" />
            </Badge>
          )}
        </CardAction>
      </CardHeader>
      {(footerTitle || footerDescription) && (
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          {footerTitle && (
            <div className="line-clamp-1 flex gap-2 font-medium">
              {footerTitle}
              {positive && iconVariant === "trending" && (
                <TrendingUp className="size-4" />
              )}
              {!positive && iconVariant === "trending" && (
                <TrendingDown className="size-4" />
              )}
            </div>
          )}
          {footerDescription && (
            <div className="text-muted-foreground">{footerDescription}</div>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
