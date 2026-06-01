import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Apple,
  ArrowLeft,
  ArrowRight,
  Clock,
  Dumbbell,
  Moon,
  Sparkles,
  Stethoscope,
  type LucideIcon,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export interface Recommendation {
  id: string
  title: string
  description: string
  priority: "high" | "medium" | "low"
  category: string
  icon: LucideIcon
  action?: string
}

const recommendations: Recommendation[] = [
  {
    id: "1",
    title: "Increase cardiovascular activity",
    description:
      "Add 30 minutes of aerobic exercise at least 3 times a week to strengthen your cardiovascular system.",
    priority: "high",
    category: "Physical activity",
    icon: Dumbbell,
    action: "View routines",
  },
  {
    id: "2",
    title: "Improve sleep quality",
    description:
      "Your sleep average is below the recommended range. A consistent nighttime routine can help.",
    priority: "medium",
    category: "Sleep",
    icon: Moon,
    action: "View tips",
  },
  {
    id: "3",
    title: "Annual preventive checkup",
    description:
      "It has been 10 months since your last checkup. Schedule your annual review to keep your profile updated.",
    priority: "medium",
    category: "Preventive care",
    icon: Stethoscope,
    action: "Schedule visit",
  },
  {
    id: "4",
    title: "Add more vegetables",
    description:
      "Based on your nutrition profile, you may benefit from increasing your vegetable and fiber intake.",
    priority: "low",
    category: "Nutrition",
    icon: Apple,
    action: "View recipes",
  },
]

const evolutionData = [
  { month: "Jan", score: 78 },
  { month: "Feb", score: 80 },
  { month: "Mar", score: 79 },
  { month: "Apr", score: 82 },
  { month: "May", score: 85 },
  { month: "Jun", score: 87 },
]

export interface NewsArticle {
  id: string
  title: string
  category: string
  readTime: number
  image: string
  excerpt: string
}

export const memberNewsArticles: NewsArticle[] = [
  {
    id: "1",
    title: "The benefits of regular exercise for cardiovascular health",
    category: "Prevention",
    readTime: 5,
    image:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
    excerpt:
      "Regular physical activity can significantly reduce the risk of heart disease.",
  },
  {
    id: "2",
    title: "Smart nutrition for a balanced diet",
    category: "Nutrition",
    readTime: 7,
    image:
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop",
    excerpt:
      "Learn how to build a meal plan that fits your lifestyle and nutritional needs.",
  },
  {
    id: "3",
    title: "The role of rest in recovery and wellbeing",
    category: "Wellbeing",
    readTime: 4,
    image:
      "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&h=300&fit=crop",
    excerpt:
      "Quality sleep is essential for cellular recovery and mental balance.",
  },
]

const priorityConfig = {
  high: {
    label: "High priority",
    color: "text-destructive",
    bg: "bg-destructive/10 border-destructive/20",
  },
  medium: {
    label: "Medium priority",
    color: "text-[color:var(--warning)]",
    bg: "bg-[color:var(--warning)]/10 border-[color:var(--warning)]/20",
  },
  low: {
    label: "Suggestion",
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
  },
} as const

const levelConfig = {
  low: {
    color: "text-[color:var(--success)]",
    bg: "bg-[color:var(--success)]/10",
    label: "Low risk",
    ringColor: "stroke-[color:var(--success)]",
  },
  moderate: {
    color: "text-[color:var(--warning)]",
    bg: "bg-[color:var(--warning)]/10",
    label: "Moderate risk",
    ringColor: "stroke-[color:var(--warning)]",
  },
  high: {
    color: "text-destructive",
    bg: "bg-destructive/10",
    label: "Needs attention",
    ringColor: "stroke-destructive",
  },
} as const

function getInitials(name: string) {
  return name
    .split(/[.\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

interface MemberOverviewProps {
  email: string
  showBack?: boolean
  onBack?: () => void
}

export function MemberOverview({ email, showBack = false, onBack }: MemberOverviewProps) {
  const memberName = email.split("@")[0] || "Member"
  const initials = getInitials(memberName) || "M"

  const radius = 70
  const circumference = 2 * Math.PI * radius
  const score = 87
  const offset = circumference - (score / 100) * circumference
  const config = levelConfig.low

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <header>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {showBack && onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                aria-label="Back"
                className="shrink-0 animate-in fade-in slide-in-from-left-2 duration-200"
              >
                <ArrowLeft className="size-5" />
              </Button>
            )}
            <Avatar className="size-14 ring-2 ring-primary/10">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {showBack ? memberName : `Hi ${memberName}`}
              </h1>
              <p className="text-sm text-muted-foreground md:text-base">
                Current health status is{" "}
                <span className="font-medium text-[color:var(--success)]">
                  stable
                </span>
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Health Score Hero */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-xl">Health score</CardTitle>
              <CardDescription>
                Personalized preventive assessment
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={`${config.bg} ${config.color} border-transparent`}
            >
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center gap-6 py-4 md:flex-row md:justify-between">
            <div className="relative flex items-center justify-center">
              <svg
                className="size-40 -rotate-90 transform md:size-48"
                viewBox="0 0 160 160"
                aria-hidden="true"
              >
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className={`${config.ringColor} transition-all duration-1000 ease-out`}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span
                  className={`text-5xl font-bold tabular-nums ${config.color}`}
                >
                  {score}
                </span>
                <span className="text-sm text-muted-foreground">out of 100</span>
              </div>
            </div>

            <div className="w-full max-w-md space-y-3 text-center md:text-left">
              <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-4 text-left">
                <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-relaxed">
                    Preventive analysis
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    The profile shows low cardiovascular risk. Keep current exercise and nutrition habits, and maintain regular follow-up.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="font-medium text-[color:var(--success)]">85+</p>
                  <p className="text-xs text-muted-foreground">Excellent</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="font-medium text-[color:var(--warning)]">
                    60-84
                  </p>
                  <p className="text-xs text-muted-foreground">Moderate</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="font-medium text-destructive">&lt;60</p>
                  <p className="text-xs text-muted-foreground">Attention</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendation Card (Only for members) */}
      {!showBack && (
        <section className="space-y-4">
          <Carousel
            opts={{
              align: "start",
            }}
            className="w-full"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  Personalized recommendations
                </h2>
                <p className="text-sm text-muted-foreground">
                  Suggested actions to improve wellbeing
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <CarouselPrevious className="static translate-x-0 translate-y-0" />
                <CarouselNext className="static translate-x-0 translate-y-0" />
              </div>
            </div>

            <CarouselContent className="-ml-4 mt-4 px-px pb-1">
              {recommendations.map((recommendation) => {
                const Icon = recommendation.icon
                const pConfig = priorityConfig[recommendation.priority]

                return (
                  <CarouselItem
                    key={recommendation.id}
                    className="pl-4 md:basis-1/2 lg:basis-1/3"
                  >
                    <Card className="group h-full min-h-[240px] border-border/60 transition-all hover:border-primary/25 hover:shadow-sm">
                      <CardHeader className="gap-3 px-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="size-5" />
                          </div>
                          <Badge
                            variant="outline"
                            className={`${pConfig.bg} ${pConfig.color} text-xs`}
                          >
                            {pConfig.label}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <CardTitle className="text-base leading-tight">
                            {recommendation.title}
                          </CardTitle>
                          <p className="text-sm leading-5 text-muted-foreground">
                            {recommendation.description}
                          </p>
                        </div>
                      </CardHeader>
                      <CardContent className="mt-auto flex items-center justify-between gap-3 px-5">
                        <Badge variant="secondary" className="text-xs">
                          {recommendation.category}
                        </Badge>
                        {recommendation.action && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-2 px-2 text-xs opacity-80 transition-opacity group-hover:opacity-100"
                          >
                            {recommendation.action}
                            <ArrowRight className="size-3" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </CarouselItem>
                )
              })}
            </CarouselContent>
          </Carousel>
        </section>
      )}

      {/* Health Evolution Chart */}
      <div className="pt-2">
        <Card className="border-border/60 p-6 shadow-[var(--shadow-card)]">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Health score trend
            </h3>
            <p className="text-sm text-muted-foreground">
              Monthly evolution of preventive health score
            </p>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={evolutionData}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="memberHealthScoreGradientShared"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="oklch(0.55 0.16 35)"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="100%"
                      stopColor="oklch(0.55 0.16 35)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.92 0.015 210)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  stroke="oklch(0.5 0.03 220)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="oklch(0.5 0.03 220)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  name="Health score"
                  stroke="oklch(0.55 0.16 35)"
                  fill="url(#memberHealthScoreGradientShared)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: "oklch(0.55 0.16 35)" }}
              />
              Health score
            </span>
          </div>
        </Card>
      </div>

      {/* News Card (Only for members) */}
      {!showBack && (
        <Card>
          <CardHeader>
            <CardTitle>Health content</CardTitle>
            <CardDescription>
              Articles and tips for wellbeing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {memberNewsArticles.map((article) => (
              <article
                key={article.id}
                className="group overflow-hidden rounded-lg border border-border/60 bg-card transition-all hover:border-primary/25 hover:shadow-sm"
              >
                <div className="flex gap-4 p-4">
                  <div className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <img
                      src={article.image}
                      alt=""
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {article.category}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          {article.readTime} min
                        </span>
                      </div>
                      <h4 className="line-clamp-2 leading-snug font-medium group-hover:text-primary">
                        {article.title}
                      </h4>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {article.excerpt}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Read article
                      <ArrowRight className="size-3" />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function MemberOverviewSkeleton({ showBack = false }: { showBack?: boolean }) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 animate-in fade-in duration-300">
      <header className="space-y-6">
        <div className="flex items-center gap-4">
          {showBack && <Skeleton className="size-10 rounded-lg shrink-0" />}
          <Skeleton className="size-14 rounded-full shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-44" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
        </div>
      </header>

      <Card className="border-2">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6 py-4 md:flex-row md:justify-between">
            <Skeleton className="size-40 rounded-full md:size-48" />
            <div className="w-full max-w-md space-y-3">
              <Skeleton className="h-24 w-full rounded-lg" />
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-16 rounded-lg" />
                <Skeleton className="h-16 rounded-lg" />
                <Skeleton className="h-16 rounded-lg" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!showBack && (
        <section className="space-y-4">
          <div>
            <Skeleton className="h-6 w-64" />
            <Skeleton className="mt-2 h-4 w-72 max-w-full" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="min-h-[250px]">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <Skeleton className="size-11 rounded-lg" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-16 w-full" />
                </CardHeader>
                <CardContent className="mt-auto flex items-center justify-between gap-3">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-8 w-28" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Chart Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full rounded-lg animate-pulse" />
        </CardContent>
      </Card>

      {!showBack && (
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
