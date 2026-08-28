import {
  listOrganizationEmployeesPage,
  listDepartments,
  type OrganizationEmployee,
  type OrganizationEmployeeRole,
  type DepartmentResponse,
} from "@workspace/api"
import { Card } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
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
  TableRowsSkeleton,
  TableRow,
} from "@workspace/ui/components/table"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

const statusClasses: Record<string, string> = {
  active:
    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 capitalize",
  onboarding:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 capitalize",
}

const MEMBER_ROLES: OrganizationEmployeeRole[] = ["member"]

const employeeTableSkeletonColumns = [
  { skeletonClassName: "h-4 w-48" },
  { skeletonClassName: "h-4 w-28" },
  { skeletonClassName: "h-4 w-10" },
  { skeletonClassName: "h-5 w-20 rounded-full" },
  { skeletonClassName: "h-4 w-24" },
]

function getRoleBadgeVariant(
  role: string
): "info-light" | "warning-light" | "outline" | "secondary" {
  switch (role) {
    case "admin":
      return "info-light"
    case "content_manager":
      return "warning-light"
    case "member":
      return "outline"
    default:
      return "secondary"
  }
}

function formatRoleName(role: string) {
  switch (role) {
    case "admin":
      return "Admin"
    case "content_manager":
      return "Content Manager"
    case "member":
      return "Member"
    default:
      return role
  }
}

interface EmployeesTableProps {
  organizationId: string | null | undefined
  roles?: OrganizationEmployeeRole[]
  showRoleFilter?: boolean
  showRolesColumn?: boolean
  title?: string
  description?: string
}

export function EmployeesTable({
  organizationId,
  roles = MEMBER_ROLES,
  showRoleFilter = false,
  showRolesColumn = false,
  title = "Employees",
  description = "Individual data and status level",
}: EmployeesTableProps) {
  const navigate = useNavigate()

  // State for raw data
  const [employees, setEmployees] = useState<OrganizationEmployee[]>([])
  const [departments, setDepartments] = useState<DepartmentResponse[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)

  // Filters State
  const [search, setSearch] = useState("")
  const [selectedDept, setSelectedDept] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedRole, setSelectedRole] = useState("all")

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Load Departments and Employees (hitting backend filters dynamically!)
  useEffect(() => {
    let active = true

    async function loadData() {
      if (!organizationId) {
        setEmployees([])
        setDepartments([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        // Fetch departments for the department filter list
        const depts = await listDepartments(organizationId)
        if (!active) return
        setDepartments(depts)

        // Build backend query filter parameters
        const apiFilters: {
          departmentId?: string
          status?: string
          search?: string
          page: number
          pageSize: number
        } = { page: currentPage, pageSize }
        if (selectedDept !== "all") apiFilters.departmentId = selectedDept
        if (selectedStatus !== "all") apiFilters.status = selectedStatus
        if (search.trim()) apiFilters.search = search.trim()

        const effectiveRoles = showRoleFilter
          ? selectedRole !== "all"
            ? [selectedRole as OrganizationEmployeeRole]
            : undefined
          : roles

        const data = await listOrganizationEmployeesPage(
          organizationId,
          effectiveRoles,
          apiFilters
        )
        if (!active) return
        setEmployees(data.items)
        setTotalItems(data.total)
      } catch (err) {
        console.error("Failed to load employees:", err)
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadData()

    return () => {
      active = false
    }
  }, [
    organizationId,
    roles,
    showRoleFilter,
    selectedRole,
    selectedDept,
    selectedStatus,
    search,
    currentPage,
    pageSize,
  ])

  // Computed Pagination values
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  const hasActiveFilters =
    search !== "" ||
    selectedDept !== "all" ||
    selectedStatus !== "all" ||
    selectedRole !== "all"

  const handleResetFilters = () => {
    setSearch("")
    setSelectedDept("all")
    setSelectedStatus("all")
    setSelectedRole("all")
    setCurrentPage(1)
  }

  return (
    <Card className="animate-in border-border/60 p-6 shadow-[var(--shadow-card)] duration-300 fade-in">
      {/* Title & Desc */}
      <div className="mb-6 flex flex-col gap-1">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {/* Advanced Filter Toolbar (Radix Data Table style layout) */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="w-full sm:max-w-xs">
            <Input
              type="text"
              placeholder="Filter by email or area..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              className="h-9 w-full bg-background"
            />
          </div>

          {/* Role Select Dropdown (Optional) */}
          {showRoleFilter && (
            <div className="w-[160px]">
              <Select
                value={selectedRole}
                onValueChange={(val) => {
                  setSelectedRole(val)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="content_manager">
                    Content Manager
                  </SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Department Select Dropdown (Hitting endpoint dynamically!) */}
          <div className="w-[180px]">
            <Select
              value={selectedDept}
              onValueChange={(val) => {
                setSelectedDept(val)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="h-9 bg-background">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Select Dropdown (Fully active and hitting backend!) */}
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

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={handleResetFilters}
              className="h-9 gap-2 px-3 text-muted-foreground transition-colors hover:text-foreground"
            >
              Reset
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-semibold text-foreground">
                Employee
              </TableHead>
              {showRolesColumn && (
                <TableHead className="font-semibold text-foreground">
                  Roles
                </TableHead>
              )}
              <TableHead className="font-semibold text-foreground">
                Area
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRowsSkeleton columns={employeeTableSkeletonColumns} />
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showRolesColumn ? 6 : 5}
                  className="h-32 text-center text-muted-foreground"
                >
                  No employees found matching the active criteria.
                </TableCell>
              </TableRow>
            ) : (
              employees.map((w) => (
                <TableRow
                  key={w.id}
                  className="group cursor-pointer transition-colors hover:bg-muted/40"
                  onClick={() => navigate(`/employees/${w.id}`)}
                >
                  <TableCell className="font-medium text-foreground transition-colors group-hover:text-primary">
                    {w.email}
                  </TableCell>
                  {showRolesColumn && (
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {w.roles && w.roles.length > 0 ? (
                          w.roles.map((role) => (
                            <Badge
                              key={role}
                              variant={getRoleBadgeVariant(role)}
                              size="xs"
                            >
                              {formatRoleName(role)}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline" size="xs">
                            No roles
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="text-muted-foreground">
                    {w.department?.name ?? "Unassigned"}
                  </TableCell>
                  <TableCell className="font-semibold text-foreground tabular-nums">
                    N/A
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        statusClasses[w.status] || statusClasses.pending
                      }
                    >
                      {w.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    Not assessed
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Premium Pagination Controls */}
      <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
        {/* Count Indicator */}
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">
            {totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0}
          </span>{" "}
          to{" "}
          <span className="font-medium text-foreground">
            {Math.min(currentPage * pageSize, totalItems)}
          </span>{" "}
          of <span className="font-medium text-foreground">{totalItems}</span>{" "}
          members
        </p>

        {/* Controls */}
        <div className="flex items-center gap-6">
          {/* Rows per page selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Rows per page:
            </span>
            <Select
              value={pageSize.toString()}
              onValueChange={(val) => {
                setPageSize(Number(val))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="h-8 w-[70px] bg-background">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Page numbers */}
          <span className="text-sm text-muted-foreground">
            Page{" "}
            <span className="font-medium text-foreground">{currentPage}</span>{" "}
            of <span className="font-medium text-foreground">{totalPages}</span>
          </span>

          {/* Navigation Buttons */}
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="size-8 bg-background"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8 bg-background"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
