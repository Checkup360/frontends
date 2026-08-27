import { useEffect, useState, useMemo } from "react"
import { listAssessments, type AssessmentsResponse } from "@workspace/api"
import { Card } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  groupResultsIntoSessions,
  AssessmentHistoryDialog,
} from "@workspace/components/components/assessment-utils"
import {
  ClipboardList,
  History,
  Calendar,
  RotateCcw,
  Activity,
} from "lucide-react"

function getRiskBadgeVariant(riskLevel: string | null) {
  if (!riskLevel) return "outline"
  const lower = riskLevel.toLowerCase()
  if (lower.includes("high")) return "destructive"
  if (lower.includes("moderate") || lower.includes("elevated")) return "warning-light"
  return "success-light"
}

function getProgressColor(riskLevel: string | null) {
  if (!riskLevel) return "bg-primary"
  const lower = riskLevel.toLowerCase()
  if (lower.includes("high")) return "bg-destructive"
  if (lower.includes("moderate") || lower.includes("elevated")) return "bg-amber-500"
  return "bg-emerald-500"
}

export function MemberStatusPage() {
  const [assessments, setAssessments] = useState<AssessmentsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      const data = await listAssessments()
      setAssessments(data)
      setIsLoading(false)
    }
    void load()
  }, [])

  const sessions = useMemo(() => {
    return groupResultsIntoSessions(assessments?.results || [])
  }, [assessments])

  const activeSession = useMemo(() => {
    if (!sessions.length) return null
    return sessions.find((s) => s.id === selectedSessionId) || sessions[0]
  }, [sessions, selectedSessionId])

  const isViewingLatest = activeSession?.isLatest ?? true

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Health Status</h2>
          <p className="text-sm text-muted-foreground">
            View your evaluated clinical risk scores, normalized parameters (0–100), and explanations.
          </p>
        </div>

        {sessions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
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
              className="gap-2"
            >
              <History className="h-4 w-4" />
              Assessment history
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : !sessions.length ? (
        <Card className="border-dashed">
          <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
            <ClipboardList className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold">No Assessments Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              You haven't completed any health assessments yet. Go to the Forms tab to get started.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-xl border bg-card/80 p-3.5 px-4 text-sm shadow-xs backdrop-blur-xs">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">
                Assessment session: {activeSession?.formattedDate}
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
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {activeSession?.results.length} score(s) evaluated
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeSession?.results.map((result) => {
              const normScore =
                result.normalized_value !== null && result.normalized_value !== undefined
                  ? Math.round(result.normalized_value)
                  : null

              const barColor = getProgressColor(result.risk_level)

              return (
                <Card
                  key={result.score_id}
                  className="flex flex-col justify-between overflow-hidden border-border/60 bg-card/90 p-6 shadow-xs transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Activity className="size-4 text-muted-foreground" />
                          <h3 className="font-bold text-lg text-foreground tracking-tight">
                            {result.score_name}
                          </h3>
                        </div>
                      </div>
                      <Badge variant={getRiskBadgeVariant(result.risk_level)} className="capitalize">
                        {result.risk_level || "Evaluated"}
                      </Badge>
                    </div>

                    {/* Normalized Score Indicator (0-100) */}
                    {normScore !== null && (
                      <div className="rounded-xl bg-muted/40 p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-muted-foreground">Normalized Health Score</span>
                          <span className="text-foreground text-sm font-bold">{normScore} / 100</span>
                        </div>
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                            style={{ width: `${normScore}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-muted-foreground pt-0.5">
                          <span>0 (High Risk)</span>
                          <span>100 (Optimal)</span>
                        </div>
                      </div>
                    )}

                    {/* Explanation */}
                    <p className="text-sm leading-relaxed text-muted-foreground pt-1">
                      {result.explanation || "No specific observations reported for this evaluation."}
                    </p>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

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

export default MemberStatusPage
