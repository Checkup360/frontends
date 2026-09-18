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
import { Switch } from "@workspace/ui/components/switch"
import { toast } from "@workspace/ui/components/sonner"
import { cn } from "@workspace/ui/lib/utils"
import {
  Activity,
  HeartPulse,
  Moon,
  RotateCcw,
  Save,
  Sparkles,
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
  {
    id: "depression",
    name: "Mood & Well-being",
    subtitle: "Emotional well-being",
    description: "Evaluates mood and emotional well-being indicators.",
    icon: HeartPulse,
    color: "bg-rose-500",
  },
  {
    id: "metabolic_syndrome",
    name: "Metabolic Health",
    subtitle: "Cardiometabolic risk",
    description: "Evaluates metabolic syndrome criteria and cardiometabolic risk.",
    icon: Activity,
    color: "bg-amber-500",
  },
  {
    id: "eoss",
    name: "Obesity-related Health Impact",
    subtitle: "Health impact staging",
    description: "Evaluates the self-reported impact on health, mood, and daily function.",
    icon: HeartPulse,
    color: "bg-violet-500",
  },
  {
    id: "cardiovascular",
    name: "Cardiovascular Risk",
    subtitle: "Heart health & 10-year CVD risk",
    description: "Evaluates 10-year fatal and non-fatal cardiovascular risk based on SCORE2 model.",
    icon: HeartPulse,
    color: "bg-red-500",
  },
  {
    id: "nordic_nmq",
    name: "Musculoskeletal Risk (NMQ)",
    subtitle: "Ergonomics & physical load",
    description: "Evaluates trouble and work impairment across 9 anatomical body regions.",
    icon: Activity,
    color: "bg-cyan-500",
  },
  {
    id: "audit_c",
    name: "Alcohol Risk Assessment (AUDIT-C)",
    subtitle: "Occupational safety & consumption",
    description: "Evaluates alcohol consumption frequency, daily quantity, and binge drinking patterns.",
    icon: HeartPulse,
    color: "bg-orange-500",
  },
  {
    id: "pss10",
    name: "Perceived Stress & Burnout (PSS-10)",
    subtitle: "Psychological resilience & burnout",
    description: "Evaluates perceived stress levels, control over life events, and coping capacity.",
    icon: HeartPulse,
    color: "bg-fuchsia-500",
  },
]


function computeBalancedWeights(
  topics: ScoreTopic[],
  currentWeights?: Record<string, number>
): Record<string, number> {
  const activeTopics = currentWeights
    ? topics.filter((t) => (currentWeights[t.id] ?? 0) > 0)
    : topics
  const targets = activeTopics.length > 0 ? activeTopics : topics
  const count = targets.length
  if (count === 0) return {}

  const base = Math.floor(100 / count)
  const remainder = 100 % count

  const weights: Record<string, number> = {}
  topics.forEach((topic) => {
    const targetIdx = targets.findIndex((t) => t.id === topic.id)
    if (targetIdx !== -1) {
      weights[topic.id] = base + (targetIdx < remainder ? 1 : 0)
    } else {
      weights[topic.id] = 0
    }
  })
  return weights
}

export function ScoreWeightsPage() {
  const { user } = useCurrentUser()
  const organizationId = user?.membership?.organization_id

  const [weights, setWeights] = useState<Record<string, number>>(() =>
    computeBalancedWeights(SCORE_TOPICS)
  )

  const [filterMode, setFilterMode] = useState<"all" | "active" | "disabled">("all")
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
          const hasKeys = Object.keys(res.score_weights).length > 0
          setWeights(
            Object.fromEntries(
              SCORE_TOPICS.map((topic) => [
                topic.id,
                res.score_weights[topic.id] ?? (hasKeys ? 0 : Math.floor(100 / SCORE_TOPICS.length)),
              ])
            )
          )
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

  const activeCount = useMemo(() => {
    return SCORE_TOPICS.filter((topic) => (weights[topic.id] || 0) > 0).length
  }, [weights])

  const disabledCount = SCORE_TOPICS.length - activeCount

  const isValid = totalWeight > 0

  const handleSliderChange = (id: string, val: number[]) => {
    const rawVal = val[0] ?? 0
    const otherSum = SCORE_TOPICS.reduce(
      (sum, topic) => (topic.id === id ? sum : sum + (weights[topic.id] || 0)),
      0
    )
    const maxAllowed = Math.max(0, 100 - otherSum)
    const clampedVal = Math.max(0, Math.min(maxAllowed, rawVal))

    setWeights((prev) => ({
      ...prev,
      [id]: clampedVal,
    }))
  }

  const handleToggleModule = (id: string, enabled: boolean) => {
    if (enabled) {
      const otherSum = SCORE_TOPICS.reduce(
        (sum, topic) => (topic.id === id ? sum : sum + (weights[topic.id] || 0)),
        0
      )
      const available = Math.max(0, 100 - otherSum)
      const defaultWeight = available > 0 ? Math.min(available, 10) : 0
      setWeights((prev) => ({
        ...prev,
        [id]: defaultWeight,
      }))
    } else {
      setWeights((prev) => ({
        ...prev,
        [id]: 0,
      }))
    }
  }

  const handleApplyBalanced = () => {
    const balanced = computeBalancedWeights(SCORE_TOPICS, weights)
    setWeights(balanced)
    toast.info("Balanced weights applied across active score categories")
  }

  const handleEnableAll = () => {
    const balancedAll = computeBalancedWeights(SCORE_TOPICS)
    setWeights(balancedAll)
    toast.info("All health modules enabled and balanced")
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

  const filteredTopics = useMemo(() => {
    return SCORE_TOPICS.filter((topic) => {
      const weight = weights[topic.id] ?? 0
      if (filterMode === "active") return weight > 0
      if (filterMode === "disabled") return weight <= 0
      return true
    })
  }, [filterMode, weights])

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Score weights
          </h2>
          <p className="text-sm text-muted-foreground">
            Adjust module enablement and weight percentages for employee evaluations.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={!isValid || loading || saving}
            className="gap-1.5 whitespace-nowrap"
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
                Combined weight distribution across active modules (must equal 100%)
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
                {isValid ? `${totalWeight}% Allocated` : "At least 1 active score required"}
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
            {SCORE_TOPICS.map((topic) => {
              const weight = weights[topic.id] || 0
              return (
                <div key={topic.id} className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      weight > 0 ? topic.color : "bg-muted-foreground/30"
                    )}
                    aria-hidden="true"
                  />
                  <span
                    className={cn(
                      weight > 0 ? "text-muted-foreground" : "text-muted-foreground/50 line-through"
                    )}
                  >
                    {topic.name}:
                  </span>
                  <span
                    className={cn(
                      "font-semibold tabular-nums",
                      weight > 0 ? "text-foreground" : "text-muted-foreground/50"
                    )}
                  >
                    {weight}%
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Toolbar & Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Left: Action buttons (Reset first, then Enable all) */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleApplyBalanced}
            disabled={loading || saving}
            className="gap-1.5 whitespace-nowrap"
          >
            <RotateCcw className="size-3.5" />
            Reset to balanced
          </Button>
          {disabledCount > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleEnableAll}
              disabled={loading || saving}
              className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 font-medium whitespace-nowrap"
            >
              <Sparkles className="size-3.5 text-emerald-500" />
              Enable all
            </Button>
          )}
        </div>

        {/* Right: Filter tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/40 p-1 text-xs">
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={cn(
              "rounded-md px-3 py-1 font-medium transition-colors cursor-pointer",
              filterMode === "all"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            All ({SCORE_TOPICS.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("active")}
            className={cn(
              "rounded-md px-3 py-1 font-medium transition-colors cursor-pointer",
              filterMode === "active"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("disabled")}
            className={cn(
              "rounded-md px-3 py-1 font-medium transition-colors cursor-pointer",
              filterMode === "disabled"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Disabled ({disabledCount})
          </button>
        </div>
      </div>

      {/* Topic Cards Grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {filteredTopics.map((topic) => {
          const value = weights[topic.id] ?? 0
          const isEnabled = value > 0
          const Icon = topic.icon

          return (
            <Card
              key={topic.id}
              className={cn(
                "border-border/60 shadow-xs transition-all",
                isEnabled ? "hover:border-border bg-card" : "bg-muted/15 border-dashed border-border/40 opacity-90"
              )}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "flex size-7 items-center justify-center rounded-md transition-colors",
                        isEnabled
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="size-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3
                          className={cn(
                            "text-sm font-semibold",
                            isEnabled ? "text-foreground" : "text-muted-foreground"
                          )}
                        >
                          {topic.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5 py-0 font-medium",
                            isEnabled
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "border-muted-foreground/30 bg-muted/30 text-muted-foreground"
                          )}
                        >
                          {isEnabled ? "Active" : "Disabled"}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {topic.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isEnabled && (
                      <span className="text-base font-bold tabular-nums text-foreground">
                        {value}%
                      </span>
                    )}
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) =>
                        handleToggleModule(topic.id, checked)
                      }
                      title={isEnabled ? "Disable module" : "Enable module"}
                    />
                  </div>
                </div>

                {isEnabled ? (
                  <div className="space-y-1 pt-1">
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
                ) : (
                  <div className="rounded-md border border-dashed border-border/50 bg-muted/30 p-2.5 text-center text-xs text-muted-foreground">
                    Module disabled (forms won't be requested from employees)
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
