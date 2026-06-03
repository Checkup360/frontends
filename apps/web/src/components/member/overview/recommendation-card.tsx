import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
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
import { ArrowRight, type LucideIcon } from "lucide-react"

export interface Recommendation {
  id: string
  title: string
  description: string
  priority: "high" | "medium" | "low"
  category: string
  icon: LucideIcon
  action?: string
}

interface RecommendationCardProps {
  recommendations: Recommendation[]
}

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

export function RecommendationCard({
  recommendations,
}: RecommendationCardProps) {
  return (
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
              Suggested actions to improve your wellbeing
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <CarouselPrevious className="static translate-x-0 translate-y-0" />
            <CarouselNext className="static translate-x-0 translate-y-0" />
          </div>
        </div>

        <CarouselContent className="mt-4 -ml-4 px-px pb-1">
          {recommendations.map((recommendation) => {
            const Icon = recommendation.icon
            const config = priorityConfig[recommendation.priority]

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
                        className={`${config.bg} ${config.color} text-xs`}
                      >
                        {config.label}
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
  )
}
