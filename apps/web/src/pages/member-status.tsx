import { useEffect, useState, useMemo } from "react"
import { listAssessments, type AssessmentsResponse } from "@workspace/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  groupResultsIntoSessions,
  getRiskIcon,
  AssessmentHistoryDialog,
} from "@workspace/components/components/assessment-utils"
import {
  ClipboardList,
  History,
  Calendar,
  RotateCcw,
} from "lucide-react"

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
            View your latest health assessment results and risk scores.
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
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <ClipboardList className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-semibold">No Assessments Found</h3>
            <p className="text-sm text-muted-foreground">
              You haven't completed any health assessments yet. Go to the Forms tab to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border bg-card p-3 px-4 text-sm shadow-xs">
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
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {activeSession?.results.length} evaluation(s)
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeSession?.results.map((result) => (
              <Card key={result.score_id} className="overflow-hidden transition-all hover:shadow-md">
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{result.score_name}</CardTitle>
                    {getRiskIcon(result.risk_level)}
                  </div>
                  <CardDescription className="flex flex-col gap-1 mt-2">
                    <div>
                      Risk Level: <span className="font-semibold text-foreground">{result.risk_level || "Unknown"}</span>
                    </div>
                    {result.raw_value !== null && result.raw_value !== undefined && (
                      <div>
                        Score: <span className="font-semibold text-foreground">{result.raw_value}</span>
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    {result.explanation || "No explanation provided."}
                  </p>
                </CardContent>
              </Card>
            ))}
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
