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
import { EmployeeProfileCard } from "@workspace/components/components/employee-profile-card"
import {
  HealthScoreCard,
  type HealthScoreRow,
} from "@workspace/components/components/health-score-card"
import {
  groupResultsIntoSessions,
  getRiskIcon,
  AssessmentHistoryDialog,
  computeOverallHealthScore,
} from "@workspace/components/components/assessment-utils"
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
  ArrowLeft,
  Moon,
  Apple,
  Clock,
  History,
  Calendar,
  ClipboardList,
  RotateCcw,
  FileText,
  TrendingUp,
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

const STANDARD_MODULES = [
  { id: "findrisc", name: "Diabetes", icon: Apple },
  { id: "stop_bang", name: "Sleep Apnea", icon: Moon },
]

function EmployeeDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Skeleton className="h-96 rounded-xl" />
        </div>
        <div className="md:col-span-2">
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
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

  // Indicators: if a form is not submitted or pending, render as dimmed (value: null, isPending: true) without number
  const dynamicIndicators: HealthScoreRow[] = useMemo(() => {
    const results = activeSession?.results || []

    return STANDARD_MODULES.map((module) => {
      const match = results.find(
        (r) =>
          (r.score_id && r.score_id.toLowerCase().includes(module.id)) ||
          (r.score_name &&
            r.score_name.toLowerCase().includes(module.name.toLowerCase()))
      )

      if (
        !match ||
        match.normalized_value === null ||
        match.normalized_value === undefined
      ) {
        return {
          label: module.name,
          value: null,
          icon: module.icon,
          tone: "muted",
          isPending: true,
        }
      }

      const risk = (match.risk_level || "").toLowerCase()
      let tone: "green" | "amber" | "blue" = "green"
      if (risk.includes("high")) {
        tone = "amber"
      } else if (risk.includes("moderate") || risk.includes("elevated")) {
        tone = "amber"
      }

      return {
        label: match.score_name || module.name,
        value: Math.round(match.normalized_value),
        icon: module.icon,
        tone,
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

    const label =
      finalScore >= 80
        ? "Good"
        : finalScore >= 60
        ? "Moderate risk"
        : "High risk"

    return {
      score: finalScore,
      label,
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

  const handleRefresh = () => {
    void loadEmployee()
  }

  const handleAssignSuccess = () => {
    setIsDialogOpen(false)
    handleRefresh()
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="size-9 rounded-lg border border-border/40 hover:bg-muted/50"
          aria-label="Back"
        >
          <ArrowLeft className="size-4 text-muted-foreground" />
        </Button>
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Employee details
        </h2>
      </div>

      {/* Grid: 2 existing cards */}
      <div className="grid animate-in gap-6 duration-300 fade-in md:grid-cols-3 items-stretch">
        <aside className="md:col-span-1 flex flex-col">
          <EmployeeProfileCard
            email={employee.email}
            status={employee.status}
            roles={employee.roles}
            departmentName={employee.department?.name}
            className="h-full"
            action={
              organizationId ? (
                <Button
                  className="w-full"
                  onClick={() => setIsDialogOpen(true)}
                >
                  {employee.department
                    ? "Change department"
                    : "Assign department"}
                </Button>
              ) : undefined
            }
          />
        </aside>

        <div className="md:col-span-2 flex flex-col">
          {employee.status === "onboarding" ? (
            <Empty className="flex h-full min-h-[380px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/60 p-6 text-center shadow-xs">
              <EmptyHeader className="flex flex-col items-center justify-center text-center">
                <EmptyMedia className="mb-4 animate-none rounded-full bg-foreground/10 p-4 text-foreground">
                  <Clock className="size-8 animate-pulse" />
                </EmptyMedia>
                <EmptyTitle className="text-base font-semibold text-foreground">
                  Pending Onboarding
                </EmptyTitle>
                <EmptyDescription className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
                  Health score information is not available yet. This member is
                  still in the onboarding process.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <HealthScoreCard
              title="Health score"
              score={computedHealth.score}
              scoreLabel={computedHealth.label}
              rows={dynamicIndicators}
              loading={loading || loadingAssessments}
              compact
              className="h-full"
            />
          )}
        </div>
      </div>

      {/* Evolution Chart */}
      {evolutionData.length > 0 && (
        <Card className="border-border/60 p-6 shadow-[var(--shadow-card)]">
          <div className="mb-4 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                Health score evolution
              </h3>
              <Badge variant="success-light" className="gap-1">
                <TrendingUp className="size-3" aria-hidden="true" />
                Progression over time
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Evolution of this employee's health score across completed
              evaluations
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={evolutionData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
        </Card>
      )}

      {/* Card 3: Clinical Study Assessment Preview & History */}
      <Card className="border-2">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Clinical Study Assessments</CardTitle>
              <CardDescription>
                Medical study risk scores evaluated by engine
              </CardDescription>
            </div>
          </div>

          {sessions.length > 0 && (
            <div className="flex items-center gap-2">
              {!isViewingLatest && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSessionId(sessions[0]?.id || null)}
                  className="gap-1 text-xs"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  View latest
                </Button>
              )}
              <Button
                variant={isViewingLatest ? "outline" : "default"}
                size="sm"
                onClick={() => setIsHistoryOpen(true)}
                className="gap-2 text-xs"
              >
                <History className="h-4 w-4" />
                Assessment history
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {loadingAssessments ? (
            <div className="flex justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : !sessions.length ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
              <ClipboardList className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <h4 className="text-base font-semibold">No Clinical Assessments Submitted</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                This employee has not loaded any medical study forms yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Active Session Info Banner */}
              <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-3 px-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">
                    Assessment from {activeSession?.formattedDate}
                  </span>
                  {isViewingLatest ? (
                    <Badge variant="success-light" size="sm">
                      Latest
                    </Badge>
                  ) : (
                    <Badge variant="warning-light" size="sm">
                      History
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {activeSession?.results.length} score(s) evaluated
                </span>
              </div>

              {/* Assessment Preview Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {STANDARD_MODULES.map((module) => {
                  const result = activeSession?.results.find(
                    (r) =>
                      (r.score_id &&
                        r.score_id.toLowerCase().includes(module.id)) ||
                      (r.score_name &&
                        r.score_name
                          .toLowerCase()
                          .includes(module.name.toLowerCase()))
                  )

                  if (
                    !result ||
                    result.normalized_value === null ||
                    result.normalized_value === undefined
                  ) {
                    return (
                      <div
                        key={module.id}
                        className="flex flex-col justify-between rounded-xl border border-dashed border-border/60 bg-muted/20 p-4 opacity-60"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="font-medium text-muted-foreground text-sm">
                              {module.name}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] text-muted-foreground border-border/60"
                            >
                              Pending form
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            This clinical study has not been completed or
                            evaluated yet.
                          </p>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={result.score_id}
                      className="flex flex-col justify-between rounded-xl border bg-card p-4 transition-all hover:shadow-xs"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-semibold text-foreground text-sm">
                            {result.score_name}
                          </span>
                          {getRiskIcon(result.risk_level)}
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          Risk Level:{" "}
                          <span className="font-semibold text-foreground">
                            {result.risk_level || "Unknown"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-3">
                          {result.explanation || "No explanation provided."}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shared Assessment History Dialog */}
      <AssessmentHistoryDialog
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        sessions={sessions}
        activeSessionId={activeSession?.id || null}
        onSelectSession={setSelectedSessionId}
        userDescription={`Select an assessment date and time for ${employee.email} to inspect past evaluation results.`}
      />

      {/* Dialog for assigning department */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {employee.department ? "Change" : "Assign"} Department
            </DialogTitle>
            <DialogDescription>
              Select a department for {employee.email}
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
