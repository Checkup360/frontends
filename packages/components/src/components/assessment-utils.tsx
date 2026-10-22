import type {
  AssessmentResultResponse,
  AssessmentsResponse,
  RiskTrendPoint,
} from "@workspace/api"
import { Badge } from "@workspace/ui/components/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  ClipboardList,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  History,
  Calendar,
  Check,
} from "lucide-react"

export interface ComputedHealthScore {
  score: number | null
  label: "Low risk" | "Moderate risk" | "High risk" | "Incomplete evaluation"
  riskLevel: "low" | "moderate" | "high" | null
  explanation: string
}

export function getAssessmentDisplayName(
  scoreId?: string | null,
  scoreName?: string | null
): string {
  const safeId = scoreId || ""
  const safeName = scoreName || ""
  const text = `${safeId} ${safeName}`.toLowerCase()
  if (text.includes("phq") || text.includes("depression") || text.includes("mood")) {
    return "Mood & Well-being"
  }
  if (text.includes("findrisc") || text.includes("diabetes")) return "Diabetes"
  if (text.includes("stop_bang") || text.includes("stopbang") || text.includes("sleep")) {
    return "Sleep Apnea"
  }
  if (
    text.includes("metabolic_syndrome") ||
    text.includes("metabolic syndrome") ||
    text.includes("metabolic")
  ) {
    return "Metabolic Health"
  }
  if (text.includes("eoss") || text.includes("obesity")) return "Obesity Impact"
  if (text.includes("score2") || text.includes("cardiovascular")) {
    return "Cardiovascular"
  }
  if (text.includes("nordic") || text.includes("nmq") || text.includes("musculoskeletal")) {
    return "Musculoskeletal"
  }
  if (text.includes("audit") || text.includes("alcohol")) {
    return "Alcohol Habits"
  }
  if (text.includes("pss") || text.includes("stress")) {
    return "Stress & Burnout"
  }
  return "Health Evaluation"
}

export function getLatestResultsPerScore(results: AssessmentResultResponse[]): AssessmentResultResponse[] {
  if (!results || results.length === 0) return []

  const latestMap = new Map<string, AssessmentResultResponse>()
  const sorted = [...results].sort((a, b) => {
    const timeA = a.evaluated_at ? new Date(a.evaluated_at).getTime() : 0
    const timeB = b.evaluated_at ? new Date(b.evaluated_at).getTime() : 0
    return timeB - timeA
  })

  for (const item of sorted) {
    const displayName = getAssessmentDisplayName(item.score_id, item.score_name)
    const key = displayName.toLowerCase()
    if (!latestMap.has(key)) {
      latestMap.set(key, item)
    }
  }

  return Array.from(latestMap.values())
}

export function groupResultsIntoSessions(
  input: AssessmentsResponse | AssessmentResultResponse[] | null | undefined
): AssessmentSession[] {
  if (!input) return []

  // If input is an AssessmentsResponse object containing backend-calculated sessions, use them directly
  if (!Array.isArray(input) && input.sessions && input.sessions.length > 0) {
    return input.sessions.map((s, index) => {
      // Deduplicate results inside session by friendly category name
      const uniqueResults = getLatestResultsPerScore(s.results || [])
      return {
        id: s.id,
        evaluatedAt: s.evaluated_at ? new Date(s.evaluated_at) : null,
        formattedDate: formatSessionDate(s.evaluated_at),
        isLatest: index === 0,
        overallScore: s.overall_health_index,
        overallRiskLevel: s.overall_risk_level,
        results: uniqueResults,
        lowestHealthIndexResults: s.lowest_health_index_results,
      }
    })
  }

  // Fallback for legacy raw array
  const results = Array.isArray(input) ? input : input.results || []
  if (results.length === 0) return []

  const sessionGroups: {
    [key: string]: {
      timestamp: number
      dateStr: string
      resultsMap: Map<string, AssessmentResultResponse>
    }
  } = {}

  for (const item of results) {
    const rawTime = item.evaluated_at ? new Date(item.evaluated_at).getTime() : 0
    const bucketTime = rawTime > 0 ? Math.floor(rawTime / 2000) * 2000 : 0
    const key = `session_${bucketTime}`

    if (!sessionGroups[key]) {
      sessionGroups[key] = {
        timestamp: rawTime,
        dateStr: item.evaluated_at || "",
        resultsMap: new Map(),
      }
    }

    const displayName = getAssessmentDisplayName(item.score_id, item.score_name)
    const scoreKey = displayName.toLowerCase()
    if (!sessionGroups[key].resultsMap.has(scoreKey)) {
      sessionGroups[key].resultsMap.set(scoreKey, item)
    }
  }

  const sortedGroups = Object.values(sessionGroups).sort((a, b) => b.timestamp - a.timestamp)

  const sessions: AssessmentSession[] = sortedGroups.map((group, index) => ({
    id: `session_${group.timestamp}_${index}`,
    evaluatedAt: group.timestamp > 0 ? new Date(group.timestamp) : null,
    formattedDate: formatSessionDate(group.dateStr),
    isLatest: index === 0,
    results: Array.from(group.resultsMap.values()),
  }))

  if (sessions.length > 0) {
    sessions[0].results = getLatestResultsPerScore(results)
  }

  return sessions
}


export function computeOverallHealthScore(
  results: AssessmentResultResponse[],
  backendOverallScore?: number | null,
  backendOverallRiskLevel?: string | null,
  riskThresholds?:
    | { low?: number; moderate?: number; low_risk?: number; moderate_risk?: number }
    | Record<string, number>
    | null
): ComputedHealthScore {
  if (!results || results.length === 0) {
    return {
      score: 0,
      label: "Low risk",
      riskLevel: "low",
      explanation: "Complete your health forms to get your personalized risk evaluation.",
    }
  }

  let score: number | null = null
  if (typeof backendOverallScore === "number") {
    score = Math.round(backendOverallScore)
  } else {
    const validScores = results
      .map((r) => r.health_index)
      .filter((v): v is number => typeof v === "number" && !isNaN(v))
    if (validScores.length > 0) {
      score = Math.round(
        validScores.reduce((a, b) => a + b, 0) / validScores.length
      )
    }
  }

  if (score === null) {
    return {
      score: null,
      label: "Incomplete evaluation",
      riskLevel: null,
      explanation:
        "Some evaluations are still pending to calculate your overall health score. Individual disease scores are shown below.",
    }
  }

  const lowThresh =
    typeof riskThresholds?.low === "number"
      ? riskThresholds.low
      : typeof riskThresholds?.low_risk === "number"
        ? riskThresholds.low_risk
        : 80
  const modThresh =
    typeof riskThresholds?.moderate === "number"
      ? riskThresholds.moderate
      : typeof riskThresholds?.moderate_risk === "number"
        ? riskThresholds.moderate_risk
        : 50

  let label: "Low risk" | "Moderate risk" | "High risk" = "Low risk"
  let riskLevel: "low" | "moderate" | "high" = "low"
  let explanation =
    "Your preventive health indicators show a favorable status. Keep up your active lifestyle!"

  if (score !== null) {
    if (score >= lowThresh) {
      label = "Low risk"
      riskLevel = "low"
      explanation =
        "Your preventive health indicators show a favorable status. Keep up your active lifestyle!"
    } else if (score >= modThresh) {
      label = "Moderate risk"
      riskLevel = "moderate"
      explanation =
        "Your health profile shows moderate risk indicators. Consider making lifestyle adjustments to improve your parameters."
    } else {
      label = "High risk"
      riskLevel = "high"
      explanation =
        "One or more evaluations show elevated risk parameters requiring preventive care and lifestyle modifications."
    }
  } else if (backendOverallRiskLevel) {
    const lowerRisk = backendOverallRiskLevel.toLowerCase()
    if (lowerRisk.includes("high") || lowerRisk.includes("attention") || lowerRisk.includes("severe")) {
      label = "High risk"
      riskLevel = "high"
      explanation =
        "One or more evaluations show elevated risk parameters requiring preventive care and lifestyle modifications."
    } else if (
      lowerRisk.includes("moderate") ||
      lowerRisk.includes("elevated") ||
      lowerRisk.includes("mild") ||
      lowerRisk.includes("inter")
    ) {
      label = "Moderate risk"
      riskLevel = "moderate"
      explanation =
        "Your health profile shows moderate risk indicators. Consider making lifestyle adjustments to improve your parameters."
    } else {
      label = "Low risk"
      riskLevel = "low"
      explanation =
        "Your preventive health indicators show a favorable status. Keep up your active lifestyle!"
    }
  }

  return {
    score,
    label,
    riskLevel,
    explanation,
  }
}

export interface AssessmentSession {
  id: string
  evaluatedAt: Date | null
  formattedDate: string
  isLatest: boolean
  overallScore?: number | null
  overallRiskLevel?: string | null
  results: AssessmentResultResponse[]
  /** Backend-selected active scores with the lowest health index, worst first. */
  lowestHealthIndexResults?: AssessmentResultResponse[]
}

export function formatSessionDate(dateString?: string | null): string {
  if (!dateString) return "Date unavailable"
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString

  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  return `${day}/${month}/${year} ${hours}:${minutes}`
}



export function getRiskIcon(riskLevel: string | null) {
  if (!riskLevel) return <ClipboardList className="h-5 w-5 text-muted-foreground" />
  const lowerRisk = riskLevel.toLowerCase()
  if (lowerRisk.includes("high") || lowerRisk.includes("attention")) return <AlertCircle className="h-5 w-5 text-destructive" />
  if (lowerRisk.includes("moderate") || lowerRisk.includes("elevated") || lowerRisk.includes("mild")) return <AlertTriangle className="h-5 w-5 text-[color:var(--warning)]" />
  if (lowerRisk.includes("low") || lowerRisk.includes("optimal") || lowerRisk.includes("good")) return <CheckCircle2 className="h-5 w-5 text-[color:var(--success)]" />
  return <ShieldAlert className="h-5 w-5 text-muted-foreground" />
}

export interface AssessmentHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessions: AssessmentSession[]
  activeSessionId: string | null
  onSelectSession: (sessionId: string) => void
  userDescription?: string
}

export function AssessmentHistoryDialog({
  open,
  onOpenChange,
  sessions,
  activeSessionId,
  onSelectSession,
  userDescription = "Select a date and time to view the risk results from that specific evaluation session.",
}: AssessmentHistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Medical Assessment History
          </DialogTitle>
          <DialogDescription>{userDescription}</DialogDescription>
        </DialogHeader>

        <div className="mt-2 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
          {sessions.map((session) => {
            const isSelected = activeSessionId === session.id
            return (
              <button
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id)
                  onOpenChange(false)
                }}
                className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all hover:border-primary/50 ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "bg-card hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isSelected ? <Check className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="font-medium text-foreground text-sm flex items-center gap-2">
                      {session.formattedDate}
                      {session.isLatest && (
                        <Badge variant="success-light" size="xs">
                          Latest
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {session.results.length} score(s) evaluated
                    </div>
                  </div>
                </div>
                {isSelected && (
                  <span className="text-xs font-semibold text-primary">Selected</span>
                )}
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export interface EmployeeEvolutionOptions {
  sessions: AssessmentSession[]
  overallHealthIndex?: number | null
  riskThresholds?: Record<string, number> | null
  scoreWeights?: Record<string, number> | null
  filterScore?: (scoreId: string, scoreName: string) => boolean
}

export interface EvolutionDataPoint {
  month: string
  period: string
  overall?: number | null
  [key: string]: string | number | boolean | null | undefined
  _isCarried?: boolean
  _measuredDate?: string
}

/**
 * Builds a chronological monthly timeline for an employee starting strictly at their
 * first recorded evaluation and forward-filling (carrying forward) values into subsequent
 * months up to the current date. Does not backfill before the first evaluation.
 *
 * Always produces EXACTLY ONE point per calendar month — multiple submissions
 * in the same month are consolidated (latest value per study wins).
 */
export function buildEmployeeEvolutionTimeline({
  sessions,
  overallHealthIndex,
  riskThresholds,
  filterScore,
}: EmployeeEvolutionOptions): EvolutionDataPoint[] {
  if (!sessions || sessions.length === 0) return []

  // Sort sessions chronologically: oldest to newest
  const sortedSessions = [...sessions].sort((a, b) => {
    const timeA = a.evaluatedAt ? a.evaluatedAt.getTime() : 0
    const timeB = b.evaluatedAt ? b.evaluatedAt.getTime() : 0
    return timeA - timeB
  })

  const earliestDate = sortedSessions[0]?.evaluatedAt || new Date()
  const now = new Date()

  const startYear = earliestDate.getFullYear()
  const startMonth = earliestDate.getMonth()
  const endYear = Math.max(startYear, now.getFullYear())
  const endMonth =
    endYear === startYear ? Math.max(startMonth, now.getMonth()) : now.getMonth()

  const isMultiYear = endYear > startYear
  const MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ]

  const formatPeriodLabel = (y: number, m: number) => {
    const name = MONTH_NAMES[m]
    return isMultiYear ? `${name} '${String(y).slice(-2)}` : name
  }

  // The globally-latest session id (to pick up backend-calculated overall_health_index).
  // sortedSessions is ascending, so the last element is the most recent regardless of input order.
  const latestSessionId = sortedSessions[sortedSessions.length - 1]?.id

  // ── Step 1: Consolidate all sessions in the same calendar month into one snapshot.
  // Sessions are sorted oldest→newest, so later sessions overwrite earlier ones per study key.
  const monthSnapshots = new Map<string, {
    overall: number | null
    studies: Record<string, number>
    date: string
  }>()

  for (const s of sortedSessions) {
    const d = s.evaluatedAt || new Date()
    const pKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`

    if (!monthSnapshots.has(pKey)) {
      monthSnapshots.set(pKey, { overall: null, studies: {}, date: "" })
    }
    const snap = monthSnapshots.get(pKey)!

    const sessionOverall =
      s.id === latestSessionId && typeof overallHealthIndex === "number"
        ? Math.round(overallHealthIndex)
        : typeof s.overallScore === "number"
          ? Math.round(s.overallScore)
          : computeOverallHealthScore(s.results, null, null, riskThresholds).score

    if (typeof sessionOverall === "number") snap.overall = sessionOverall

    for (const r of s.results) {
      if (r.score_name && r.health_index !== null && r.health_index !== undefined) {
        const trimmed = r.score_name.trim()
        if (!filterScore || filterScore(r.score_id || "", trimmed)) {
          snap.studies[trimmed] = Math.round(r.health_index)
        }
      }
    }

    const dateStr = s.formattedDate ? s.formattedDate.split(" ")[0] : ""
    if (dateStr) snap.date = dateStr
  }

  // ── Step 2: Walk month-by-month, emit exactly ONE point per month.
  const timeline: EvolutionDataPoint[] = []

  let lastKnownOverall: number | null = null
  const lastKnownStudies: Record<string, number> = {}
  let lastMeasuredDate: string | undefined = undefined

  let curY = startYear
  let curM = startMonth

  while (curY < endYear || (curY === endYear && curM <= endMonth)) {
    const pKey = `${curY}-${String(curM + 1).padStart(2, "0")}`
    const snap = monthSnapshots.get(pKey)

    if (snap) {
      if (typeof snap.overall === "number") lastKnownOverall = snap.overall
      Object.assign(lastKnownStudies, snap.studies)
      if (snap.date) lastMeasuredDate = snap.date

      timeline.push({
        month: formatPeriodLabel(curY, curM),
        period: pKey,
        overall: lastKnownOverall,
        ...lastKnownStudies,
        _isCarried: false,
        _measuredDate: snap.date || lastMeasuredDate,
      })
    } else if (lastKnownOverall !== null || Object.keys(lastKnownStudies).length > 0) {
      timeline.push({
        month: formatPeriodLabel(curY, curM),
        period: pKey,
        overall: lastKnownOverall,
        ...lastKnownStudies,
        _isCarried: true,
        _measuredDate: lastMeasuredDate,
      })
    }

    curM++
    if (curM > 11) { curM = 0; curY++ }
  }

  return timeline
}

/**
 * Builds a chronological monthly timeline for organization and department trends,
 * starting strictly at the first period with data and forward-filling values up to
 * the current month.
 */
export function buildTrendsTimelineWithForwardFill(
  trends: RiskTrendPoint[]
): Array<RiskTrendPoint & { month: string; _isCarried?: boolean }> {
  if (!trends || trends.length === 0) return []

  const sortedTrends = [...trends].sort((a, b) => a.period.localeCompare(b.period))
  const firstPoint = sortedTrends[0]
  if (!firstPoint?.period) {
    return trends.map((t) => ({ ...t, month: t.month_label }))
  }

  const [fYearStr, fMonthStr] = firstPoint.period.split("-")
  const startYear = parseInt(fYearStr, 10)
  const startMonth = parseInt(fMonthStr, 10) - 1

  const now = new Date()
  const endYear = Math.max(startYear, now.getFullYear())
  const endMonth =
    endYear === startYear ? Math.max(startMonth, now.getMonth()) : now.getMonth()

  const isMultiYear = endYear > startYear
  const MONTH_NAMES = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]

  const formatPeriodLabel = (y: number, m: number) => {
    const name = MONTH_NAMES[m]
    return isMultiYear ? `${name} '${String(y).slice(-2)}` : name
  }

  const trendsByPeriod = new Map<string, RiskTrendPoint>()
  for (const t of sortedTrends) {
    trendsByPeriod.set(t.period, t)
  }

  const result: Array<RiskTrendPoint & { month: string; _isCarried?: boolean }> = []

  let lastAverageScore: number | null = null
  let lastScoresByStudy: Record<string, number> = {}
  let hasStarted = false

  let curY = startYear
  let curM = startMonth

  while (curY < endYear || (curY === endYear && curM <= endMonth)) {
    const pKey = `${curY}-${String(curM + 1).padStart(2, "0")}`
    const t = trendsByPeriod.get(pKey)

    if (t) {
      hasStarted = true
      if (typeof t.average_score === "number") {
        lastAverageScore = t.average_score
      }
      if (t.scores_by_study) {
        lastScoresByStudy = { ...lastScoresByStudy, ...t.scores_by_study }
      }
      result.push({
        ...t,
        month: t.month_label || formatPeriodLabel(curY, curM),
        average_score: t.average_score ?? lastAverageScore,
        scores_by_study: { ...lastScoresByStudy },
        _isCarried: false,
      })
    } else if (hasStarted) {
      // Forward fill every month after the timeline has started, even when no
      // numeric score exists yet, so real periods never disappear from the axis.
      result.push({
        period: pKey,
        month_label: formatPeriodLabel(curY, curM),
        month: formatPeriodLabel(curY, curM),
        average_score: lastAverageScore,
        total_assessments: 0,
        scores_by_study: { ...lastScoresByStudy },
        _isCarried: true,
      })
    }

    curM++
    if (curM > 11) {
      curM = 0
      curY++
    }
  }

  return result
}

