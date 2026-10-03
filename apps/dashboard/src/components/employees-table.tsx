import {
  listOrganizationEmployeesPage,
  listDepartments,
  removeEmployee,
  createSuperadminRemovalRequest,
  type OrganizationEmployee,
  type OrganizationEmployeeRole,
  type DepartmentResponse,
} from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { Card } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { Label } from "@workspace/ui/components/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
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
import { TablePagination } from "@workspace/components/components/table-pagination"
import { formatEmployeeName } from "@workspace/components/components/employee-profile-card"
import { toast } from "@workspace/ui/components/sonner"
import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { X, MoreVertical, UserCog, UserMinus, ShieldAlert } from "lucide-react"

const statusClasses: Record<string, string> = {
  active:
    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 capitalize",
  onboarding:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 capitalize",
  inactive:
    "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border-zinc-500/20 capitalize",
}

const MEMBER_ROLES: OrganizationEmployeeRole[] = ["member"]

import { ManageRolesDialog } from "./manage-roles-dialog"
import { getRoleBadgeProps, formatRoleName, normalizeRoles } from "@/lib/role-utils"

function formatLastAssessment(value?: string | null): string {
  if (!value) return "Not assessed"
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value))
}

interface EmployeesTableProps {
  organizationId: string | null | undefined
  roles?: OrganizationEmployeeRole[]
  showRoleFilter?: boolean
  showRolesColumn?: boolean
  allowRoleManagement?: boolean
  onDataChanged?: () => void
  title?: string
  description?: string
  showScoreColumn?: boolean
}

export function EmployeesTable({
  organizationId,
  roles = MEMBER_ROLES,
  showRoleFilter = false,
  showRolesColumn = false,
  allowRoleManagement = false,
  onDataChanged,
  title = "Employees",
  description = "Individual data and status level",
  showScoreColumn = true,
}: EmployeesTableProps) {
  const navigate = useNavigate()
  const { user } = useCurrentUser()

  // State for raw data
  const [employees, setEmployees] = useState<OrganizationEmployee[]>([])
  const [departments, setDepartments] = useState<DepartmentResponse[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true) // true only on initial mount
  const [isFetching, setIsFetching] = useState(false) // true on filter/page re-fetches

  const isCurrentUserSuperadmin = useMemo(() => {
    if (user?.is_sysadmin) return true
    if (user?.membership?.roles?.includes("superadmin")) return true
    const me = employees.find((e) => e.email === user?.email)
    return me?.roles.includes("superadmin") ?? false
  }, [user, employees])

  const isCurrentUserAdmin = useMemo(() => {
    if (user?.is_sysadmin) return true
    if (user?.membership?.roles?.includes("admin")) return true
    const me = employees.find((e) => e.email === user?.email)
    return me?.roles.includes("admin") ?? false
  }, [user, employees])

  // Filters State
  const [search, setSearch] = useState("")
  const [selectedDept, setSelectedDept] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedRole, setSelectedRole] = useState("all")
  const [selectedScore, setSelectedScore] = useState("all")

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Action Modals State
  const [managingEmployee, setManagingEmployee] =
    useState<OrganizationEmployee | null>(null)
  const [manageRolesOpen, setManageRolesOpen] = useState(false)

  const [deactivatingEmployee, setDeactivatingEmployee] =
    useState<OrganizationEmployee | null>(null)
  const [deactivateOpen, setDeactivateOpen] = useState(false)

  const [quorumTargetEmployee, setQuorumTargetEmployee] =
    useState<OrganizationEmployee | null>(null)
  const [quorumReason, setQuorumReason] = useState("")
  const [quorumDialogOpen, setQuorumDialogOpen] = useState(false)

  const [actionLoading, setActionLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  // Tracks whether we've ever completed a fetch for the current org
  const isInitialLoad = useRef(true)

  // Load Departments and Employees
  useEffect(() => {
    let active = true

    async function loadData() {
      if (!organizationId) {
        setEmployees([])
        setDepartments([])
        setLoading(false)
        return
      }

      // First load ever: show full skeleton. Subsequent fetches: keep rows visible.
      if (isInitialLoad.current) {
        setLoading(true)
      } else {
        setIsFetching(true)
      }
      try {
        const depts = await listDepartments(organizationId)
        if (!active) return
        setDepartments(depts)

        const apiFilters: {
          departmentId?: string
          status?: string
          score?: string
          search?: string
          page: number
          pageSize: number
        } = { page: currentPage, pageSize }
        if (selectedDept !== "all") apiFilters.departmentId = selectedDept
        if (selectedStatus !== "all") apiFilters.status = selectedStatus
        if (selectedScore !== "all") apiFilters.score = selectedScore
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
        isInitialLoad.current = false
      } catch (err) {
        console.error("Failed to load employees:", err)
      } finally {
        if (active) {
          setLoading(false)
          setIsFetching(false)
        }
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
    selectedScore,
    search,
    currentPage,
    pageSize,
    refreshKey,
  ])

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  const hasActiveFilters =
    search !== "" ||
    selectedDept !== "all" ||
    selectedStatus !== "all" ||
    selectedRole !== "all" ||
    selectedScore !== "all"

  const handleResetFilters = () => {
    setSearch("")
    setSelectedDept("all")
    setSelectedStatus("all")
    setSelectedRole("all")
    setSelectedScore("all")
    setCurrentPage(1)
  }

  const handleOpenManageRoles = (emp: OrganizationEmployee) => {
    setManagingEmployee(emp)
    setManageRolesOpen(true)
  }

  const handleOpenDeactivate = (emp: OrganizationEmployee) => {
    setDeactivatingEmployee(emp)
    setDeactivateOpen(true)
  }

  const handleOpenQuorumRequest = (emp: OrganizationEmployee) => {
    if (!isCurrentUserSuperadmin) {
      toast.error("Only superadmins can initiate a quorum removal request.")
      return
    }
    setQuorumTargetEmployee(emp)
    setQuorumReason("")
    setQuorumDialogOpen(true)
  }

  const handleConfirmDeactivate = async () => {
    if (!organizationId || !deactivatingEmployee) return
    setActionLoading(true)
    try {
      const res = await removeEmployee(organizationId, deactivatingEmployee.id)
      if (res.error) {
        toast.error(res.error.message)
      } else {
        toast.success(
          "Employee deactivated. Historical medical data has been preserved."
        )
        setDeactivateOpen(false)
        setDeactivatingEmployee(null)
        setRefreshKey((k) => k + 1)
        onDataChanged?.()
      }
    } catch {
      toast.error("Failed to deactivate employee")
    } finally {
      setActionLoading(false)
    }
  }

  const handleSubmitQuorumRequest = async () => {
    if (!organizationId || !quorumTargetEmployee) return
    setActionLoading(true)
    try {
      const res = await createSuperadminRemovalRequest(
        organizationId,
        quorumTargetEmployee.id,
        quorumReason.trim() || undefined
      )
      if (res.error) {
        toast.error(res.error.message)
      } else {
        toast.success("Quorum removal request submitted successfully.")
        setQuorumDialogOpen(false)
        setQuorumTargetEmployee(null)
        setQuorumReason("")
        window.location.reload()
      }
    } catch {
      toast.error("Failed to submit quorum request")
    } finally {
      setActionLoading(false)
    }
  }

  const renderSkeletonColumns = [
    { skeletonClassName: "h-4 w-48" },
    ...(showRolesColumn ? [{ skeletonClassName: "h-4 w-12" }] : []),
    { skeletonClassName: "h-4 w-28" },
    ...(showScoreColumn ? [{ skeletonClassName: "h-4 w-10" }] : []),
    { skeletonClassName: "h-5 w-20 rounded-full" },
    { skeletonClassName: "h-4 w-24" },
    ...(showRolesColumn && allowRoleManagement
      ? [{ skeletonClassName: "h-8 w-8 ml-auto rounded-md" }]
      : []),
  ]

  const totalColSpan =
    4 +
    (showRolesColumn ? 1 : 0) +
    (showScoreColumn ? 1 : 0) +
    (showRolesColumn && allowRoleManagement ? 1 : 0)

  return (
    <Card className="animate-in border-border/60 p-6 shadow-[var(--shadow-card)] duration-300 fade-in">
      {/* Title & Desc */}
      <div className="mb-6 flex flex-col gap-1">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
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
                  <SelectItem value="superadmin">Superadmin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="content_manager">
                    Content Manager
                  </SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

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
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showScoreColumn && (
            <div className="w-[160px]">
              <Select
                value={selectedScore}
                onValueChange={(val) => {
                  setSelectedScore(val)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="All Scores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scores</SelectItem>
                  <SelectItem value="scored">With Score</SelectItem>
                  <SelectItem value="unscored">Without Score</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

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
              {showScoreColumn && (
                <TableHead className="font-semibold text-foreground">
                  Score
                </TableHead>
              )}
              <TableHead className="font-semibold text-foreground">
                Status
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                Last assessment
              </TableHead>
              {showRolesColumn && allowRoleManagement && (
                <TableHead className="w-16 text-right font-semibold text-foreground">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody
            className={
              isFetching
                ? "pointer-events-none opacity-50 transition-opacity"
                : "transition-opacity"
            }
          >
            {loading ? (
              <TableRowsSkeleton columns={renderSkeletonColumns} />
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={totalColSpan}
                  className="h-32 text-center text-muted-foreground"
                >
                  No employees found matching the active criteria.
                </TableCell>
              </TableRow>
            ) : (
              employees.map((w) => {
                const isTargetSuperadmin =
                  w.roles?.includes("superadmin") ?? false
                const isSelf = Boolean(user?.email && w.email === user.email)

                return (
                  <TableRow
                    key={w.id}
                    className="group cursor-pointer transition-colors hover:bg-muted/40"
                    onClick={() => navigate(`/employees/${w.id}`)}
                  >
                    <TableCell className="font-medium text-foreground transition-colors group-hover:text-primary">
                      <span className="block font-medium">
                        {formatEmployeeName(w)}
                      </span>
                      <span className="block text-xs font-normal text-muted-foreground">
                        {w.email}
                      </span>
                    </TableCell>
                    {showRolesColumn && (
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {w.roles && w.roles.length > 0 ? (
                            normalizeRoles(w.roles).map((role) => {
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
                    )}
                    <TableCell className="text-muted-foreground">
                      {w.department?.name ?? "Unassigned"}
                    </TableCell>
                    {showScoreColumn && (
                      <TableCell className="font-semibold text-foreground tabular-nums">
                        {typeof w.overall_health_index === "number"
                          ? `${Math.round(w.overall_health_index)}%`
                          : "—"}
                      </TableCell>
                    )}
                    <TableCell>
                      {w.status ? (
                        <Badge
                          variant="outline"
                          className={
                            statusClasses[w.status] || statusClasses.pending
                          }
                        >
                          {w.status}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatLastAssessment(w.last_assessment)}
                    </TableCell>
                    {showRolesColumn && allowRoleManagement && (
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                            >
                              <MoreVertical className="size-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem
                              onClick={() => handleOpenManageRoles(w)}
                            >
                              <UserCog className="mr-2 size-4" />
                              Manage Roles
                            </DropdownMenuItem>
                            {isTargetSuperadmin ? (
                              isCurrentUserSuperadmin &&
                              !isSelf && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleOpenQuorumRequest(w)}
                                  >
                                    <ShieldAlert className="mr-2 size-4 text-amber-600 dark:text-amber-400" />
                                    Request Removal (Quorum)
                                  </DropdownMenuItem>
                                </>
                              )
                            ) : (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => handleOpenDeactivate(w)}
                                >
                                  <UserMinus className="mr-2 size-4" />
                                  Deactivate Employee
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls — only show once we have data */}
      {!loading && totalItems > 0 && (
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
          loading={loading}
        />
      )}

      {/* ── Manage Roles Dialog ── */}
      <ManageRolesDialog
        open={manageRolesOpen}
        onOpenChange={setManageRolesOpen}
        employee={managingEmployee}
        organizationId={organizationId}
        isCurrentUserSuperadmin={isCurrentUserSuperadmin}
        isCurrentUserAdmin={isCurrentUserAdmin}
        onSuccess={() => {
          setRefreshKey((k) => k + 1)
          onDataChanged?.()
        }}
      />

      {/* ── Deactivate Employee Dialog ── */}
      <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {deactivatingEmployee?.roles?.includes("superadmin")
                ? "Superadmin Deactivation Protected"
                : "Deactivate Employee"}
            </DialogTitle>
            <DialogDescription>
              {deactivatingEmployee?.roles?.includes("superadmin") ? (
                "This user holds the Superadmin role. Platform governance requires an absolute majority quorum vote from all active Superadmins before a Superadmin can be removed."
              ) : (
                <>
                  Are you sure you want to deactivate{" "}
                  <span className="font-semibold text-foreground">
                    {deactivatingEmployee
                      ? formatEmployeeName(deactivatingEmployee) ||
                        deactivatingEmployee.email
                      : ""}
                  </span>
                  ? This will revoke active sessions and disable portal access.
                  Historical medical checkups and assessment records are legally
                  preserved and will NOT be deleted.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeactivateOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            {deactivatingEmployee?.roles?.includes("superadmin") ? (
              isCurrentUserSuperadmin ? (
                <Button
                  variant="default"
                  onClick={() => {
                    const emp = deactivatingEmployee
                    setDeactivateOpen(false)
                    if (emp) handleOpenQuorumRequest(emp)
                  }}
                >
                  Initiate Quorum Request
                </Button>
              ) : null
            ) : (
              <Button
                variant="destructive"
                onClick={handleConfirmDeactivate}
                disabled={actionLoading}
              >
                {actionLoading ? "Deactivating..." : "Confirm Deactivation"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Quorum Request Dialog ── */}
      {isCurrentUserSuperadmin && (
        <Dialog open={quorumDialogOpen} onOpenChange={setQuorumDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldAlert className="size-5 text-amber-600 dark:text-amber-400" />
                Request Superadmin Removal
              </DialogTitle>
              <DialogDescription>
                Initiates a formal multi-party Quorum voting process to remove{" "}
                <span className="font-semibold text-foreground">
                  {quorumTargetEmployee
                    ? formatEmployeeName(quorumTargetEmployee) ||
                      quorumTargetEmployee.email
                    : ""}
                </span>{" "}
                from the Superadmin role. You will automatically cast an
                approval vote as requester.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="quorum-reason">
                  Reason for removal (optional)
                </Label>
                <span className="text-xs text-muted-foreground">
                  {quorumReason.length}/500
                </span>
              </div>
              <textarea
                id="quorum-reason"
                placeholder="e.g. Employee leaving organization or role transition"
                value={quorumReason}
                onChange={(e) => setQuorumReason(e.target.value.slice(0, 500))}
                disabled={actionLoading}
                maxLength={500}
                rows={3}
                className="w-full min-w-0 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm break-all shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setQuorumDialogOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleSubmitQuorumRequest}
                disabled={actionLoading}
              >
                {actionLoading ? "Submitting..." : "Submit Quorum Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
}
