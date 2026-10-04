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

function formatRiskLevelLabel(
  riskLevel: string | null,
  score: number,
  riskThresholds?: Record<string, number> | null
): string {
  const low =
    typeof riskThresholds?.low === "number"
      ? riskThresholds.low
      : typeof riskThresholds?.low_risk === "number"
        ? riskThresholds.low_risk
        : 80
  const mod =
    typeof riskThresholds?.moderate === "number"
      ? riskThresholds.moderate
      : typeof riskThresholds?.moderate_risk === "number"
        ? riskThresholds.moderate_risk
        : 50

  if (typeof score === "number" && !isNaN(score)) {
    if (score >= low) {
      return "Low risk"
    }
    if (score >= mod) {
      return "Moderate risk"
    }
    return "High risk"
  }

  if (riskLevel) {
    const lower = riskLevel.toLowerCase()
    if (lower.includes("very high") || lower.includes("severe")) {
      return "Very high risk"
    }
    if (lower.includes("high") || lower.includes("attention")) {
      return "High risk"
    }
    if (lower.includes("moderate")) {
      return "Moderate risk"
    }
    if (lower.includes("elevated") || lower.includes("mild")) {
      return "Slightly elevated risk"
    }
    if (lower.includes("low") || lower.includes("optimal") || lower.includes("good")) {
      return "Low risk"
    }
    return riskLevel
  }

  return "Low risk"
}

/** Helper to determine theme tone and labels for risk levels (Health Index: 0 = high risk/critical, 100 = low risk/optimal) */
function getRiskLevelConfig(
  riskLevel: string | null,
  riskScore: number,
  riskThresholds?: Record<string, number> | null
) {
  const label = formatRiskLevelLabel(riskLevel, riskScore, riskThresholds)
  const lower = label.toLowerCase()

  // 1. Very high / High risk / Needs attention (destructive token)
  if (lower.includes("high") || lower.includes("attention") || lower.includes("severe")) {
    return {
      label,
      color: "text-destructive",
      iconBg: "bg-destructive/10",
      badgeVariant: "outline" as const,
      badgeClass:
        "bg-destructive/10 text-destructive border-destructive/20 font-medium",
      ringColor: "stroke-destructive text-destructive",
      barColor: "bg-destructive",
      description: lower.includes("very high")
        ? "Severe risk indicators detected. Needs attention and proactive medical follow-up."
        : "High risk indicators detected. Needs attention and proactive medical follow-up.",
    }
  }

  // 2. Moderate risk / Slightly elevated (warning token)
  if (
    lower.includes("moderate") ||
    lower.includes("elevated") ||
    lower.includes("mild")
  ) {
    return {
      label,
      color: "text-[color:var(--warning)]",
      iconBg: "bg-[color:var(--warning)]/10",
      badgeVariant: "outline" as const,
      badgeClass:
        "bg-[color:var(--warning)]/10 text-[color:var(--warning)] border-[color:var(--warning)]/20 font-medium",
      ringColor: "stroke-[color:var(--warning)] text-[color:var(--warning)]",
      barColor: "bg-[color:var(--warning)]",
      description:
        lower.includes("elevated") || lower.includes("mild")
          ? "Slightly elevated indicators. Minor lifestyle adjustments recommended."
          : "Moderate risk detected. Preventive lifestyle habits advised.",
    }
  }

  // 3. Low risk / Optimal (success token)
  return {
    label,
    color: "text-[color:var(--success)]",
    iconBg: "bg-[color:var(--success)]/10",
    badgeVariant: "outline" as const,
    badgeClass:
      "bg-[color:var(--success)]/10 text-[color:var(--success)] border-[color:var(--success)]/20 font-medium",
    ringColor: "stroke-[color:var(--success)] text-[color:var(--success)]",
    barColor: "bg-[color:var(--success)]",
    description: "Evaluations within optimal and healthy parameters.",
  }
}

/** Returns the normalized score (0-100) delivered by the backend */
function getNormalizedScore(result: AssessmentResultResponse): number {
  if (
    result.health_index !== null &&
    result.health_index !== undefined
  ) {
    return Math.min(100, Math.max(0, Math.round(result.health_index)))
  }
  const raw = result.raw_value ?? 0
  return Math.min(100, Math.max(0, Math.round(raw)))
}

/** Maps distinct icon per score category */
function getScoreIcon(scoreId: string, scoreName?: string) {
  const text = `${scoreId} ${scoreName || ""}`.toLowerCase()
  if (text.includes("sleep") || text.includes("stop") || text.includes("apnea"))
    return Moon
  if (
    text.includes("diabetes") ||
    text.includes("findrisc") ||
    text.includes("glucose")
  )
    return Activity
  return HeartPulse
}


/** Formats technical score names for clean user-facing view */
function formatUserScoreName(result: AssessmentResultResponse) {
  return getAssessmentDisplayName(result.score_id, result.score_name)
}

/** Circular Radial Progress Component for Individual Scores */
function RadialScore({
  value,
  size = 66,
  strokeWidth = 5.5,
  ringColor = "stroke-primary text-primary",
  scoreColor,
  trackClass = "text-muted/50",
  sublabel = "/ 100",
}: {
  value: number
  size?: number
  strokeWidth?: number
  ringColor?: string
  scoreColor?: string
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
      <svg className="size-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
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
            "leading-none tabular-nums",
            scoreColor ?? "text-foreground"
          )}
        >
          {safeVal}
        </span>
        {sublabel && (
          <span
            className={cn(
              size < 90 ? "mt-0.5 text-[9px]" : "mt-1 text-xs",
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
  const [assessments, setAssessments] = useState<AssessmentsResponse | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  )
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [submissions, setSubmissions] = useState<AssessmentSubmissionSummary[]>(
    []
  )
  const [submissionPage, setSubmissionPage] = useState(1)
  const [submissionHasNext, setSubmissionHasNext] = useState(false)
  const [submissionsLoading, setSubmissionsLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] =
    useState<AssessmentSubmissionDetail | null>(null)
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
      isViewingLatest ? assessments?.overall_health_index : null,
      isViewingLatest ? assessments?.overall_risk_level : null,
      assessments?.risk_thresholds
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
            {memberName} ·{" "}
            {activeSession
              ? `Evaluated on ${activeSession.formattedDate}`
              : "Health status profile"}
          </p>
        </div>

        {sessions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {!isViewingLatest && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSessionId(sessions[0]?.id || null)}
                className="h-8 gap-1.5 border-border/60 text-xs"
              >
                <RotateCcw className="size-3.5" />
                View latest
              </Button>
            )}

            <Button
              variant={isViewingLatest ? "outline" : "default"}
              size="sm"
              onClick={() => setIsHistoryOpen(true)}
              className="h-8 gap-1.5 border-border/60 text-xs"
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
          <p className="text-xs text-muted-foreground">
            Loading your health status...
          </p>
        </div>
      ) : !sessions.length ? (
        /* Empty State */
        <Card className="border-dashed border-border/80 bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <ClipboardList className="size-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              No Assessments Yet
            </h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              You haven't completed any clinical or health forms yet. Fill out
              your health studies to generate your risk evaluations.
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
            riskThresholds={assessments?.risk_thresholds}
          />

          {/* Individual Scores Section (Horizontal Row Cards) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Individual Scores
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Risk scores evaluated per domain category
                </p>
              </div>
                            <span className="text-xs font-medium text-muted-foreground">
                {activeSession?.results.length} category evaluation(s)
              </span>
            </div>

            {/* Horizontal Layout Cards */}
            <div className="space-y-3">
                            {activeSession?.results
                .map((result) => {
                const normScore = getNormalizedScore(result)
                const config = getRiskLevelConfig(
                  result.risk_level,
                  normScore,
                  assessments?.risk_thresholds
                )
                const Icon = getScoreIcon(result.score_id, result.score_name)
                const displayName = formatUserScoreName(result)

                return (
                  <Card
                    key={result.score_id}
                    className="overflow-hidden rounded-xl border border-border/60 bg-gradient-to-r from-muted/20 via-card to-card p-4 shadow-xs transition-all hover:border-border/90 hover:shadow-sm sm:p-5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Left: Icon, Topic Name, Badge, Description & View details */}
                      <div className="flex items-start gap-3.5">
                        <div
                          className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-xl",
                            config.iconBg,
                            config.color
                          )}
                        >
                          <Icon className="size-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground sm:text-base">
                              {displayName}
                            </h3>
                            <Badge
                              variant={config.badgeVariant}
                              className={cn(
                                config.badgeClass,
                                "h-5 px-2 py-0 text-[11px]"
                              )}
                            >
                              {config.label}
                            </Badge>
                          </div>
                          <p className="text-xs leading-relaxed text-muted-foreground">
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
                          scoreColor={config.color}
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
