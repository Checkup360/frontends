import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Slider } from "@workspace/ui/components/slider"
import { toast } from "@workspace/ui/components/sonner"
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Minus,
  Moon,
  Plus,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react"
import { useMemo, useState } from "react"

interface ScoreTopic {
  id: string
  name: string
  subtitle: string
  description: string
  icon: typeof Activity
  barClass: string
  badgeClass: string
}

const SCORE_TOPICS: ScoreTopic[] = [
  {
    id: "diabetes",
    name: "Diabetes",
    subtitle: "Metabolic health",
    description:
      "Evaluates metabolic risk indicators, nutritional habits, physical activity, and glycemic predisposition.",
    icon: Activity,
    barClass: "bg-emerald-500",
    badgeClass:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "sleep_apnea",
    name: "Sleep Apnea",
    subtitle: "Respiratory & sleep quality",
    description:
      "Evaluates sleep patterns, daytime fatigue, respiratory risk indicators, and airway biometric factors.",
    icon: Moon,
    barClass: "bg-blue-500",
    badgeClass:
      "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
]

/** Computes an equal/balanced distribution across any number of topics */
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
  const [weights, setWeights] = useState<Record<string, number>>(() => {
    const balanced = computeBalancedWeights(SCORE_TOPICS)
    const saved = localStorage.getItem("checkup360_score_weights")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Verify all active topics exist and sum to <= 100
        const hasAllKeys = SCORE_TOPICS.every(
          (t) => typeof parsed[t.id] === "number"
        )
        const total = SCORE_TOPICS.reduce(
          (sum, t) => sum + (parsed[t.id] || 0),
          0
        )
        if (hasAllKeys && total <= 100) {
          return parsed
        }
      } catch {
        // Fallback to balanced
      }
    }
    return balanced
  })

  const [saving, setSaving] = useState(false)

  // Calculate total allocated weight
  const totalWeight = useMemo(() => {
    return SCORE_TOPICS.reduce((sum, topic) => sum + (weights[topic.id] || 0), 0)
  }, [weights])

  const isValid = totalWeight === 100
  const remaining = Math.max(0, 100 - totalWeight)

  /**
   * For any topic, the maximum value it can take without exceeding 100%
   * is: current_value + remaining_unallocated_percentage
   */
  const getMaxAllowedFor = (id: string) => {
    const current = weights[id] || 0
    return Math.min(100, current + remaining)
  }

  const handleSliderChange = (id: string, val: number[]) => {
    const rawVal = val[0] ?? 0
    const maxAllowed = getMaxAllowedFor(id)
    const clampedVal = Math.max(0, Math.min(maxAllowed, rawVal))

    setWeights((prev) => ({
      ...prev,
      [id]: clampedVal,
    }))
  }

  const handleInputChange = (id: string, rawInput: string) => {
    const parsed = parseInt(rawInput, 10)
    const val = isNaN(parsed) ? 0 : parsed
    const maxAllowed = getMaxAllowedFor(id)
    const clampedVal = Math.max(0, Math.min(maxAllowed, val))

    setWeights((prev) => ({
      ...prev,
      [id]: clampedVal,
    }))
  }

  const handleStep = (id: string, delta: number) => {
    const current = weights[id] || 0
    const maxAllowed = getMaxAllowedFor(id)
    const nextVal = Math.max(0, Math.min(maxAllowed, current + delta))

    setWeights((prev) => ({
      ...prev,
      [id]: nextVal,
    }))
  }

  const handleApplyBalanced = () => {
    const balanced = computeBalancedWeights(SCORE_TOPICS)
    setWeights(balanced)
    toast.info("Balanced weights applied", {
      description: "Distributed equally across all active health topics.",
    })
  }

  const handleSave = () => {
    if (!isValid) return
    setSaving(true)
    setTimeout(() => {
      localStorage.setItem("checkup360_score_weights", JSON.stringify(weights))
      setSaving(false)
      toast.success("Score weights updated successfully", {
        description: "Composite health score evaluations will now reflect these topic weights.",
      })
    }, 350)
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Score weights
            </h1>
            <Badge variant="outline" className="text-xs">
              Org Configuration
            </Badge>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Define the percentage influence of each health topic on the composite organizational score.
            To increase a topic's weight, decrease another topic first.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleApplyBalanced}
            disabled={saving}
          >
            <RotateCcw className="size-4" />
            Reset to balanced
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={!isValid || saving}
            className="gap-2"
          >
            <Save className="size-4" />
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>

      {/* Total Allocated Card & Visual Progress */}
      <Card className="border-border/60 shadow-[var(--shadow-card)]">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Total allocated</CardTitle>
              <CardDescription>
                Proportional distribution across health topics (Max: 100%)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {totalWeight}%
              </span>
              <Badge
                variant={isValid ? "outline" : "secondary"}
                className={
                  isValid
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                    : "font-semibold"
                }
              >
                {isValid ? "100% Allocated" : `${remaining}% Unallocated`}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Multi-segment stacked progress bar */}
          <div className="space-y-2">
            <div className="relative h-4 w-full overflow-hidden rounded-full bg-muted/70 p-0.5 shadow-inner">
              <div className="flex h-full w-full overflow-hidden rounded-full transition-all duration-300">
                {SCORE_TOPICS.map((topic) => {
                  const weight = weights[topic.id] || 0
                  if (weight <= 0) return null

                  return (
                    <div
                      key={topic.id}
                      className={`h-full transition-all duration-300 ${topic.barClass}`}
                      style={{ width: `${weight}%` }}
                      title={`${topic.name}: ${weight}%`}
                    />
                  )
                })}
              </div>
            </div>

            {/* Segment legend */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {SCORE_TOPICS.map((topic) => {
                const weight = weights[topic.id] || 0
                return (
                  <div
                    key={topic.id}
                    className="flex items-center justify-between rounded-md border border-border/40 bg-muted/20 px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className={`size-2.5 shrink-0 rounded-full ${topic.barClass}`}
                      />
                      <span className="truncate font-medium text-foreground">
                        {topic.name}
                      </span>
                      <span className="hidden text-muted-foreground sm:inline truncate">
                        • {topic.subtitle}
                      </span>
                    </div>
                    <span className="font-semibold tabular-nums text-foreground">
                      {weight}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Validation Alert Message */}
          {isValid ? (
            <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              <AlertTitle className="font-semibold text-emerald-900 dark:text-emerald-200">
                Weights are correctly allocated
              </AlertTitle>
              <AlertDescription className="text-emerald-700 dark:text-emerald-300/90">
                All topic weights total exactly 100%. Changes are ready to be saved.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300">
              <AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="font-semibold text-amber-900 dark:text-amber-200">
                You have {remaining}% unallocated
              </AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-300/90">
                Total allocation is currently {totalWeight}%. Increase one of the topics below to reach 100% and enable saving.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Quick Balanced Preset */}
      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Balanced allocation
            </h3>
            <p className="text-xs text-muted-foreground">
              Distribute influence evenly across all {SCORE_TOPICS.length} health topics.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleApplyBalanced}
        >
          Apply balanced
        </Button>
      </div>

      {/* Individual Topic Weight Sliders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">
              Topic weights
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            To allocate more to a topic, reduce another first
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {SCORE_TOPICS.map((topic) => {
            const value = weights[topic.id] ?? 0
            const maxAllowed = getMaxAllowedFor(topic.id)
            const Icon = topic.icon
            const isAtMax = value >= maxAllowed && remaining === 0

            return (
              <Card
                key={topic.id}
                className="border-border/60 shadow-[var(--shadow-card)] transition-all hover:border-border"
              >
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-col gap-5">
                    {/* Header Row */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg ${topic.badgeClass}`}
                        >
                          <Icon className="size-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground text-base">
                              {topic.name}
                            </h3>
                            <span className="text-xs text-muted-foreground">
                              • {topic.subtitle}
                            </span>
                            <Badge variant="outline" className={topic.badgeClass}>
                              {value}% weight
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground leading-relaxed max-w-xl">
                            {topic.description}
                          </p>
                        </div>
                      </div>

                      {/* Manual Stepper & Input */}
                      <div className="flex items-center gap-1.5 self-end sm:self-auto sm:shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-8"
                          onClick={() => handleStep(topic.id, -5)}
                          disabled={value <= 0}
                          title="Decrease by 5%"
                        >
                          <Minus className="size-3.5" />
                        </Button>
                        <div className="relative w-16">
                          <Input
                            type="number"
                            min={0}
                            max={maxAllowed}
                            value={value}
                            onChange={(e) =>
                              handleInputChange(topic.id, e.target.value)
                            }
                            className="h-8 text-center text-sm font-semibold tabular-nums pr-5"
                          />
                          <span className="pointer-events-none absolute right-2 top-1.5 text-xs text-muted-foreground font-semibold">
                            %
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-8"
                          onClick={() => handleStep(topic.id, 5)}
                          disabled={value >= maxAllowed}
                          title={
                            isAtMax
                              ? "Cannot increase: total allocation is at 100%. Decrease another topic first."
                              : "Increase by 5%"
                          }
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Interactive Slider constrained to maxAllowed */}
                    <div className="space-y-2">
                      <Slider
                        value={[value]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(val) =>
                          handleSliderChange(topic.id, val)
                        }
                        className="py-1"
                      />
                      <div className="flex justify-between text-[11px] font-medium text-muted-foreground/70">
                        <span>0%</span>
                        {isAtMax && (
                          <span className="text-muted-foreground font-semibold">
                            Max reached ({maxAllowed}%)
                          </span>
                        )}
                        {!isAtMax && remaining > 0 && (
                          <span className="text-muted-foreground">
                            Max available: {maxAllowed}%
                          </span>
                        )}
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            Total allocation:
          </span>
          <span
            className={`text-sm font-bold tabular-nums ${
              isValid
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-amber-600 dark:text-amber-400"
            }`}
          >
            {totalWeight}%
          </span>
          {!isValid && (
            <span className="text-xs text-muted-foreground">
              (Must equal 100% to save)
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleApplyBalanced}
            disabled={saving}
          >
            <RotateCcw className="size-4" />
            Reset to balanced
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={!isValid || saving}
            className="gap-2"
          >
            <Save className="size-4" />
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  )
}
