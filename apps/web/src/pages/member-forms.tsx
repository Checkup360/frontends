import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Progress } from "@workspace/ui/components/progress"
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
import { fetchMemberForm } from "@workspace/api"

export function MemberFormsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [biometricsFilled, setBiometricsFilled] = useState(false)
  const [sleepFilled, setSleepFilled] = useState(false)
  const [habitsFilled, setHabitsFilled] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadFormStatuses() {
      setIsLoading(true)
      const [bio, sleep, habits] = await Promise.all([
        fetchMemberForm("biometrics"),
        fetchMemberForm("sleep"),
        fetchMemberForm("habits"),
      ])

      if (!cancelled) {
        const hasBio = Boolean(
          bio?.data &&
            (bio.data.waist_circumference !== undefined ||
              bio.data.neck_circumference !== undefined)
        )
        const hasSleep = Boolean(
          sleep?.data &&
            (sleep.data.snoring !== undefined ||
              sleep.data.tired !== undefined ||
              sleep.data.observed_apnea !== undefined)
        )
        const hasHabits = Boolean(
          habits?.data &&
            (habits.data.daily_physical_activity !== undefined ||
              habits.data.fruits_vegetables !== undefined ||
              habits.data.hypertension_medication !== undefined ||
              habits.data.previous_high_glucose !== undefined ||
              habits.data.family_diabetes !== undefined)
        )

        setBiometricsFilled(hasBio)
        setSleepFilled(hasSleep)
        setHabitsFilled(hasHabits)
        setIsLoading(false)
      }
    }
    void loadFormStatuses()
    return () => {
      cancelled = true
    }
  }, [])

  const completedCount =
    (biometricsFilled ? 1 : 0) + (sleepFilled ? 1 : 0) + (habitsFilled ? 1 : 0)
  const progressPercent = Math.round((completedCount / 3) * 100)
  const allCompleted = completedCount === 3

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Health Data Forms
        </h2>
        <p className="text-sm text-muted-foreground">
          Keep your physical, sleep, and lifestyle information up to date.
        </p>
      </div>

      {/* Main Unified Assessment Card */}
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">
                  Health & Clinical Data Questionnaire
                </CardTitle>
                <CardDescription>
                  Comprehensive health questionnaire gathering physical measurements, sleep indicators, and lifestyle habits.
                </CardDescription>
              </div>
            </div>
            {isLoading ? (
              <Badge variant="outline" className="animate-pulse">
                Checking...
              </Badge>
            ) : allCompleted ? (
              <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle2 className="mr-1 size-3.5" /> Fully Completed
              </Badge>
            ) : completedCount > 0 ? (
              <Badge variant="secondary" className="border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300">
                <Clock className="mr-1 size-3.5" /> In Progress ({completedCount}/3)
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Clock className="mr-1 size-3.5" /> Pending
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-muted-foreground">
              <span>Form Completion Status</span>
              <span>{progressPercent}% Complete ({completedCount} of 3 sections filled)</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-muted/40 p-4 border border-border/40">
            <p className="text-xs text-muted-foreground max-w-xl">
              Updating your health information ensures all evaluations and member insights remain accurate.
            </p>
            <Button size="default" asChild className="gap-2">
              <Link to="/forms/studies">
                {allCompleted ? "Update Health Form" : "Complete Health Form"}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modular Form Sections Breakdown */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            Form Information Sections
          </h3>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Section 1: Biometrics */}
          <Card className="flex flex-col justify-between p-5 transition-all hover:border-primary/40 hover:shadow-xs">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex size-9 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Activity className="size-5" />
                </div>
                {biometricsFilled ? (
                  <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="mr-1 size-3" /> Completed
                  </Badge>
                ) : (
                  <Badge variant="secondary">Pending</Badge>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Biometrics & Body Measurements
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Body measurement data such as neck and waist circumference parameters.
                </p>
              </div>
            </div>
          </Card>

          {/* Section 2: Sleep */}
          <Card className="flex flex-col justify-between p-5 transition-all hover:border-primary/40 hover:shadow-xs">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex size-9 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Moon className="size-5" />
                </div>
                {sleepFilled ? (
                  <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="mr-1 size-3" /> Completed
                  </Badge>
                ) : (
                  <Badge variant="secondary">Pending</Badge>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Sleep & Rest Indicators
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Questions regarding snoring, daytime fatigue, and sleep quality indicators.
                </p>
              </div>
            </div>
          </Card>

          {/* Section 3: Habits */}
          <Card className="flex flex-col justify-between p-5 transition-all hover:border-primary/40 hover:shadow-xs">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex size-9 items-center justify-center rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <HeartPulse className="size-5" />
                </div>
                {habitsFilled ? (
                  <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="mr-1 size-3" /> Completed
                  </Badge>
                ) : (
                  <Badge variant="secondary">Pending</Badge>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Lifestyle & Health Habits
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Daily physical activity, dietary habits, medical treatments, and family history.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}
