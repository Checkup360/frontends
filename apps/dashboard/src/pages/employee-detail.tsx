import { useEffect, useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  listOrganizationEmployees,
  listEmployeeAssessments,
  type OrganizationEmployee,
  type AssessmentsResponse,
} from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { AssignDepartmentForm } from "@workspace/components/components/assign-department-form"
import {
  HealthScoreCard,
  type HealthScoreRow,
} from "@workspace/components/components/health-score-card"
import {
  groupResultsIntoSessions,
  AssessmentHistoryDialog,
  computeOverallHealthScore,
} from "@workspace/components/components/assessment-utils"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import {
  Activity,
  ArrowLeft,
  Moon,
  Clock,
  History,
  Calendar,
  ClipboardList,
  RotateCcw,
  FileText,
  TrendingUp,
  Mail,
  Building2,
  Edit3,
  HeartPulse,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

/** Standard score topics reusing identical icons from score-weights.tsx */
const SCORE_TOPICS = [
  {
    id: "diabetes",
    matchKey: "findrisc",
    name: "Diabetes",
    subtitle: "Metabolic health",
    icon: Activity,
  },
  {
    id: "sleep_apnea",
    matchKey: "stop_bang",
    name: "Sleep Apnea",
    subtitle: "Respiratory & sleep quality",
    icon: Moon,
  },
]

function getRiskTone(riskLevel?: string | null, value?: number | null) {
  const normRisk = (riskLevel || "").toLowerCase()

  if (normRisk.includes("high") || (typeof value === "number" && value < 60)) {
    return {
      tone: "red" as const,
      riskLevel: "high" as const,
      label: "High risk",
      badgeClass:
        "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
    }
  }

  if (
    normRisk.includes("moderate") ||
    normRisk.includes("elevated") ||
    (typeof value === "number" && value < 80)
  ) {
    return {
      tone: "amber" as const,
      riskLevel: "moderate" as const,
      label: "Moderate risk",
      badgeClass:
        "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    }
  }

  if (typeof value === "number" || normRisk.includes("low")) {
    return {
      tone: "green" as const,
      riskLevel: "low" as const,
      label: "Low risk",
      badgeClass:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    }
  }

  return {
    tone: "muted" as const,
    riskLevel: null,
    label: "Pending",
    badgeClass: "border-border/60 bg-muted/40 text-muted-foreground",
  }
}

function formatFullName(email: string) {
  const prefix = email.split("@")[0] || email
  const parts = prefix.split(/[._-]+/).filter(Boolean)
  if (parts.length > 0) {
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ")
  }
  return prefix
}

function getInitials(fullName: string, email: string) {
  const parts = fullName.split(" ").filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

function EmployeeDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse space-y-6">
      <Skeleton className="h-32 w-full rounded-3xl" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-80 rounded-3xl" />
        <Skeleton className="h-80 rounded-3xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-3xl" />
    </div>
  )
}

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useCurrentUser()
  const organizationId = user?.membership?.organization_id

  const [employee, setEmployee] = useState<OrganizationEmployee | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Assessments state
  const [assessments, setAssessments] = useState<AssessmentsResponse | null>(null)
  const [loadingAssessments, setLoadingAssessments] = useState(true)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  const loadEmployee = async () => {
    if (!organizationId || !id) return
    setLoading(true)
    setError("")
    try {
      const employees = await listOrganizationEmployees(organizationId)
      const found = employees.find((e) => e.id === id)
      if (found) {
        setEmployee(found)
      } else {
        setError("Employee not found.")
      }
    } catch {
      setError("Failed to load employee details.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!organizationId || !id) return
      setLoading(true)
      setError("")
      try {
        const employees = await listOrganizationEmployees(organizationId)
        const found = employees.find((e) => e.id === id)
        if (active) {
          if (found) {
            setEmployee(found)
          } else {
            setError("Employee not found.")
          }
        }
      } catch {
        if (active) setError("Failed to load employee details.")
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [organizationId, id])

  useEffect(() => {
    let active = true
    const loadAssessmentsData = async () => {
      if (!organizationId || !id) return
      setLoadingAssessments(true)
      const data = await listEmployeeAssessments(organizationId, id)
      if (active) {
        setAssessments(data)
        setLoadingAssessments(false)
      }
    }
    void loadAssessmentsData()
    return () => {
      active = false
    }
  }, [organizationId, id])

  const sessions = useMemo(() => {
    return groupResultsIntoSessions(assessments)
  }, [assessments])

  const activeSession = useMemo(() => {
    if (!sessions.length) return null
    return sessions.find((s) => s.id === selectedSessionId) || sessions[0]
  }, [sessions, selectedSessionId])

  const isViewingLatest = activeSession?.isLatest ?? true

  // Indicators: map each score topic with risk-based tone and color
  const dynamicIndicators: HealthScoreRow[] = useMemo(() => {
    const results = activeSession?.results || []

    return SCORE_TOPICS.map((topic) => {
      const match = results.find(
        (r) =>
          (r.score_id &&
            (r.score_id.toLowerCase().includes(topic.id) ||
              r.score_id.toLowerCase().includes(topic.matchKey))) ||
          (r.score_name &&
            r.score_name.toLowerCase().includes(topic.name.toLowerCase()))
      )

      if (
        !match ||
        match.normalized_value === null ||
        match.normalized_value === undefined
      ) {
        return {
          label: topic.name,
          value: null,
          icon: topic.icon,
          tone: "muted" as const,
          isPending: true,
        }
      }

      const val = Math.round(match.normalized_value)
      const riskMeta = getRiskTone(match.risk_level, val)

      return {
        label: match.score_name || topic.name,
        value: val,
        icon: topic.icon,
        tone: riskMeta.tone,
        isPending: false,
      }
    })
  }, [activeSession])

  const hasAnyEvaluated = dynamicIndicators.some(
    (i) => !i.isPending && i.value !== null
  )

  const computedHealth = useMemo(() => {
    if (!hasAnyEvaluated) {
      return {
        score: null,
        label: "Pending assessment",
        riskLevel: null,
      }
    }
    const evaluated = dynamicIndicators.filter(
      (i) => !i.isPending && typeof i.value === "number"
    )
    const calculatedAvg =
      evaluated.length > 0
        ? Math.round(
            evaluated.reduce((sum, i) => sum + (i.value ?? 0), 0) /
              evaluated.length
          )
        : 100

    const finalScore =
      typeof assessments?.overall_score === "number"
        ? Math.round(assessments.overall_score)
        : calculatedAvg

    const riskMeta = getRiskTone(assessments?.overall_risk_level, finalScore)

    return {
      score: finalScore,
      label: riskMeta.label,
      riskLevel: riskMeta.riskLevel,
    }
  }, [hasAnyEvaluated, dynamicIndicators, assessments])

  // Dynamic evolution chart from session history
  const evolutionData = useMemo(() => {
    if (!sessions.length) return []
    return [...sessions]
      .reverse()
      .map((session, idx, arr) => {
        const isLatestInArray = idx === arr.length - 1
        const sessionScore =
          isLatestInArray && typeof assessments?.overall_score === "number"
            ? Math.round(assessments.overall_score)
            : computeOverallHealthScore(session.results).score

        return {
          month: session.formattedDate.split(" ")[0] || "Evaluation",
          score: sessionScore,
        }
      })
  }, [sessions, assessments])

  if (loading) {
    return <EmployeeDetailSkeleton />
  }

  if (error || !employee) {
    return (
      <Card className="mx-auto mt-12 max-w-md border-destructive/20 bg-destructive/5">
        <CardContent className="space-y-4 pt-6 text-center">
          <p className="font-medium text-destructive">
            {error || "Employee not found."}
          </p>
          <Button
            onClick={() => navigate(-1)}
            variant="link"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Go back
          </Button>
        </CardContent>
      </Card>
    )
  }

  const fullName = formatFullName(employee.email)
  const initials = getInitials(fullName, employee.email)
  const roleLabel = employee.roles.includes("admin")
    ? "Administrator"
    : "Member"
  const overallRiskMeta = getRiskTone(
    computedHealth.riskLevel,
    computedHealth.score
  )

  const handleRefresh = () => {
    void loadEmployee()
  }

  const handleAssignSuccess = () => {
    setIsDialogOpen(false)
    handleRefresh()
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-in duration-300 fade-in">
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="size-9 rounded-lg border border-border/40 hover:bg-muted/50 cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="size-4 text-muted-foreground" />
        </Button>
      </div>

      {/* Prominent Employee Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-r from-card via-card to-muted/20 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Large Avatar + Full Info */}
          <div className="flex items-start gap-4 md:gap-6">
            <Avatar className="size-16 shrink-0 ring-4 ring-primary/10 md:size-20">
              <AvatarImage src="" alt={fullName} />
              <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary md:text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {fullName}
                </h1>
                <Badge
                  variant="outline"
                  className={
                    employee.status === "active"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 capitalize px-2.5 py-0.5"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 capitalize px-2.5 py-0.5"
                  }
                >
                  {employee.status}
                </Badge>
                <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-normal">
                  {roleLabel}
                </Badge>
                {computedHealth.score !== null && (
                  <Badge
                    variant="outline"
                    className={`gap-1.5 px-2.5 py-0.5 text-xs font-semibold ${overallRiskMeta.badgeClass}`}
                  >
                    <HeartPulse className="size-3.5" />
                    {overallRiskMeta.label} ({computedHealth.score}%)
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="size-4 text-muted-foreground/70" />
                  <span className="font-medium text-foreground">{employee.email}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Building2 className="size-4 text-muted-foreground/70" />
                  {employee.department ? (
                    <span className="font-medium text-foreground">
                      {employee.department.name}
                    </span>
                  ) : (
                    <span className="italic text-muted-foreground">Unassigned department</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap items-center gap-3 pl-14 lg:pl-0">
            {organizationId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(true)}
                className="gap-2 text-xs rounded-xl cursor-pointer shadow-2xs h-9 px-3.5"
              >
                <Edit3 className="size-3.5" />
                {employee.department ? "Change department" : "Assign department"}
              </Button>
            )}

            {sessions.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsHistoryOpen(true)}
                className="gap-2 text-xs rounded-xl cursor-pointer shadow-2xs h-9 px-3.5"
              >
                <History className="size-3.5" />
                Assessment history ({sessions.length})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Health Section */}
      {employee.status === "onboarding" ? (
        <Empty className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-card/60 p-8 text-center shadow-xs">
          <EmptyHeader className="flex flex-col items-center justify-center text-center">
            <EmptyMedia className="mb-4 rounded-full bg-foreground/10 p-4 text-foreground">
              <Clock className="size-8 animate-pulse" />
            </EmptyMedia>
            <EmptyTitle className="text-base font-semibold text-foreground">
              Pending Onboarding
            </EmptyTitle>
            <EmptyDescription className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Health score evaluations are not available yet. This employee is
              currently completing the onboarding process.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 items-stretch">
          {/* Health Score Overview Card */}
          <HealthScoreCard
            title="Health score"
            score={computedHealth.score}
            scoreLabel={computedHealth.label}
            riskLevel={computedHealth.riskLevel}
            rows={dynamicIndicators}
            loading={loading || loadingAssessments}
            compact
            className="h-full"
          />

          {/* Health Score Evolution Chart */}
          <Card className="rounded-3xl border-border/80 bg-card/85 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-primary" />
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">
                    Health score evolution
                  </h3>
                </div>
                {evolutionData.length > 0 && (
                  <Badge variant="success-light" className="text-xs">
                    Progression
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Score progression across medical assessments
              </p>
            </div>

            {evolutionData.length > 0 ? (
              <div className="h-60 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={evolutionData}
                    margin={{ top: 20, right: 16, left: -6, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="employeeScoreGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--primary)"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--primary)"
                          stopOpacity={0.0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      className="text-xs text-muted-foreground"
                    />
                    <YAxis
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      className="text-xs text-muted-foreground"
                      tickFormatter={(v: number) => `${v}%`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const val = payload[0]?.value as number
                          return (
                            <div className="rounded-lg border bg-background p-2.5 shadow-md text-xs">
                              <p className="font-semibold">
                                {payload[0]?.payload.month}
                              </p>
                              <p className="text-muted-foreground">
                                Score:{" "}
                                <span className="font-bold text-foreground">
                                  {val}%
                                </span>
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
                      fill="url(#employeeScoreGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-60 flex-col items-center justify-center rounded-xl border border-dashed text-center p-4">
                <ClipboardList className="size-8 text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">
                  History will be plotted as new evaluations are completed.
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Clinical Study Assessments - Only shown if not in onboarding */}
      {employee.status !== "onboarding" && (
        <Card className="rounded-3xl border-border/80 bg-card/85 shadow-sm">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="size-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  Clinical Study Assessments
                </CardTitle>
                <CardDescription className="text-xs">
                  Medical risk evaluations calculated by clinical engine
                </CardDescription>
              </div>
            </div>

            {sessions.length > 0 && !isViewingLatest && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSessionId(sessions[0]?.id || null)}
                className="gap-1 text-xs cursor-pointer"
              >
                <RotateCcw className="size-3.5" />
                View latest
              </Button>
            )}
          </CardHeader>

          <CardContent className="space-y-4 pt-1">
            {loadingAssessments ? (
              <div className="flex justify-center p-8">
                <div className="h-7 w-7 animate-spin rounded-full border-3 border-primary border-t-transparent"></div>
              </div>
            ) : !sessions.length ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center">
                <ClipboardList className="mb-3 size-8 text-muted-foreground/40" />
                <h4 className="text-sm font-semibold">
                  No Clinical Assessments Submitted
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  This employee has not completed medical study questionnaires
                  yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Active Session Info Banner */}
                <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3 px-4 text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-3.5 text-primary" />
                    <span className="font-medium text-foreground">
                      Assessment from {activeSession?.formattedDate}
                    </span>
                    {isViewingLatest ? (
                      <Badge variant="success-light" size="sm" className="text-[10px]">
                        Latest
                      </Badge>
                    ) : (
                      <Badge variant="warning-light" size="sm" className="text-[10px]">
                        History
                      </Badge>
                    )}
                  </div>
                  <span className="text-muted-foreground">
                    {activeSession?.results.length} score(s) evaluated
                  </span>
                </div>

                {/* Assessment Modules Grid: Neutral Card styling, color ONLY on the percentage badge */}
                <div className="grid gap-4 md:grid-cols-2">
                  {SCORE_TOPICS.map((topic) => {
                    const result = activeSession?.results.find(
                      (r) =>
                        (r.score_id &&
                          (r.score_id.toLowerCase().includes(topic.id) ||
                            r.score_id.toLowerCase().includes(topic.matchKey))) ||
                        (r.score_name &&
                          r.score_name
                            .toLowerCase()
                            .includes(topic.name.toLowerCase()))
                    )

                    const Icon = topic.icon
                    const isEvaluated =
                      result &&
                      result.normalized_value !== null &&
                      result.normalized_value !== undefined

                    const val = isEvaluated
                      ? Math.round(result.normalized_value as number)
                      : null
                    const riskMeta = getRiskTone(
                      result?.risk_level,
                      val
                    )

                    if (!isEvaluated) {
                      return (
                        <div
                          key={topic.id}
                          className="flex flex-col justify-between rounded-2xl border border-dashed border-border/60 bg-muted/15 p-5 opacity-60"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                  <Icon className="size-4" />
                                </div>
                                <div>
                                  <span className="font-semibold text-muted-foreground text-sm">
                                    {topic.name}
                                  </span>
                                  <p className="text-[11px] text-muted-foreground">
                                    {topic.subtitle}
                                  </p>
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className="border-border/60 text-[10px] text-muted-foreground"
                              >
                                Pending form
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Evaluation has not been completed or calculated yet.
                            </p>
                          </div>
                        </div>
                      )
                    }

                    const hasCustomExplanation =
                      result?.explanation &&
                      result.explanation.trim() !== "" &&
                      result.explanation.toLowerCase() !==
                        "no explanation provided."

                    return (
                      <div
                        key={topic.id}
                        className="flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-5 transition-all hover:shadow-xs"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
                                <Icon className="size-4" />
                              </div>
                              <div>
                                <span className="font-semibold text-foreground text-sm">
                                  {result.score_name || topic.name}
                                </span>
                                <p className="text-[11px] text-muted-foreground">
                                  {topic.subtitle}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-xs font-semibold ${riskMeta.badgeClass}`}
                            >
                              {val}%
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Risk Level:</span>
                            <span className="font-semibold text-foreground capitalize">
                              {result.risk_level || riskMeta.label}
                            </span>
                          </div>

                          {hasCustomExplanation && (
                            <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                              {result.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Shared Assessment History Dialog */}
      <AssessmentHistoryDialog
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        sessions={sessions}
        activeSessionId={activeSession?.id || null}
        onSelectSession={setSelectedSessionId}
        userDescription={`Select an assessment date and time for ${fullName} (${employee.email}) to inspect past evaluation results.`}
      />

      {/* Dialog for assigning department */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {employee.department ? "Change" : "Assign"} Department
            </DialogTitle>
            <DialogDescription>
              Select a department for {fullName} ({employee.email})
            </DialogDescription>
          </DialogHeader>
          {organizationId && (
            <AssignDepartmentForm
              organizationId={organizationId}
              employee={employee}
              onSuccess={handleAssignSuccess}
              compact
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
