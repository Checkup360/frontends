import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Slider } from "@workspace/ui/components/slider"
import { toast } from "@workspace/ui/components/sonner"
import {
  Activity,
  Moon,
  RotateCcw,
  Save,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import {
  getOrganizationScoreWeights,
  updateOrganizationScoreWeights,
} from "@workspace/api"

interface ScoreTopic {
  id: string
  name: string
  subtitle: string
  description: string
  icon: typeof Activity
  color: string
}

const SCORE_TOPICS: ScoreTopic[] = [
  {
    id: "diabetes",
    name: "Diabetes",
    subtitle: "Metabolic health",
    description:
      "Evaluates metabolic risk indicators, nutritional habits, physical activity, and glycemic predisposition.",
    icon: Activity,
    color: "bg-emerald-500",
  },
  {
    id: "sleep_apnea",
    name: "Sleep Apnea",
    subtitle: "Respiratory & sleep quality",
    description:
      "Evaluates sleep patterns, daytime fatigue, respiratory risk indicators, and airway biometric factors.",
    icon: Moon,
    color: "bg-blue-500",
  },
]

function computeBalancedWeights(topics: ScoreTopic[]): Record<string, number> {
  const count = topics.length
  if (count === 0) return {}
  const base = Math.floor(100 / count)
  const remainder = 100 % count

  const weights: Record<string, number> = {}
  topics.forEach((topic, index) => {
    weights[topic.id] = base + (index < remainder ? 1 : 0)
  })
  return weights
}

export function ScoreWeightsPage() {
  const { user } = useCurrentUser()
  const organizationId = user?.membership?.organization_id

  const [weights, setWeights] = useState<Record<string, number>>(() =>
    computeBalancedWeights(SCORE_TOPICS)
  )

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    const loadWeights = async () => {
      if (!organizationId) {
        setLoading(false)
        return
      }
      try {
        const res = await getOrganizationScoreWeights(organizationId)
        if (active && res && res.score_weights) {
          setWeights((prev) => ({
            ...prev,
            ...res.score_weights,
          }))
        }
      } catch (e) {
        console.error("Failed to load score weights from API", e)
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadWeights()
    return () => {
      active = false
    }
  }, [organizationId])

  const totalWeight = useMemo(() => {
    return SCORE_TOPICS.reduce(
      (sum, topic) => sum + (weights[topic.id] || 0),
      0
    )
  }, [weights])

  const isValid = totalWeight === 100
  const remaining = Math.max(0, 100 - totalWeight)

  const handleSliderChange = (id: string, val: number[]) => {
    const rawVal = val[0] ?? 0
    const current = weights[id] || 0
    const maxAllowed = Math.min(100, current + remaining)
    const clampedVal = Math.max(0, Math.min(maxAllowed, rawVal))

    setWeights((prev) => ({
      ...prev,
      [id]: clampedVal,
    }))
  }

  const handleApplyBalanced = () => {
    const balanced = computeBalancedWeights(SCORE_TOPICS)
    setWeights(balanced)
    toast.info("Balanced weights applied (50% / 50%)")
  }

  const handleSave = async () => {
    if (!isValid || !organizationId) return
    setSaving(true)
    try {
      const res = await updateOrganizationScoreWeights(
        organizationId,
        weights
      )
      if (res && res.score_weights) {
        setWeights(res.score_weights)
        toast.success("Score weights updated successfully")
      } else {
        toast.error("Failed to save score weights")
      }
    } catch {
      toast.error("An error occurred while saving score weights.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Score weights
          </h2>
          <p className="text-sm text-muted-foreground">
            Adjust the weight percentage each health evaluation contributes to
            the overall score.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleApplyBalanced}
            disabled={loading || saving}
            className="gap-1.5"
          >
            <RotateCcw className="size-3.5" />
            Reset to balanced
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={!isValid || loading || saving}
            className="gap-1.5"
          >
            <Save className="size-3.5" />
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>

      {/* Total Allocated Card with Multi-Topic Stacked Progress Bar */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-semibold text-foreground">
                Total allocated
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Combined weight distribution across modules (must equal 100%)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tabular-nums text-foreground">
                {totalWeight}%
              </span>
              <Badge
                variant={isValid ? "outline" : "secondary"}
                className={
                  isValid
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-xs"
                }
              >
                {isValid ? "100% Allocated" : `${remaining}% unallocated`}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {/* Stacked multi-color progress bar */}
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div className="flex h-full w-full">
              {SCORE_TOPICS.map((topic) => {
                const weight = weights[topic.id] || 0
                if (weight <= 0) return null
                return (
                  <div
                    key={topic.id}
                    className={`h-full transition-all duration-200 ${topic.color}`}
                    style={{ width: `${weight}%` }}
                    title={`${topic.name}: ${weight}%`}
                  />
                )
              })}
            </div>
          </div>

          {/* Compact Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {SCORE_TOPICS.map((topic) => (
              <div key={topic.id} className="flex items-center gap-1.5">
                <span
                  className={`size-2 rounded-full ${topic.color}`}
                  aria-hidden="true"
                />
                <span className="text-muted-foreground">{topic.name}:</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {weights[topic.id] || 0}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Topic Cards (Compact) */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {SCORE_TOPICS.map((topic) => {
          const value = weights[topic.id] ?? 0
          const Icon = topic.icon

          return (
            <Card
              key={topic.id}
              className="border-border/60 shadow-xs transition-colors hover:border-border"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="size-3.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        {topic.name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        {topic.subtitle}
                      </p>
                    </div>
                  </div>
                  <span className="text-base font-bold tabular-nums text-foreground">
                    {value}%
                  </span>
                </div>

                <div className="space-y-1">
                  <Slider
                    value={[value]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(val) => handleSliderChange(topic.id, val)}
                    className="py-1"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
