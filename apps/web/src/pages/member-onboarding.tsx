import { submitMemberDetails } from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  Cigarette,
  Droplet,
  HeartPulse,
  Ruler,
  ShieldCheck,
  Sparkles,
  User,
  Weight,
  Wine,
  type LucideIcon,
} from "lucide-react"
import { useMemo, useState } from "react"
import { Navigate } from "react-router-dom"

type OnboardingData = {
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  weight: string
  height: string
  bloodType: string
  smokingStatus: string
  alcoholConsumption: string
  exerciseFrequency: string
  chronicConditions: string[]
}

type WizardStep = {
  id: number
  name: string
  description: string
  icon: LucideIcon
}

const initialData: OnboardingData = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  weight: "",
  height: "",
  bloodType: "",
  smokingStatus: "",
  alcoholConsumption: "",
  exerciseFrequency: "",
  chronicConditions: [],
}

const chronicConditionOptions = [
  "Diabetes",
  "Hypertension",
  "Asthma",
  "Arthritis",
  "Severe allergies",
  "Heart conditions",
]

const steps: WizardStep[] = [
  {
    id: 0,
    name: "Get Started",
    description: "Start here",
    icon: Sparkles,
  },
  {
    id: 1,
    name: "Personal info",
    description: "Basic member details",
    icon: User,
  },
  {
    id: 2,
    name: "Health profile",
    description: "Wellness baseline",
    icon: HeartPulse,
  },
]

const onboardingHighlights = [
  {
    title: "Private by design",
    description: "Your profile details are handled separately from login data.",
    icon: ShieldCheck,
  },
  {
    title: "Health baseline",
    description: "A simple starting point for your wellness experience.",
    icon: HeartPulse,
  },
  {
    title: "Ready once",
    description: "Complete onboarding once and continue to your dashboard.",
    icon: BadgeCheck,
  },
]

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function fieldError(error: string | null, field: string) {
  return error === field ? (
    <p className="text-sm text-destructive">Required field</p>
  ) : null
}

function SidebarStep({
  step,
  currentStep,
}: {
  step: WizardStep
  currentStep: number
}) {
  const Icon = step.icon
  const isCompleted = currentStep > step.id
  const isCurrent = currentStep === step.id

  return (
    <div className="relative flex items-center gap-2 py-2 lg:gap-4 lg:py-4">
      {step.id !== steps[steps.length - 1].id ? (
        <>
          {/* Vertical line for desktop */}
          <div className="absolute top-10 left-6 hidden h-full w-px bg-border/40 lg:block">
            <div
              className={cn(
                "w-full bg-primary transition-all duration-500",
                isCompleted ? "h-full" : "h-0"
              )}
            />
          </div>
          {/* Horizontal line for mobile */}
          <div className="absolute top-1/2 left-12 h-px w-8 -translate-y-1/2 bg-border/40 lg:hidden">
            <div
              className={cn(
                "h-full bg-primary transition-all duration-500",
                isCompleted ? "w-full" : "w-0"
              )}
            />
          </div>
        </>
      ) : null}

      <div
        className={cn(
          "relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
          isCompleted
            ? "border-primary bg-primary text-primary-foreground"
            : isCurrent
              ? "border-primary bg-background text-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.10)]"
              : "border-border/50 bg-background/50 text-muted-foreground"
        )}
      >
        {isCompleted ? (
          <Check className="size-5" strokeWidth={3} />
        ) : (
          <Icon className="size-5" />
        )}
      </div>

      <div className="hidden min-w-0 lg:block">
        <p
          className={cn(
            "text-sm font-semibold transition-colors",
            isCurrent || isCompleted
              ? "text-foreground"
              : "text-muted-foreground"
          )}
        >
          {step.name}
        </p>
        <p className="text-xs text-muted-foreground/70">{step.description}</p>
      </div>
    </div>
  )
}

export function MemberOnboardingPage() {
  const { user, isLoading, refresh } = useCurrentUser()
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<OnboardingData>(initialData)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const maxDate = useMemo(() => todayIsoDate(), [])
  const memberOrganization = user?.membership?.roles?.includes("member")
    ? user.membership
    : undefined
  const organizationName =
    memberOrganization?.organization_name ?? "Your organization"
  const activeStep = steps.find((step) => step.id === currentStep) ?? steps[0]

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <p className="text-center text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!user.requires_onboarding) {
    return <Navigate to="/" replace />
  }

  const updateField = <K extends keyof OnboardingData>(
    field: K,
    value: OnboardingData[K]
  ) => {
    setData((current) => ({ ...current, [field]: value }))
    if (error === field) {
      setError(null)
    }
  }

  const toggleCondition = (condition: string) => {
    setData((current) => {
      const exists = current.chronicConditions.includes(condition)
      return {
        ...current,
        chronicConditions: exists
          ? current.chronicConditions.filter((item) => item !== condition)
          : [...current.chronicConditions, condition],
      }
    })
  }

  const validateStep = () => {
    if (currentStep === 1) {
      if (!data.firstName.trim()) return "firstName"
      if (!data.lastName.trim()) return "lastName"
      if (!data.dateOfBirth) return "dateOfBirth"
      if (!data.gender) return "gender"
    }

    if (currentStep === 2) {
      if (!data.weight) return "weight"
      if (!data.height) return "height"
      if (!data.bloodType) return "bloodType"
      if (!data.smokingStatus) return "smokingStatus"
      if (!data.alcoholConsumption) return "alcoholConsumption"
      if (!data.exerciseFrequency) return "exerciseFrequency"
    }

    return null
  }

  const nextStep = () => {
    if (currentStep === 0) {
      setCurrentStep(1)
      return
    }

    const invalidField = validateStep()
    if (invalidField) {
      setError(invalidField)
      return
    }
    setError(null)
    setCurrentStep((step) => Math.min(step + 1, steps[steps.length - 1].id))
  }

  const prevStep = () => {
    setError(null)
    setCurrentStep((step) => Math.max(step - 1, 0))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const invalidField = validateStep()
    if (invalidField) {
      setError(invalidField)
      return
    }

    setError(null)
    setFormError(null)
    setIsSubmitting(true)

    try {
      const result = await submitMemberDetails({
        date_of_birth: data.dateOfBirth,
      })

      if (result.error) {
        setFormError(result.error.message)
        return
      }

      await refresh()
      window.location.replace("/")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background px-4 py-8 sm:px-6 lg:px-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--border))_1px,transparent_0)] bg-[length:28px_28px] opacity-35" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-muted/60 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-6xl items-center">
        <div className="w-full">
          <div className="mb-8 text-center">
            <Badge
              variant="outline"
              className="mb-4 inline-flex items-center gap-2 rounded-full border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium tracking-wider text-primary backdrop-blur"
            >
              <span className="size-1.5 rounded-full bg-primary" />
              Member onboarding
            </Badge>
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {currentStep === 0
                ? "Welcome to CheckUp360"
                : "Complete your profile"}
            </h1>
            <p className="text-muted-foreground">
              Your organization is {organizationName}
            </p>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-background/40 shadow-xl backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />

            <form
              onSubmit={(event) => void handleSubmit(event)}
              className="relative grid lg:grid-cols-[320px_1fr]"
            >
              <div className="border-b border-border/40 bg-background/30 p-6 lg:border-r lg:border-b-0 lg:p-8">
                <div className="flex flex-row items-center justify-center gap-8 lg:flex-col lg:items-stretch lg:gap-0 lg:space-y-1">
                  {steps.map((step) => (
                    <SidebarStep
                      key={step.id}
                      step={step}
                      currentStep={currentStep}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col p-6 lg:p-10">
                <div className="flex-1">
                  <div
                    key={currentStep}
                    className="animate-in space-y-8 duration-300 fade-in-0 slide-in-from-right-3"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-2xl font-semibold text-foreground">
                          {activeStep.name}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {activeStep.description}
                        </p>
                      </div>
                      <Badge variant="secondary" className="w-fit">
                        Step {currentStep + 1} of {steps.length}
                      </Badge>
                    </div>

                    {formError ? (
                      <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                        {formError}
                      </div>
                    ) : null}

                    {currentStep === 0 ? (
                      <div className="space-y-8">
                        <div className="rounded-2xl border border-border/40 bg-background/30 p-6 backdrop-blur">
                          <div className="flex flex-col gap-5 md:flex-row md:items-center">
                            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                              <Sparkles className="size-6" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-xl font-semibold">
                                Your journey starts now
                              </h3>
                              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                Let's finish your member profile with a few
                                quick details before opening your dashboard.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                          {onboardingHighlights.map((item) => {
                            const Icon = item.icon

                            return (
                              <div
                                key={item.title}
                                className="rounded-xl border border-border/40 bg-background/40 p-4 backdrop-blur transition-all hover:border-primary/50 hover:bg-background/60"
                              >
                                <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                                  <Icon className="size-4" />
                                </div>
                                <p className="mt-4 text-sm font-medium">
                                  {item.title}
                                </p>
                                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                                  {item.description}
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : currentStep === 1 ? (
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="first-name">First name</Label>
                          <Input
                            id="first-name"
                            value={data.firstName}
                            onChange={(event) =>
                              updateField("firstName", event.target.value)
                            }
                            disabled={isSubmitting}
                            placeholder="John"
                            className="rounded-lg border-border/40 bg-background/40 backdrop-blur transition-all focus:border-primary/50 focus:bg-background/60"
                          />
                          {fieldError(error, "firstName")}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="last-name">Last name</Label>
                          <Input
                            id="last-name"
                            value={data.lastName}
                            onChange={(event) =>
                              updateField("lastName", event.target.value)
                            }
                            disabled={isSubmitting}
                            placeholder="Doe"
                            className="rounded-lg border-border/40 bg-background/40 backdrop-blur transition-all focus:border-primary/50 focus:bg-background/60"
                          />
                          {fieldError(error, "lastName")}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="date-of-birth">Date of birth</Label>
                          <div className="relative">
                            <CalendarDays className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              id="date-of-birth"
                              type="date"
                              max={maxDate}
                              value={data.dateOfBirth}
                              onChange={(event) =>
                                updateField("dateOfBirth", event.target.value)
                              }
                              disabled={isSubmitting}
                              className="rounded-lg border-border/40 bg-background/40 pl-10 backdrop-blur transition-all focus:border-primary/50 focus:bg-background/60"
                            />
                          </div>
                          {fieldError(error, "dateOfBirth")}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="gender">Gender</Label>
                          <Select
                            value={data.gender}
                            onValueChange={(value) =>
                              updateField("gender", value)
                            }
                            disabled={isSubmitting}
                          >
                            <SelectTrigger
                              id="gender"
                              className="rounded-lg border-border/40 bg-background/40 backdrop-blur transition-all focus:border-primary/50 focus:bg-background/60"
                            >
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                              <SelectItem value="prefer-not-to-say">
                                Prefer not to say
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {fieldError(error, "gender")}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="weight">Weight (kg)</Label>
                            <div className="relative">
                              <Weight className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                id="weight"
                                type="number"
                                min="1"
                                step="0.1"
                                value={data.weight}
                                onChange={(event) =>
                                  updateField("weight", event.target.value)
                                }
                                disabled={isSubmitting}
                                placeholder="70"
                                className="rounded-lg border-border/40 bg-background/40 pl-10 backdrop-blur transition-all focus:border-primary/50 focus:bg-background/60"
                              />
                            </div>
                            {fieldError(error, "weight")}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="height">Height (cm)</Label>
                            <div className="relative">
                              <Ruler className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                id="height"
                                type="number"
                                min="1"
                                value={data.height}
                                onChange={(event) =>
                                  updateField("height", event.target.value)
                                }
                                disabled={isSubmitting}
                                placeholder="175"
                                className="rounded-lg border-border/40 bg-background/40 pl-10 backdrop-blur transition-all focus:border-primary/50 focus:bg-background/60"
                              />
                            </div>
                            {fieldError(error, "height")}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="blood-type">Blood type</Label>
                          <Select
                            value={data.bloodType}
                            onValueChange={(value) =>
                              updateField("bloodType", value)
                            }
                            disabled={isSubmitting}
                          >
                            <SelectTrigger
                              id="blood-type"
                              className="rounded-lg border-border/40 bg-background/40 backdrop-blur transition-all focus:border-primary/50 focus:bg-background/60"
                            >
                              <Droplet className="mr-2 size-4 text-muted-foreground" />
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="a-positive">A+</SelectItem>
                              <SelectItem value="a-negative">A-</SelectItem>
                              <SelectItem value="b-positive">B+</SelectItem>
                              <SelectItem value="b-negative">B-</SelectItem>
                              <SelectItem value="ab-positive">AB+</SelectItem>
                              <SelectItem value="ab-negative">AB-</SelectItem>
                              <SelectItem value="o-positive">O+</SelectItem>
                              <SelectItem value="o-negative">O-</SelectItem>
                              <SelectItem value="unknown">
                                I don't know
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {fieldError(error, "bloodType")}
                        </div>

                        <Separator className="bg-border/40" />

                        <div className="space-y-4">
                          <Label className="text-base">Lifestyle habits</Label>
                          <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label
                                htmlFor="smoking-status"
                                className="flex items-center gap-2 text-sm font-normal"
                              >
                                <Cigarette className="size-4" />
                                Smoking status
                              </Label>
                              <Select
                                value={data.smokingStatus}
                                onValueChange={(value) =>
                                  updateField("smokingStatus", value)
                                }
                                disabled={isSubmitting}
                              >
                                <SelectTrigger
                                  id="smoking-status"
                                  className="rounded-lg border-border/40 bg-background/40 backdrop-blur transition-all focus:border-primary/50 focus:bg-background/60"
                                >
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="never">Never</SelectItem>
                                  <SelectItem value="former">
                                    Former smoker
                                  </SelectItem>
                                  <SelectItem value="occasional">
                                    Occasionally
                                  </SelectItem>
                                  <SelectItem value="regular">
                                    Regularly
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              {fieldError(error, "smokingStatus")}
                            </div>

                            <div className="space-y-2">
                              <Label
                                htmlFor="alcohol-consumption"
                                className="flex items-center gap-2 text-sm font-normal"
                              >
                                <Wine className="size-4" />
                                Alcohol consumption
                              </Label>
                              <Select
                                value={data.alcoholConsumption}
                                onValueChange={(value) =>
                                  updateField("alcoholConsumption", value)
                                }
                                disabled={isSubmitting}
                              >
                                <SelectTrigger
                                  id="alcohol-consumption"
                                  className="rounded-lg border-border/40 bg-background/40 backdrop-blur transition-all focus:border-primary/50 focus:bg-background/60"
                                >
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="never">Never</SelectItem>
                                  <SelectItem value="occasional">
                                    Occasionally
                                  </SelectItem>
                                  <SelectItem value="moderate">
                                    Moderate
                                  </SelectItem>
                                  <SelectItem value="frequent">
                                    Frequent
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              {fieldError(error, "alcoholConsumption")}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="exercise-frequency"
                            className="flex items-center gap-2"
                          >
                            <Activity className="size-4" />
                            Exercise frequency
                          </Label>
                          <Select
                            value={data.exerciseFrequency}
                            onValueChange={(value) =>
                              updateField("exerciseFrequency", value)
                            }
                            disabled={isSubmitting}
                          >
                            <SelectTrigger
                              id="exercise-frequency"
                              className="rounded-lg border-border/40 bg-background/40 backdrop-blur transition-all focus:border-primary/50 focus:bg-background/60"
                            >
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No exercise</SelectItem>
                              <SelectItem value="1-2">
                                1-2 times per week
                              </SelectItem>
                              <SelectItem value="3-4">
                                3-4 times per week
                              </SelectItem>
                              <SelectItem value="5+">
                                5+ times per week
                              </SelectItem>
                              <SelectItem value="daily">Daily</SelectItem>
                            </SelectContent>
                          </Select>
                          {fieldError(error, "exerciseFrequency")}
                        </div>

                        <Separator className="bg-border/40" />

                        <div className="space-y-3">
                          <Label className="text-base">
                            Chronic conditions
                          </Label>
                          <div className="grid gap-3 md:grid-cols-2">
                            {chronicConditionOptions.map((condition) => (
                              <label
                                key={condition}
                                htmlFor={`condition-${condition}`}
                                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border/40 bg-background/40 px-3 py-2 text-sm backdrop-blur transition-all hover:border-primary/50 hover:bg-background/60 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                              >
                                <Checkbox
                                  id={`condition-${condition}`}
                                  checked={data.chronicConditions.includes(
                                    condition
                                  )}
                                  onCheckedChange={() =>
                                    toggleCondition(condition)
                                  }
                                  disabled={isSubmitting}
                                />
                                <span>{condition}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-border/40 pt-8">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={prevStep}
                    disabled={currentStep === 0 || isSubmitting}
                    className="gap-2 text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowLeft className="size-4" />
                    Back
                  </Button>

                  {currentStep < steps[steps.length - 1].id ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={isSubmitting}
                      className="gap-2 rounded-full px-8"
                    >
                      {currentStep === 0 ? "Start onboarding" : "Next step"}
                      <ArrowRight className="size-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="gap-2 rounded-full px-8"
                    >
                      {isSubmitting ? "Saving..." : "Complete"}
                      <Check className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
