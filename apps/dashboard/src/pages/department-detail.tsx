import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  getOrganizationDepartmentAnalytics,
  listDepartments,
  listOrganizationEmployeesPage,
  type DepartmentAnalyticsSummary,
  type DepartmentResponse,
  type OrganizationEmployee,
} from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableRowsSkeleton,
} from "@workspace/ui/components/table"
import {
  ArrowLeft,
  Users,
  AlertTriangle,
  ShieldCheck,
  Folder as FolderIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react"
import { Input } from "@workspace/ui/components/input"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusClasses: Record<string, string> = {
  active:
    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 capitalize",
  onboarding:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 capitalize",
}

const tableSkeletonColumns = [
  { skeletonClassName: "h-4 w-48" },
  { skeletonClassName: "h-5 w-20 rounded-full" },
  { skeletonClassName: "h-4 w-24" },
]

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
      <Skeleton className="h-80 rounded-xl" />
    </div>
  )
}

// ─── Stat mini-card ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  hint?: string
  icon: React.ElementType
  tone: "primary" | "warning" | "success"
}) {
  const iconClass = {
    primary: "bg-primary/15 text-primary",
    warning: "bg-[color:var(--warning)]/15 text-[color:var(--warning)]",
    success: "bg-[color:var(--success)]/15 text-[color:var(--success)]",
  }[tone]

  return (
    <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">
          {value}
        </CardTitle>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
          <Badge variant="outline" className={iconClass}>
            <Icon className="size-4" />
          </Badge>
        </div>
      </CardHeader>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DepartmentDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user } = useCurrentUser()
  const organizationId = user?.membership?.organization_id

  const [department, setDepartment] = useState<DepartmentResponse | null>(null)
  const [deptAnalytics, setDeptAnalytics] =
    useState<DepartmentAnalyticsSummary | null>(null)
  const [loadingDept, setLoadingDept] = useState(true)
  const [error, setError] = useState("")

  // Table state
  const [employees, setEmployees] = useState<OrganizationEmployee[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [loadingTable, setLoadingTable] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)

  // ── Load department by slug + real analytics ──
  useEffect(() => {
    let active = true
    async function load() {
      if (!organizationId || !slug) return
      setLoadingDept(true)
      setError("")
      try {
        const [depts, analytics] = await Promise.all([
          listDepartments(organizationId),
          getOrganizationDepartmentAnalytics(organizationId),
        ])
        if (!active) return
        const found = depts.find((d) => d.slug === slug)
        if (found) {
          setDepartment(found)
          const summary =
            analytics.find((a) => a.department_id === found.id) ?? null
          setDeptAnalytics(summary)
        } else {
          setError("Department not found.")
        }
      } catch {
        if (!active) return
        setError("Failed to load department.")
      } finally {
        if (active) setLoadingDept(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [organizationId, slug])

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
  }, [organizationId, department, selectedStatus, search, currentPage, pageSize])

  // ── Derived stats from real analytics ──
  const totalMembers = totalItems
  const activeCount = employees.filter(
    (e) => e.status.toLowerCase() === "active"
  ).length

  const healthScore = deptAnalytics
    ? Math.round(deptAnalytics.average_score)
    : 100
  const highRiskWorkers = deptAnalytics ? deptAnalytics.high_risk_count : 0

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const hasFilters = search !== "" || selectedStatus !== "all"

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
            className="text-sm font-semibold text-primary hover:underline"
          >
            Back to departments
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/departments")}
          className="size-9 rounded-lg border border-border/40 hover:bg-muted/50"
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
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              {department.name}
            </h2>
            <Badge variant="outline" className="font-mono text-xs">
              /{department.slug}
            </Badge>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <section className="grid gap-3 md:grid-cols-3">
        <StatCard
          icon={Users}
          tone="primary"
          label="Total members"
          value={loadingTable ? "..." : totalMembers.toString()}
          hint={loadingTable ? undefined : `${activeCount} active`}
        />
        <StatCard
          icon={ShieldCheck}
          tone={healthScore >= 80 ? "success" : "warning"}
          label="Health score"
          value={loadingDept ? "..." : `${healthScore}%`}
          hint="Aggregated health index"
        />
        <StatCard
          icon={AlertTriangle}
          tone={highRiskWorkers > 0 ? "warning" : "success"}
          label="High risk cases"
          value={loadingDept ? "..." : highRiskWorkers.toString()}
          hint={
            highRiskWorkers === 1
              ? "1 employee in risk"
              : `${highRiskWorkers} employees in risk`
          }
        />
      </section>

      {/* Employees table */}
      <Card className="animate-in border-border/60 p-6 shadow-[var(--shadow-card)] duration-300 fade-in">
        <div className="mb-6 flex flex-col gap-1">
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            Members
          </h3>
          <p className="text-sm text-muted-foreground">
            All employees assigned to {department.name}
          </p>
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
              placeholder="Search by email, role..."
              className="h-9 pr-8 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <Select
            value={selectedStatus}
            onValueChange={(val) => {
              setSelectedStatus(val)
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="h-9 w-full sm:w-[150px]">
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="onboarding">Onboarding</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("")
                setSelectedStatus("all")
                setCurrentPage(1)
              }}
              className="h-9 text-xs text-muted-foreground"
            >
              Reset
            </Button>
          )}
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Role</TableHead>
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
                  colSpan={3}
                  className="py-12 text-center text-muted-foreground"
                >
                  {hasFilters
                    ? "No members match the current filters."
                    : "No members assigned to this department yet."}
                </TableCell>
              </TableRow>
            ) : (
              employees.map((emp) => (
                <TableRow
                  key={emp.id}
                  className="cursor-pointer transition-colors hover:bg-muted/40"
                  onClick={() => navigate(`/employees/${emp.id}`)}
                >
                  <TableCell>
                    <span className="font-medium text-foreground">
                      {emp.email}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        statusClasses[emp.status.toLowerCase()] ?? "capitalize"
                      }
                    >
                      {emp.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                    {emp.roles.join(", ") || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages} ({totalItems} members)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loadingTable}
                className="gap-1"
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages || loadingTable}
                className="gap-1"
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
