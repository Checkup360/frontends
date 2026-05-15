import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { CheckCircle2, Clock, FileText } from "lucide-react"

export function MemberFormsPage() {
  const forms = [
    {
      id: 1,
      title: "Annual Health Checkup 2026",
      description:
        "Complete your annual health assessment for occupational health monitoring.",
      status: "pending",
      dueDate: "2026-05-15",
      priority: "high",
    },
    {
      id: 2,
      title: "Employee Satisfaction Survey",
      description: "Help us improve our workplace by sharing your feedback.",
      status: "completed",
      completedDate: "2026-04-20",
    },
    {
      id: 3,
      title: "Ergonomic Assessment",
      description: "Review your workspace setup and provide feedback.",
      status: "pending",
      dueDate: "2026-06-01",
      priority: "medium",
    },
  ]

  const pendingForms = forms.filter((f) => f.status === "pending")
  const completedForms = forms.filter((f) => f.status === "completed")

  return (
    <div className="space-y-6">
      {/* Pending Forms */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Clock className="h-5 w-5 text-[color:var(--warning)]" />
          Pending Forms ({pendingForms.length})
        </h2>
        <div className="space-y-3">
          {pendingForms.length > 0 ? (
            pendingForms.map((form) => (
              <Card key={form.id} className="border-[color:var(--warning)]/30">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[color:var(--warning)]" />
                        {form.priority === "high" && (
                          <span className="inline-block rounded bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                            High Priority
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-base">{form.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {form.description}
                      </CardDescription>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Due:{" "}
                        {form.dueDate &&
                          new Date(form.dueDate).toLocaleDateString("en-US")}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button size="sm" className="w-full">
                    Complete Form
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No pending forms
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Completed Forms */}
      {completedForms.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <CheckCircle2 className="h-5 w-5 text-[color:var(--success)]" />
            Completed Forms ({completedForms.length})
          </h2>
          <div className="space-y-3">
            {completedForms.map((form) => (
              <Card key={form.id} className="opacity-75">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[color:var(--success)]" />
                      </div>
                      <CardTitle className="text-base">{form.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {form.description}
                      </CardDescription>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Completed:{" "}
                        {form.completedDate &&
                          new Date(form.completedDate).toLocaleDateString(
                            "en-US"
                          )}
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
