import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { Badge } from "@workspace/ui/components/badge"
import {
  Activity,
  ArrowUpRight,
  Clock,
  HeartPulse,
  Sparkles,
  LogIn,
  ArrowRight,
  Sun,
  Moon,
  LogOut,
  type LucideIcon,
} from "lucide-react"
import { Link } from "react-router-dom"
import { getRedirectUrlByUserRole, logout, resolveCmsUrl } from "@workspace/api"
import type { AuthMeResponse } from "@workspace/api"
import { useTheme } from "@workspace/ui/components/theme-provider"
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { useInView } from "@/hooks/use-in-view"

type HeroCheckup360Props = {
  className?: string
  user?: AuthMeResponse | null
}

const previewDomains: { name: string; value: number; icon: LucideIcon }[] = [
  { name: "Cardiovascular", value: 88, icon: HeartPulse },
  { name: "Metabolic", value: 71, icon: Activity },
  { name: "Sleep", value: 64, icon: Moon },
  { name: "Mood", value: 92, icon: Sparkles },
]

const previewNewsArticles = [
  {
    category: "Sleep Apnea",
    title:
      "Snoring, Fatigue and Sleep Apnea: Protect Your Heart While You Sleep",
    excerpt:
      "Poor sleep quality and untreated apnea raise cardiovascular risk. Learn the early warning signs.",
    readTime: "5 min read",
    image: "/landing/news/sleep.jpg",
  },
  {
    category: "Diabetes",
    title: "Preventing Type 2 Diabetes: How to Keep Blood Glucose in Check",
    excerpt:
      "Insulin resistance and prediabetes can be reversed with the right lifestyle habits.",
    readTime: "6 min read",
    image: "/landing/news/glucose.jpg",
  },
  {
    category: "General Health",
    title: "Everyday Prevention: 5 Habits That Transform Your Health",
    excerpt:
      "Great health changes rarely happen in a single moment, but in everyday decisions.",
    readTime: "5 min read",
    image: "/landing/news/general.jpg",
  },
]

const newsDeckPositions = [
  { offsetX: -118, rotation: -9, offsetY: 26 },
  { offsetX: 118, rotation: 9, offsetY: 26 },
  { offsetX: 0, rotation: 0, offsetY: 0 },
]
const RevealContext = createContext(true)

const previewOverallHealthIndex = 82

function OverallHealthRing({ value }: { value: number }) {
  const isRevealed = useContext(RevealContext)
  const radius = 42
  const circumference = 2 * Math.PI * radius
  return (
    <div className="relative size-28 shrink-0">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="8"
          className="stroke-muted"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={
            circumference * (1 - (isRevealed ? value : 0) / 100)
          }
          className="stroke-risk-low transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl leading-none font-semibold tabular-nums">
          {value}
        </span>
        <span className="mt-1 text-[10px] text-muted-foreground">
          out of 100
        </span>
      </div>
    </div>
  )
}

const previewDepartments: {
  name: string
  value: number
  variant: "risk-low" | "risk-moderate" | "risk-high"
  label: string
}[] = [
  { name: "Finance", value: 85, variant: "risk-low", label: "Low risk" },
  {
    name: "Operations",
    value: 72,
    variant: "risk-moderate",
    label: "Moderate",
  },
  { name: "Logistics", value: 47, variant: "risk-high", label: "Attention" },
]

function MeterRow({
  label,
  value,
  icon: Icon,
  trailing,
  index = 0,
}: {
  label: string
  value: number
  icon?: LucideIcon
  trailing?: ReactNode
  index?: number
}) {
  const isRevealed = useContext(RevealContext)
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium">
          {Icon && <Icon className="size-4 text-muted-foreground" />}
          {label}
        </span>
        <span className="flex items-center gap-2">
          <span className="text-muted-foreground tabular-nums">{value}</span>
          {trailing}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-linear-to-r from-primary/60 to-primary transition-[width] duration-1000 ease-out"
          style={{
            width: isRevealed ? `${value}%` : "0%",
            transitionDelay: `${index * 120}ms`,
          }}
        />
      </div>
    </div>
  )
}

function EmployeeTileVisual() {
  return (
    <div className="mx-auto flex h-full w-full max-w-xs flex-col items-center justify-center gap-4 rounded-xl border bg-card p-5 shadow-lg shadow-foreground/5">
      <div className="flex w-full items-center justify-between">
        <p className="text-sm font-medium">Health Score</p>
        <Badge variant="risk-low">Low risk</Badge>
      </div>
      <OverallHealthRing value={previewOverallHealthIndex} />
    </div>
  )
}

function EmployerTileVisual() {
  return (
    <div className="mx-auto w-full max-w-lg rounded-xl border bg-card p-5 shadow-lg shadow-foreground/5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium">Departments</p>
        <p className="text-2xl leading-none font-semibold tabular-nums">68</p>
      </div>
      <div className="space-y-3">
        {previewDepartments.map((department, index) => (
          <MeterRow
            key={department.name}
            index={index}
            label={department.name}
            value={department.value}
            trailing={
              <Badge variant={department.variant} className="text-[10px]">
                {department.label}
              </Badge>
            }
          />
        ))}
      </div>
    </div>
  )
}

function AssessmentsTileVisual() {
  return (
    <div className="mx-auto grid w-full max-w-2xl gap-x-8 gap-y-4 rounded-xl border bg-card p-5 shadow-lg shadow-foreground/5 sm:grid-cols-2">
      {previewDomains.map((domain, index) => (
        <MeterRow
          key={domain.name}
          index={index}
          label={domain.name}
          value={domain.value}
          icon={domain.icon}
        />
      ))}
    </div>
  )
}

function NewsArticleCard({
  article,
}: {
  article: (typeof previewNewsArticles)[number]
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-xl shadow-foreground/10">
      <img
        src={article.image}
        alt=""
        loading="lazy"
        className="h-28 w-full object-cover"
      />
      <div className="space-y-2 p-3.5">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {article.readTime}
          </span>
          <Badge variant="secondary" className="text-[10px]">
            {article.category}
          </Badge>
        </div>
        <p className="line-clamp-2 text-sm leading-snug font-semibold">
          {article.title}
        </p>
        <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
          {article.excerpt}
        </p>
        <p className="flex items-center justify-end gap-1 pt-1 text-[11px] font-medium">
          Read article
          <ArrowRight className="size-3" />
        </p>
      </div>
    </div>
  )
}

function NewsTileVisual() {
  const [isSpread, setIsSpread] = useState(false)

  return (
    <div
      className="relative mx-auto h-[22rem] w-full"
      onMouseEnter={() => setIsSpread(true)}
      onMouseLeave={() => setIsSpread(false)}
    >
      {previewNewsArticles.map((article, index) => {
        const position = newsDeckPositions[index]
        const spread = isSpread ? 1.12 : 1
        return (
          <div
            key={article.title}
            className="absolute top-4 left-1/2 w-56 origin-bottom transition-transform duration-500 ease-out"
            style={{
              zIndex: index === 2 ? 20 : 10 + index,
              transform: `translateX(calc(-50% + ${position.offsetX * spread}px)) translateY(${position.offsetY}px) rotate(${position.rotation * spread}deg)`,
            }}
          >
            <NewsArticleCard article={article} />
          </div>
        )
      })}
    </div>
  )
}

const AUTO_ADVANCE_MILLISECONDS = 6000

type ShowcaseItem = {
  id: string
  title: string
  description: string
  visual: ReactNode
}

const showcaseItems: ShowcaseItem[] = [
  {
    id: "employees",
    title: "For employees",
    description:
      "Complete short clinical questionnaires and get a clear health index.",
    visual: <EmployeeTileVisual />,
  },
  {
    id: "employers",
    title: "For employers",
    description:
      "Workforce health overview by department, risk trends, and assessment compliance.",
    visual: <EmployerTileVisual />,
  },
  {
    id: "assessments",
    title: "Validated assessments",
    description:
      "Clinically validated questionnaires, scored on a single 0-100 health index.",
    visual: <AssessmentsTileVisual />,
  },
  {
    id: "news",
    title: "Preventive news",
    description:
      "Articles from the care team, matched to each person's results.",
    visual: <NewsTileVisual />,
  },
]

function ShowcaseProgress({ isRunning }: { isRunning: boolean }) {
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setHasStarted(true), 30)
    return () => window.clearTimeout(timeoutId)
  }, [])

  return (
    <div className="mt-4 h-px w-full bg-border">
      <div
        className="h-full origin-left bg-foreground transition-transform ease-linear"
        style={{
          transform: `scaleX(${hasStarted || !isRunning ? 1 : 0})`,
          transitionDuration: isRunning
            ? `${AUTO_ADVANCE_MILLISECONDS}ms`
            : "0ms",
        }}
      />
    </div>
  )
}

function ShowcaseStage({ children }: { children: ReactNode }) {
  const [isRevealed, setIsRevealed] = useState(false)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setIsRevealed(true), 50)
    return () => window.clearTimeout(timeoutId)
  }, [])

  return (
    <RevealContext.Provider value={isRevealed}>
      <div className="w-full animate-in duration-500 zoom-in-95 fade-in slide-in-from-bottom-2">
        {children}
      </div>
    </RevealContext.Provider>
  )
}

function ProductShowcase() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(true)
  const { elementRef, isInView } = useInView<HTMLDivElement>(0.3)

  useEffect(() => {
    if (!isAutoAdvancing || !isInView) return
    const timeoutId = window.setTimeout(
      () => setActiveIndex((index) => (index + 1) % showcaseItems.length),
      AUTO_ADVANCE_MILLISECONDS
    )
    return () => window.clearTimeout(timeoutId)
  }, [activeIndex, isAutoAdvancing, isInView])

  const selectItem = (index: number) => {
    setIsAutoAdvancing(false)
    setActiveIndex(index)
  }

  const activeItem = showcaseItems[activeIndex]

  return (
    <div
      ref={elementRef}
      className={cn(
        "grid items-stretch gap-8 transition-all duration-700 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12",
        isInView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      )}
    >
      <div className="flex flex-col justify-center" role="tablist">
        {showcaseItems.map((item, index) => {
          const isActive = index === activeIndex
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => selectItem(index)}
              className={cn(
                "group py-5 text-left transition-opacity duration-300 first:pt-0 last:pb-0",
                isActive ? "opacity-100" : "opacity-45 hover:opacity-80"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold tracking-tight">
                  {item.title}
                </span>
              </div>
              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-500",
                  isActive ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div className="overflow-hidden">
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
              {isActive ? (
                <ShowcaseProgress key={item.id} isRunning={isAutoAdvancing} />
              ) : (
                <div className="mt-4 h-px w-full bg-border" />
              )}
            </button>
          )
        })}
      </div>

      <div className="relative isolate flex min-h-[26rem] items-center justify-center overflow-hidden rounded-2xl border bg-muted/30 p-6 sm:p-10">
        <div
          aria-hidden
          className="absolute inset-x-6 -top-8 -z-10 h-40 rounded-full bg-primary/15 blur-3xl"
        />
        <div className="relative w-full max-w-md">
          <ShowcaseStage key={activeItem.id}>{activeItem.visual}</ShowcaseStage>
        </div>
      </div>
    </div>
  )
}

export function HeroCheckup360({ className, user }: HeroCheckup360Props) {
  const { theme, setTheme } = useTheme()
  const isSysadmin = user?.is_sysadmin
  const isAdmin = user?.membership?.roles?.includes("admin")
  const isContentManager = user?.membership?.roles?.includes("content_manager")

  const [loggingOut, setLoggingOut] = useState(false)

  const toggleTheme = () => {
    const resolvedTheme =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme

    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  const getButtonLabel = () => {
    if (isSysadmin) return "Backoffice"
    if (isContentManager && !isAdmin) return "CMS"
    return "Dashboard"
  }

  const handleNavigate = () => {
    if (isContentManager && !isAdmin && !isSysadmin) {
      window.location.assign(`${resolveCmsUrl()}/admin`)
      return
    }
    const redirectUrl = getRedirectUrlByUserRole(user)
    window.location.replace(redirectUrl)
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    window.location.replace("/")
  }

  return (
    <div className={cn("relative bg-background", className)}>
      {/* Floating Theme Toggle on Landing page */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={toggleTheme}
          className="flex size-10 items-center justify-center rounded-lg border border-border/40 bg-background/80 text-muted-foreground shadow-lg backdrop-blur-md transition-all hover:bg-muted hover:text-foreground"
          aria-label="Toggle color theme"
        >
          {theme === "dark" ? (
            <Sun className="size-5 animate-in duration-300 spin-in-45" />
          ) : (
            <Moon className="size-5 animate-in duration-300 spin-in-45" />
          )}
        </button>
      </div>

      <section className="relative isolate overflow-hidden pt-24 pb-12 md:pt-32">
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/70 mask-[linear-gradient(to_top,transparent,white,white,transparent)] p-16 opacity-80 md:size-[1200px] md:p-32"
        >
          <div className="size-full rounded-full border border-border/70 p-16 md:p-32">
            <div className="size-full rounded-full border border-border/70" />
          </div>
        </div>
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-4 py-1.5 text-sm text-muted-foreground shadow-sm backdrop-blur">
              <Activity className="size-4 text-primary" />
              Preventive occupational health
            </div>

            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl md:text-7xl">
                CheckUp360
              </h1>

              <p className="mx-auto max-w-2xl text-2xl font-medium tracking-tight text-balance text-foreground/85 md:text-3xl">
                Manage your team’s health before risk turns into a problem.
              </p>
            </div>

            <p className="mx-auto max-w-2xl text-base leading-7 text-pretty text-muted-foreground md:text-lg">
              We bring validated clinical assessments, health trends, and
              personalized recommendations together so companies can monitor
              risks, prevent chronic diseases, and make better decisions.
            </p>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
              {user ? (
                <>
                  <Button size="lg" onClick={handleNavigate}>
                    {getButtonLabel()}
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleLogout}
                    disabled={loggingOut}
                  >
                    {loggingOut ? "Logging out..." : "Log out"}
                    {!loggingOut && <LogOut className="ml-2 size-4" />}
                  </Button>
                </>
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
        </div>
      </section>

      <section className="overflow-hidden pb-20 md:pb-28">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <ProductShowcase />
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
