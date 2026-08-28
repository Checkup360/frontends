import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  listDepartmentsPage,
  listOrganizationEmployees,
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
  AvatarGroup,
  AvatarGroupCount,
} from "@workspace/ui/components/avatar"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemFooter,
  ItemHeader,
  ItemTitle,
} from "@workspace/ui/components/item"
import { Progress } from "@workspace/ui/components/progress"
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
} from "lucide-react"
import { DepartmentTrendsChart } from "@workspace/components/components/department-trends-chart"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

// ─── Types ────────────────────────────────────────────────────────────────────

interface DepartmentRiskInsight {
  id: string
  name: string
  slug: string
  total: number
  onboarding: number
  risk: number
}

function riskTone(risk: number) {
  if (risk >= 50) {
    return {
      label: "High risk",
      variant: "destructive" as const,
      icon: AlertTriangle,
    }
  }
  if (risk >= 25) {
    return {
      label: "Monitor",
      variant: "warning-light" as const,
      icon: AlertCircle,
    }
  }
  return {
    label: "Healthy",
    variant: "success-light" as const,
    icon: ShieldCheck,
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DepartmentsPage() {
  const { user } = useCurrentUser()
  const navigate = useNavigate()
  const organizationId = user?.membership?.organization_id ?? null

  const isMobile = useIsMobile()
  const PAGE_SIZE = isMobile ? 3 : 6

  // ── All departments (for KPIs + trends chart) ──
  const [allDepartments, setAllDepartments] = useState<DepartmentResponse[]>([])
  const [employees, setEmployees] = useState<OrganizationEmployee[]>([])
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

  // ── Load all depts + employees once (for KPIs & trends) ──
  useEffect(() => {
    let active = true
    async function load() {
      if (!organizationId) {
        setAllDepartments([])
        setEmployees([])
        setLoadingMeta(false)
        return
      }
      setLoadingMeta(true)
      const [depts, emps] = await Promise.all([
        listDepartments(organizationId),
        listOrganizationEmployees(organizationId, ["member"]),
      ])
      if (!active) return
      setAllDepartments(depts)
      setEmployees(emps)
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
        if (active) setError("Failed to load departments.")
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

  // ── Insights derived from ALL departments ──
  const insights = useMemo<DepartmentRiskInsight[]>(() => {
    return allDepartments.map((department) => {
      const members = employees.filter(
        (employee) => employee.department?.id === department.id
      )
      const onboarding = members.filter(
        (employee) => employee.status.toLowerCase() === "onboarding"
      ).length
      return {
        id: department.id,
        name: department.name,
        slug: department.slug,
        total: members.length,
        onboarding,
        risk:
          members.length === 0
            ? 0
            : Math.round((onboarding / members.length) * 100),
      }
    })
  }, [allDepartments, employees])

  const highestRisk = useMemo(() => {
    return insights
      .filter((d) => d.total > 0)
      .sort((a, b) => b.risk - a.risk)[0]
  }, [insights])

  const averageRisk =
    insights.length === 0
      ? 0
      : Math.round(
          insights.reduce((total, d) => total + d.risk, 0) / insights.length
        )

  // ── Refresh helpers ──
  const refreshAll = async () => {
    if (!organizationId) return
    const [depts, emps] = await Promise.all([
      listDepartments(organizationId),
      listOrganizationEmployees(organizationId, ["member"]),
    ])
    setAllDepartments(depts)
    setEmployees(emps)
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

  const getInitials = (email: string) =>
    email.split("@")[0]?.slice(0, 2).toUpperCase() || "??"

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
            icon={AlertTriangle}
            iconVariant="icon"
            tone="warning"
            label="Highest onboarding risk"
            value={highestRisk ? `${highestRisk.risk}%` : "0%"}
            hint={highestRisk?.name ?? "No members assigned"}
          />
        )}
        {loading ? (
          <OverviewStatCardSkeleton />
        ) : (
          <OverviewStatCard
            icon={ShieldCheck}
            iconVariant="icon"
            tone="success"
            label="Average department risk"
            value={`${averageRisk}%`}
            hint="Based on onboarding members"
          />
        )}
      </section>

      {/* ── Grid card ── */}
      <div className="w-full">
        <Card className="flex h-full min-h-[400px] flex-col rounded-3xl border-border/70 bg-card/80 p-5 shadow-sm">
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
              size="sm"
              className="self-start"
              icon={Plus}
              onClick={() => setCreateOpen(true)}
            >
              New department
            </ActionButton>
          </div>

          {/* Search + total */}
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative sm:max-w-xs sm:flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Search departments..."
                className="h-9 rounded-full border-transparent bg-muted/60 pl-9 shadow-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="h-8 rounded-full border-border/70 px-3 text-muted-foreground"
              >
                {loadingGrid ? "..." : totalItems} total
              </Badge>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Grid */}
          {loadingGrid ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <Skeleton key={index} className="h-44 rounded-2xl" />
              ))}
            </div>
          ) : totalItems === 0 && !error ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/80 bg-muted/20 py-10 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-foreground">
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-muted">
                <FolderIcon className="size-5" />
              </span>
              <span className="text-sm font-medium">
                {search
                  ? "No departments match your search."
                  : "No departments yet. Use the button above to create one."}
              </span>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {departments.map((dept) => {
                const insight = insights.find((item) => item.id === dept.id)
                const tone = riskTone(insight?.risk ?? 0)
                const deptMembers = employees.filter(
                  (employee) => employee.department?.id === dept.id
                )

                return (
                  <Item
                    key={dept.id}
                    variant="outline"
                    className="group cursor-pointer rounded-2xl border-border/85 bg-card/45 shadow-xs transition-all duration-200 ease-out hover:border-primary/40 hover:bg-muted/20"
                    onClick={() => navigate(`/departments/${dept.slug}`)}
                  >
                    <ItemHeader>
                      <div className="flex items-center gap-2">
                        <FolderIcon
                          className="size-3.5 text-muted-foreground transition-all duration-300 group-hover:scale-110 group-hover:text-primary"
                          aria-hidden="true"
                        />
                        <span className="font-mono text-xs text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
                          /{dept.slug}
                        </span>
                      </div>
                      <Badge variant={tone.variant} size="xs" className="gap-1">
                        {tone.icon && <tone.icon className="shrink-0" />}
                        {tone.label}
                      </Badge>
                    </ItemHeader>

                    <ItemContent>
                      <ItemTitle className="text-base font-semibold text-foreground">
                        {dept.name}
                      </ItemTitle>
                    </ItemContent>

                    <ItemActions onClick={(event) => event.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="h-8 w-8 rounded-lg"
                          >
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
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
                    </ItemActions>

                    <ItemFooter className="mt-1 border-t border-border/40 pt-2">
                      <AvatarGroup>
                        {deptMembers.slice(0, 3).map((member) => {
                          const initials = getInitials(member.email)
                          return (
                            <Avatar key={member.id} size="sm">
                              <AvatarFallback className="text-[10px]">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                          )
                        })}
                        {deptMembers.length > 3 && (
                          <AvatarGroupCount className="text-[10px]">
                            +{deptMembers.length - 3}
                          </AvatarGroupCount>
                        )}
                        {deptMembers.length === 0 && (
                          <span className="text-xs text-muted-foreground italic">
                            No members
                          </span>
                        )}
                      </AvatarGroup>

                      <div className="flex items-center gap-2">
                        <Progress
                          value={insight?.risk ?? 0}
                          className="h-1.5 w-16"
                        />
                        <span className="text-xs font-medium text-muted-foreground">
                          {insight?.risk ?? 0}%
                        </span>
                      </div>
                    </ItemFooter>
                  </Item>
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
                </span>{" "}
                ·{" "}
                <span className="font-medium text-foreground">
                  {totalItems}
                </span>{" "}
                total
              </p>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 bg-background"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loadingGrid}
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
                  disabled={currentPage === totalPages || loadingGrid}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create department</DialogTitle>
            <DialogDescription>
              Add a new department to your workspace.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => void handleCreateLocal(e)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="dept-new-name">Department name</Label>
              <Input
                id="dept-new-name"
                placeholder="e.g. Engineering, People Ops..."
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value)
                  setCreateError("")
                }}
                disabled={creating}
              />
              {newName.trim() && (
                <p className="text-xs text-muted-foreground">
                  URL identifier:{" "}
                  <span className="rounded border border-border/40 bg-muted/60 px-1 py-0.5 font-mono font-medium text-foreground">
                    {makeSlugPreview(newName)}
                  </span>
                </p>
              )}
              {createError && (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="size-3 shrink-0" />
                  {createError}
                </p>
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
                <Plus className="size-4" />
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
            <AlertDialogTitle>Delete department?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.name}". This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {deleteError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteTarget(null)
                setDeleteError("")
              }}
              disabled={deleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(event) => {
                event.preventDefault()
                void handleDeleteLocal()
              }}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete department"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
