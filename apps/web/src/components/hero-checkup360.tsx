import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import {
  Activity,
  ArrowUpRight,
  BrainCircuit,
  HeartPulse,
  LogIn,
  ShieldCheck,
  ArrowRight,
} from "lucide-react"
import { Link } from "react-router-dom"
import { getRedirectUrlByUserRole } from "@workspace/api"
import type { AuthMeResponse } from "@workspace/api"

type HeroCheckup360Props = {
  className?: string
  user?: AuthMeResponse | null
}

const heroCards = [
  {
    title: "For employees",
    description:
      "Health data input and personalized preventive recommendations.",
    icon: HeartPulse,
  },
  {
    title: "For employers",
    description: "Aggregated indicators to detect risk trends.",
    icon: ShieldCheck,
  },
  {
    title: "Risk engine",
    description: "Risk prediction using machine learning models.",
    icon: BrainCircuit,
  },
]

export function HeroCheckup360({ className, user }: HeroCheckup360Props) {
  const isAdminOrSysadmin =
    user && (user.is_sysadmin || user.memberships?.some((m) => m.role === "admin"))

  const getButtonLabel = () => {
    if (user?.is_sysadmin) return "Backoffice"
    if (user?.memberships?.some((m) => m.role === "admin")) return "Dashboard"
    return "Dashboard"
  }

  const handleNavigate = () => {
    const redirectUrl = getRedirectUrlByUserRole(user)
    window.location.replace(redirectUrl)
  }

  return (
    <div className={cn("bg-background", className)}>
      <section className="overflow-hidden py-20 md:min-h-[calc(100svh-65px)] md:py-28">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative isolate grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/70 mask-[linear-gradient(to_top,transparent,white,white,transparent)] p-16 opacity-80 md:size-[1200px] md:p-32"
            >
              <div className="size-full rounded-full border border-border/70 p-16 md:p-32">
                <div className="size-full rounded-full border border-border/70" />
              </div>
            </div>

            <div className="flex flex-col items-start gap-6 text-left">
              <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-4 py-1.5 text-sm text-muted-foreground shadow-sm backdrop-blur">
                <Activity className="size-4 text-primary" />
                AI-powered preventive occupational health
              </div>

              <div className="space-y-5">
                <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl md:text-7xl">
                  CheckUp360
                </h1>

                <p className="max-w-2xl text-2xl font-medium tracking-tight text-balance text-foreground/85 md:text-3xl">
                  Manage your team’s health before risk turns into a problem.
                </p>
              </div>

              <p className="max-w-2xl text-base leading-7 text-pretty text-muted-foreground md:text-lg">
                We integrate health data, predictive analytics, and personalized
                recommendations to help companies monitor risks, prevent chronic
                diseases, and make better decisions.
              </p>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                {isAdminOrSysadmin ? (
                  <Button size="lg" onClick={handleNavigate}>
                    {getButtonLabel()}
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                ) : (
                  <>
                    <Button size="lg" asChild>
                      <Link to="/login">
                        Log in
                        <LogIn className="ml-2 size-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="lg" asChild>
                      <a href="mailto:team.checkup360@gmail.com">
                        Contact
                        <ArrowUpRight className="ml-2 size-4" />
                      </a>
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-4 -z-10 rounded-full bg-primary/10 blur-3xl" />
              <div className="rounded-lg border bg-card/80 p-4 shadow-2xl shadow-foreground/10 backdrop-blur">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <p className="text-sm font-medium">Population risk</p>
                    <p className="text-xs text-muted-foreground">
                      Aggregated and anonymized view
                    </p>
                  </div>
                  <div className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    AI active
                  </div>
                </div>

                <div className="grid gap-3 py-5 sm:grid-cols-3">
                  <div className="rounded-lg bg-muted/60 p-4">
                    <p className="text-2xl font-semibold">84%</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      no critical alerts
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/60 p-4">
                    <p className="text-2xl font-semibold">12</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      detected trends
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/60 p-4">
                    <p className="text-2xl font-semibold">3.8x</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      clinical prioritization
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    ["Cardiometabolic", "72%"],
                    ["Stress & recovery", "58%"],
                    ["Physical activity", "44%"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="mb-1.5 flex justify-between text-xs">
                        <span className="font-medium">{label}</span>
                        <span className="text-muted-foreground">{value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: value }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:col-span-2 lg:grid-cols-3">
              {heroCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-lg border bg-card/70 p-5 text-left shadow-sm backdrop-blur"
                >
                  <card.icon className="mb-4 size-5 text-primary" />
                  <p className="text-sm font-medium">{card.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {card.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t bg-muted/30">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>CheckUp360</p>
          <a
            href="mailto:team.checkup360@gmail.com"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            team.checkup360@gmail.com
          </a>
        </div>
      </footer>
    </div>
  )
}
