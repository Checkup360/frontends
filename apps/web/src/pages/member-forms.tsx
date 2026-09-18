import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Progress } from "@workspace/ui/components/progress"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  HeartPulse,
  Moon,
  Sparkles,
} from "lucide-react"
import { fetchActiveMemberForms } from "@workspace/api"

interface FormCardDef {
  type: string
  title: string
  description: string
  icon: typeof Activity
  editLabel: string
  completeLabel: string
}

const ALL_FORMS: FormCardDef[] = [
  {
    type: "biometrics",
    title: "Physical Biometrics",
    description: "Neck and waist body measurements.",
    icon: Activity,
    editLabel: "Edit Biometrics",
    completeLabel: "Complete Biometrics",
  },
  {
    type: "eoss",
    title: "Obesity-related Health Impact",
    description: "A reflective assessment of health, mood, and daily function.",
    icon: HeartPulse,
    editLabel: "Edit Health Impact",
    completeLabel: "Complete Health Impact",
  },
  {
    type: "mood",
    title: "Mood & Well-being",
    description: "Recent mood and emotional well-being indicators.",
    icon: HeartPulse,
    editLabel: "Edit Mood Assessment",
    completeLabel: "Complete Mood Assessment",
  },
  {
    type: "sleep",
    title: "Sleep Quality",
    description: "Snoring, daytime fatigue, and rest indicators.",
    icon: Moon,
    editLabel: "Edit Sleep Data",
    completeLabel: "Complete Sleep Data",
  },
  {
    type: "habits",
    title: "Lifestyle & Habits",
    description: "Physical activity, dietary habits, and history.",
    icon: HeartPulse,
    editLabel: "Edit Habits",
    completeLabel: "Complete Habits",
  },
  {
    type: "metabolic",
    title: "Metabolic Health",
    description: "Blood pressure, lipids, glucose, and treatment information.",
    icon: Activity,
    editLabel: "Edit Metabolic Data",
    completeLabel: "Complete Metabolic Data",
  },
  {
    type: "nordic_nmq",
    title: "Musculoskeletal Risk",
    description: "Standardized questionnaire evaluating body regions for discomfort and work impact.",
    icon: Activity,
    editLabel: "Edit Musculoskeletal Assessment",
    completeLabel: "Complete Musculoskeletal Assessment",
  },
  {
    type: "audit_c",
    title: "Alcohol Risk Assessment",
    description: "Standardized survey evaluating alcohol consumption frequency and habits.",
    icon: HeartPulse,
    editLabel: "Edit Alcohol Assessment",
    completeLabel: "Complete Alcohol Assessment",
  },
  {
    type: "pss10",
    title: "Perceived Stress & Burnout",
    description: "10-item scale assessing feelings and stress control over the past month.",
    icon: HeartPulse,
    editLabel: "Edit Stress Assessment",
    completeLabel: "Complete Stress Assessment",
  },
]

interface CachedFormsState {
  activeFormTypes: Set<string>
  formStatuses: Record<string, boolean>
}

let formsCache: CachedFormsState | null = null

export function MemberFormsPage() {
  const [isLoading, setIsLoading] = useState(() => !formsCache)
  const [activeFormTypes, setActiveFormTypes] = useState<Set<string>>(
    () => formsCache?.activeFormTypes ?? new Set()
  )
  const [formStatuses, setFormStatuses] = useState<Record<string, boolean>>(
    () => formsCache?.formStatuses ?? {}
  )

  useEffect(() => {
    let cancelled = false
    async function loadFormStatuses() {
      if (!formsCache) {
        setIsLoading(true)
      }
      try {
        const activeRes = await fetchActiveMemberForms()
        if (!cancelled && activeRes?.active_forms) {
          const newActiveTypes = new Set<string>()
          const newStatuses: Record<string, boolean> = {}

          for (const form of activeRes.active_forms) {
            newActiveTypes.add(form.form_type)
            newStatuses[form.form_type] = Boolean(form.is_completed)
          }

          formsCache = {
            activeFormTypes: newActiveTypes,
            formStatuses: newStatuses,
          }
          setActiveFormTypes(newActiveTypes)
          setFormStatuses(newStatuses)
        }
      } catch (err) {
        console.error("Error loading active forms:", err)
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadFormStatuses()
    return () => {
      cancelled = true
    }
  }, [])

  const visibleForms = ALL_FORMS.filter((f) => activeFormTypes.has(f.type))
  const totalCount = visibleForms.length
  const completedCount = visibleForms.filter((f) => formStatuses[f.type]).length
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100
  const allCompleted = totalCount > 0 && completedCount === totalCount

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Health Forms
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Keep your physical, sleep, and lifestyle information up to date.
        </p>
      </div>

      {/* Overall Progress Card */}
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">
                  Overall Completion Status
                </CardTitle>
                <CardDescription>
                  Completion progress for your active health data forms.
                </CardDescription>
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-6 w-32 rounded-full" />
            ) : allCompleted ? (
              <Badge
                variant="default"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 className="mr-1 size-3.5" /> {completedCount} of{" "}
                {totalCount} Completed
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Clock className="mr-1 size-3.5" /> {completedCount} of{" "}
                {totalCount} Completed
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-2.5 w-full rounded-full" />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-muted-foreground">
                <span>Form Completion</span>
                <span>
                  {progressPercent}% ({completedCount} of {totalCount} active sections filled)
                </span>
              </div>
              <Progress value={progressPercent} className="h-2.5" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Form Modules Cards */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            Available Health Forms
          </h3>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                className="flex flex-col justify-between p-5"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <Skeleton className="size-10 rounded-xl" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
                <div className="mt-6 pt-2">
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
              </Card>
            ))}
          </div>
        ) : visibleForms.length === 0 ? (
          <Card className="border-dashed border-border/80 bg-muted/10">
            <CardContent className="flex flex-col items-center justify-center p-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-3">
                <FileText className="size-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">No Health Forms Required</h3>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                There are currently no active health forms assigned to your profile based on your organization's configuration.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleForms.map((form) => {
              const isFilled = Boolean(formStatuses[form.type])
              const Icon = form.icon

              return (
                <Card
                  key={form.type}
                  className="flex flex-col justify-between p-5 transition-all hover:border-primary/40 hover:shadow-xs"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-foreground/80">
                        <Icon className="size-5" />
                      </div>
                      {isFilled ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        >
                          <CheckCircle2 className="mr-1 size-3" /> Completed
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-foreground">
                        {form.title}
                      </h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {form.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="w-full justify-between gap-1"
                    >
                      <Link to={`/forms/studies?form=${form.type}`}>
                        {isFilled ? form.editLabel : form.completeLabel}
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
