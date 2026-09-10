import { useEffect, useState, useMemo } from "react"
import {
  getMyAssessmentSubmission,
  listAssessments,
  listMyAssessmentSubmissions,
  type AssessmentSubmissionDetail,
  type AssessmentSubmissionSummary,
  type AssessmentsResponse,
  type AssessmentResultResponse,
} from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  groupResultsIntoSessions,
  computeOverallHealthScore,
  getAssessmentDisplayName,
  AssessmentHistoryDialog,
} from "@workspace/components/components/assessment-utils"
import { HealthScoreHeroCard } from "@workspace/components/components/health-score-hero-card"
import { AssessmentSubmissionHistory } from "@workspace/components/components/assessment-submission-history"
import { formatFullName } from "@workspace/components/components/employee-profile-card"
import { cn } from "@workspace/ui/lib/utils"
import {
  Activity,
  ClipboardList,
  HeartPulse,
  History,
  Moon,
  RotateCcw,
  Sparkles,
} from "lucide-react"
import { Link } from "react-router-dom"

/** Helper to determine theme tone and labels for risk levels (Health Score: 100 = best/optimal, 0 = highest risk) */
function getRiskLevelConfig(riskLevel: string | null, healthScore: number) {
  const lower = (riskLevel || "").toLowerCase()

  // 1. High / Very high risk (red/destructive)
  if (lower.includes("high") || (!lower && healthScore < 50)) {
    return {
      label: riskLevel || "High Risk",
      color: "text-destructive",
      badgeVariant: "destructive" as const,
      badgeClass: "bg-destructive/15 text-destructive border-transparent font-medium",
      ringColor: "stroke-destructive text-destructive",
      barColor: "bg-destructive",
      description: "Needs attention and proactive medical follow-up.",
    }
  }

  // 2. Moderate / Intermediate risk (amber/orange)
  if (lower.includes("moderate") || lower.includes("intermediate") || (!lower && healthScore < 70)) {
    return {
      label: riskLevel || "Moderate Risk",
      color: "text-amber-600 dark:text-amber-400",
      badgeVariant: "outline" as const,
      badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-medium",
      ringColor: "stroke-amber-500 text-amber-500",
      barColor: "bg-amber-500",
      description: "Moderate risk detected. Preventive lifestyle habits advised.",
    }
  }

  // 3. Slightly elevated risk (yellow/gold tone)
  if (lower.includes("elevated") || (!lower && healthScore < 85)) {
    return {
      label: riskLevel || "Slightly Elevated",
      color: "text-yellow-600 dark:text-yellow-400",
      badgeVariant: "outline" as const,
      badgeClass: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30 font-medium",
      ringColor: "stroke-yellow-500 text-yellow-500",
      barColor: "bg-yellow-500",
      description: "Slightly elevated indicators. Minor lifestyle adjustments recommended.",
    }
  }

  // 4. Low risk / Optimal (emerald green)
  return {
    label: riskLevel || "Low Risk",
    color: "text-emerald-600 dark:text-emerald-400",
    badgeVariant: "outline" as const,
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-medium",
    ringColor: "stroke-emerald-500 text-emerald-500",
    barColor: "bg-emerald-500",
    description: "Evaluations within optimal and healthy parameters.",
  }
}

/** Returns the normalized score (0-100) delivered by the backend */
function getNormalizedScore(result: AssessmentResultResponse): number {
  if (result.normalized_value !== null && result.normalized_value !== undefined) {
    return Math.min(100, Math.max(0, Math.round(result.normalized_value)))
  }
  const raw = result.raw_value ?? 0
  return Math.min(100, Math.max(0, Math.round(raw)))
}

/** Maps distinct icon per score category */
function getScoreIcon(scoreId: string, scoreName?: string) {
  const text = `${scoreId} ${scoreName || ""}`.toLowerCase()
  if (text.includes("sleep") || text.includes("stop") || text.includes("apnea")) return Moon
  if (text.includes("diabetes") || text.includes("findrisc") || text.includes("glucose")) return Activity
  return HeartPulse
}

/** Formats technical score names for clean user-facing view */
function formatUserScoreName(result: AssessmentResultResponse) {
  const text = `${result.score_id} ${result.score_name}`.toLowerCase()
  if (text.includes("findrisc") || text.includes("diabetes")) {
    return "Diabetes"
  }
  if (text.includes("stop_bang") || text.includes("stopbang") || text.includes("sleep")) {
    return "Sleep Apnea"
  }
  return getAssessmentDisplayName(result.score_id, result.score_name)
}

/** Circular Radial Progress Component for Individual Scores */
function RadialScore({
  value,
  size = 66,
  strokeWidth = 5.5,
  ringColor = "stroke-primary text-primary",
  trackClass = "text-muted/50",
  sublabel = "/ 100",
}: {
  value: number
  size?: number
  strokeWidth?: number
  ringColor?: string
  trackClass?: string
  sublabel?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const safeVal = Math.min(Math.max(value, 0), 100)
  const offset = circumference - (safeVal / 100) * circumference

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        className="size-full -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className={trackClass}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          className={cn("transition-all duration-700 ease-out", ringColor)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span
          className={cn(
            size < 90 ? "text-lg font-bold" : "text-3xl font-extrabold",
            "tabular-nums text-foreground leading-none"
          )}
        >
          {safeVal}
        </span>
        {sublabel && (
          <span
            className={cn(
              size < 90 ? "text-[9px] mt-0.5" : "text-xs mt-1",
              "font-medium text-muted-foreground"
            )}
          >
            {sublabel}
          </span>
        )}
      </div>
    </div>
  )
}

export function MemberStatusPage() {
  const { user } = useCurrentUser()
  const [assessments, setAssessments] = useState<AssessmentsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [submissions, setSubmissions] = useState<AssessmentSubmissionSummary[]>([])
  const [submissionPage, setSubmissionPage] = useState(1)
  const [submissionHasNext, setSubmissionHasNext] = useState(false)
  const [submissionsLoading, setSubmissionsLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<AssessmentSubmissionDetail | null>(null)
  const [submissionDetailLoading, setSubmissionDetailLoading] = useState(false)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      const data = await listAssessments()
      setAssessments(data)
      setIsLoading(false)
    }
    void load()
  }, [])

  useEffect(() => {
    async function loadSubmissions() {
      setSubmissionsLoading(true)
      const data = await listMyAssessmentSubmissions()
      if (data) {
        setSubmissions(data.items)
        setSubmissionHasNext(data.has_next)
      }
      setSubmissionsLoading(false)
    }
    void loadSubmissions()
  }, [])

  const loadMoreSubmissions = async () => {
    const nextPage = submissionPage + 1
    setSubmissionsLoading(true)
    const data = await listMyAssessmentSubmissions(nextPage)
    if (data) {
      setSubmissions((current) => [...current, ...data.items])
      setSubmissionPage(nextPage)
      setSubmissionHasNext(data.has_next)
    }
    setSubmissionsLoading(false)
  }

  const selectSubmission = async (submission: AssessmentSubmissionSummary) => {
    setSubmissionDetailLoading(true)
    setSelectedSubmission(await getMyAssessmentSubmission(submission.id))
    setSubmissionDetailLoading(false)
  }

  const sessions = useMemo(() => {
    return groupResultsIntoSessions(assessments)
  }, [assessments])

  const activeSession = useMemo(() => {
    if (!sessions.length) return null
    return sessions.find((s) => s.id === selectedSessionId) || sessions[0]
  }, [sessions, selectedSessionId])

  const isViewingLatest = activeSession?.isLatest ?? true

  // Compute Overall Health Score using the shared assessment logic
  const computedHealth = useMemo(() => {
    if (!activeSession || !activeSession.results.length) return null
    return computeOverallHealthScore(
      activeSession.results,
      isViewingLatest ? assessments?.overall_score : null,
      isViewingLatest ? assessments?.overall_risk_level : null
    )
  }, [activeSession, isViewingLatest, assessments])

  const memberName = formatFullName(user) || "Member"

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-12">
      {/* Header & Session Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Assessment Results
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {memberName} · {activeSession ? `Evaluated on ${activeSession.formattedDate}` : "Health status profile"}
          </p>
        </div>

        {sessions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {!isViewingLatest && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSessionId(sessions[0]?.id || null)}
                className="h-8 gap-1.5 text-xs border-border/60"
              >
                <RotateCcw className="size-3.5" />
                View latest
              </Button>
            )}

            <Button
              variant={isViewingLatest ? "outline" : "default"}
              size="sm"
              onClick={() => setIsHistoryOpen(true)}
              className="h-8 gap-1.5 text-xs border-border/60"
            >
              <History className="size-3.5" />
              Assessment history
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="size-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground">Loading your health status...</p>
        </div>
      ) : !sessions.length ? (
        /* Empty State */
        <Card className="border-dashed border-border/80 bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-3">
              <ClipboardList className="size-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No Assessments Yet</h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              You haven't completed any clinical or health forms yet. Fill out your health studies to generate your risk evaluations.
            </p>
            <Button asChild size="sm" className="mt-5 gap-2 rounded-full px-5">
              <Link to="/forms">
                <Sparkles className="size-3.5" />
                Go to Health Forms
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Reused Health Score Hero Card (Exact component from Overview) */}
          <HealthScoreHeroCard
            score={computedHealth?.score ?? null}
            riskLevel={computedHealth?.riskLevel}
            explanation={computedHealth?.explanation}
          />

          {/* Individual Scores Section (Horizontal Row Cards) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Individual Scores
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Risk scores evaluated per domain category
                </p>
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {activeSession?.results.length} category evaluation(s)
              </span>
            </div>

            {/* Horizontal Layout Cards */}
            <div className="space-y-3">
              {activeSession?.results.map((result) => {
                const normScore = getNormalizedScore(result)
                const config = getRiskLevelConfig(result.risk_level, normScore)
                const Icon = getScoreIcon(result.score_id, result.score_name)
                const displayName = formatUserScoreName(result)

                return (
                  <Card
                    key={result.score_id}
                    className="overflow-hidden rounded-xl border border-border/60 bg-gradient-to-r from-muted/20 via-card to-card p-4 sm:p-5 shadow-xs transition-all hover:border-border/90 hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Left: Icon, Topic Name, Badge, Description & View details */}
                      <div className="flex items-start gap-3.5">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground/80">
                          <Icon className="size-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm sm:text-base font-semibold text-foreground">
                              {displayName}
                            </h3>
                            <Badge variant={config.badgeVariant} className={cn(config.badgeClass, "text-[11px] px-2 py-0 h-5")}>
                              {config.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {config.description}
                          </p>
                        </div>
                      </div>

                      {/* Right: Radial gauge only */}
                      <div className="shrink-0">
                        <RadialScore
                          value={normScore}
                          size={66}
                          strokeWidth={5.5}
                          ringColor={config.ringColor}
                          sublabel="/ 100"
                        />
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <AssessmentSubmissionHistory
        submissions={submissions}
        loading={submissionsLoading}
        hasNext={submissionHasNext}
        onLoadMore={loadMoreSubmissions}
        onSelect={selectSubmission}
        selected={selectedSubmission}
        detailLoading={submissionDetailLoading}
      />

      {/* History Dialog */}
      <AssessmentHistoryDialog
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        sessions={sessions}
        activeSessionId={activeSession?.id || null}
        onSelectSession={setSelectedSessionId}
      />
    </div>
  )
}
