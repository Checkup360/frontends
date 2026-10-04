import { useEffect, useState, useMemo } from "react"
import { listAssessments, type AssessmentsResponse } from "@workspace/api"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  groupResultsIntoSessions,
  computeOverallHealthScore,
  type Recommendation,
} from "./assessment-utils"
import { HealthScoreHeroCard, heroLevelConfig } from "./health-score-hero-card"

const priorityConfig = {
  high: {
    label: "High priority",
    color: "text-destructive",
    bg: "bg-destructive/10 border-destructive/20",
  },
  medium: {
    label: "Medium priority",
    color: "text-[color:var(--warning)]",
    bg: "bg-[color:var(--warning)]/10 border-[color:var(--warning)]/20",
  },
  low: {
    label: "Suggestion",
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
  },
} as const

import {
  formatFullName,
  formatFirstName,
  getInitials,
} from "./employee-profile-card"

interface MemberOverviewProps {
  email: string
  firstName?: string | null
  lastName?: string | null
  name?: string | null
  avatarUrl?: string | null
  assessments?: AssessmentsResponse | null
  showBack?: boolean
  onBack?: () => void
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
}: MemberOverviewProps) {
  const [assessmentsData, setAssessmentsData] = useState<AssessmentsResponse | null>(
    initialAssessments || null
  )
  const [isLoading, setIsLoading] = useState(!initialAssessments)

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

  // Dynamic evolution chart from session history
  const evolutionData = useMemo(() => {
    if (!sessions.length) return []
    return [...sessions]
      .reverse()
      .map((session, idx, arr) => {
        // For latest session in array (which is the actual latest session), use overall_health_index from backend if present
        const isLatestInArray = idx === arr.length - 1
        const sessionScore = isLatestInArray && typeof assessmentsData?.overall_health_index === "number"
          ? Math.round(assessmentsData.overall_health_index)
          : computeOverallHealthScore(
              session.results,
              null,
              null,
              assessmentsData?.risk_thresholds
            ).score

        return {
          month: session.formattedDate.split(" ")[0] || "Evaluation",
          score: sessionScore,
        }
      })
  }, [sessions, assessmentsData])

  const recommendationsList: Recommendation[] = computedHealth?.recommendations || []

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
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
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
              onClick={() => {
                window.location.href = "/forms"
              }}
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

          {/* Recommendation Card Carousel */}
          {!showBack && recommendationsList.length > 0 && (
            <section className="space-y-4">
              <Carousel
                opts={{
                  align: "start",
                }}
                className="w-full"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Personalized recommendations
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Suggested actions based on evaluated health risk scores
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <CarouselPrevious className="static translate-x-0 translate-y-0" />
                    <CarouselNext className="static translate-x-0 translate-y-0" />
                  </div>
                </div>

                <CarouselContent className="mt-4 -ml-4 px-px pb-1">
                  {recommendationsList.map((recommendation) => {
                    const Icon = recommendation.icon
                    const pConfig = priorityConfig[recommendation.priority]

                    return (
                      <CarouselItem
                        key={recommendation.id}
                        className="pl-4 md:basis-1/2 lg:basis-1/3"
                      >
                        <Card className="group h-full border-border/60 p-5 space-y-3 transition-all hover:border-primary/25 hover:shadow-sm">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <Icon className="size-5" />
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-xs ${pConfig.bg} ${pConfig.color}`}
                            >
                              {pConfig.label}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-semibold text-foreground leading-snug">
                              {recommendation.title}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {recommendation.description}
                            </p>
                          </div>
                          {recommendation.action && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="group/btn -ml-2 text-xs font-semibold text-primary"
                            >
                              {recommendation.action}
                              <ArrowRight className="ml-1 size-3 transition-transform group-hover/btn:translate-x-1" />
                            </Button>
                          )}
                        </Card>
                      </CarouselItem>
                    )
                  })}
                </CarouselContent>
              </Carousel>
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
            <Card className="p-6">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={evolutionData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="memberScoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      className="text-xs text-muted-foreground"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      className="text-xs text-muted-foreground"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const val = payload[0]?.value as number
                          return (
                            <div className="rounded-lg border bg-background p-2.5 shadow-md text-xs">
                              <p className="font-semibold">{payload[0]?.payload.month}</p>
                              <p className="text-muted-foreground">
                                Score: <span className="font-bold text-foreground">{val}</span> / 100
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="var(--primary)"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#memberScoreGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
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
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  )
}

