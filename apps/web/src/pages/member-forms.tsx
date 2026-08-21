import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Calendar, CheckCircle2, Clock, FileText } from "lucide-react"
import { Link } from "react-router-dom"

type FormItem = {
  id: number
  title: string
  description: string
  status: "pending" | "completed"
  priority?: "high" | "standard" | "medium" | "low"
  dueDate?: string
  completedDate?: string
  href?: string
}

function formatDate(dateStr?: string) {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

export function MemberFormsPage() {
  const forms: FormItem[] = [
    {
      id: 1,
      title: "Annual Health Checkup 2026",
      description:
        "Complete your annual health assessment for occupational health monitoring.",
      status: "pending",
      dueDate: "2026-05-14",
      priority: "high",
      href: "/forms/stop-bang",
    },
    {
      id: 2,
      title: "Ergonomic Assessment",
      description: "Review your workspace setup and provide feedback.",
      status: "pending",
      dueDate: "2026-05-31",
      priority: "standard",
      href: "/forms/stop-bang",
    },
    {
      id: 3,
      title: "Employee Satisfaction Survey",
      description: "Help us improve our workplace by sharing your feedback.",
      status: "completed",
      completedDate: "2026-04-19",
    },
  ]

  const pendingForms = forms.filter((f) => f.status === "pending")
  const completedForms = forms.filter((f) => f.status === "completed")

  return (
    <div className="space-y-12">
      {/* Pending Forms Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="size-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Pending Forms
            </h3>
          </div>
          <Badge
            variant="secondary"
            className="rounded-full px-2.5 py-0.5 text-xs font-normal"
          >
            {pendingForms.length} Total
          </Badge>
        </div>

        <div className="space-y-3">
          {pendingForms.length > 0 ? (
            pendingForms.map((form) => {
              const isHighPriority = form.priority === "high"

              return (
                <Card
                  key={form.id}
                  className="group flex flex-col gap-4 rounded-lg p-4 transition-all hover:bg-muted/40 hover:shadow-xs"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm leading-tight font-semibold text-foreground">
                          {form.title}
                        </h4>
                        {isHighPriority ? (
                          <Badge
                            variant="destructive"
                            size="xs"
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase"
                          >
                            High Priority
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            size="xs"
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase"
                          >
                            Standard
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {form.description}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <FileText className="size-4 text-muted-foreground/60 transition-opacity group-hover:text-muted-foreground" />
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="size-3.5" />
                        <span>{formatDate(form.dueDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant={isHighPriority ? "default" : "outline"}
                      asChild
                    >
                      <Link to={form.href || "#"}>Complete Form</Link>
                    </Button>
                  </div>
                </Card>
              )
            })
          ) : (
            <Card className="p-6">
              <Empty>
                <EmptyMedia>
                  <Clock className="size-8 text-muted-foreground/60" />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>No pending forms</EmptyTitle>
                  <EmptyDescription>
                    You are all caught up! There are no forms requiring your
                    attention right now.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </Card>
          )}
        </div>
      </section>

      {/* Completed Forms Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="size-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Completed Forms
            </h3>
          </div>
          <Badge
            variant="secondary"
            className="rounded-full px-2.5 py-0.5 text-xs font-normal"
          >
            {completedForms.length} Archive
          </Badge>
        </div>

        <div className="space-y-3">
          {completedForms.length > 0 ? (
            completedForms.map((form) => (
              <Card
                key={form.id}
                className="group flex flex-col gap-3 rounded-lg p-4 opacity-85 transition-all hover:bg-muted/30 hover:opacity-100"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm leading-tight font-semibold text-foreground">
                        {form.title}
                      </h4>
                      <Badge
                        variant="secondary"
                        size="xs"
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase"
                      >
                        Completed
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {form.description}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <CheckCircle2 className="size-4 text-emerald-500 dark:text-emerald-400" />
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="size-3.5" />
                      <span>{formatDate(form.completedDate)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-6">
              <Empty>
                <EmptyMedia>
                  <CheckCircle2 className="size-8 text-muted-foreground/60" />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>No completed forms</EmptyTitle>
                  <EmptyDescription>
                    Completed forms and submissions will appear here.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </Card>
          )}
        </div>
      </section>
    </div>
  )
}
