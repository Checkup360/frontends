import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  listDepartments,
  listOrganizationEmployeesPage,
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

  // ── Load department by slug ──
  useEffect(() => {
    let active = true
    async function load() {
      if (!organizationId || !slug) return
      setLoadingDept(true)
      setError("")
      const depts = await listDepartments(organizationId)
      if (!active) return
      const found = depts.find((d) => d.slug === slug)
      if (found) {
        setDepartment(found)
      } else {
        setError("Department not found.")
      }
      setLoadingDept(false)
    }
    void load()
    return () => { active = false }
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
    return () => { active = false }
  }, [organizationId, department, selectedStatus, search, currentPage, pageSize])

  // ── Derived stats ──
  const totalMembers = totalItems
  const onboardingCount = employees.filter(
    (e) => e.status.toLowerCase() === "onboarding"
  ).length
  const activeCount = employees.filter(
    (e) => e.status.toLowerCase() === "active"
  ).length
  const risk =
    totalMembers === 0
      ? 0
      : Math.round((onboardingCount / totalMembers) * 100)

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
            <span className="font-mono text-xs text-muted-foreground/60">
              /{department.slug}
            </span>
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
          icon={AlertTriangle}
          tone="warning"
          label="Onboarding"
          value={loadingTable ? "..." : onboardingCount.toString()}
          hint={loadingTable ? undefined : `${risk}% of members`}
        />
        <StatCard
          icon={ShieldCheck}
          tone={risk >= 50 ? "warning" : risk >= 25 ? "warning" : "success"}
          label="Risk level"
          value={loadingTable ? "..." : `${risk}%`}
          hint="Based on onboarding members"
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
          <div className="w-full sm:max-w-xs">
            <Input
              placeholder="Filter by email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              className="h-9 bg-background"
            />
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
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("")
                setSelectedStatus("all")
                setCurrentPage(1)
              }}
              className="h-9 gap-2 px-3 text-muted-foreground hover:text-foreground"
            >
              Reset
              <X className="size-4" />
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="font-semibold text-foreground">
                  Employee
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingTable ? (
                <TableRowsSkeleton columns={tableSkeletonColumns} />
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="h-32 text-center text-muted-foreground"
                  >
                    {hasFilters
                      ? "No employees match the active filters."
                      : "No employees in this department yet."}
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => (
                  <TableRow
                    key={emp.id}
                    className="group cursor-pointer transition-colors hover:bg-muted/40"
                    onClick={() => navigate(`/employees/${emp.id}`)}
                  >
                    <TableCell className="font-medium text-foreground transition-colors group-hover:text-primary">
                      {emp.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          statusClasses[emp.status] ?? "capitalize"
                        }
                      >
                        {emp.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0}
            </span>{" "}
            to{" "}
            <span className="font-medium text-foreground">
              {Math.min(currentPage * pageSize, totalItems)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">{totalItems}</span>{" "}
            members
          </p>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Page{" "}
              <span className="font-medium text-foreground">{currentPage}</span>{" "}
              of{" "}
              <span className="font-medium text-foreground">{totalPages}</span>
            </span>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="size-8 bg-background"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loadingTable}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8 bg-background"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages || loadingTable}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
