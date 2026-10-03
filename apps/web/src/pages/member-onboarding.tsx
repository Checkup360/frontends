import { acceptConsent, logout, resolveWebUrl, submitMemberDetails } from "@workspace/api"
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
import { useTheme } from "@workspace/ui/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils"
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  FileText,
  HeartPulse,
  Lock,
  LogOut,
  Moon,
  Ruler,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  Weight,
  type LucideIcon,
} from "lucide-react"
import { useMemo, useState } from "react"
import { Navigate } from "react-router-dom"
import { usePwaInstall } from "../components/pwa/pwa-install-context"
import { PwaInstallDrawer } from "../components/pwa/pwa-install-drawer"
import { LegalDocumentModal } from "../components/legal/legal-document-modal"
import { MedicalNonDiagnosticDisclaimer } from "../components/legal/medical-disclaimer"

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    const resolvedTheme =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme

    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex size-9 items-center justify-center rounded-lg border border-border/40 bg-background/70 text-muted-foreground shadow-xs transition-all hover:bg-muted hover:text-foreground"
      aria-label="Toggle color theme"
    >
      {theme === "dark" ? (
        <Sun className="size-4 animate-in duration-300 spin-in-45" />
      ) : (
        <Moon className="size-4 animate-in duration-300 spin-in-45" />
      )}
    </button>
  )
}

type OnboardingData = {
  firstName: string
  lastName: string
  phoneNumber: string
  dateOfBirth: string
  gender: string
  weight: string
  height: string
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
  phoneNumber: "",
  dateOfBirth: "",
  gender: "",
  weight: "",
  height: "",
}

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
    name: "Biometrics",
    description: "Height and weight",
    icon: HeartPulse,
  },
  {
    id: 3,
    name: "Consent & Privacy",
    description: "Legal agreements",
    icon: ShieldCheck,
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

function fieldError(
  error: string | null,
  field: string,
  message: string = "Required field"
) {
  return error === field ? (
    <p className="text-sm text-destructive">{message}</p>
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
  const { user, isLoading, refresh, clear } = useCurrentUser()
  const { canInstall } = usePwaInstall()
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<OnboardingData>(initialData)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [installDrawerOpen, setInstallDrawerOpen] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)
  const [acceptHealthData, setAcceptHealthData] = useState(false)
  const [viewingLegalDoc, setViewingLegalDoc] = useState<string | null>(null)
  const [previousStepIndex, setPreviousStepIndex] = useState(currentStep)

  if (currentStep !== previousStepIndex) {
    setPreviousStepIndex(currentStep)
    if (currentStep !== 3) {
      setAcceptTerms(false)
      setAcceptPrivacy(false)
      setAcceptHealthData(false)
    }
  }
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

  const validateStep = () => {
    if (currentStep === 1) {
      if (!data.firstName.trim()) return "firstName"
      if (!data.lastName.trim()) return "lastName"
      if (!data.phoneNumber.trim()) return "phoneNumber"
      if (!/^\+[\d\s\-(). ]{7,19}$/.test(data.phoneNumber.trim()))
        return "phoneNumber"
      if (!data.dateOfBirth) return "dateOfBirth"
      if (!data.gender) return "gender"
    }

    if (currentStep === 2) {
      if (
        !data.weight ||
        isNaN(Number(data.weight)) ||
        Number(data.weight) <= 0 ||
        Number(data.weight) >= 500
      )
        return "weight"
      if (
        !data.height ||
        isNaN(Number(data.height)) ||
        Number(data.height) <= 0 ||
        Number(data.height) >= 300
      )
        return "height"
    }

    if (currentStep === 3) {
      if (!acceptTerms) return "acceptTerms"
      if (!acceptPrivacy) return "acceptPrivacy"
      if (!acceptHealthData) return "acceptHealthData"
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

  const continueToApp = async () => {
    await refresh()
    window.location.replace("/")
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
      // 1. Record legal consents
      await acceptConsent({
        consent_type: "TERMS_AND_CONDITIONS",
        document_version: "1",
      })
      await acceptConsent({
        consent_type: "PRIVACY_POLICY",
        document_version: "1",
      })
      await acceptConsent({
        consent_type: "HEALTH_DATA_PROCESSING_CONSENT",
        document_version: "1",
      })
      await acceptConsent({
        consent_type: "FORM_CONSENT",
        form_type: "biometrics",
        document_version: "1",
      })

      // 2. Submit member details (which creates profile and biometrics)
      const result = await submitMemberDetails({
        date_of_birth: data.dateOfBirth,
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        phone_number: data.phoneNumber.trim(),
        height: parseFloat(data.height),
        weight: parseFloat(data.weight),
        biological_sex: data.gender,
      })

      if (result.error) {
        setFormError(result.error.message)
        return
      }

      if (canInstall) {
        setInstallDrawerOpen(true)
        return
      }

      await continueToApp()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    setFormError(null)

    try {
      await logout()
      clear()
      window.location.replace(resolveWebUrl())
    } catch {
      setFormError("Unable to log out. Please try again.")
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background px-4 py-8 sm:px-6 lg:px-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--border))_1px,transparent_0)] bg-[length:28px_28px] opacity-35" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-muted/60 blur-3xl" />

      <div className="relative z-10 mx-auto mb-4 flex w-full max-w-6xl items-center justify-end gap-2">
        <ThemeToggle />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => void handleLogout()}
          disabled={isLoggingOut}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="size-4" />
          {isLoggingOut ? "Logging out..." : "Log out"}
        </Button>
      </div>

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

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="phone-number">Phone number</Label>
                          <Input
                            id="phone-number"
                            type="tel"
                            value={data.phoneNumber}
                            onChange={(event) =>
                              updateField("phoneNumber", event.target.value)
                            }
                            disabled={isSubmitting}
                            placeholder="+54 11 1234-5678"
                            className="rounded-lg border-border/40 bg-background/40 backdrop-blur transition-all focus:border-primary/50 focus:bg-background/60"
                          />
                          {error === "phoneNumber" ? (
                            <p className="text-sm text-destructive">
                              Must start with + and country code (e.g. +54 11
                              1234-5678)
                            </p>
                          ) : null}
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
                          <Label htmlFor="gender">Biological sex</Label>
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
                            </SelectContent>
                          </Select>
                          {fieldError(error, "gender")}
                        </div>
                      </div>
                    ) : currentStep === 2 ? (
                      <div className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="weight">Weight (kg)</Label>
                            <div className="relative">
                              <Weight className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                id="weight"
                                type="number"
                                min="1"
                                max="500"
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
                            {fieldError(
                              error,
                              "weight",
                              !data.weight
                                ? "Required field"
                                : "Please enter a valid weight in kilograms (kg)."
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="height">Height (cm)</Label>
                            <div className="relative">
                              <Ruler className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                id="height"
                                type="number"
                                min="1"
                                max="300"
                                step="0.1"
                                value={data.height}
                                onChange={(event) =>
                                  updateField("height", event.target.value)
                                }
                                disabled={isSubmitting}
                                placeholder="175"
                                className="rounded-lg border-border/40 bg-background/40 pl-10 backdrop-blur transition-all focus:border-primary/50 focus:bg-background/60"
                              />
                            </div>
                            {fieldError(
                              error,
                              "height",
                              !data.height
                                ? "Required field"
                                : "Please enter a valid height in centimeters (cm)."
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {/* Header banner */}
                        <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 sm:p-5">
                          <div className="flex items-start gap-3.5">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                              <ShieldCheck className="size-5" />
                            </div>
                            <div className="min-w-0 space-y-1">
                              <h3 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
                                Informed Consent & Privacy Agreements
                              </h3>
                              <p className="text-xs leading-relaxed text-muted-foreground">
                                Please review and accept our platform agreements to enable health assessment features and preventive analytics.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Consent Cards List */}
                        <div className="space-y-3.5">
                          {/* Terms & Conditions Card */}
                          <div
                            className={cn(
                              "group relative overflow-hidden rounded-2xl border transition-all duration-200",
                              acceptTerms
                                ? "border-primary/50 bg-card shadow-xs"
                                : "border-border/70 bg-card/60 hover:border-border",
                              error === "acceptTerms" && "border-destructive/60 bg-destructive/[0.02]"
                            )}
                          >
                            {/* Card Top: Info & Read button */}
                            <div className="p-4 sm:p-5">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                                    <FileText className="size-4 text-primary" />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h4 className="text-sm font-semibold tracking-tight text-foreground">
                                        Terms of Service
                                      </h4>
                                      <Badge variant="secondary" className="text-[10px] font-mono py-0 px-1.5 h-4 text-muted-foreground">
                                        v1.0
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      Governs platform usage rules, account responsibilities, and service security standards.
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setViewingLegalDoc("TERMS_AND_CONDITIONS")}
                                  className="h-8 gap-1.5 px-3 text-xs font-medium shrink-0 rounded-lg border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted"
                                >
                                  <FileText className="size-3.5" />
                                  <span>Read document</span>
                                </Button>
                              </div>
                            </div>

                            {/* Card Bottom: Explicit Action Checkbox Bar */}
                            <div
                              className={cn(
                                "flex items-center gap-3 border-t px-4 py-3 sm:px-5 transition-colors cursor-pointer",
                                acceptTerms
                                  ? "border-primary/30 bg-primary/5"
                                  : "border-border/40 bg-muted/25 hover:bg-muted/40",
                                error === "acceptTerms" && "border-destructive/40 bg-destructive/5"
                              )}
                              onClick={() => {
                                setAcceptTerms(!acceptTerms)
                                if (error === "acceptTerms") setError(null)
                              }}
                            >
                              <Checkbox
                                id="accept-terms"
                                checked={acceptTerms}
                                onCheckedChange={(val) => {
                                  setAcceptTerms(Boolean(val))
                                  if (error === "acceptTerms") setError(null)
                                }}
                                disabled={isSubmitting}
                                className="mt-0"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Label
                                htmlFor="accept-terms"
                                className="text-xs font-medium leading-relaxed text-foreground cursor-pointer flex-1 select-none"
                              >
                                I agree to the Terms of Service
                              </Label>
                              {acceptTerms && (
                                <CheckCircle2 className="size-4 text-primary shrink-0 animate-in fade-in zoom-in-50 duration-200" />
                              )}
                            </div>

                            {error === "acceptTerms" && (
                              <p className="bg-destructive/10 px-5 py-1.5 text-xs text-destructive font-medium border-t border-destructive/20">
                                You must accept the Terms of Service to proceed.
                              </p>
                            )}
                          </div>

                          {/* Privacy Policy Card */}
                          <div
                            className={cn(
                              "group relative overflow-hidden rounded-2xl border transition-all duration-200",
                              acceptPrivacy
                                ? "border-primary/50 bg-card shadow-xs"
                                : "border-border/70 bg-card/60 hover:border-border",
                              error === "acceptPrivacy" && "border-destructive/60 bg-destructive/[0.02]"
                            )}
                          >
                            {/* Card Top: Info & Read button */}
                            <div className="p-4 sm:p-5">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                                    <Lock className="size-4 text-primary" />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h4 className="text-sm font-semibold tracking-tight text-foreground">
                                        Privacy Policy
                                      </h4>
                                      <Badge variant="secondary" className="text-[10px] font-mono py-0 px-1.5 h-4 text-muted-foreground">
                                        v1.0
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      Details how your personal data is protected, encrypted, and your privacy access rights.
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setViewingLegalDoc("PRIVACY_POLICY")}
                                  className="h-8 gap-1.5 px-3 text-xs font-medium shrink-0 rounded-lg border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted"
                                >
                                  <FileText className="size-3.5" />
                                  <span>Read document</span>
                                </Button>
                              </div>
                            </div>

                            {/* Card Bottom: Explicit Action Checkbox Bar */}
                            <div
                              className={cn(
                                "flex items-center gap-3 border-t px-4 py-3 sm:px-5 transition-colors cursor-pointer",
                                acceptPrivacy
                                  ? "border-primary/30 bg-primary/5"
                                  : "border-border/40 bg-muted/25 hover:bg-muted/40",
                                error === "acceptPrivacy" && "border-destructive/40 bg-destructive/5"
                              )}
                              onClick={() => {
                                setAcceptPrivacy(!acceptPrivacy)
                                if (error === "acceptPrivacy") setError(null)
                              }}
                            >
                              <Checkbox
                                id="accept-privacy"
                                checked={acceptPrivacy}
                                onCheckedChange={(val) => {
                                  setAcceptPrivacy(Boolean(val))
                                  if (error === "acceptPrivacy") setError(null)
                                }}
                                disabled={isSubmitting}
                                className="mt-0"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Label
                                htmlFor="accept-privacy"
                                className="text-xs font-medium leading-relaxed text-foreground cursor-pointer flex-1 select-none"
                              >
                                I agree to the Privacy Policy
                              </Label>
                              {acceptPrivacy && (
                                <CheckCircle2 className="size-4 text-primary shrink-0 animate-in fade-in zoom-in-50 duration-200" />
                              )}
                            </div>

                            {error === "acceptPrivacy" && (
                              <p className="bg-destructive/10 px-5 py-1.5 text-xs text-destructive font-medium border-t border-destructive/20">
                                You must accept the Privacy Policy to proceed.
                              </p>
                            )}
                          </div>

                          {/* Health Data Processing Consent Card */}
                          <div
                            className={cn(
                              "group relative overflow-hidden rounded-2xl border transition-all duration-200",
                              acceptHealthData
                                ? "border-primary/50 bg-card shadow-xs"
                                : "border-border/70 bg-card/60 hover:border-border",
                              error === "acceptHealthData" && "border-destructive/60 bg-destructive/[0.02]"
                            )}
                          >
                            {/* Card Top: Info & Read button */}
                            <div className="p-4 sm:p-5">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <HeartPulse className="size-4" />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h4 className="text-sm font-semibold tracking-tight text-foreground">
                                        Health & Biometric Data Processing
                                      </h4>
                                      <Badge variant="secondary" className="text-[10px] font-mono py-0 px-1.5 h-4 text-muted-foreground">
                                        v1.0
                                      </Badge>
                                      <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] py-0 px-1.5 h-4">
                                        Occupational Health
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      Authorizes processing and review of health indicators, risk profiles, and workplace well-being assessments by authorized organization administrators and medical staff.
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setViewingLegalDoc("HEALTH_DATA_PROCESSING_CONSENT")}
                                  className="h-8 gap-1.5 px-3 text-xs font-medium shrink-0 rounded-lg border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted"
                                >
                                  <FileText className="size-3.5" />
                                  <span>Read document</span>
                                </Button>
                              </div>
                            </div>

                            {/* Card Bottom: Explicit Action Checkbox Bar */}
                            <div
                              className={cn(
                                "flex items-center gap-3 border-t px-4 py-3 sm:px-5 transition-colors cursor-pointer",
                                acceptHealthData
                                  ? "border-primary/30 bg-primary/5"
                                  : "border-border/40 bg-muted/25 hover:bg-muted/40",
                                error === "acceptHealthData" && "border-destructive/40 bg-destructive/5"
                              )}
                              onClick={() => {
                                setAcceptHealthData(!acceptHealthData)
                                if (error === "acceptHealthData") setError(null)
                              }}
                            >
                              <Checkbox
                                id="accept-health"
                                checked={acceptHealthData}
                                onCheckedChange={(val) => {
                                  setAcceptHealthData(Boolean(val))
                                  if (error === "acceptHealthData") setError(null)
                                }}
                                disabled={isSubmitting}
                                className="mt-0"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Label
                                htmlFor="accept-health"
                                className="text-xs font-medium leading-relaxed text-foreground cursor-pointer flex-1 select-none"
                              >
                                I consent to Health and Biometric Data Processing
                              </Label>
                              {acceptHealthData && (
                                <CheckCircle2 className="size-4 text-primary shrink-0 animate-in fade-in zoom-in-50 duration-200" />
                              )}
                            </div>

                            {error === "acceptHealthData" && (
                              <p className="bg-destructive/10 px-5 py-1.5 text-xs text-destructive font-medium border-t border-destructive/20">
                                Health data processing consent is required to complete onboarding.
                              </p>
                            )}
                          </div>
                        </div>

                        <MedicalNonDiagnosticDisclaimer />
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
      <LegalDocumentModal
        open={viewingLegalDoc !== null}
        documentKey={viewingLegalDoc}
        onOpenChange={(open) => {
          if (!open) setViewingLegalDoc(null)
        }}
      />
      <PwaInstallDrawer
        open={installDrawerOpen}
        onOpenChange={setInstallDrawerOpen}
        onContinue={continueToApp}
      />
    </div>
  )
}
