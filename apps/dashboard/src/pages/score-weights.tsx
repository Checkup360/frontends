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
import { Progress } from "@workspace/ui/components/progress"
import { Slider } from "@workspace/ui/components/slider"
import { Switch } from "@workspace/ui/components/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { toast } from "@workspace/ui/components/sonner"
import { cn } from "@workspace/ui/lib/utils"
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  HeartPulse,
  Loader2,
  Moon,
  RotateCcw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Undo2,
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
}

const SCORE_TOPICS: ScoreTopic[] = [
  {
    id: "diabetes",
    name: "Diabetes",
    subtitle: "Metabolic health & 10-year risk",
    description:
      "Evaluates metabolic risk indicators, nutritional habits, physical activity, and glycemic predisposition.",
    icon: Activity,
  },
  {
    id: "sleep_apnea",
    name: "Sleep Apnea",
    subtitle: "Respiratory & sleep quality",
    description:
      "Evaluates sleep patterns, daytime fatigue, respiratory risk indicators, and airway biometric factors.",
    icon: Moon,
  },
  {
    id: "depression",
    name: "Mood & Well-being",
    subtitle: "Emotional well-being & mood",
    description: "Evaluates mood and emotional well-being indicators.",
    icon: HeartPulse,
  },
  {
    id: "metabolic_syndrome",
    name: "Metabolic Health",
    subtitle: "Cardiometabolic & vital signs",
    description:
      "Evaluates metabolic syndrome criteria and cardiometabolic risk.",
    icon: Activity,
  },
  {
    id: "eoss",
    name: "Obesity Impact",
    subtitle: "Health & functional impact staging",
    description:
      "Evaluates the self-reported impact on health, mood, and daily function.",
    icon: HeartPulse,
  },
  {
    id: "cardiovascular",
    name: "Cardiovascular",
    subtitle: "Heart health & 10-year CVD risk",
    description:
      "Evaluates 10-year fatal and non-fatal cardiovascular risk based on clinical guidelines.",
    icon: HeartPulse,
  },
  {
    id: "nordic_nmq",
    name: "Musculoskeletal",
    subtitle: "Ergonomics & physical load",
    description:
      "Evaluates trouble and work impairment across 9 anatomical body regions.",
    icon: Activity,
  },
  {
    id: "audit_c",
    name: "Alcohol Habits",
    subtitle: "Occupational safety & consumption habits",
    description:
      "Evaluates alcohol consumption frequency, daily quantity, and binge drinking patterns.",
    icon: HeartPulse,
  },
  {
    id: "pss10",
    name: "Stress & Burnout",
    subtitle: "Psychological resilience & coping",
    description:
      "Evaluates perceived stress levels, control over life events, and coping capacity.",
    icon: HeartPulse,
  },
]

const DEFAULT_RISK_THRESHOLDS = {
  low: 80,
  moderate: 50,
}

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

function areWeightsEqual(
  a: Record<string, number>,
  b: Record<string, number>
): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const k of keys) {
    if ((a[k] ?? 0) !== (b[k] ?? 0)) return false
  }
  return true
}

function areThresholdsEqual(
  a: { low: number; moderate: number },
  b: { low: number; moderate: number }
): boolean {
  return a.low === b.low && a.moderate === b.moderate
}

export function ScoreWeightsPage() {
  const { user } = useCurrentUser()
  const organizationId = user?.membership?.organization_id

  // Active Tab
  const [activeTab, setActiveTab] = useState<"scores" | "thresholds">("scores")

  // Current Working State
  const [weights, setWeights] = useState<Record<string, number>>(() =>
    computeBalancedWeights(SCORE_TOPICS)
  )
  const [riskThresholds, setRiskThresholds] = useState<{
    low: number
    moderate: number
  }>(DEFAULT_RISK_THRESHOLDS)

  // Last Saved (Server) State for Dirty Checking
  const [savedWeights, setSavedWeights] = useState<Record<string, number>>(() =>
    computeBalancedWeights(SCORE_TOPICS)
  )
  const [savedThresholds, setSavedThresholds] = useState<{
    low: number
    moderate: number
  }>(DEFAULT_RISK_THRESHOLDS)

  const [filterMode, setFilterMode] = useState<"all" | "active" | "disabled">(
    "all"
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Fetch initial configuration from API
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
          let loadedWeights: Record<string, number>
          if (res.score_weights && Object.keys(res.score_weights).length > 0) {
            loadedWeights = Object.fromEntries(
              SCORE_TOPICS.map((topic) => [
                topic.id,
                res.score_weights[topic.id] ?? 0,
              ])
            )
          } else {
            loadedWeights = computeBalancedWeights(SCORE_TOPICS)
          }
          setWeights(loadedWeights)
          setSavedWeights(loadedWeights)

          const loadedThresholds = {
            low: Number(res.risk_thresholds?.low ?? DEFAULT_RISK_THRESHOLDS.low),
            moderate: Number(
              res.risk_thresholds?.moderate ?? DEFAULT_RISK_THRESHOLDS.moderate
            ),
          }
          setRiskThresholds(loadedThresholds)
          setSavedThresholds(loadedThresholds)
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

  // Computed Metrics
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
  const isWeightsValid = is100Percent

  const isRiskThresholdsValid = useMemo(() => {
    return (
      riskThresholds.moderate >= 1 &&
      riskThresholds.moderate < riskThresholds.low &&
      riskThresholds.low <= 99
    )
  }, [riskThresholds])

  const isStandardThresholds =
    riskThresholds.low === DEFAULT_RISK_THRESHOLDS.low &&
    riskThresholds.moderate === DEFAULT_RISK_THRESHOLDS.moderate

  // Dirty State Computations
  const isWeightsDirty = useMemo(
    () => !areWeightsEqual(weights, savedWeights),
    [weights, savedWeights]
  )

  const isThresholdsDirty = useMemo(
    () => !areThresholdsEqual(riskThresholds, savedThresholds),
    [riskThresholds, savedThresholds]
  )

  // Discard Handlers
  const handleDiscardWeights = () => {
    setWeights(savedWeights)
    toast.info("Unsaved weight changes discarded.")
  }

  const handleDiscardThresholds = () => {
    setRiskThresholds(savedThresholds)
    toast.info("Unsaved threshold changes discarded.")
  }

  // Weight Balancing Helper
  const roundWeightsTo100 = (
    w: Record<string, number>,
    fixedId?: string
  ) => {
    const result = { ...w }
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
    toast.info("Balanced weights applied across active score categories.")
  }

  const handleEnableAll = () => {
    const balancedAll = computeBalancedWeights(SCORE_TOPICS)
    setWeights(balancedAll)
    toast.info("All health modules enabled and balanced.")
  }

  const handleResetThresholds = () => {
    setRiskThresholds(DEFAULT_RISK_THRESHOLDS)
    toast.info("Risk thresholds reset to standard defaults (80 / 50).")
  }

  // Unified Save Executor
  const executeSave = async (contextLabel?: string) => {
    if (totalWeight > 0 && totalWeight !== 100) {
      toast.error("Total weight must equal exactly 100% before saving.")
      return false
    }
    if (!isRiskThresholdsValid) {
      toast.error(
        "Moderate risk cutoff must be strictly lower than Low risk cutoff."
      )
      return false
    }
    if (!organizationId) return false

    setSaving(true)
    try {
      const res = await updateOrganizationScoreWeights(
        organizationId,
        weights,
        riskThresholds
      )
      if (res) {
        if (res.score_weights) {
          setWeights(res.score_weights)
          setSavedWeights(res.score_weights)
        } else {
          setSavedWeights(weights)
        }
        if (res.risk_thresholds) {
          const updated = {
            low: Number(res.risk_thresholds.low ?? DEFAULT_RISK_THRESHOLDS.low),
            moderate: Number(
              res.risk_thresholds.moderate ?? DEFAULT_RISK_THRESHOLDS.moderate
            ),
          }
          setRiskThresholds(updated)
          setSavedThresholds(updated)
        } else {
          setSavedThresholds(riskThresholds)
        }

        if (contextLabel) {
          toast.success(`${contextLabel} updated successfully.`)
        } else {
          toast.success("Changes saved successfully.")
        }
        return true
      } else {
        toast.error("Failed to save configuration.")
        return false
      }
    } catch {
      toast.error("An error occurred while saving configuration.")
      return false
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
      {/* ── Page Header ── */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Score Configuration
        </h2>
        <p className="text-sm text-muted-foreground">
          Configure health module weight formulas and risk cutoff thresholds for
          employee evaluations.
        </p>
      </div>

      {/* ── Tabs Navigation ── */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "scores" | "thresholds")}
        className="w-full space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 p-1">
          <TabsTrigger value="scores" className="gap-2 text-xs font-semibold sm:text-sm">
            <SlidersHorizontal className="size-4" />
            <span>Score Weights</span>
            {isWeightsDirty && (
              <span
                className="size-1.5 rounded-full bg-amber-500"
                title="Unsaved changes in Score Weights"
              />
            )}
          </TabsTrigger>
          <TabsTrigger
            value="thresholds"
            className="gap-2 text-xs font-semibold sm:text-sm"
          >
            <ShieldCheck className="size-4" />
            <span>Risk Thresholds</span>
            {isThresholdsDirty && (
              <span
                className="size-1.5 rounded-full bg-amber-500"
                title="Unsaved changes in Risk Thresholds"
              />
            )}
          </TabsTrigger>
        </TabsList>

        {/* ========================================================= */}
        {/* TAB 1: SCORE WEIGHTS DEFINITION                           */}
        {/* ========================================================= */}
        <TabsContent value="scores" className="space-y-6 outline-none">
          {/* Allocation Progress Overview Card */}
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-0.5">
                  <CardTitle className="text-base font-semibold text-foreground">
                    Score Weights
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Combined distribution across enabled health modules (must equal exactly 100%)
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-foreground tabular-nums">
                    {totalWeight}%
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      totalWeight === 100
                        ? "border-emerald-500/30 bg-emerald-500/10 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                        : totalWeight === 0
                          ? "border-muted-foreground/30 bg-muted/40 text-xs font-semibold text-muted-foreground"
                          : "border-amber-500/30 bg-amber-500/10 text-xs font-semibold text-amber-600 dark:text-amber-400"
                    }
                  >
                    {totalWeight === 100
                      ? "100% Allocated (Balanced)"
                      : totalWeight === 0
                        ? "All Modules Disabled"
                        : totalWeight < 100
                          ? `${100 - totalWeight}% Remaining`
                          : `${totalWeight - 100}% Excess`}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {/* Clean Single Theme Progress Bar */}
              <div className="space-y-1.5">
                <Progress
                  value={Math.min(100, totalWeight)}
                  className={cn(
                    "h-2.5 w-full bg-muted",
                    totalWeight > 100 && "[&>div]:bg-destructive"
                  )}
                />
              </div>

              {/* Module Active Breakdown Summary */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>
                    <strong>{activeCount}</strong> active{" "}
                    {activeCount === 1 ? "module" : "modules"}
                  </span>
                  <span>•</span>
                  <span>
                    <strong>{disabledCount}</strong> disabled
                  </span>
                </div>
                {totalWeight === 100 && (
                  <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3.5" />
                    Formula distribution ready
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Controls Toolbar: Actions & Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: Quick Actions */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleApplyBalanced}
                disabled={loading || saving}
                className="gap-1.5 whitespace-nowrap"
              >
                <RotateCcw className="size-3.5 text-muted-foreground" />
                Reset to balanced
              </Button>
              {disabledCount > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleEnableAll}
                  disabled={loading || saving}
                  className="gap-1.5 font-medium whitespace-nowrap hover:bg-muted"
                >
                  <Sparkles className="size-3.5 text-primary" />
                  Enable all
                </Button>
              )}
            </div>

            {/* Right: Filter Segmented Control */}
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

          {/* Module Cards Grid */}
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
                      : "border-dashed border-border/50 bg-muted/20 opacity-80"
                  )}
                >
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                            isEnabled
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          <Icon className="size-4" />
                        </div>
                        <div className="space-y-0.5">
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
                                  ? "border-primary/30 bg-primary/10 text-primary"
                                  : "border-muted-foreground/30 bg-muted/30 text-muted-foreground"
                              )}
                            >
                              {isEnabled ? "Active" : "Disabled"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {topic.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
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

                    <p className="text-xs text-muted-foreground/90">
                      {topic.description}
                    </p>

                    {isEnabled ? (
                      <div className="space-y-1 pt-1">
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
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>0%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-md border border-dashed border-border/60 bg-muted/30 p-2 text-center text-xs text-muted-foreground">
                        Module disabled (excluded from employee health assessments)
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Section 1 Footer Action Bar */}
          <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs">
              {totalWeight === 100 ? (
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-4" />
                  <span>Valid weight total: 100% allocated</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="size-4" />
                  <span>
                    Total weight must equal exactly 100% (currently{" "}
                    <strong>{totalWeight}%</strong>)
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {isWeightsDirty && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDiscardWeights}
                  disabled={loading || saving}
                  className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Undo2 className="size-3.5" />
                  Discard
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                onClick={() => void executeSave("Score weights")}
                disabled={!isWeightsValid || loading || saving || !isWeightsDirty}
                className="gap-1.5 whitespace-nowrap"
              >
                {saving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                {saving ? "Saving..." : "Save score weights"}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ========================================================= */}
        {/* TAB 2: RISK CUTOFF THRESHOLDS                             */}
        {/* ========================================================= */}
        <TabsContent value="thresholds" className="space-y-6 outline-none">
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
                    Define score cutoff boundaries used to categorize employee evaluations into risk tiers.
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
                    {isStandardThresholds
                      ? "Standard Defaults"
                      : "Custom Thresholds"}
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
                      Reset to defaults
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-0">
              {/* Dynamic Segmented Color Bar Visualizer */}
              <div className="space-y-2">
                <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-muted shadow-inner">
                  <div
                    className="h-full bg-rose-500 transition-all duration-200"
                    style={{ width: `${riskThresholds.moderate}%` }}
                    title={`Needs attention: 0 - ${riskThresholds.moderate - 1}`}
                  />
                  <div
                    className="h-full bg-amber-500 transition-all duration-200"
                    style={{
                      width: `${Math.max(
                        0,
                        riskThresholds.low - riskThresholds.moderate
                      )}%`,
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
                <div className="flex justify-between px-0.5 text-[11px] font-medium text-muted-foreground">
                  <span>0 pts (High Risk)</span>
                  <span>
                    Moderate:{" "}
                    <strong className="text-foreground">
                      &ge; {riskThresholds.moderate} pts
                    </strong>
                  </span>
                  <span>
                    Low Risk:{" "}
                    <strong className="text-foreground">
                      &ge; {riskThresholds.low} pts
                    </strong>
                  </span>
                  <span>100 pts (Optimal)</span>
                </div>
              </div>

              {/* Sliders & Threshold Controls */}
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-border/60 bg-muted/20 p-4 sm:grid-cols-2">
                {/* Low Risk Slider */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="low-threshold"
                      className="text-xs font-semibold text-foreground"
                    >
                      Low Risk Minimum Cutoff (Optimal)
                    </Label>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        &ge; {riskThresholds.low}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        pts
                      </span>
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
                  <p className="text-[11px] text-muted-foreground">
                    Employees scoring at or above {riskThresholds.low} are classified as low risk.
                  </p>
                </div>

                {/* Moderate Risk Slider */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="moderate-threshold"
                      className="text-xs font-semibold text-foreground"
                    >
                      Moderate Risk Minimum Cutoff
                    </Label>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                        &ge; {riskThresholds.moderate}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        pts
                      </span>
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
                  <p className="text-[11px] text-muted-foreground">
                    Employees scoring from {riskThresholds.moderate} to {riskThresholds.low - 1} are classified as moderate risk.
                  </p>
                </div>
              </div>

              {/* 3 Tier Classification Breakdown Cards */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {/* Needs Attention Tier */}
                <div className="flex flex-col justify-between rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                      <AlertCircle className="size-3.5" />
                      Needs Attention
                    </span>
                    <Badge
                      variant="outline"
                      className="border-rose-500/30 bg-rose-500/10 text-[10px] font-semibold text-rose-600 dark:text-rose-400"
                    >
                      &lt; {riskThresholds.moderate} pts
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    High risk indicators requiring clinical intervention or follow-up.
                  </p>
                </div>

                {/* Moderate Risk Tier */}
                <div className="flex flex-col justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="size-3.5" />
                      Moderate Risk
                    </span>
                    <Badge
                      variant="outline"
                      className="border-amber-500/30 bg-amber-500/10 text-[10px] font-semibold text-amber-600 dark:text-amber-400"
                    >
                      {riskThresholds.moderate} – {riskThresholds.low - 1} pts
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Moderate risk factors recommending lifestyle adjustments or preventive monitoring.
                  </p>
                </div>

                {/* Low Risk Tier */}
                <div className="flex flex-col justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-3.5" />
                      Low Risk (Optimal)
                    </span>
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 bg-emerald-500/10 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
                    >
                      {riskThresholds.low} – 100 pts
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Optimal health parameters aligned with low cardiometabolic risk guidelines.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2 Footer Action Bar */}
          <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs">
              {isRiskThresholdsValid ? (
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-4" />
                  <span>
                    Valid thresholds: Moderate ({riskThresholds.moderate}) &lt; Low Risk ({riskThresholds.low})
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                  <AlertCircle className="size-4" />
                  <span>
                    Moderate threshold must be strictly lower than Low risk threshold
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {isThresholdsDirty && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDiscardThresholds}
                  disabled={loading || saving}
                  className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Undo2 className="size-3.5" />
                  Discard
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                onClick={() => void executeSave("Risk thresholds")}
                disabled={!isRiskThresholdsValid || loading || saving || !isThresholdsDirty}
                className="gap-1.5 whitespace-nowrap"
              >
                {saving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                {saving ? "Saving..." : "Save risk thresholds"}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
