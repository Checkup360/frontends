import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import {
  Avatar,
  AvatarFallback,
} from "@workspace/ui/components/avatar"
import {
  Apple,
  Dumbbell,
  Moon,
  Stethoscope,
} from "lucide-react"

import {
  HealthEvolutionChart,
  HealthScoreHero,
  NewsCard,
  RecommendationCard,
  type Recommendation,
} from "@/components/member-overview"
import { memberNewsArticles } from "@/components/member-overview/articles"
import { MemberOverviewSkeleton } from "@/components/member-overview-skeleton"

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

function getMemberName(email?: string) {
  if (!email) {
    return "Member"
  }

  return email.split("@")[0]
}

function getInitials(name: string) {
  return name
    .split(/[.\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

export function MemberOverviewPage() {
  const { user, isLoading } = useCurrentUser()

  if (isLoading) {
    return <MemberOverviewSkeleton />
  }

  const memberName = getMemberName(user?.email)
  const initials = getInitials(memberName) || "M"

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <header>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="size-14 ring-2 ring-primary/10">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Hi {memberName}
              </h1>
              <p className="text-sm text-muted-foreground md:text-base">
                Your current health status is{" "}
                <span className="font-medium text-[color:var(--success)]">
                  stable
                </span>
              </p>
            </div>
          </div>
        </div>
      </header>

      <HealthScoreHero
        score={87}
        level="low"
        aiSummary="Your profile shows low cardiovascular risk. Keep your current exercise and nutrition habits, and maintain regular follow-up."
      />

      <RecommendationCard recommendations={recommendations} />

      <div className="pt-2">
        <HealthEvolutionChart data={evolutionData} />
      </div>

      <NewsCard articles={memberNewsArticles} />
    </div>
  )
}

export default MemberOverviewPage
