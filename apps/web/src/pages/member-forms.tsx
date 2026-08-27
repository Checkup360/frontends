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
                  Completion progress for your health data forms.
                </CardDescription>
              </div>
            </div>
            {isLoading ? (
              <Badge variant="outline" className="animate-pulse">
                Checking...
              </Badge>
            ) : allCompleted ? (
              <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle2 className="mr-1 size-3.5" /> 3 of 3 Completed
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Clock className="mr-1 size-3.5" /> {completedCount} of 3 Completed
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-muted-foreground">
              <span>Form Completion</span>
              <span>{progressPercent}% ({completedCount} of 3 sections filled)</span>
            </div>
            <Progress value={progressPercent} className="h-2.5" />
          </div>
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

        <div className="grid gap-4 md:grid-cols-3">
          {/* Card 1: Biometrics */}
          <Card className="flex flex-col justify-between p-5 transition-all hover:border-primary/40 hover:shadow-xs">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-foreground/80">
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
                <h4 className="text-base font-semibold text-foreground">
                  Physical Biometrics
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Neck and waist body measurements.
                </p>
              </div>
            </div>
            <div className="mt-6 pt-2">
              <Button variant="outline" size="sm" asChild className="w-full justify-between gap-1">
                <Link to="/forms/studies?form=biometrics">
                  {biometricsFilled ? "Edit Biometrics" : "Complete Biometrics"}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </Card>

          {/* Card 2: Sleep */}
          <Card className="flex flex-col justify-between p-5 transition-all hover:border-primary/40 hover:shadow-xs">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-foreground/80">
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
                <h4 className="text-base font-semibold text-foreground">
                  Sleep Quality
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Snoring, daytime fatigue, and rest indicators.
                </p>
              </div>
            </div>
            <div className="mt-6 pt-2">
              <Button variant="outline" size="sm" asChild className="w-full justify-between gap-1">
                <Link to="/forms/studies?form=sleep">
                  {sleepFilled ? "Edit Sleep Data" : "Complete Sleep Data"}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </Card>

          {/* Card 3: Habits */}
          <Card className="flex flex-col justify-between p-5 transition-all hover:border-primary/40 hover:shadow-xs">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-foreground/80">
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
                <h4 className="text-base font-semibold text-foreground">
                  Lifestyle & Habits
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Physical activity, dietary habits, and history.
                </p>
              </div>
            </div>
            <div className="mt-6 pt-2">
              <Button variant="outline" size="sm" asChild className="w-full justify-between gap-1">
                <Link to="/forms/studies?form=habits">
                  {habitsFilled ? "Edit Habits" : "Complete Habits"}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}
