import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Label } from "@workspace/ui/components/label"
import { Slider } from "@workspace/ui/components/slider"
import { Switch } from "@workspace/ui/components/switch"
import { toast } from "@workspace/ui/components/sonner"
import { cn } from "@workspace/ui/lib/utils"
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  HeartPulse,
  Moon,
  RotateCcw,
  Save,
  ShieldCheck,
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
    subtitle: "Metabolic health & 10-year risk",
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
    subtitle: "Emotional well-being & mood",
    description: "Evaluates mood and emotional well-being indicators.",
    icon: HeartPulse,
    color: "bg-rose-500",
  },
  {
    id: "metabolic_syndrome",
    name: "Metabolic Health",
    subtitle: "Cardiometabolic & vital signs",
    description:
      "Evaluates metabolic syndrome criteria and cardiometabolic risk.",
    icon: Activity,
    color: "bg-amber-500",
  },
  {
    id: "eoss",
    name: "Obesity Impact",
    subtitle: "Health & functional impact staging",
    description:
      "Evaluates the self-reported impact on health, mood, and daily function.",
    icon: HeartPulse,
    color: "bg-violet-500",
  },
  {
    id: "cardiovascular",
    name: "Cardiovascular",
    subtitle: "Heart health & 10-year CVD risk",
    description:
      "Evaluates 10-year fatal and non-fatal cardiovascular risk based on clinical guidelines.",
    icon: HeartPulse,
    color: "bg-red-500",
  },
  {
    id: "nordic_nmq",
    name: "Musculoskeletal",
    subtitle: "Ergonomics & physical load",
    description:
      "Evaluates trouble and work impairment across 9 anatomical body regions.",
    icon: Activity,
    color: "bg-cyan-500",
  },
  {
    id: "audit_c",
    name: "Alcohol Habits",
    subtitle: "Occupational safety & consumption habits",
    description:
      "Evaluates alcohol consumption frequency, daily quantity, and binge drinking patterns.",
    icon: HeartPulse,
    color: "bg-orange-500",
  },
  {
    id: "pss10",
    name: "Stress & Burnout",
    subtitle: "Psychological resilience & coping",
    description:
      "Evaluates perceived stress levels, control over life events, and coping capacity.",
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

  const [riskThresholds, setRiskThresholds] = useState<{
    low: number
    moderate: number
  }>({
    low: 80,
    moderate: 50,
  })

  const [filterMode, setFilterMode] = useState<"all" | "active" | "disabled">(
    "all"
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
        if (active && res) {
          if (res.score_weights) {
            const hasKeys = Object.keys(res.score_weights).length > 0
            setWeights(
              Object.fromEntries(
                SCORE_TOPICS.map((topic) => [
                  topic.id,
                  res.score_weights[topic.id] ??
                    (hasKeys ? 0 : Math.floor(100 / SCORE_TOPICS.length)),
                ])
              )
            )
          }
          if (res.risk_thresholds) {
            setRiskThresholds({
              low: Number(res.risk_thresholds.low ?? 80),
              moderate: Number(res.risk_thresholds.moderate ?? 50),
            })
          }
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

  const is100Percent = totalWeight === 100 || totalWeight === 0
  const isRiskThresholdsValid = useMemo(() => {
    return (
      riskThresholds.moderate >= 0 &&
      riskThresholds.moderate < riskThresholds.low &&
      riskThresholds.low <= 100
    )
  }, [riskThresholds])

  const isValid = is100Percent && isRiskThresholdsValid

  const isStandardThresholds =
    riskThresholds.low === 80 && riskThresholds.moderate === 50

  const handleResetThresholds = () => {
    setRiskThresholds({ low: 80, moderate: 50 })
    toast.info("Risk thresholds reset to standard defaults (80 / 50)")
  }

  const roundWeightsTo100 = (
    weights: Record<string, number>,
    fixedId?: string
  ) => {
    const result = { ...weights }
    const activeIds = Object.keys(result).filter(
      (k) => result[k] > 0 || k === fixedId
    )
    if (activeIds.length === 0) return result

    let totalFloor = 0
    const fractions: { id: string; frac: number }[] = []

    for (const id of Object.keys(result)) {
      if (result[id] > 0 || id === fixedId) {
        let floored = Math.floor(result[id])
        if (id === fixedId) {
          floored = Math.round(result[id])
        }
        totalFloor += floored
        if (id !== fixedId) {
          fractions.push({ id, frac: result[id] - Math.floor(result[id]) })
        }
        result[id] = floored
      } else {
        result[id] = 0
      }
    }

    const remainder = 100 - totalFloor

    if (remainder > 0) {
      fractions.sort((a, b) => b.frac - a.frac)
      for (let i = 0; i < remainder && i < fractions.length; i++) {
        result[fractions[i].id] += 1
      }
    } else if (remainder < 0) {
      fractions.sort((a, b) => a.frac - b.frac)
      const absRem = -remainder
      for (let i = 0; i < absRem && i < fractions.length; i++) {
        if (result[fractions[i].id] > 0) {
          result[fractions[i].id] -= 1
        }
      }
    }

    return result
  }

  const handleSliderChange = (id: string, val: number[]) => {
    const rawVal = val[0] ?? 0
    setWeights((prev) => {
      const otherSum = SCORE_TOPICS.reduce(
        (sum, topic) => (topic.id === id ? sum : sum + (prev[topic.id] || 0)),
        0
      )
      const maxAllowed = Math.max(0, 100 - otherSum)
      const clampedVal = Math.max(0, Math.min(maxAllowed, rawVal))

      return {
        ...prev,
        [id]: clampedVal,
      }
    })
  }

  const handleToggleModule = (id: string, enabled: boolean) => {
    setWeights((prev) => {
      const next = { ...prev }
      if (enabled) {
        const activeIds = Object.keys(next).filter((k) => next[k] > 0)
        const newCount = activeIds.length + 1
        const fairShare = 100 / newCount

        const delta = fairShare
        const otherSum = activeIds.reduce((sum, k) => sum + next[k], 0)

        next[id] = fairShare

        if (otherSum > 0) {
          for (const activeId of activeIds) {
            const proportion = next[activeId] / otherSum
            next[activeId] = Math.max(0, next[activeId] - delta * proportion)
          }
        }
        return roundWeightsTo100(next, id)
      } else {
        const disabledVal = next[id] || 0
        next[id] = 0

        const otherActiveIds = Object.keys(next).filter((k) => next[k] > 0)
        const otherSum = otherActiveIds.reduce((sum, k) => sum + next[k], 0)

        if (otherActiveIds.length > 0) {
          if (otherSum === 0) {
            const eqVal = disabledVal / otherActiveIds.length
            for (const activeId of otherActiveIds) {
              next[activeId] += eqVal
            }
          } else {
            for (const activeId of otherActiveIds) {
              const proportion = next[activeId] / otherSum
              next[activeId] += disabledVal * proportion
            }
          }
        }
        return roundWeightsTo100(next)
      }
    })
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
    if (totalWeight > 0 && totalWeight !== 100) {
      toast.error("Total weight must equal exactly 100%")
      return
    }
    if (!isRiskThresholdsValid) {
      toast.error(
        "Moderate risk cutoff must be strictly lower than Low risk cutoff"
      )
      return
    }
    if (!organizationId) return
    setSaving(true)
    try {
      const res = await updateOrganizationScoreWeights(
        organizationId,
        weights,
        riskThresholds
      )
      if (res) {
        if (res.score_weights) setWeights(res.score_weights)
        if (res.risk_thresholds) {
          setRiskThresholds({
            low: Number(res.risk_thresholds.low ?? 80),
            moderate: Number(res.risk_thresholds.moderate ?? 50),
          })
        }
        toast.success("Changes saved successfully.")
      } else {
        toast.error("Failed to save configuration")
      }
    } catch {
      toast.error("An error occurred while saving configuration.")
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
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Score weights
          </h2>
          <p className="text-sm text-muted-foreground">
            Adjust module enablement, weight percentages, and risk cutoff
            thresholds for employee evaluations.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
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

      {/* ========================================================= */}
      {/* SECTION 1: SCORE WEIGHTS (TOP)                            */}
      {/* ========================================================= */}

      {/* Total Allocated Card with Multi-Topic Stacked Progress Bar */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-semibold text-foreground">
                Total allocated
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Combined weight distribution across active modules (must equal
                100%)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-foreground tabular-nums">
                {totalWeight}%
              </span>
              <Badge
                variant={is100Percent ? "outline" : "secondary"}
                className={
                  is100Percent
                    ? "border-emerald-500/30 bg-emerald-500/10 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                    : "border-amber-500/30 bg-amber-500/10 text-xs font-semibold text-amber-600 dark:text-amber-400"
                }
              >
                {totalWeight === 0
                  ? "All Modules Disabled"
                  : `${totalWeight}% Allocated`}
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
                      weight > 0
                        ? "text-muted-foreground"
                        : "text-muted-foreground/50 line-through"
                    )}
                  >
                    {topic.name}:
                  </span>
                  <span
                    className={cn(
                      "font-semibold tabular-nums",
                      weight > 0
                        ? "text-foreground"
                        : "text-muted-foreground/50"
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
              className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 font-medium whitespace-nowrap text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
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
              "cursor-pointer rounded-md px-3 py-1 font-medium transition-colors",
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
              "cursor-pointer rounded-md px-3 py-1 font-medium transition-colors",
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
              "cursor-pointer rounded-md px-3 py-1 font-medium transition-colors",
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
                isEnabled
                  ? "bg-card hover:border-border"
                  : "border-dashed border-border/40 bg-muted/15 opacity-90"
              )}
            >
              <CardContent className="space-y-3 p-4">
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
                            isEnabled
                              ? "text-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          {topic.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={cn(
                            "px-1.5 py-0 text-[10px] font-medium",
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
                      <span className="text-base font-bold text-foreground tabular-nums">
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

      {/* ========================================================= */}
      {/* SECTION 2: RISK CUTOFF THRESHOLDS (BOTTOM)                */}
      {/* ========================================================= */}

      {/* Risk Classification Standards Card */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                <ShieldCheck className="size-4 text-primary" />
                Risk Cutoff Thresholds
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Define score boundaries for employee risk classification.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={
                  isStandardThresholds
                    ? "border-primary/30 bg-primary/10 text-xs font-semibold text-primary"
                    : "border-amber-500/30 bg-amber-500/10 text-xs font-semibold text-amber-600 dark:text-amber-400"
                }
              >
                {isStandardThresholds ? "Standard Defaults" : "Custom Thresholds"}
              </Badge>
              {!isStandardThresholds && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetThresholds}
                  className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="size-3" />
                  Reset to default
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {/* Dynamic Segmented color bar */}
          <div className="space-y-1.5">
            <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-muted shadow-inner">
              <div
                className="h-full bg-rose-500 transition-all duration-200"
                style={{ width: `${riskThresholds.moderate}%` }}
                title={`Needs attention: 0 - ${riskThresholds.moderate - 1}`}
              />
              <div
                className="h-full bg-amber-500 transition-all duration-200"
                style={{
                  width: `${Math.max(0, riskThresholds.low - riskThresholds.moderate)}%`,
                }}
                title={`Moderate risk: ${riskThresholds.moderate} - ${riskThresholds.low - 1}`}
              />
              <div
                className="h-full bg-emerald-500 transition-all duration-200"
                style={{
                  width: `${Math.max(0, 100 - riskThresholds.low)}%`,
                }}
                title={`Low risk: ${riskThresholds.low} - 100`}
              />
            </div>
            <div className="flex justify-between px-0.5 text-[10px] font-medium text-muted-foreground">
              <span>0 (High risk)</span>
              <span>
                Moderate:{" "}
                <strong className="text-foreground">
                  {riskThresholds.moderate}
                </strong>
              </span>
              <span>
                Low risk:{" "}
                <strong className="text-foreground">
                  {riskThresholds.low}
                </strong>
              </span>
              <span>100 (Optimal)</span>
            </div>
          </div>

          {/* Sliders / Controls for Cutoff Values */}
          <div className="grid grid-cols-1 gap-4 rounded-lg border border-border/60 bg-muted/20 p-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="low-threshold"
                  className="text-xs font-semibold text-foreground"
                >
                  Low Risk Minimum Score (Optimal)
                </Label>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    &ge; {riskThresholds.low}
                  </span>
                  <span className="text-[10px] text-muted-foreground">pts</span>
                </div>
              </div>
              <Slider
                id="low-threshold"
                value={[riskThresholds.low]}
                min={Math.max(1, riskThresholds.moderate + 1)}
                max={99}
                step={1}
                onValueChange={(val) => {
                  const raw = val[0] ?? 80
                  setRiskThresholds((prev) => ({
                    ...prev,
                    low: Math.max(prev.moderate + 1, Math.min(99, raw)),
                  }))
                }}
                className="py-1"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="moderate-threshold"
                  className="text-xs font-semibold text-foreground"
                >
                  Moderate Risk Minimum Score
                </Label>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                    &ge; {riskThresholds.moderate}
                  </span>
                  <span className="text-[10px] text-muted-foreground">pts</span>
                </div>
              </div>
              <Slider
                id="moderate-threshold"
                value={[riskThresholds.moderate]}
                min={1}
                max={Math.min(98, riskThresholds.low - 1)}
                step={1}
                onValueChange={(val) => {
                  const raw = val[0] ?? 50
                  setRiskThresholds((prev) => ({
                    ...prev,
                    moderate: Math.max(1, Math.min(prev.low - 1, raw)),
                  }))
                }}
                className="py-1"
              />
            </div>
          </div>

          {/* 3 Tier Badges */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center justify-between rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
              <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                <AlertCircle className="size-3.5" />
                Needs Attention
              </span>
              <Badge
                variant="outline"
                className="border-rose-500/30 bg-rose-500/10 text-[10px] font-semibold text-rose-600 dark:text-rose-400"
              >
                &lt; {riskThresholds.moderate}
              </Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                <AlertTriangle className="size-3.5" />
                Moderate Risk
              </span>
              <Badge
                variant="outline"
                className="border-amber-500/30 bg-amber-500/10 text-[10px] font-semibold text-amber-600 dark:text-amber-400"
              >
                {riskThresholds.moderate} – {riskThresholds.low - 1}
              </Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" />
                Low Risk
              </span>
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
              >
                {riskThresholds.low} – 100
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Global Page Action Footer */}
      <div className="flex items-center justify-end border-t border-border/60 pt-4 pb-8">
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
  )
}
