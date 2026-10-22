import { useEffect, useState, useMemo } from "react"
import {
  fetchActiveMemberForms,
  listAssessments,
  type AssessmentsResponse,
} from "@workspace/api"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  ClipboardList,
  Clock,
  HeartPulse,
  Moon,
  Sparkles,
} from "lucide-react"

import {
  groupResultsIntoSessions,
  computeOverallHealthScore,
  getAssessmentDisplayName,
  buildEmployeeEvolutionTimeline,
} from "./assessment-utils"
import { CHART_PALETTE, ScoreEvolutionChart } from "./score-evolution-chart"
import { HealthScoreHeroCard, heroLevelConfig } from "./health-score-hero-card"

import {
  formatFullName,
  formatFirstName,
  getInitials,
} from "./employee-profile-card"

const scoreStatusConfig = {
  high: {
    label: "Needs Attention",
    variant: "risk-high" as const,
    barColor: "bg-risk-high/85",
    textColor: "text-risk-high",
  },
  moderate: {
    label: "Moderate Risk",
    variant: "risk-moderate" as const,
    barColor: "bg-risk-moderate/90",
    textColor: "text-risk-moderate",
  },
  low: {
    label: "Low Risk",
    variant: "risk-low" as const,
    barColor: "bg-risk-low/85",
    textColor: "text-risk-low",
  },
} as const

function getDomainIcon(scoreId: string, scoreName?: string) {
  const text = `${scoreId} ${scoreName || ""}`.toLowerCase()
  if (text.includes("sleep") || text.includes("stop") || text.includes("apnea")) {
    return Moon
  }
  if (text.includes("diabet") || text.includes("findrisc") || text.includes("glucose")) {
    return Activity
  }
  if (text.includes("cardio") || text.includes("score2") || text.includes("heart")) {
    return HeartPulse
  }
  if (text.includes("mood") || text.includes("phq") || text.includes("depression")) {
    return Sparkles
  }
  return ClipboardCheck
}

interface MemberOverviewProps {
  email: string
  firstName?: string | null
  lastName?: string | null
  name?: string | null
  avatarUrl?: string | null
  assessments?: AssessmentsResponse | null
  showBack?: boolean
  onBack?: () => void
  onNavigate?: (href: string) => void
}

export function MemberOverview({
  email,
  firstName,
  lastName,
  name,
  avatarUrl,
  assessments: initialAssessments,
  showBack = false,
  onBack,
  onNavigate,
}: MemberOverviewProps) {
  const [assessmentsData, setAssessmentsData] = useState<AssessmentsResponse | null>(
    initialAssessments || null
  )
  const [isLoading, setIsLoading] = useState(!initialAssessments)
  const [pendingFormsCount, setPendingFormsCount] = useState(0)

  useEffect(() => {
    if (showBack) return

    let active = true
    async function loadPendingForms() {
      const res = await fetchActiveMemberForms()
      if (!active) return
      const pending =
        res?.active_forms.filter((form) => !form.is_completed).length ?? 0
      setPendingFormsCount(pending)
    }
    void loadPendingForms()
    return () => {
      active = false
    }
  }, [showBack])

  useEffect(() => {
    if (initialAssessments !== undefined) {
      setAssessmentsData(initialAssessments)
      setIsLoading(false)
      return
    }

    let active = true
    async function loadData() {
      setIsLoading(true)
      const res = await listAssessments()
      if (active) {
        setAssessmentsData(res)
        setIsLoading(false)
      }
    }
    void loadData()
    return () => {
      active = false
    }
  }, [initialAssessments])

  const fullName = formatFullName({ email, first_name: firstName, last_name: lastName, name })
  const greetingName = formatFirstName({ email, first_name: firstName, name })
  const initials = getInitials(fullName, email) || "M"

  const sessions = useMemo(() => {
    return groupResultsIntoSessions(assessmentsData)
  }, [assessmentsData])

  const latestSession = sessions[0]

  const computedHealth = useMemo(() => {
    if (!latestSession || !latestSession.results.length) return null
    return computeOverallHealthScore(
      latestSession.results,
      assessmentsData?.overall_health_index,
      assessmentsData?.overall_risk_level,
      assessmentsData?.risk_thresholds
    )
  }, [latestSession, assessmentsData])

  const score = computedHealth?.score ?? null
  const riskKey = (
    computedHealth?.riskLevel === "high"
      ? "high"
      : computedHealth?.riskLevel === "moderate"
        ? "moderate"
        : "low"
  ) as keyof typeof heroLevelConfig
  const config = heroLevelConfig[riskKey]

  const handleNavigate = (href: string) => {
    if (onNavigate) {
      onNavigate(href)
    } else {
      window.location.href = href
    }
  }

  // Identify weaker / priority focus scores to display
  const focusScores = useMemo(() => {
    if (!latestSession?.results?.length) return []
    const lowThresh =
      typeof assessmentsData?.risk_thresholds?.low === "number"
        ? assessmentsData.risk_thresholds.low
        : 80
    const modThresh =
      typeof assessmentsData?.risk_thresholds?.moderate === "number"
        ? assessmentsData.risk_thresholds.moderate
        : 50

    const items = latestSession.results.map((result) => {
      const scoreVal =
        typeof result.health_index === "number"
          ? Math.min(100, Math.max(0, Math.round(result.health_index)))
          : typeof result.raw_value === "number"
            ? Math.min(100, Math.max(0, Math.round(result.raw_value)))
            : 0

      const lowerRisk = (result.risk_level || "").toLowerCase()
      let priority = 1 // 1: low, 2: moderate, 3: high
      let statusKey: "low" | "moderate" | "high" = "low"

      if (
        scoreVal < modThresh ||
        lowerRisk.includes("high") ||
        lowerRisk.includes("severe") ||
        lowerRisk.includes("attention")
      ) {
        priority = 3
        statusKey = "high"
      } else if (
        scoreVal < lowThresh ||
        lowerRisk.includes("moderate") ||
        lowerRisk.includes("elevated") ||
        lowerRisk.includes("mild")
      ) {
        priority = 2
        statusKey = "moderate"
      }

      return {
        ...result,
        scoreVal,
        priority,
        statusKey,
        displayName: getAssessmentDisplayName(result.score_id, result.score_name),
      }
    })

    // Sort by priority descending (high risk first), then by scoreVal ascending (lowest score first)
    items.sort((a, b) => b.priority - a.priority || a.scoreVal - b.scoreVal)

    // Take top 3 focus items
    return items.slice(0, 3)
  }, [latestSession, assessmentsData?.risk_thresholds])

  const hasPendingRisks = useMemo(
    () => focusScores.some((item) => item.statusKey !== "low"),
    [focusScores]
  )

  // Forward-fill monthly timeline from first evaluation to today
  const evolutionData = useMemo(() => {
    return buildEmployeeEvolutionTimeline({
      sessions,
      overallHealthIndex: assessmentsData?.overall_health_index,
      riskThresholds: assessmentsData?.risk_thresholds ?? null,
    })
  }, [sessions, assessmentsData])

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <header>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {showBack && onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                aria-label="Back"
                className="shrink-0 animate-in duration-200 fade-in slide-in-from-left-2"
              >
                <ArrowLeft className="size-5" />
              </Button>
            )}
            <Avatar
              key={avatarUrl ?? "fallback"}
              className="size-14 ring-2 ring-primary/10"
            >
              {avatarUrl && (
                <AvatarImage
                  src={avatarUrl}
                  alt={fullName}
                  className="object-cover"
                />
              )}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {showBack ? fullName : `Hi ${greetingName}`}
              </h1>
              <p className="text-sm text-muted-foreground md:text-base">
                Current health status is{" "}
                <span className={`font-medium ${config.color}`}>
                  {config.label.toLowerCase()}
                </span>
              </p>
            </div>
          </div>
          {showBack && (
            <Badge variant="outline" className="text-sm">
              Employee Details
            </Badge>
          )}
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : !sessions.length ? (
        /* Empty State */
        <Card className="border-dashed">
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-4">
              <ClipboardList className="size-7" />
            </div>
            <h3 className="text-lg font-semibold">No Assessments Found</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              There are no recorded health evaluations for this member yet. Completed form results will appear here.
            </p>
            <Button
              className="mt-6 rounded-full"
              onClick={() => handleNavigate("/forms")}
            >
              Complete First Assessment
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Health Score Hero */}
          <HealthScoreHeroCard
            score={score}
            riskLevel={computedHealth?.riskLevel}
            explanation={computedHealth?.explanation}
            riskThresholds={assessmentsData?.risk_thresholds}
          />

          {/* Key Health Focus & Form Updates */}
          {focusScores.length > 0 && (
            <section className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">
                    {hasPendingRisks ? "Priority Focus Areas" : "Health Focus & Evaluations"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {hasPendingRisks
                      ? "Scores with higher risk indicators. Keep your health forms updated to track your progress."
                      : "All evaluated parameters are in optimal range. Keep forms updated for regular tracking."}
                  </p>
                </div>
                {!showBack && (
                  <Button
                    variant={pendingFormsCount > 0 ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleNavigate("/forms")}
                    className={cn(
                      "self-start sm:self-auto gap-2 rounded-xl text-xs font-semibold shadow-xs transition-all",
                      pendingFormsCount > 0
                        ? "border-transparent"
                        : "border-border/80 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                    )}
                  >
                    <ClipboardList
                      className={cn(
                        "size-3.5",
                        pendingFormsCount === 0 && "text-primary"
                      )}
                    />
                    <span>
                      {pendingFormsCount > 0
                        ? `Complete ${pendingFormsCount} Pending Form${pendingFormsCount === 1 ? "" : "s"}`
                        : "Go to Forms"}
                    </span>
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                )}
              </div>

              <div
                className={cn(
                  "grid gap-4",
                  focusScores.length === 1 && "grid-cols-1",
                  focusScores.length === 2 && "grid-cols-1 sm:grid-cols-2",
                  focusScores.length >= 3 && "grid-cols-1 md:grid-cols-3"
                )}
              >
                {focusScores.map((item) => {
                  const status = scoreStatusConfig[item.statusKey]
                  const Icon = getDomainIcon(item.score_id, item.score_name)

                  return (
                    <Card
                      key={item.score_id}
                      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border-border/60 bg-gradient-to-br from-card via-card to-muted/20 p-5 shadow-xs transition-all hover:border-primary/30 hover:shadow-md"
                    >
                      <div className="space-y-4">
                        {/* Top: Icon on left, Badge on right */}
                        <div className="flex items-center justify-between gap-3">
                          <div
                            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground/80"
                          >
                            <Icon className="size-5" />
                          </div>
                          <Badge
                            variant={status.variant}
                            size="xs"
                          >
                            {status.label}
                          </Badge>
                        </div>

                        {/* Title and Health Index: full card width */}
                        <div className="space-y-1">
                          <h3
                            className="font-semibold text-foreground text-sm leading-snug line-clamp-2 min-h-[2.5rem] flex items-center"
                            title={item.displayName}
                          >
                            {item.displayName}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Health index:{" "}
                            <span className={cn("font-bold tabular-nums", status.textColor)}>
                              {item.scoreVal}/100
                            </span>
                          </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-700 ease-out",
                              status.barColor
                            )}
                            style={{ width: `${Math.min(100, Math.max(8, item.scoreVal))}%` }}
                          />
                        </div>
                      </div>

                      {!showBack && (
                        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                            <Clock className="size-3 text-muted-foreground/70" />
                            <span>Keep updated</span>
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleNavigate("/forms")}
                            className="group/btn h-7 px-2.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg"
                          >
                            <span>Update in Forms</span>
                            <ArrowRight className="ml-1 size-3 transition-transform group-hover/btn:translate-x-0.5" />
                          </Button>
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            </section>
          )}

          {/* Health Score History Evolution Chart */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Evolution</h2>
              <p className="text-sm text-muted-foreground">
                Health score progression over time (higher is healthier)
              </p>
            </div>
            <ScoreEvolutionChart
              title="Health score evolution"
              description=""
              data={evolutionData}
              series={[
                {
                  key: "overall",
                  label: "Health score",
                  color: CHART_PALETTE[0],
                },
              ]}
              yAxisDomain={[0, 100]}
              yAxisTicks={[0, 25, 50, 75, 100]}
              showDots={true}
              showPercentages={false}
              height={240}
              emptyTitle="No evaluations yet"
              emptyMessage="Your health score history will appear here as you complete assessments."
            />
          </section>
        </>
      )}
    </div>
  )
}

export function MemberOverviewSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <div className="flex items-center gap-4">
        <Skeleton className="size-14 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  )
}

