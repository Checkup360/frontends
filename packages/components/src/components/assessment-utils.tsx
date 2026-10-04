import type { AssessmentResultResponse, AssessmentsResponse } from "@workspace/api"
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
  if (text.includes("findrisc") || text.includes("diabetes")) return "Type 2 Diabetes Risk"
  if (text.includes("stop_bang") || text.includes("stopbang") || text.includes("sleep")) {
    return "Sleep Quality"
  }
  if (
    text.includes("metabolic_syndrome") ||
    text.includes("metabolic syndrome") ||
    text.includes("metabolic")
  ) {
    return "Metabolic Health"
  }
  if (text.includes("eoss") || text.includes("obesity")) return "Obesity-related Health Impact"
  if (text.includes("score2") || text.includes("cardiovascular")) {
    return "Cardiovascular Risk"
  }
  if (text.includes("nordic") || text.includes("nmq") || text.includes("musculoskeletal")) {
    return "Musculoskeletal Risk"
  }
  if (text.includes("audit") || text.includes("alcohol")) {
    return "Alcohol Risk Assessment"
  }
  if (text.includes("pss") || text.includes("stress")) {
    return "Perceived Stress & Burnout"
  }
  return "Health Risk Evaluation"
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
