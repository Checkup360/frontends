import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  createDepartment,
  deleteDepartment,
  getOrganizationDepartmentAnalytics,
  listDepartments,
  listDepartmentsPage,
  listOrganizationEmployees,
  type DepartmentAnalyticsSummary,
  type DepartmentResponse,
  type OrganizationEmployee,
} from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { Card } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { ActionButton } from "@workspace/components/components/action-button"
import {
  OverviewStatCard,
  OverviewStatCardSkeleton,
} from "@workspace/components/components/card"
import {
  formatEmployeeName,
  getInitials as getInitialsHelper,
} from "@workspace/components/components/employee-profile-card"
import { Input } from "@workspace/ui/components/input"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@workspace/ui/components/dropdown-menu"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarGroup,
  AvatarGroupCount,
} from "@workspace/ui/components/avatar"
import {
  AlertTriangle,
  ShieldCheck,
  Folder as FolderIcon,
  Plus,
  Search,
  AlertCircle,
  Pencil,
  Trash2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react"
import { DepartmentTrendsChart } from "@workspace/components/components/department-trends-chart"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

// ─── Types ────────────────────────────────────────────────────────────────────

interface DepartmentHealthInsight {
  id: string
  name: string
  slug: string
  total: number
  score: number | null
  risk: number | null
}

function scoreTone(score: number | null) {
  if (score === null) {
    return {
      label: "Pending",
      variant: "outline" as const,
      icon: null,
    }
  }
  if (score >= 80) {
    return {
      label: "Healthy",
      variant: "success-light" as const,
      icon: ShieldCheck,
    }
  }
  if (score >= 60) {
    return {
      label: "Monitor",
      variant: "warning-light" as const,
      icon: AlertCircle,
    }
  }
  return {
    label: "High risk",
    variant: "destructive" as const,
    icon: AlertTriangle,
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DepartmentsPage() {
  const { user } = useCurrentUser()
  const navigate = useNavigate()
  const organizationId = user?.membership?.organization_id ?? null

  const isMobile = useIsMobile()
  const PAGE_SIZE = isMobile ? 4 : 8

  // ── All departments (for KPIs + trends chart) ──
  const [allDepartments, setAllDepartments] = useState<DepartmentResponse[]>([])
  const [employees, setEmployees] = useState<OrganizationEmployee[]>([])
  const [deptAnalytics, setDeptAnalytics] = useState<
    DepartmentAnalyticsSummary[]
  >([])
  const [loadingMeta, setLoadingMeta] = useState(true)

  // ── Paginated grid ──
  const [departments, setDepartments] = useState<DepartmentResponse[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [loadingGrid, setLoadingGrid] = useState(true)
  const [error, setError] = useState("")

  // ── Filters & pagination ──
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // ── CRUD dialogs ──
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")

  const [deleteTarget, setDeleteTarget] = useState<DepartmentResponse | null>(
    null
  )
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  // ── Load all depts + employees + analytics once (for KPIs & trends) ──
  useEffect(() => {
    let active = true
    async function load() {
      if (!organizationId) {
        setAllDepartments([])
        setEmployees([])
        setDeptAnalytics([])
        setLoadingMeta(false)
        return
      }
      setLoadingMeta(true)
      const [depts, emps, analytics] = await Promise.all([
        listDepartments(organizationId),
        listOrganizationEmployees(organizationId, ["member"]),
        getOrganizationDepartmentAnalytics(organizationId),
      ])
      if (!active) return
      setAllDepartments(depts)
      setEmployees(emps)
      setDeptAnalytics(analytics || [])
      setLoadingMeta(false)
    }
    void load()
    return () => {
      active = false
    }
  }, [organizationId])

  // ── Load paginated grid (reacts to search + page) ──
  useEffect(() => {
    let active = true
    async function load() {
      if (!organizationId) {
        setDepartments([])
        setTotalItems(0)
        setLoadingGrid(false)
        return
      }
      setLoadingGrid(true)
      setError("")
      try {
        const data = await listDepartmentsPage(organizationId, {
          search: search.trim() || undefined,
          page: currentPage,
          pageSize: PAGE_SIZE,
        })
        if (!active) return
        setDepartments(data.items)
        setTotalItems(data.total)
      } catch {
        if (!active) return
        setError("Failed to load departments.")
      } finally {
        if (active) setLoadingGrid(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [organizationId, search, currentPage, PAGE_SIZE])

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))

  // ── Insights derived from real department analytics ──
  const insights = useMemo<DepartmentHealthInsight[]>(() => {
    return allDepartments.map((department) => {
      const summary = deptAnalytics.find(
        (a) => a.department_id === department.id
      )
      const members = employees.filter(
        (employee) => employee.department?.id === department.id
      )
      const score =
        typeof summary?.average_score === "number"
          ? Math.round(summary.average_score)
          : null
      return {
        id: department.id,
        name: department.name,
        slug: department.slug,
        total: summary?.total_workers ?? members.length,
        score,
        risk: score !== null ? 100 - score : null,
      }
    })
  }, [allDepartments, employees, deptAnalytics])

  const highestScoreDept = useMemo(() => {
    const scoredPool = insights.filter(
      (d): d is DepartmentHealthInsight & { score: number } => d.score !== null
    )
    if (scoredPool.length === 0) return null
    const activePool = scoredPool.filter((d) => d.total > 0)
    const pool = activePool.length > 0 ? activePool : scoredPool
    return [...pool].sort((a, b) => b.score - a.score)[0]
  }, [insights])

  const averageScore = useMemo(() => {
    const scored = insights.filter(
      (d): d is DepartmentHealthInsight & { score: number } => d.score !== null
    )
    if (scored.length === 0) return null
    return Math.round(
      scored.reduce((total, d) => total + d.score, 0) / scored.length
    )
  }, [insights])

  // ── Refresh helpers ──
  const refreshAll = async () => {
    if (!organizationId) return
    const [depts, emps, analytics] = await Promise.all([
      listDepartments(organizationId),
      listOrganizationEmployees(organizationId, ["member"]),
      getOrganizationDepartmentAnalytics(organizationId),
    ])
    setAllDepartments(depts)
    setEmployees(emps)
    setDeptAnalytics(analytics || [])
  }

  const refreshGrid = async () => {
    if (!organizationId) return
    const data = await listDepartmentsPage(organizationId, {
      search: search.trim() || undefined,
      page: currentPage,
      pageSize: PAGE_SIZE,
    })
    setDepartments(data.items)
    setTotalItems(data.total)
  }

  // ── CRUD handlers ──
  const handleCreateLocal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setCreateError("")
    if (!organizationId) {
      setCreateError("No organization found.")
      setCreating(false)
      return
    }
    const result = await createDepartment(organizationId, {
      name: newName.trim(),
    })
    setCreating(false)
    if (result.error) {
      setCreateError(
        result.error.code === "department_slug_already_exists"
          ? "A department with that name already exists."
          : result.error.message
      )
      return
    }
    setNewName("")
    setCreateOpen(false)
    await Promise.all([refreshAll(), refreshGrid()])
  }

  const handleDeleteLocal = async () => {
    if (!deleteTarget || !organizationId) return
    setDeleting(true)
    setDeleteError("")
    const result = await deleteDepartment(organizationId, deleteTarget.id)
    setDeleting(false)
    if ("error" in result) {
      setDeleteError(
        result.error.code === "department_in_use"
          ? `Cannot delete "${deleteTarget.name}" — it still has assigned employees.`
          : result.error.message
      )
      return
    }
    setDeleteTarget(null)
    // Go back a page if we just deleted the last item on this page
    if (departments.length === 1 && currentPage > 1) {
      setCurrentPage((p) => p - 1)
    } else {
      await Promise.all([refreshAll(), refreshGrid()])
    }
  }

  const makeSlugPreview = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

  const getInitials = (
    member:
      | string
      | {
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          name?: string | null
        }
  ) => {
    const fullName = formatEmployeeName(member)
    const email = typeof member === "string" ? member : member.email || ""
    return getInitialsHelper(fullName, email)
  }

  const loading = loadingMeta && loadingGrid

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* ── KPIs ── */}
      <section className="grid gap-3 md:grid-cols-3">
        {loading ? (
          <OverviewStatCardSkeleton />
        ) : (
          <OverviewStatCard
            icon={FolderIcon}
            iconVariant="icon"
            tone="primary"
            label="Total departments"
            value={allDepartments.length.toString()}
            hint={`${totalItems} visible after filters`}
          />
        )}
        {loading ? (
          <OverviewStatCardSkeleton />
        ) : (
          <OverviewStatCard
            icon={TrendingUp}
            iconVariant="icon"
            tone={highestScoreDept ? "success" : "primary"}
            label="Highest health score"
            value={highestScoreDept ? `${highestScoreDept.score}%` : "—"}
            hint={highestScoreDept?.name ?? "No evaluations recorded"}
          />
        )}
        {loading ? (
          <OverviewStatCardSkeleton />
        ) : (
          <OverviewStatCard
            icon={ShieldCheck}
            iconVariant="icon"
            tone={averageScore !== null ? "success" : "primary"}
            label="Average department score"
            value={averageScore !== null ? `${averageScore}%` : "—"}
            hint={averageScore !== null ? "Aggregated health index" : "No evaluations recorded"}
          />
        )}
      </section>

      {/* ── Grid card ── */}
      <div className="w-full">
        <Card className="flex flex-col rounded-3xl border-border/70 bg-card/80 p-5 shadow-sm">
          {/* Header */}
          <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                Departments
              </h3>
              <p className="text-sm text-muted-foreground">
                Search, create and maintain department ownership.
              </p>
            </div>
            <ActionButton
              type="button"
              variant="default"
              icon={Plus}
              onClick={() => {
                setNewName("")
                setCreateError("")
                setCreateOpen(true)
              }}
            >
              New department
            </ActionButton>
          </div>

          {/* Search bar */}
          <div className="relative mb-5 w-full sm:max-w-xs">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search departments..."
              className="pl-9"
            />
          </div>

          {/* Grid content */}
          {loadingGrid ? (
            <div className="grid grid-cols-1 content-start items-start gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refreshGrid()}
              >
                Retry
              </Button>
            </div>
          ) : departments.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-center">
              <FolderIcon className="size-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">
                No departments found
              </p>
              <p className="text-xs text-muted-foreground">
                {search
                  ? "Try adjusting your search query."
                  : "Get started by creating your first department."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 content-start items-start gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {departments.map((dept) => {
                const insight = insights.find((d) => d.id === dept.id)
                const tone = scoreTone(insight ? insight.score : null)
                const deptMembers = employees.filter(
                  (employee) => employee.department?.id === dept.id
                )

                return (
                  <div
                    key={dept.id}
                    data-slot="item"
                    className="group relative flex flex-col justify-between rounded-xl border border-border/70 bg-card/60 p-3.5 shadow-xs transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card/95 hover:shadow-md cursor-pointer"
                    onClick={() => navigate(`/departments/${dept.slug}`)}
                  >
                    {/* Header: Name + slug on left, risk/score badge + 3 dots on right */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4
                          data-slot="item-title"
                          className="text-sm font-semibold tracking-tight text-foreground line-clamp-1 transition-colors group-hover:text-primary"
                        >
                          {dept.name}
                        </h4>
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground truncate">
                          /{dept.slug}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge
                          variant={tone.variant}
                          size="xs"
                          className="gap-1 font-medium"
                        >
                          {tone.icon && (
                            <tone.icon className="size-3 shrink-0" />
                          )}
                          <span>{tone.label}</span>
                          {insight?.score !== null &&
                            insight?.score !== undefined && (
                              <span className="ml-0.5 font-semibold tabular-nums">
                                {insight.score}%
                              </span>
                            )}
                        </Badge>

                        <div onClick={(event) => event.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                className="size-6 rounded-md text-muted-foreground opacity-70 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
                              >
                                <MoreHorizontal className="size-3.5" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuItem
                                onClick={(event) => {
                                  event.stopPropagation()
                                  navigate(`/departments/${dept.slug}/edit`)
                                }}
                              >
                                <Pencil className="mr-2 size-3.5" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  setDeleteError("")
                                  setDeleteTarget(dept)
                                }}
                              >
                                <Trash2 className="mr-2 size-3.5" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>

                    {/* Footer: Member avatars + count + arrow */}
                    <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <AvatarGroup>
                          {deptMembers.slice(0, 3).map((member) => {
                            const initials = getInitials(member)
                            return (
                              <Avatar key={member.id} size="sm" className="size-6 text-[10px]">
                                {member.avatar_url && (
                                  <AvatarImage
                                    src={member.avatar_url}
                                    alt={member.email}
                                    className="object-cover"
                                  />
                                )}
                                <AvatarFallback className="text-[9px]">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                            )
                          })}
                          {deptMembers.length > 3 && (
                            <AvatarGroupCount className="size-6 text-[9px]">
                              +{deptMembers.length - 3}
                            </AvatarGroupCount>
                          )}
                        </AvatarGroup>
                        <span className="truncate text-xs font-medium text-muted-foreground">
                          {deptMembers.length === 0
                            ? "No members"
                            : `${deptMembers.length} ${
                                deptMembers.length === 1 ? "member" : "members"
                              }`}
                        </span>
                      </div>

                      <div className="flex shrink-0 items-center text-xs font-medium text-muted-foreground transition-colors group-hover:text-primary">
                        <ChevronRight className="size-4 -translate-x-0.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-4">
              <p className="text-sm text-muted-foreground">
                Page{" "}
                <span className="font-medium text-foreground">
                  {currentPage}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {totalPages}
                </span>
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1 || loadingGrid}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages || loadingGrid}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  aria-label="Next page"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ── Trends chart ── */}
      {!loadingMeta && allDepartments.length > 0 && (
        <DepartmentTrendsChart
          organizationId={organizationId || undefined}
          departments={allDepartments}
        />
      )}

      {/* ── Create dialog ── */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open && !creating) {
            setNewName("")
            setCreateError("")
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create department</DialogTitle>
            <DialogDescription>
              Add a new department to organize your team and manage risk.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateLocal} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="create-dept-name">Department name</Label>
              <Input
                id="create-dept-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Engineering, Sales, HR"
                autoFocus
                disabled={creating}
              />
              {newName.trim() && (
                <p className="font-mono text-xs text-muted-foreground">
                  Slug: /{makeSlugPreview(newName)}
                </p>
              )}
              {createError && (
                <p className="text-xs text-destructive">{createError}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating || !newName.trim()}>
                {creating ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete dialog ── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setDeleteTarget(null)
            setDeleteError("")
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.name}
              </span>
              ? This action cannot be undone. Departments with assigned employees
              cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-xs text-destructive">{deleteError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void handleDeleteLocal()
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
