import { Card } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"

export interface AreaScoreItem {
  name: string
  /** Health score: 100 = fully healthy, null = pending evaluations */
  score: number | null
  workers: number
}

interface AreaScoresProps {
  areas: AreaScoreItem[]
  loading?: boolean
  /** Max items to display. Defaults to 5. */
  limit?: number
}

const toneFor = (score: number | null) => {
  if (score === null) {
    return {
      label: "Pending",
      className:
        "bg-muted/40 text-muted-foreground border-border/60",
      barClass: "bg-muted",
    }
  }
  if (score >= 80)
    return {
      label: "Healthy",
      className:
        "bg-[color:var(--success)]/15 text-[color:var(--success)] border-transparent",
      barClass: "bg-[color:var(--success)]",
    }
  if (score >= 60)
    return {
      label: "Monitor",
      className:
        "bg-[color:var(--warning)]/15 text-[color:var(--warning)] border-transparent",
      barClass: "bg-[color:var(--warning)]",
    }
  return {
    label: "Risk",
    className: "bg-destructive/15 text-destructive border-transparent",
    barClass: "bg-destructive",
  }
}

export function AreaScores({ areas, loading = false, limit = 5 }: AreaScoresProps) {
  // Sort: evaluated departments with lowest score first, then pending, break ties by most workers
  const sorted = [...areas]
    .sort((a, b) => {
      if (a.score !== null && b.score !== null) {
        return a.score - b.score || b.workers - a.workers
      }
      if (a.score !== null && b.score === null) return -1
      if (a.score === null && b.score !== null) return 1
      return b.workers - a.workers
    })
    .slice(0, limit)

  const hidden = areas.length - sorted.length

  return (
    <Card className="flex h-full flex-col border-border/60 p-6 shadow-[var(--shadow-card)]">
      <div className="shrink-0">
        <h3 className="text-base font-semibold text-foreground">
          Top risk areas
        </h3>
        <p className="text-sm text-muted-foreground">
          Departments ordered by health index
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {loading ? (
          Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-14 rounded-full" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-8" />
                </div>
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))
        ) : sorted.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No departments yet.
          </p>
        ) : (
          sorted.map((a) => {
            const tone = toneFor(a.score)
            return (
              <div key={a.name}>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-foreground">{a.name}</span>
                    <Badge variant="outline" className={tone.className}>
                      {tone.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {a.workers} employees
                    </span>
                    <span className="font-semibold text-foreground tabular-nums">
                      {a.score !== null ? a.score : "—"}
                    </span>
                  </div>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${tone.barClass}`}
                    style={{ width: a.score !== null ? `${a.score}%` : "0%" }}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>

      {!loading && hidden > 0 && (
        <p className="mt-4 shrink-0 text-center text-xs text-muted-foreground">
          +{hidden} more department{hidden !== 1 ? "s" : ""} not shown
        </p>
      )}
    </Card>
  )
}
