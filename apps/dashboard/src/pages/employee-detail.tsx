import { useEffect, useState, useMemo } from "react"
import { cn } from "@workspace/ui/lib/utils"
import { useParams, useNavigate } from "react-router-dom"
import {
  getOrganizationEmployee,
  listEmployeeAssessments,
  getEmployeeAssessmentSubmission,
  listEmployeeAssessmentSubmissions,
  type AssessmentSubmissionDetail,
  type AssessmentSubmissionSummary,
  type EmployeeDetail,
  type AssessmentsResponse,
} from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { AssignDepartmentForm } from "@workspace/components/components/assign-department-form"
import {
  HealthScoreCard,
  type HealthScoreRow,
} from "@workspace/components/components/health-score-card"
import {
  groupResultsIntoSessions,
  AssessmentHistoryDialog,
  getAssessmentDisplayName,
} from "@workspace/components/components/assessment-utils"
import { AssessmentSubmissionHistory } from "@workspace/components/components/assessment-submission-history"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import {
  Activity,
  ArrowLeft,
  HeartPulse,
  Moon,
  Clock,
  History,
  Calendar,
  ClipboardList,
  RotateCcw,
  FileText,
  Mail,
  Building2,
  Edit3,
  UserCog,
  Phone,
  Cake,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { ManageRolesDialog } from "@/components/manage-roles-dialog"
import { getRoleBadgeProps, formatRoleName, normalizeRoles } from "@/lib/role-utils"
import {
  ScoreEvolutionChart,
  type ChartSeries,
} from "@workspace/components/components/score-evolution-chart"

const OVERALL_SERIES_CONFIG: ChartSeries = {
  key: "overall",
  label: "General",
  color: "oklch(0.65 0.18 250)", // Brand Primary / Blue
  strokeWidth: 2.5,
}

const PALETTE = [
  "oklch(0.62 0.20 145)", // Green / Emerald
  "oklch(0.60 0.22 320)", // Purple / Violet
  "oklch(0.68 0.20 55)", // Amber / Yellow
  "oklch(0.62 0.18 195)", // Cyan / Teal
  "oklch(0.60 0.20 30)", // Orange
  "oklch(0.55 0.18 280)", // Indigo
  "oklch(0.58 0.20 10)", // Rose
]

/** Standard score topics reusing identical icons and metadata from score-weights.tsx */
const SCORE_TOPICS = [
  {
    id: "diabetes",
    matchKey: "findrisc",
    name: "Diabetes",
    subtitle: "Metabolic health & 10-year risk",
    icon: Activity,
  },
  {
    id: "sleep_apnea",
    matchKey: "stop_bang",
    name: "Sleep Apnea",
    subtitle: "Respiratory & sleep quality",
    icon: Moon,
  },
  {
    id: "depression",
    matchKey: "phq",
    name: "Mood & Well-being",
    subtitle: "Emotional well-being & mood",
    icon: HeartPulse,
  },
  {
    id: "metabolic_syndrome",
    matchKey: "metabolic",
    name: "Metabolic Health",
    subtitle: "Cardiometabolic & vital signs",
    icon: Activity,
  },
  {
    id: "eoss",
    matchKey: "eoss",
    name: "Obesity Impact",
    subtitle: "Health & functional impact staging",
    icon: HeartPulse,
  },
  {
    id: "cardiovascular",
    matchKey: "score2",
    name: "Cardiovascular",
    subtitle: "Heart health & 10-year CVD risk",
    icon: HeartPulse,
  },
  {
    id: "nordic_nmq",
    matchKey: "nordic",
    name: "Musculoskeletal",
    subtitle: "Ergonomics & physical load",
    icon: Activity,
  },
  {
    id: "audit_c",
    matchKey: "audit",
    name: "Alcohol Habits",
    subtitle: "Occupational safety & consumption habits",
    icon: HeartPulse,
  },
  {
    id: "pss10",
    matchKey: "pss",
    name: "Stress & Burnout",
    subtitle: "Psychological resilience & coping",
    icon: HeartPulse,
  },
]

function getTopicMeta(scoreId: string, scoreName: string) {
  const sid = (scoreId || "").toLowerCase()
  const sn = (scoreName || "").toLowerCase()

  for (const topic of SCORE_TOPICS) {
    if (
      sid.includes(topic.id) ||
      sid.includes(topic.matchKey) ||
      sn.includes(topic.name.toLowerCase())
    ) {
      return topic
    }
  }

  return {
    id: scoreId || scoreName || "unknown",
    matchKey: "unknown",
    name: scoreName || scoreId || "Clinical Evaluation",
    subtitle: "Medical assessment",
    icon: Activity,
  }
}

function getRiskTone(
  riskLevel?: string | null,
  value?: number | null,
  riskThresholds?: Record<string, number> | null
) {
  const low =
    typeof riskThresholds?.low === "number"
      ? riskThresholds.low
      : typeof riskThresholds?.low_risk === "number"
        ? riskThresholds.low_risk
        : 80
  const mod =
    typeof riskThresholds?.moderate === "number"
      ? riskThresholds.moderate
      : typeof riskThresholds?.moderate_risk === "number"
        ? riskThresholds.moderate_risk
        : 50

  if (typeof value === "number" && !isNaN(value)) {
    if (value >= low) {
      return {
        tone: "green" as const,
        riskLevel: "low" as const,
        label: "Low risk",
        variant: "risk-low" as const,
      }
    }
    if (value >= mod) {
      return {
        tone: "amber" as const,
        riskLevel: "moderate" as const,
        label: "Moderate risk",
        variant: "risk-moderate" as const,
      }
    }
    return {
      tone: "red" as const,
      riskLevel: "high" as const,
      label: "Needs Attention",
      variant: "risk-high" as const,
    }
  }

  const normRisk = (riskLevel || "").toLowerCase()

  if (
    normRisk.includes("high") ||
    normRisk.includes("attention") ||
    normRisk.includes("severe")
  ) {
    return {
      tone: "red" as const,
      riskLevel: "high" as const,
      label: "Needs Attention",
      variant: "risk-high" as const,
    }
  }

  if (
    normRisk.includes("moderate") ||
    normRisk.includes("elevated") ||
    normRisk.includes("mild") ||
    normRisk.includes("inter")
  ) {
    return {
      tone: "amber" as const,
      riskLevel: "moderate" as const,
      label: "Moderate risk",
      variant: "risk-moderate" as const,
    }
  }

  if (
    normRisk.includes("low") ||
    normRisk.includes("optimal") ||
    normRisk.includes("good")
  ) {
    return {
      tone: "green" as const,
      riskLevel: "low" as const,
      label: "Low risk",
      variant: "risk-low" as const,
    }
  }

  return {
    tone: "muted" as const,
    riskLevel: null,
    label: "Pending",
    variant: "secondary" as const,
  }
}

function formatFullName(
  input:
    | string
    | {
        email?: string | null
        first_name?: string | null
        last_name?: string | null
        name?: string | null
      }
) {
  if (typeof input === "object" && input !== null) {
    if (input.name && input.name.trim()) return input.name.trim()
    const first = input.first_name?.trim()
    const last = input.last_name?.trim()
    if (first || last) {
      return `${first ?? ""} ${last ?? ""}`.trim()
    }
    const email = input.email || ""
    const prefix = email.split("@")[0] || email
    const parts = prefix.split(/[._-]+/).filter(Boolean)
    if (parts.length > 0) {
      return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ")
    }
    return prefix
  }
  const email = input || ""
  const prefix = email.split("@")[0] || email
  const parts = prefix.split(/[._-]+/).filter(Boolean)
  if (parts.length > 0) {
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ")
  }
  return prefix
}

function calculateAge(dateOfBirth: Date) {
  const today = new Date()
  const age = today.getFullYear() - dateOfBirth.getFullYear()
  const hadBirthdayThisYear =
    today.getMonth() > dateOfBirth.getMonth() ||
    (today.getMonth() === dateOfBirth.getMonth() &&
      today.getDate() >= dateOfBirth.getDate())
  return hadBirthdayThisYear ? age : age - 1
}

function formatDateOfBirth(value: string) {
  // Parse as a local date: "YYYY-MM-DD" alone would be read as UTC midnight.
  const [year, month, day] = value.split("-").map(Number)
  const dateOfBirth = new Date(year, month - 1, day)
  const formatted = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(dateOfBirth)
  return `${formatted} (${calculateAge(dateOfBirth)} years)`
}

function getInitials(fullName: string, email: string) {
  const parts = fullName.split(" ").filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

function EmployeeDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse space-y-6">
      <Skeleton className="h-32 w-full rounded-3xl" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-80 rounded-3xl" />
        <Skeleton className="h-80 rounded-3xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-3xl" />
    </div>
  )
}

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useCurrentUser()
  const organizationId = user?.membership?.organization_id

  const [employee, setEmployee] = useState<EmployeeDetail | null>(null)
  const [scoreWeights, setScoreWeights] = useState<Record<
    string,
    number
  > | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [manageRolesOpen, setManageRolesOpen] = useState(false)

  const isCurrentUserSuperadmin = useMemo(() => {
    if (user?.is_sysadmin) return true
    return user?.membership?.roles?.includes("superadmin") ?? false
  }, [user])

  const isCurrentUserAdmin = useMemo(() => {
    if (user?.is_sysadmin) return true
    return user?.membership?.roles?.includes("admin") ?? false
  }, [user])

  const canManageRoles = isCurrentUserSuperadmin || isCurrentUserAdmin

  // Assessments state
  const [assessments, setAssessments] = useState<AssessmentsResponse | null>(
    null
  )
  const [loadingAssessments, setLoadingAssessments] = useState(true)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  )
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [submissions, setSubmissions] = useState<AssessmentSubmissionSummary[]>(
    []
  )
  const [submissionPage, setSubmissionPage] = useState(1)
  const [submissionHasNext, setSubmissionHasNext] = useState(false)
  const [submissionsLoading, setSubmissionsLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] =
    useState<AssessmentSubmissionDetail | null>(null)
  const [submissionDetailLoading, setSubmissionDetailLoading] = useState(false)

  // Load weights
  useEffect(() => {
    if (!organizationId) return

    async function loadWeights() {
      try {
        const { getOrganizationScoreWeights } = await import("@workspace/api")
        const weights = await getOrganizationScoreWeights(
          organizationId as string
        )

        if (
          weights &&
          weights.score_weights &&
          Object.keys(weights.score_weights).length > 0
        ) {
          setScoreWeights(weights.score_weights)
        } else {
          const defaults: Record<string, number> = {}
          for (const t of SCORE_TOPICS) defaults[t.id] = 1
          setScoreWeights(defaults)
        }
      } catch (err) {
        console.error("Failed to load score weights:", err)
        const defaults: Record<string, number> = {}
        for (const t of SCORE_TOPICS) defaults[t.id] = 1
        setScoreWeights(defaults)
      }
    }
    void loadWeights()
  }, [organizationId])

  const loadEmployee = async () => {
    if (!organizationId || !id) return
    setLoading(true)
    setError("")
    try {
      const found = await getOrganizationEmployee(organizationId, id)
      if (found) {
        setEmployee(found)
      } else {
        setError("Employee not found.")
      }
    } catch {
      setError("Failed to load employee details.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!organizationId || !id) return
      setLoading(true)
      setError("")
      try {
        const found = await getOrganizationEmployee(organizationId, id)
        if (active) {
          if (found) {
            setEmployee(found)
          } else {
            setError("Employee not found.")
          }
        }
      } catch {
        if (active) setError("Failed to load employee details.")
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [organizationId, id])

  useEffect(() => {
    let active = true
    const loadSubmissions = async () => {
      if (!organizationId || !id) return
      setSubmissionsLoading(true)
      const data = await listEmployeeAssessmentSubmissions(organizationId, id)
      if (active) {
        setSubmissions(data?.items || [])
        setSubmissionHasNext(data?.has_next || false)
        setSubmissionsLoading(false)
      }
    }
    void loadSubmissions()
    return () => {
      active = false
    }
  }, [organizationId, id])

  const loadMoreSubmissions = async () => {
    if (!organizationId || !id) return
    const nextPage = submissionPage + 1
    setSubmissionsLoading(true)
    const data = await listEmployeeAssessmentSubmissions(
      organizationId,
      id,
      nextPage
    )
    if (data) {
      setSubmissions((current) => [...current, ...data.items])
      setSubmissionPage(nextPage)
      setSubmissionHasNext(data.has_next)
    }
    setSubmissionsLoading(false)
  }

  const selectSubmission = async (submission: AssessmentSubmissionSummary) => {
    if (!organizationId || !id) return
    setSubmissionDetailLoading(true)
    setSelectedSubmission(
      await getEmployeeAssessmentSubmission(organizationId, id, submission.id)
    )
    setSubmissionDetailLoading(false)
  }

  useEffect(() => {
    let active = true
    const loadAssessmentsData = async () => {
      if (!organizationId || !id) return
      setLoadingAssessments(true)
      const data = await listEmployeeAssessments(organizationId, id)
      if (active) {
        setAssessments(data)
        setLoadingAssessments(false)
      }
    }
    void loadAssessmentsData()
    return () => {
      active = false
    }
  }, [organizationId, id])

  const sessions = useMemo(() => {
    return groupResultsIntoSessions(assessments)
  }, [assessments])

  const activeSession = useMemo(() => {
    if (!sessions.length) return null
    return sessions.find((s) => s.id === selectedSessionId) || sessions[0]
  }, [sessions, selectedSessionId])

  const isViewingLatest = activeSession?.isLatest ?? true

  // Indicators: sort all results by severity and get top 3
  const dynamicIndicators: HealthScoreRow[] = useMemo(() => {
    const results = activeSession?.results || []

    const allIndicators = results.map((res) => {
      const topicMeta = getTopicMeta(res.score_id || "", res.score_name || "")
      const isDeactivated =
        scoreWeights !== null && (scoreWeights[topicMeta.id] ?? 0) <= 0
      const isEvaluated =
        res.health_index !== null && res.health_index !== undefined
      const val = isEvaluated
        ? Math.round(res.health_index as number)
        : null
      const riskMeta = getRiskTone(
        res.risk_level,
        val ?? undefined,
        assessments?.risk_thresholds
      )

      let severityScore = 0
      if (riskMeta.riskLevel === "high") severityScore = 3
      else if (riskMeta.riskLevel === "moderate") severityScore = 2
      else if (riskMeta.riskLevel === "low") severityScore = 1

      return {
        label: getAssessmentDisplayName(
          res.score_id || "",
          res.score_name || topicMeta.name
        ),
        value: val,
        icon: topicMeta.icon,
        tone: isDeactivated ? "muted" : riskMeta.tone,
        isPending: !isEvaluated,
        isDeactivated: isDeactivated,
        _severityScore: severityScore,
        _val: val ?? 100, // lower is worse, 100 is best
        _weight: scoreWeights ? (scoreWeights[topicMeta.id] ?? 0) : 1,
      }
    })

    allIndicators.sort((a, b) => {
      const aActive = !a.isDeactivated
      const bActive = !b.isDeactivated
      if (aActive !== bActive) return aActive ? -1 : 1

      if (aActive) {
        if (a._weight !== b._weight) return b._weight - a._weight
      }

      if (a._severityScore !== b._severityScore) {
        return b._severityScore - a._severityScore
      }
      return a._val - b._val
    })

    return allIndicators.slice(0, 3).map((indicator) => ({
      label: indicator.label,
      value: indicator.value,
      icon: indicator.icon,
      tone: indicator.tone,
      isPending: indicator.isPending,
      isDeactivated: indicator.isDeactivated,
    }))
  }, [activeSession, scoreWeights, assessments?.risk_thresholds])

  const hasAnyEvaluated = dynamicIndicators.some(
    (i) => !i.isPending && i.value !== null
  )

  const computedHealth = useMemo(() => {
    if (!hasAnyEvaluated) {
      return {
        score: null,
        label: "Pending assessment",
        riskLevel: null,
      }
    }

    if (typeof assessments?.overall_health_index !== "number") {
      return {
        score: null,
        label: "Incomplete assessment",
        riskLevel: null,
      }
    }

    const finalScore = Math.round(assessments.overall_health_index)
    const riskMeta = getRiskTone(
      assessments?.overall_risk_level,
      finalScore,
      assessments?.risk_thresholds
    )

    return {
      score: finalScore,
      label: riskMeta.label,
      riskLevel: riskMeta.riskLevel,
    }
  }, [hasAnyEvaluated, assessments])

  // Discover available study curves dynamically from session assessment results (100% dynamic)
  const availableStudies = useMemo<ChartSeries[]>(() => {
    const list: ChartSeries[] = [OVERALL_SERIES_CONFIG]
    const foundKeys = new Set<string>()

    sessions.forEach((session) => {
      session.results.forEach((res) => {
        if (
          res.score_name &&
          res.health_index !== null &&
          res.health_index !== undefined
        ) {
          const topic = getTopicMeta(res.score_id || "", res.score_name)
          const isDeactivated = scoreWeights !== null && (scoreWeights[topic.id] ?? 0) <= 0
          if (!isDeactivated) {
            foundKeys.add(res.score_name.trim())
          }
        }
      })
    })

    Array.from(foundKeys).forEach((studyName, idx) => {
      const color = PALETTE[idx % PALETTE.length]
      list.push({
        key: studyName,
        label: studyName,
        color,
        strokeWidth: 2,
      })
    })

    return list
  }, [sessions, scoreWeights])

  // Multi-curve evolution data from session history
  const evolutionData = useMemo(() => {
    if (!sessions.length) return []
    return [...sessions].reverse().map((session, idx, arr) => {
      const isLatestInArray = idx === arr.length - 1
      const overallScore =
        isLatestInArray && typeof assessments?.overall_health_index === "number"
          ? Math.round(assessments.overall_health_index)
          : typeof session.overallScore === "number"
            ? Math.round(session.overallScore)
            : null

      const row: Record<string, string | number> = {
        month: session.formattedDate.split(" ")[0] || `Eval #${idx + 1}`,
      }
      if (typeof overallScore === "number") {
        row.overall = overallScore
      }

      session.results.forEach((r) => {
        if (
          r.score_name &&
          r.health_index !== null &&
          r.health_index !== undefined
        ) {
          const topic = getTopicMeta(r.score_id || "", r.score_name)
          const isDeactivated = scoreWeights !== null && (scoreWeights[topic.id] ?? 0) <= 0
          if (!isDeactivated) {
            row[r.score_name.trim()] = Math.round(r.health_index)
          }
        }
      })

      return row
    })
  }, [sessions, assessments, scoreWeights])

  const sortedBottomResults = useMemo(() => {
    if (!activeSession) return []

    const results = [...(activeSession.results || [])]
    const seenTopicIds = new Set<string>()

    for (const r of results) {
      const topic = getTopicMeta(r.score_id || "", r.score_name || "")
      seenTopicIds.add(topic.id)
    }

    for (const topic of SCORE_TOPICS) {
      if (!seenTopicIds.has(topic.id)) {
        results.push({
          score_id: topic.matchKey,
          score_name: topic.name,
          health_index: null,
          risk_level: null,
          explanation: null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
      }
    }

    return results.sort((a, b) => {
      const topicA = getTopicMeta(a.score_id || "", a.score_name || "")
      const topicB = getTopicMeta(b.score_id || "", b.score_name || "")
      const isDeactA =
        scoreWeights !== null && (scoreWeights[topicA.id] ?? 0) <= 0
      const isDeactB =
        scoreWeights !== null && (scoreWeights[topicB.id] ?? 0) <= 0
      if (isDeactA !== isDeactB) return isDeactA ? 1 : -1
      return 0
    })
  }, [activeSession, scoreWeights])

  if (loading) {
    return <EmployeeDetailSkeleton />
  }

  if (error || !employee) {
    return (
      <Card className="mx-auto mt-12 max-w-md border-destructive/20 bg-destructive/5">
        <CardContent className="space-y-4 pt-6 text-center">
          <p className="font-medium text-destructive">
            {error || "Member not found."}
          </p>
          <Button
            onClick={() => navigate(-1)}
            variant="link"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Go back
          </Button>
        </CardContent>
      </Card>
    )
  }

  const fullName = formatFullName(employee)
  const initials = getInitials(fullName, employee.email)

  const handleRefresh = () => {
    void loadEmployee()
  }

  const handleAssignSuccess = () => {
    setIsDialogOpen(false)
    handleRefresh()
  }

  return (
    <div className="mx-auto w-full max-w-7xl animate-in space-y-6 duration-300 fade-in">
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="size-9 cursor-pointer rounded-lg border border-border/40 hover:bg-muted/50"
          aria-label="Back"
        >
          <ArrowLeft className="size-4 text-muted-foreground" />
        </Button>
      </div>

      {/* Prominent Employee Hero Header */}
      <Card className="relative overflow-hidden rounded-xl border border-border/60 bg-card p-6 shadow-xs md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Large Avatar + Full Info */}
          <div className="flex items-start gap-4 md:gap-6">
            <Avatar
              key={employee.avatar_url ?? "fallback"}
              className="size-16 shrink-0 ring-4 ring-primary/10 md:size-20"
            >
              <AvatarImage
                src={employee.avatar_url || ""}
                alt={fullName}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary md:text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {fullName}
                </h1>
                {employee.status && (
                  <Badge
                    variant={employee.status === "active" ? "success-light" : "warning-light"}
                    size="sm"
                    className="capitalize"
                  >
                    {employee.status}
                  </Badge>
                )}
                {normalizeRoles(employee.roles || []).map((r) => {
                  const badgeProps = getRoleBadgeProps(r)
                  return (
                    <Badge
                      key={r}
                      variant={badgeProps.variant}
                      size="xs"
                      className={badgeProps.className}
                    >
                      {formatRoleName(r)}
                    </Badge>
                  )
                })}
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="size-4 text-muted-foreground/70" />
                  <span className="font-medium text-foreground">
                    {employee.email}
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Building2 className="size-4 text-muted-foreground/70" />
                  {employee.department ? (
                    <span className="font-medium text-foreground">
                      {employee.department.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">
                      Unassigned department
                    </span>
                  )}
                </span>
                {employee.phone_number && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="size-4 text-muted-foreground/70" />
                    <span className="font-medium text-foreground">
                      {employee.phone_number}
                    </span>
                  </span>
                )}
                {employee.date_of_birth && (
                  <span className="flex items-center gap-1.5">
                    <Cake className="size-4 text-muted-foreground/70" />
                    <span className="font-medium text-foreground">
                      {formatDateOfBirth(employee.date_of_birth)}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap items-center gap-2.5 pl-14 lg:pl-0">
            {organizationId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(true)}
                className="h-8 cursor-pointer gap-1.5 rounded-lg px-3 text-xs"
              >
                <Edit3 className="size-3.5" />
                {employee.department
                  ? "Change department"
                  : "Assign department"}
              </Button>
            )}

            {canManageRoles && organizationId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setManageRolesOpen(true)}
                className="h-8 cursor-pointer gap-1.5 rounded-lg px-3 text-xs"
              >
                <UserCog className="size-3.5" />
                Manage roles
              </Button>
            )}

            {sessions.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsHistoryOpen(true)}
                className="h-8 cursor-pointer gap-1.5 rounded-lg px-3 text-xs"
              >
                <History className="size-3.5" />
                Assessment history ({sessions.length})
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Main Health Section */}
      {employee.status === "onboarding" ? (
        <Empty className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/15 p-8 text-center shadow-xs">
          <EmptyHeader className="flex flex-col items-center justify-center text-center">
            <EmptyMedia className="mb-4 rounded-full bg-foreground/10 p-4 text-foreground">
              <Clock className="size-8 animate-pulse" />
            </EmptyMedia>
            <EmptyTitle className="text-base font-semibold text-foreground">
              Pending Onboarding
            </EmptyTitle>
            <EmptyDescription className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Health score evaluations are not available yet. This employee is
              currently completing the onboarding process.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid items-stretch gap-6 lg:grid-cols-2">
          {/* Health Score Overview Card */}
          <HealthScoreCard
            title="Health score"
            score={computedHealth.score}
            scoreLabel={computedHealth.label}
            riskLevel={computedHealth.riskLevel}
            rows={dynamicIndicators}
            loading={loading || loadingAssessments}
            compact
            className="h-full"
          />

          {/* Health Score Evolution Chart (Reusable Component) */}
          <ScoreEvolutionChart
            title="Health score evolution"
            description="Score progression across medical assessments (higher is healthier)"
            badgeLabel={evolutionData.length > 0 ? "Progression" : undefined}
            data={evolutionData}
            series={availableStudies}
            showPercentages={false}
            loading={loading || loadingAssessments}
            emptyTitle="No evaluations yet"
            emptyMessage="History will be plotted as new evaluations are completed."
            height={240}
          />
        </div>
      )}

      {/* Clinical Study Assessments - Only shown if not in onboarding */}
      {employee.status !== "onboarding" && (
        <Card className="rounded-xl border border-border/60 bg-card shadow-xs">
          <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="size-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  Clinical Study Assessments
                </CardTitle>
                <CardDescription className="text-xs">
                  Medical risk evaluations calculated by clinical engine
                </CardDescription>
              </div>
            </div>

            {sessions.length > 0 && !isViewingLatest && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSessionId(sessions[0]?.id || null)}
                className="h-8 cursor-pointer gap-1.5 rounded-lg px-3 text-xs"
              >
                <RotateCcw className="size-3.5" />
                View latest
              </Button>
            )}
          </CardHeader>

          <CardContent className="space-y-4 pt-1">
            {loadingAssessments ? (
              <div className="flex justify-center p-8">
                <div className="h-7 w-7 animate-spin rounded-full border-3 border-primary border-t-transparent"></div>
              </div>
            ) : !sessions.length ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/15 p-8 text-center">
                <ClipboardList className="mb-3 size-8 text-muted-foreground/40" />
                <h4 className="text-sm font-semibold">
                  No Clinical Assessments Submitted
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  This employee has not completed medical study questionnaires
                  yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Active Session Info Banner */}
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3 px-4 text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-3.5 text-primary" />
                    <span className="font-medium text-foreground">
                      Assessment from {activeSession?.formattedDate}
                    </span>
                    {isViewingLatest ? (
                      <Badge
                        variant="success-light"
                        size="xs"
                      >
                        Latest
                      </Badge>
                    ) : (
                      <Badge
                        variant="warning-light"
                        size="xs"
                      >
                        History
                      </Badge>
                    )}
                  </div>
                  <span className="text-muted-foreground">
                    {activeSession?.results.length} score(s) evaluated
                  </span>
                </div>

                {/* Assessment Modules Grid: Neutral Card styling, color ONLY on the percentage badge */}
                <div className="grid gap-4 md:grid-cols-2">
                  {sortedBottomResults.map((result, idx) => {
                    const topic = getTopicMeta(
                      result.score_id || "",
                      result.score_name || ""
                    )
                    const Icon = topic.icon
                    const isDeactivated =
                      scoreWeights !== null &&
                      (scoreWeights[topic.id] ?? 0) <= 0

                    const isEvaluated =
                      result.health_index !== null &&
                      result.health_index !== undefined

                    const val = isEvaluated
                      ? Math.round(result.health_index as number)
                      : null
                    const riskMeta = getRiskTone(
                      result.risk_level,
                      val,
                      assessments?.risk_thresholds
                    )

                    if (!isEvaluated) {
                      return (
                        <div
                          key={result.score_id || `pending-${idx}`}
                          className="flex flex-col justify-between rounded-xl border border-dashed border-border/60 bg-muted/15 p-5 opacity-60"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                  <Icon className="size-4" />
                                </div>
                                <div>
                                  <span className="text-sm font-semibold text-muted-foreground">
                                    {getAssessmentDisplayName(
                                      result.score_id,
                                      result.score_name || topic.name
                                    )}
                                  </span>
                                  <p className="text-[11px] text-muted-foreground">
                                    {topic.subtitle}
                                  </p>
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                size="xs"
                                className="border-border/60 text-muted-foreground"
                              >
                                {isDeactivated
                                  ? "Disabled form"
                                  : "Pending form"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {isDeactivated
                                ? "This evaluation is currently disabled."
                                : "Evaluation has not been completed or calculated yet."}
                            </p>
                          </div>
                        </div>
                      )
                    }

                    const hasCustomExplanation =
                      result.explanation &&
                      result.explanation.trim() !== "" &&
                      result.explanation.toLowerCase() !==
                        "no explanation provided."

                    return (
                      <div
                        key={result.score_id || `eval-${idx}`}
                        className={cn(
                          "flex flex-col justify-between rounded-xl border border-border/60 bg-card p-5 transition-all hover:shadow-xs",
                          isDeactivated && "opacity-60"
                        )}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "flex size-8 items-center justify-center rounded-lg bg-muted",
                                  isDeactivated
                                    ? "text-muted-foreground"
                                    : "text-foreground"
                                )}
                              >
                                <Icon className="size-4" />
                              </div>
                              <div>
                                <span
                                  className={cn(
                                    "text-sm font-semibold",
                                    isDeactivated
                                      ? "text-muted-foreground"
                                      : "text-foreground"
                                  )}
                                >
                                  {getAssessmentDisplayName(
                                    result.score_id,
                                    result.score_name || topic.name
                                  )}
                                </span>
                                <p className="text-[11px] text-muted-foreground">
                                  {topic.subtitle}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge
                                variant={isDeactivated ? "outline" : (riskMeta.variant || "outline")}
                                size="xs"
                                className={cn(
                                  "font-semibold",
                                  isDeactivated && "border-border/60 bg-muted/40 text-muted-foreground"
                                )}
                              >
                                {val}%
                              </Badge>
                              {isDeactivated && (
                                <span className="text-[9px] font-medium text-muted-foreground/80 uppercase">
                                  Disabled
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">
                              Risk Level:
                            </span>
                            <span
                              className={cn(
                                "font-semibold capitalize",
                                isDeactivated
                                  ? "text-muted-foreground"
                                  : "text-foreground"
                              )}
                            >
                              {result.risk_level || riskMeta.label}
                            </span>
                          </div>

                          {hasCustomExplanation && (
                            <p className="pt-1 text-xs leading-relaxed text-muted-foreground">
                              {result.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Shared Assessment History Dialog */}
      <AssessmentHistoryDialog
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        sessions={sessions}
        activeSessionId={activeSession?.id || null}
        onSelectSession={setSelectedSessionId}
        userDescription={`Select an assessment date and time for ${fullName} (${employee.email}) to inspect past evaluation results.`}
      />
      <AssessmentSubmissionHistory
        submissions={submissions}
        loading={submissionsLoading}
        hasNext={submissionHasNext}
        onLoadMore={loadMoreSubmissions}
        onSelect={selectSubmission}
        selected={selectedSubmission}
        detailLoading={submissionDetailLoading}
      />

      {/* Dialog for assigning department */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle>
              {employee.department ? "Change" : "Assign"} Department
            </DialogTitle>
            <DialogDescription>
              Select a department for {fullName} ({employee.email})
            </DialogDescription>
          </DialogHeader>
          {organizationId && (
            <AssignDepartmentForm
              organizationId={organizationId}
              employee={employee}
              onSuccess={handleAssignSuccess}
              compact
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog for managing roles */}
      <ManageRolesDialog
        open={manageRolesOpen}
        onOpenChange={setManageRolesOpen}
        employee={employee}
        organizationId={organizationId}
        isCurrentUserSuperadmin={isCurrentUserSuperadmin}
        isCurrentUserAdmin={isCurrentUserAdmin}
        onSuccess={handleRefresh}
      />
    </div>
  )
}
