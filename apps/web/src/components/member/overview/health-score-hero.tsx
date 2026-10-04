import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Sparkles } from "lucide-react"

interface HealthScoreHeroProps {
  score: number
  level: "low" | "moderate" | "high"
  aiSummary: string
}

const levelConfig = {
  low: {
    color: "text-[color:var(--success)]",
    bg: "bg-[color:var(--success)]/10",
    label: "Low risk",
    ringColor: "stroke-[color:var(--success)]",
  },
  moderate: {
    color: "text-[color:var(--warning)]",
    bg: "bg-[color:var(--warning)]/10",
    label: "Moderate risk",
    ringColor: "stroke-[color:var(--warning)]",
  },
  high: {
    color: "text-destructive",
    bg: "bg-destructive/10",
    label: "Needs attention",
    ringColor: "stroke-destructive",
  },
} as const

export function HealthScoreHero({
  score,
  level,
  aiSummary,
}: HealthScoreHeroProps) {
  const config = levelConfig[level]
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-xl">Your health score</CardTitle>
            <CardDescription>
              Personalized preventive assessment
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={`${config.bg} ${config.color} border-transparent`}
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
                {score}
              </span>
              <span className="text-sm text-muted-foreground">out of 100</span>
            </div>
          </div>

          <div className="w-full max-w-md space-y-3 text-center md:text-left">
            <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-4 text-left">
              <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed font-medium">
                  Preventive analysis
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {aiSummary}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="font-medium text-destructive">&lt;50</p>
                <p className="text-xs text-muted-foreground">Attention</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="font-medium text-[color:var(--warning)]">50-79</p>
                <p className="text-xs text-muted-foreground">Moderate</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="font-medium text-[color:var(--success)]">80-100</p>
                <p className="text-xs text-muted-foreground">Low Risk</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
