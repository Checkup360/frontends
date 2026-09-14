import type { AssessmentResultResponse, AssessmentsResponse } from "@workspace/api"

export function getLatestResultsPerScore(results: AssessmentResultResponse[]): AssessmentResultResponse[] {
  if (!results || results.length === 0) return []

  const latestMap = new Map<string, AssessmentResultResponse>()
  const sorted = [...results].sort((a, b) => {
    const timeA = a.evaluated_at ? new Date(a.evaluated_at).getTime() : 0
    const timeB = b.evaluated_at ? new Date(b.evaluated_at).getTime() : 0
    return timeB - timeA
  })

  for (const item of sorted) {
    const key = item.score_name.toLowerCase()
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
    return input.sessions.map((s, index) => ({
      id: s.id,
      evaluatedAt: s.evaluated_at ? new Date(s.evaluated_at) : null,
      formattedDate: formatSessionDate(s.evaluated_at),
      isLatest: index === 0,
      overallScore: s.overall_score,
      overallRiskLevel: s.overall_risk_level,
      results: s.results,
    }))
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

    const scoreKey = item.score_name.toLowerCase()
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
  Dumbbell,
  Moon,
  Stethoscope,
  Apple,
  Activity,
  HeartPulse,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

export interface Recommendation {
  id: string
  title: string
  description: string
  priority: "high" | "medium" | "low"
  category: string
  icon: LucideIcon
  action?: string
}

export interface ComputedHealthScore {
  score: number | null
  label: "Low risk" | "Moderate risk" | "Needs attention" | "Incomplete evaluation"
  riskLevel: "low" | "moderate" | "high" | null
  explanation: string
  recommendations: Recommendation[]
}

export function getAssessmentDisplayName(scoreId: string, scoreName: string): string {
  const text = `${scoreId} ${scoreName}`.toLowerCase()
  if (text.includes("phq") || text.includes("depression")) {
    return "Mood and emotional well-being"
  }
  if (text.includes("findrisc") || text.includes("diabetes")) return "Diabetes"
  if (text.includes("stop_bang") || text.includes("stopbang") || text.includes("sleep")) {
    return "Sleep Apnea"
  }
  if (text.includes("metabolic_syndrome") || text.includes("metabolic syndrome")) {
    return "Metabolic Health"
  }
  if (text.includes("eoss")) return "Obesity-related Health Impact"
  if (text.includes("score2") || text.includes("cardiovascular")) {
    return "Cardiovascular Risk"
  }
  return scoreName
}

export function computeOverallHealthScore(
  results: AssessmentResultResponse[],
  backendOverallScore?: number | null,
  _backendOverallRiskLevel?: string | null
): ComputedHealthScore {
  if (!results || results.length === 0) {
    return {
      score: 100,
      label: "Low risk",
      riskLevel: "low",
      explanation: "Complete your health forms to get your personalized risk evaluation.",
      recommendations: [],
    }
  }

  let score: number | null = null
  if (typeof backendOverallScore === "number") {
    score = Math.round(backendOverallScore)
  }

  const recommendations: Recommendation[] = []

  for (const r of results) {
    const risk = (r.risk_level || "").toLowerCase()
    const name = getAssessmentDisplayName(r.score_id, r.score_name || r.score_id || "Assessment")
    const isCardio = name.toLowerCase().includes("cardio") || (r.score_id || "").toLowerCase().includes("score2")

    if (risk.includes("high")) {
      recommendations.push({
        id: `rec_${r.score_id}_high`,
        title: `High Risk Attention: ${name}`,
        description:
          r.explanation ||
          `Your ${name} score indicates high risk factors. We recommend consulting a healthcare provider.`,
        priority: "high",
        category: name.toLowerCase().includes("sleep")
          ? "Sleep"
          : name.toLowerCase().includes("diabet")
          ? "Nutrition & Lifestyle"
          : isCardio
          ? "Cardiovascular Health"
          : "Preventive care",
        icon: name.toLowerCase().includes("sleep")
          ? Moon
          : name.toLowerCase().includes("diabet")
          ? Apple
          : isCardio
          ? HeartPulse
          : Stethoscope,
        action: "View details",
      })
    } else if (risk.includes("moderate") || risk.includes("elevated")) {
      recommendations.push({
        id: `rec_${r.score_id}_mod`,
        title: `Moderate Risk Monitoring: ${name}`,
        description:
          r.explanation ||
          `Your ${name} score shows moderate risk factors. Consider lifestyle adjustments.`,
        priority: "medium",
        category: name.toLowerCase().includes("sleep")
          ? "Sleep"
          : name.toLowerCase().includes("diabet")
          ? "Nutrition & Activity"
          : isCardio
          ? "Cardiovascular Health"
          : "Preventive care",
        icon: name.toLowerCase().includes("sleep")
          ? Moon
          : name.toLowerCase().includes("diabet")
          ? Dumbbell
          : isCardio
          ? HeartPulse
          : Activity,
        action: "View recommendations",
      })
    } else {
      recommendations.push({
        id: `rec_${r.score_id}_low`,
        title: `Good Standing: ${name}`,
        description:
          r.explanation ||
          `Your ${name} evaluation shows low risk. Maintain your healthy habits!`,
        priority: "low",
        category: isCardio ? "Cardiovascular Health" : "Lifestyle",
        icon: Sparkles,
        action: "Keep it up",
      })
    }
  }

  if (score === null) {
    return {
      score: null,
      label: "Incomplete evaluation",
      riskLevel: null,
      explanation:
        "Some evaluations are still pending to calculate your overall health score. Individual disease scores are shown below.",
      recommendations,
    }
  }

  let label: "Low risk" | "Moderate risk" | "Needs attention" = "Low risk"
  let riskLevel: "low" | "moderate" | "high" = "low"
  let explanation =
    "Your preventive health indicators show a favorable status. Keep up your active lifestyle!"

  if (score < 60) {
    label = "Needs attention"
    riskLevel = "high"
    explanation =
      "One or more evaluations show elevated risk parameters requiring preventive care and lifestyle modifications."
  } else if (score < 85) {
    label = "Moderate risk"
    riskLevel = "moderate"
    explanation =
      "Your health profile shows moderate risk indicators. Review the recommendations below to improve your parameters."
  }

  return {
    score,
    label,
    riskLevel,
    explanation,
    recommendations,
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
  if (lowerRisk.includes("high")) return <AlertCircle className="h-5 w-5 text-destructive" />
  if (lowerRisk.includes("moderate")) return <AlertTriangle className="h-5 w-5 text-yellow-500" />
  if (lowerRisk.includes("low")) return <CheckCircle2 className="h-5 w-5 text-green-500" />
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
