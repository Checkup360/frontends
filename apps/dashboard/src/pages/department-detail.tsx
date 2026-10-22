import { formatEnumLabel } from "@workspace/ui/lib/format-enum-label"
import { useEffect, useMemo, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  assignEmployeeDepartment,
  getOrganizationDepartmentAnalytics,
  getOrganizationRiskTrends,
  getOrganizationScoreWeights,
  listDepartments,
  listOrganizationEmployeesPage,
  type DepartmentAnalyticsSummary,
  type DepartmentResponse,
  type OrganizationEmployee,
  type RiskTrendPoint,
} from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import {
  Card,
  CardContent,
} from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableRowsSkeleton,
} from "@workspace/ui/components/table"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import {
  ArrowLeft,
  ArrowRightLeft,
  Users,
  AlertTriangle,
  ShieldCheck,
  Folder as FolderIcon,
  X,
  Pencil,
  UserPlus,
  Search,
  Check,
  ChevronRight,
} from "lucide-react"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { toast } from "@workspace/ui/components/sonner"
import {
  getDisplayName,
  getInitials,
} from "@workspace/components/components/employee-profile-card"
import { TablePagination } from "@workspace/components/components/table-pagination"
import {
  ScoreEvolutionChart,
  type ChartSeries,
} from "@workspace/components/components/score-evolution-chart"
import { buildTrendsTimelineWithForwardFill } from "@workspace/components/components/assessment-utils"
import { OverviewStatCard } from "@workspace/components/components/card"
import { getRoleBadgeProps, formatRoleName, normalizeRoles } from "@/lib/role-utils"
import { isScoreDeactivated } from "@/lib/score-topics"
import { cn } from "@workspace/ui/lib/utils"

// ─── Helpers & Configurations ──────────────────────────────────────────────────

const statusVariants: Record<
  string,
  "success-light" | "warning-light" | "info-light" | "secondary"
> = {
  active: "success-light",
  onboarding: "info-light",
  pending_assessments: "warning-light",
  inactive: "secondary",
  pending: "secondary",
}

function formatLastAssessment(value?: string | null): string {
  if (!value) return "Not assessed"
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value))
}

const tableSkeletonColumns = [
  { skeletonClassName: "h-4 w-44" },
  { skeletonClassName: "h-5 w-20 rounded-full" },
  { skeletonClassName: "h-4 w-12" },
  { skeletonClassName: "h-5 w-20 rounded-full" },
  { skeletonClassName: "h-4 w-28" },
  { skeletonClassName: "h-8 w-8 ml-auto" },
]

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

const DEFAULT_RISK_THRESHOLDS = {
  low: 80,
  moderate: 50,
} as const

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DepartmentDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
      <Skeleton className="h-96 rounded-3xl" />
      <Skeleton className="h-80 rounded-xl" />
    </div>
  )
}


// ─── Assign Member Modal (Isolated State & Search) ───────────────────────────

interface AssignMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  department: DepartmentResponse
  onAssigned: () => void
}

function AssignMemberDialog({
  open,
  onOpenChange,
  organizationId,
  department,
  onAssigned,
}: AssignMemberDialogProps) {
  const [employees, setEmployees] = useState<OrganizationEmployee[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleDialogChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSearchQuery("")
      setSelectedEmployeeId("")
      setError("")
      setEmployees([])
    }
    onOpenChange(newOpen)
  }

  // Backend search with debounce
  useEffect(() => {
    if (!open || !organizationId) return
    let active = true

    const timer = setTimeout(async () => {
      setLoading(true)
      setError("")
      try {
        const data = await listOrganizationEmployeesPage(
          organizationId,
          undefined,
          {
            search: searchQuery.trim() || undefined,
            page: 1,
            pageSize: 50,
          }
        )
        if (!active) return
        setEmployees(data.items)
      } catch {
        if (!active) return
        setError("Failed to load organization employees.")
      } finally {
        if (active) setLoading(false)
      }
    }, 200)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [open, organizationId, searchQuery])

  const selectedEmployee = useMemo(() => {
    return employees.find((e) => e.id === selectedEmployeeId) ?? null
  }, [employees, selectedEmployeeId])

  const isAlreadyInThisDept = selectedEmployee?.department?.id === department.id
  const isInAnotherDept =
    selectedEmployee?.department &&
    selectedEmployee.department.id !== department.id

  const handleAssign = async () => {
    if (!organizationId || !department || !selectedEmployee) return
    setError("")
    setSubmitting(true)
    try {
      const res = await assignEmployeeDepartment(
        organizationId,
        selectedEmployee.id,
        department.id
      )
      if (!res) {
        setError("Failed to assign department.")
        return
      }
      const displayName = getDisplayName(selectedEmployee)
      toast.success(`${displayName} assigned to ${department.name}`)
      handleDialogChange(false)
      onAssigned()
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "An error occurred while assigning the department."
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="flex flex-col rounded-3xl p-6 sm:h-[600px] sm:max-w-lg">
        <DialogHeader className="shrink-0 space-y-1">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <UserPlus className="size-5 text-primary" />
            Assign Member to {department.name}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Search by name, surname, or email to assign or switch a member to{" "}
            <strong className="text-foreground">{department.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden py-1">
          {error && (
            <div className="flex shrink-0 items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Search Input */}
          <div className="shrink-0 space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Search member
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.preventDefault()
                }}
                placeholder="Search by name, surname, email..."
                className="h-10 rounded-xl pl-9 text-sm"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          {/* Results List Container - Fixed flex-1 area */}
          <div className="flex min-h-0 flex-1 flex-col space-y-1">
            <div className="flex shrink-0 items-center justify-between px-1 text-xs text-muted-foreground">
              <span>
                {loading ? "Searching..." : `Results (${employees.length})`}
              </span>
              {selectedEmployee && (
                <span className="font-medium text-primary">1 selected</span>
              )}
            </div>

            <div className="flex-1 space-y-1.5 overflow-y-auto rounded-2xl border border-border/60 bg-muted/10 p-2">
              {loading && employees.length === 0 ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border bg-card p-3"
                  >
                    <Skeleton className="size-9 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))
              ) : employees.length === 0 ? (
                <div className="flex h-full min-h-[140px] items-center justify-center p-4 text-center text-xs text-muted-foreground">
                  {searchQuery
                    ? "No members match your search query."
                    : "No members found."}
                </div>
              ) : (
                employees.map((emp) => {
                  const fullName = getDisplayName(emp)
                  const initials = getInitials(fullName, emp.email)
                  const isSelected = emp.id === selectedEmployeeId
                  const isThisDept = emp.department?.id === department.id

                  return (
                    <div
                      key={emp.id}
                      onClick={() => {
                        setSelectedEmployeeId(emp.id)
                        setError("")
                      }}
                      className={cn(
                        "flex cursor-pointer items-center justify-between rounded-xl border p-2.5 text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                          : "border-border/50 bg-card hover:border-border hover:bg-muted/50"
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Avatar className="size-8.5 shrink-0 ring-1 ring-primary/15">
                          <AvatarImage src="" alt={fullName} />
                          <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-xs font-semibold text-foreground">
                            {fullName}
                          </span>
                          <span className="truncate text-[11px] text-muted-foreground">
                            {emp.email}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {isThisDept ? (
                          <Badge
                            variant="outline"
                            className="border-border/80 text-[10px] text-muted-foreground"
                          >
                            Current dept
                          </Badge>
                        ) : emp.department ? (
                          <Badge
                            variant="warning-light"
                            size="xs"
                          >
                            {emp.department.name}
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-[10px] text-muted-foreground"
                          >
                            Unassigned
                          </Badge>
                        )}
                        {isSelected && (
                          <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="size-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Department Status & Switch Notice (Fixed container height) */}
          <div className="flex h-16 shrink-0 items-center">
            {selectedEmployee ? (
              <div className="w-full rounded-xl border bg-muted/20 p-2.5 text-xs">
                {isAlreadyInThisDept && (
                  <div className="text-muted-foreground">
                    <strong>{getDisplayName(selectedEmployee)}</strong> is
                    already in <strong>{department.name}</strong>.
                  </div>
                )}

                {isInAnotherDept && (
                  <div className="flex items-center gap-2 text-warning">
                    <ArrowRightLeft className="size-4 shrink-0 text-warning" />
                    <span>
                      Currently in{" "}
                      <strong>{selectedEmployee.department?.name}</strong>. Will{" "}
                      <strong>switch</strong> to{" "}
                      <strong>{department.name}</strong>.
                    </span>
                  </div>
                )}

                {!selectedEmployee.department && (
                  <div className="flex items-center gap-2 text-foreground">
                    <UserPlus className="size-4 shrink-0 text-primary" />
                    <span>
                      Currently unassigned. Will assign to{" "}
                      <strong>{department.name}</strong>.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full rounded-xl border border-dashed border-border/60 p-2.5 text-center text-xs text-muted-foreground">
                Select an employee from the list above to proceed.
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 pt-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAssign}
            disabled={!selectedEmployee || isAlreadyInThisDept || submitting}
            className="cursor-pointer gap-2"
          >
            {submitting ? (
              <>
                <div className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Assigning...
              </>
            ) : isInAnotherDept ? (
              <>
                <ArrowRightLeft className="size-4" />
                Switch to {department.name}
              </>
            ) : (
              <>
                <UserPlus className="size-4" />
                Assign to {department.name}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function DepartmentDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user } = useCurrentUser()
  const organizationId = user?.membership?.organization_id

  const [department, setDepartment] = useState<DepartmentResponse | null>(null)
  const [deptAnalytics, setDeptAnalytics] =
    useState<DepartmentAnalyticsSummary | null>(null)
  const [trends, setTrends] = useState<RiskTrendPoint[]>([])
  const [scoreWeights, setScoreWeights] = useState<Record<string, number> | null>(
    null
  )
  const [riskThresholds, setRiskThresholds] = useState<{
    low: number
    moderate: number
  }>(DEFAULT_RISK_THRESHOLDS)
  const [loadingDept, setLoadingDept] = useState(true)
  const [loadingTrends, setLoadingTrends] = useState(true)
  const [error, setError] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)

  // Table state
  const [employees, setEmployees] = useState<OrganizationEmployee[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [loadingTable, setLoadingTable] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedScore, setSelectedScore] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Add/Assign employee modal open state
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)

  // ── Load department by slug + analytics & trends ──
  useEffect(() => {
    let active = true
    async function load() {
      if (!organizationId || !slug) return
      setLoadingDept(true)
      setLoadingTrends(true)
      setError("")
      try {
        const [depts, analytics, weights] = await Promise.all([
          listDepartments(organizationId),
          getOrganizationDepartmentAnalytics(organizationId),
          getOrganizationScoreWeights(organizationId).catch(() => null),
        ])
        if (!active) return
        if (weights?.score_weights) {
          setScoreWeights(weights.score_weights)
        }
        if (weights?.risk_thresholds) {
          setRiskThresholds({
            low:
              typeof weights.risk_thresholds.low === "number"
                ? weights.risk_thresholds.low
                : DEFAULT_RISK_THRESHOLDS.low,
            moderate:
              typeof weights.risk_thresholds.moderate === "number"
                ? weights.risk_thresholds.moderate
                : DEFAULT_RISK_THRESHOLDS.moderate,
          })
        }
        const found = depts.find((d) => d.slug === slug)
        if (found) {
          setDepartment(found)
          const summary =
            analytics.find((a) => a.department_id === found.id) ?? null
          setDeptAnalytics(summary)

          // Load historical risk trends with per-study breakdown for this department
          const trendData = await getOrganizationRiskTrends(
            organizationId,
            12,
            found.id
          )
          if (active) {
            setTrends(trendData || [])
          }
        } else {
          setError("Department not found.")
        }
      } catch {
        if (!active) return
        setError("Failed to load department.")
      } finally {
        if (active) {
          setLoadingDept(false)
          setLoadingTrends(false)
        }
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [organizationId, slug, refreshKey])

  // ── Load employees for this department (paginated) ──
  useEffect(() => {
    let active = true
    async function load() {
      if (!organizationId || !department) return
      setLoadingTable(true)
      const data = await listOrganizationEmployeesPage(
        organizationId,
        ["member"],
        {
          departmentId: department.id,
          status: selectedStatus !== "all" ? selectedStatus : undefined,
          score: selectedScore !== "all" ? selectedScore : undefined,
          search: search.trim() || undefined,
          page: currentPage,
          pageSize,
        }
      )
      if (!active) return
      setEmployees(data.items)
      setTotalItems(data.total)
      setLoadingTable(false)
    }
    void load()
    return () => {
      active = false
    }
  }, [
    organizationId,
    department,
    selectedStatus,
    selectedScore,
    search,
    currentPage,
    pageSize,
    refreshKey,
  ])

  // ── Derived stats from real analytics ──
  const totalMembers = totalItems
  const activeCount = employees.filter(
    (e) => e.status?.toLowerCase() === "active"
  ).length

  const healthScore =
    typeof deptAnalytics?.average_score === "number"
      ? Math.round(deptAnalytics.average_score)
      : null
  const highRiskWorkers = deptAnalytics ? deptAnalytics.high_risk_count : 0

  // Forward-fill monthly timeline from first evaluation to today
  const filledTrends = useMemo(() => {
    return buildTrendsTimelineWithForwardFill(trends)
  }, [trends])

  // Discover all available studies from backend trends that are enabled for the organization
  const availableStudies = useMemo<ChartSeries[]>(() => {
    const list: ChartSeries[] = [OVERALL_SERIES_CONFIG]
    const foundKeys = new Set<string>()

    trends.forEach((pt) => {
      if (pt.scores_by_study) {
        Object.keys(pt.scores_by_study).forEach((studyName) => {
          const trimmed = studyName.trim()
          if (!trimmed) return
          if (!isScoreDeactivated(trimmed, scoreWeights)) {
            foundKeys.add(trimmed)
          }
        })
      }
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
  }, [trends, scoreWeights])

  // Chart data: forward-filled rows, only including enabled studies
  const chartData = useMemo(() => {
    return filledTrends.map((t) => {
      const row: Record<string, string | number | boolean | null | undefined> = {
        month: t.month,
        period: t.period,
        overall:
          typeof t.average_score === "number"
            ? Math.round(t.average_score)
            : null,
        _isCarried: t._isCarried,
      }
      if (t.scores_by_study) {
        Object.entries(t.scores_by_study).forEach(([k, v]) => {
          if (!isScoreDeactivated(k, scoreWeights)) {
            row[k] = Math.round(v)
          }
        })
      }
      return row
    })
  }, [filledTrends, scoreWeights])

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const hasFilters =
    search !== "" || selectedStatus !== "all" || selectedScore !== "all"

  // ── States ──
  if (loadingDept) return <DepartmentDetailSkeleton />

  if (error || !department) {
    return (
      <Card className="mx-auto mt-12 max-w-md border-destructive/20 bg-destructive/5">
        <CardContent className="space-y-4 pt-6 text-center">
          <p className="font-medium text-destructive">
            {error || "Department not found."}
          </p>
          <Button
            onClick={() => navigate("/departments")}
            variant="link"
            className="cursor-pointer text-sm font-semibold text-primary hover:underline"
          >
            Back to departments
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl animate-in space-y-6 duration-300 fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/departments")}
            className="size-9 cursor-pointer rounded-lg border border-border/40 hover:bg-muted/50"
            aria-label="Back to departments"
          >
            <ArrowLeft className="size-4 text-muted-foreground" />
          </Button>
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Departments
            </span>
            <div className="flex items-center gap-2">
              <FolderIcon className="size-4 text-muted-foreground" />
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {department.name}
              </h2>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/departments/${department.slug}/edit`)}
            className="cursor-pointer gap-2"
          >
            <Pencil className="size-3.5" />
            Edit department
          </Button>
        </div>
      </div>

      {/* KPI summary cards */}
      <section className="grid gap-4 md:grid-cols-3">
        <OverviewStatCard
          icon={Users}
          iconVariant="icon"
          tone="primary"
          label="Total members"
          value={loadingTable ? "..." : totalMembers.toString()}
          hint={loadingTable ? undefined : `${activeCount} active`}
        />
        <OverviewStatCard
          icon={ShieldCheck}
          iconVariant="icon"
          tone={
            healthScore === null
              ? "primary"
              : healthScore >= riskThresholds.low
                ? "success"
                : "warning"
          }
          label="Health score"
          value={
            loadingDept ? "..." : healthScore !== null ? `${healthScore}%` : "—"
          }
          hint={
            healthScore !== null
              ? "Aggregated health index"
              : "No evaluations recorded"
          }
        />
        <OverviewStatCard
          icon={AlertTriangle}
          iconVariant="icon"
          tone={highRiskWorkers > 0 ? "warning" : "success"}
          label="High risk cases"
          value={loadingDept ? "..." : highRiskWorkers.toString()}
          hint={
            highRiskWorkers === 1
              ? "1 member at risk"
              : `${highRiskWorkers} members at risk`
          }
        />
      </section>

      {/* ── Clinical Studies & Health Score Evolution Chart (Reusable Component) ── */}
      <ScoreEvolutionChart
        title="Clinical Studies & Health Score Evolution"
        description="Select any clinical study to visualize and compare its monthly score variation (0–100%, higher is healthier)"
        data={chartData}
        series={availableStudies}
        showPercentages={true}
        loading={loadingTrends}
        emptyTitle="No evaluation trends yet"
        emptyMessage={`Historical scores for each clinical study will appear here as members of ${department.name} complete health assessments.`}
        height={280}
      />

      {/* Members table */}
      <Card className="animate-in border-border/60 p-6 shadow-[var(--shadow-card)] duration-300 fade-in">
        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Members
            </h3>
            <p className="text-sm text-muted-foreground">
              All members assigned to {department.name}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddMemberOpen(true)}
            className="mt-2 cursor-pointer gap-1.5 self-start text-xs sm:mt-0 sm:self-auto"
          >
            <UserPlus className="size-3.5" />
            Assign member
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search by name or email..."
              className="h-9 pr-8 text-sm"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("")
                  setCurrentPage(1)
                }}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div className="w-[150px]">
            <Select
              value={selectedStatus}
              onValueChange={(val) => {
                setSelectedStatus(val)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="h-9 bg-background">
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-[150px]">
            <Select
              value={selectedScore}
              onValueChange={(val) => {
                setSelectedScore(val)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="h-9 bg-background">
                <SelectValue placeholder="All scores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All scores</SelectItem>
                <SelectItem value="scored">With score</SelectItem>
                <SelectItem value="unscored">Without score</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("")
                setSelectedStatus("all")
                setSelectedScore("all")
                setCurrentPage(1)
              }}
              className="h-9 cursor-pointer text-xs text-muted-foreground hover:text-foreground"
            >
              Reset
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-border/60 bg-card">
          <Table className="min-w-[700px]">
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="font-semibold text-foreground">
                  Employee
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  Roles
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  Score
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  Status
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  Last assessment
                </TableHead>
                <TableHead className="w-16 text-right font-semibold text-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingTable ? (
                <TableRowsSkeleton
                  rows={pageSize}
                  columns={tableSkeletonColumns}
                />
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-12 text-center text-muted-foreground"
                  >
                    {hasFilters
                      ? "No members match the current filters."
                      : "No members assigned to this department yet."}
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => {
                  const displayName = getDisplayName(emp)
                  return (
                    <TableRow
                      key={emp.id}
                      className="group cursor-pointer transition-colors hover:bg-muted/40"
                      onClick={() => navigate(`/employees/${emp.id}`)}
                    >
                      <TableCell className="font-medium text-foreground transition-colors group-hover:text-primary">
                        <span className="block font-medium">
                          {displayName}
                        </span>
                        <span className="block text-xs font-normal text-muted-foreground">
                          {emp.email}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {emp.roles && emp.roles.length > 0 ? (
                            normalizeRoles(emp.roles).map((role) => {
                              const badgeProps = getRoleBadgeProps(role)
                              return (
                                <Badge
                                  key={role}
                                  variant={badgeProps.variant}
                                  className={badgeProps.className}
                                  size="xs"
                                >
                                  {formatRoleName(role)}
                                </Badge>
                              )
                            })
                          ) : (
                            <Badge variant="outline" size="xs">
                              No roles
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-foreground tabular-nums">
                        {typeof emp.overall_health_index === "number"
                          ? `${Math.round(emp.overall_health_index)}%`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {emp.status ? (
                          <Badge
                            variant={
                              statusVariants[emp.status.toLowerCase()] ??
                              "secondary"
                            }
                            size="xs"
                          >
                            {formatEnumLabel(emp.status)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatLastAssessment(emp.last_assessment)}
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/employees/${emp.id}`)}
                          className="size-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                          title="View employee profile"
                          aria-label="View employee profile"
                        >
                          <ChevronRight className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Reusable Table Pagination */}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize)
            setCurrentPage(1)
          }}
          itemLabel="members"
          loading={loadingTable}
          className="border-t border-border/40 pt-4"
        />
      </Card>

      {/* ── Dialog: Isolated Search & Assign Component ── */}
      {department && organizationId && (
        <AssignMemberDialog
          open={isAddMemberOpen}
          onOpenChange={setIsAddMemberOpen}
          organizationId={organizationId}
          department={department}
          onAssigned={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  )
}
