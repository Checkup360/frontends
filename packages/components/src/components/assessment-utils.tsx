import type { AssessmentResultResponse } from "@workspace/api"
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

export interface AssessmentSession {
  id: string
  evaluatedAt: Date | null
  formattedDate: string
  isLatest: boolean
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

export function groupResultsIntoSessions(results: AssessmentResultResponse[]): AssessmentSession[] {
  if (!results || results.length === 0) return []

  const sessionGroups: { [key: string]: { timestamp: number; dateStr: string; results: AssessmentResultResponse[] } } = {}

  for (const item of results) {
    const rawTime = item.evaluated_at ? new Date(item.evaluated_at).getTime() : 0
    const bucketTime = rawTime > 0 ? Math.floor(rawTime / 5000) * 5000 : 0
    const key = `session_${bucketTime}`

    if (!sessionGroups[key]) {
      sessionGroups[key] = {
        timestamp: rawTime,
        dateStr: item.evaluated_at || "",
        results: [],
      }
    }
    sessionGroups[key].results.push(item)
  }

  return Object.values(sessionGroups)
    .sort((a, b) => b.timestamp - a.timestamp)
    .map((group, index) => ({
      id: `session_${group.timestamp}_${index}`,
      evaluatedAt: group.timestamp > 0 ? new Date(group.timestamp) : null,
      formattedDate: formatSessionDate(group.dateStr),
      isLatest: index === 0,
      results: group.results,
    }))
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
