import { useEffect, useState, useMemo } from "react"
import { listAssessments, type AssessmentsResponse } from "@workspace/api"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
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
  Sparkles,
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

function getInitials(name: string) {
  return name
    .split(/[.\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

interface MemberOverviewProps {
  email: string
  assessments?: AssessmentsResponse | null
  showBack?: boolean
  onBack?: () => void
}

export function MemberOverview({
  email,
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

  const memberName = email.split("@")[0] || "Member"
  const initials = getInitials(memberName) || "M"

  const sessions = useMemo(() => {
    return groupResultsIntoSessions(assessmentsData?.results || [])
  }, [assessmentsData])

  const latestSession = sessions[0]

  const computedHealth = useMemo(() => {
    if (!latestSession || !latestSession.results.length) return null
    return computeOverallHealthScore(
      latestSession.results,
      assessmentsData?.overall_score,
      assessmentsData?.overall_risk_level
    )
  }, [latestSession, assessmentsData])

  const score = computedHealth?.score ?? 100
  const config = levelConfig[computedHealth?.riskLevel || "low"]

  const radius = 70
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  // Dynamic evolution chart from session history
  const evolutionData = useMemo(() => {
    if (!sessions.length) return []
    return [...sessions]
      .reverse()
      .map((session, idx, arr) => {
        // For latest session in array (which is the actual latest session), use overall_score from backend if present
        const isLatestInArray = idx === arr.length - 1
        const sessionScore = isLatestInArray && typeof assessmentsData?.overall_score === "number"
          ? Math.round(assessmentsData.overall_score)
          : computeOverallHealthScore(session.results).score

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
            <Avatar className="size-14 ring-2 ring-primary/10">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {showBack ? memberName : `Hi ${memberName}`}
              </h1>
              <p className="text-sm text-muted-foreground md:text-base">
                Current health status is{" "}
                <span className={`font-medium ${config.color}`}>
                  {config.label.toLowerCase()}
                </span>
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* If loading */}
      {isLoading ? (
        <Card className="border-2 p-8">
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </Card>
      ) : !latestSession ? (
        /* Empty State: Prompt user to fill forms */
        <Card className="relative overflow-hidden border-dashed border-2 bg-card/60 p-8 shadow-sm">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ClipboardList className="size-7" />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-xl font-bold tracking-tight">No Health Assessments Yet</h3>
              <p className="text-sm text-muted-foreground">
                Complete your biometrics, sleep, and lifestyle forms to unlock your personalized health score, evaluated risk metrics, and recommendations.
              </p>
            </div>
            <Button asChild className="gap-2">
              <a href="/forms">
                Go to Health Forms
                <ArrowRight className="size-4" />
              </a>
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Health Score Hero */}
          <Card className="border-2">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-xl">Health Score</CardTitle>
                  <CardDescription>
                    Evaluated from your latest clinical studies & health forms
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
                    <span className="text-sm text-muted-foreground">
                      out of 100
                    </span>
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
                        {computedHealth?.explanation}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="font-medium text-[color:var(--success)]">85-100</p>
                      <p className="text-xs text-muted-foreground">Low Risk</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="font-medium text-[color:var(--warning)]">
                        60-84
                      </p>
                      <p className="text-xs text-muted-foreground">Moderate Risk</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="font-medium text-destructive">&lt;60</p>
                      <p className="text-xs text-muted-foreground">Attention Needed</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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
                              className={`${pConfig.bg} ${pConfig.color} text-xs`}
                            >
                              {pConfig.label}
                            </Badge>
                          </div>
                          <div className="space-y-1.5">
                            <h3 className="font-semibold text-base leading-snug">
                              {recommendation.title}
                            </h3>
                            <p className="text-sm leading-relaxed text-muted-foreground">
                              {recommendation.description}
                            </p>
                          </div>
                        </Card>
                      </CarouselItem>
                    )
                  })}
                </CarouselContent>
              </Carousel>
            </section>
          )}

          {/* Health Evolution Chart */}
          {evolutionData.length > 0 && (
            <div className="pt-2">
              <Card className="border-border/60 p-6 shadow-[var(--shadow-card)]">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Health score trend
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Evolution across assessment sessions
                  </p>
                </div>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={evolutionData}
                      margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="memberHealthScoreGradientShared"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="oklch(0.55 0.16 35)"
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="100%"
                            stopColor="oklch(0.55 0.16 35)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="oklch(0.92 0.015 210)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="month"
                        stroke="oklch(0.5 0.03 220)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="oklch(0.5 0.03 220)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 100]}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        name="Health Score"
                        stroke="oklch(0.55 0.16 35)"
                        fill="url(#memberHealthScoreGradientShared)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function MemberOverviewSkeleton({
  showBack = false,
}: {
  showBack?: boolean
}) {
  return (
    <div className="mx-auto w-full max-w-7xl animate-in space-y-8 duration-300 fade-in">
      <header className="space-y-6">
        <div className="flex items-center gap-4">
          {showBack && <Skeleton className="size-10 shrink-0 rounded-lg" />}
          <Skeleton className="size-14 shrink-0 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-44" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
        </div>
      </header>

      <Card className="border-2">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6 py-4 md:flex-row md:justify-between">
            <Skeleton className="size-40 rounded-full md:size-48" />
            <div className="w-full max-w-md space-y-3">
              <Skeleton className="h-24 w-full rounded-lg" />
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-16 rounded-lg" />
                <Skeleton className="h-16 rounded-lg" />
                <Skeleton className="h-16 rounded-lg" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
