import { useEffect, useMemo, useState } from "react"
import {
  createDepartment,
  updateDepartment,
  deleteDepartment,
  listDepartments,
  listOrganizationEmployees,
  type DepartmentResponse,
  type OrganizationEmployee,
} from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { Card } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
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
  Users,
  Folder as FolderIcon,
  Plus,
  Search,
  AlertCircle,
  Pencil,
  Trash2,
  Check,
  X,
  MoreHorizontal,
} from "lucide-react"


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

export function DepartmentsPage() {
  const { user } = useCurrentUser()
  const organizationId = user?.membership?.organization_id ?? null

  const [departments, setDepartments] = useState<DepartmentResponse[]>([])
  const [employees, setEmployees] = useState<OrganizationEmployee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Search, creation, rename and delete states
  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState("")

  const [deleteTarget, setDeleteTarget] = useState<DepartmentResponse | null>(
    null
  )
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  useEffect(() => {
    let active = true
    async function load() {
      if (!organizationId) {
        setDepartments([])
        setEmployees([])
        setLoading(false)
        return
      }
      setLoading(true)
      setError("")
      try {
        const [departmentsData, employeesData] = await Promise.all([
          listDepartments(organizationId),
          listOrganizationEmployees(organizationId, ["member"]),
        ])
        if (active) {
          setDepartments(departmentsData)
          setEmployees(employeesData)
        }
      } catch {
        if (active) setError("Failed to load departments.")
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [organizationId])

  const insights = useMemo<DepartmentRiskInsight[]>(() => {
    return departments.map((department) => {
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
  }, [departments, employees])

  const highestRisk = useMemo(() => {
    return insights
      .filter((department) => department.total > 0)
      .sort((a, b) => b.risk - a.risk)[0]
  }, [insights])

  const assignedMembers = employees.filter(
    (employee) => employee.department
  ).length
  const unassignedMembers = employees.length - assignedMembers
  const averageRisk =
    insights.length === 0
      ? 0
      : Math.round(
          insights.reduce((total, department) => total + department.risk, 0) /
            insights.length
        )
  const filteredDepartments = useMemo(() => {
    return departments.filter((dept) => {
      const term = search.trim().toLowerCase()
      if (!term) return true
      return (
        dept.name.toLowerCase().includes(term) ||
        dept.slug.toLowerCase().includes(term)
      )
    })
  }, [departments, search])

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
    setDepartments((prev) => [...prev, result.success])
    setNewName("")
    setCreateOpen(false)
  }

  const handleSaveRenameLocal = async (dept: DepartmentResponse) => {
    if (!editName.trim()) return
    setSaving(true)
    setEditError("")
    if (!organizationId) {
      setEditError("No organization found.")
      setSaving(false)
      return
    }
    const result = await updateDepartment(organizationId, dept.id, {
      name: editName.trim(),
    })
    setSaving(false)
    if (result.error) {
      setEditError(
        result.error.code === "department_slug_already_exists"
          ? "A department with that name already exists."
          : result.error.message
      )
      return
    }
    setDepartments((prev) =>
      prev.map((d) => (d.id === dept.id ? result.success : d))
    )
    setEditingId(null)
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
    setDepartments((prev) => prev.filter((d) => d.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const startEdit = (dept: DepartmentResponse) => {
    setEditingId(dept.id)
    setEditName(dept.name)
    setEditError("")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName("")
    setEditError("")
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

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="grid gap-3 md:grid-cols-3">
        <DepartmentMetricCard
          icon={Users}
          label="Assigned members"
          value={loading ? null : assignedMembers.toString()}
          hint={`${unassignedMembers} unassigned`}
        />
        <DepartmentMetricCard
          icon={AlertTriangle}
          label="Highest onboarding risk"
          value={loading ? null : highestRisk ? `${highestRisk.risk}%` : "0%"}
          hint={highestRisk?.name ?? "No members assigned"}
          tone="warning"
        />
        <DepartmentMetricCard
          icon={ShieldCheck}
          label="Average department risk"
          value={loading ? null : `${averageRisk}%`}
          hint="Based on onboarding members"
          tone="success"
        />
      </section>

      <div className="w-full">
        <Card className="flex h-full min-h-[400px] flex-col rounded-3xl border-border/70 bg-card/80 p-5 shadow-sm">
          <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                Departments
              </h3>
              <p className="text-sm text-muted-foreground">
                Search, create and maintain department ownership.
              </p>
            </div>
            <Button
              size="sm"
              className="self-start"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-4" />
              New department
            </Button>
          </div>

          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative sm:max-w-xs sm:flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search departments..."
                className="h-9 rounded-full border-transparent bg-muted/60 pl-9 shadow-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="h-8 rounded-full border-border/70 px-3"
              >
                All
              </Badge>
              <Badge
                variant="outline"
                className="h-8 rounded-full border-border/70 px-3 text-muted-foreground"
              >
                {loading ? "..." : departments.length} total
              </Badge>
            </div>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-44 rounded-2xl" />
              ))}
            </div>
          ) : departments.length === 0 && !error ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/80 bg-muted/20 py-10 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-foreground">
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-muted">
                <FolderIcon className="size-5" />
              </span>
              <span className="text-sm font-medium">
                No departments yet. Use the button above to create one.
              </span>
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl bg-muted/20 py-10 text-center">
              <FolderIcon className="mb-2 size-6 text-muted-foreground/60" />
              <p className="text-sm font-medium text-foreground">
                No departments match your search.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDepartments.map((dept) => {
                const insight = insights.find((item) => item.id === dept.id)
                const tone = riskTone(insight?.risk ?? 0)
                const deptMembers = employees.filter(
                  (employee) => employee.department?.id === dept.id
                )

                return (
                  <Item
                    key={dept.id}
                    variant="outline"
                    className="group cursor-default rounded-2xl border-border/85 bg-card/45 shadow-xs transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/20 hover:bg-muted/10 hover:shadow-md active:translate-y-0 active:scale-[0.985]"
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
                      {editingId === dept.id ? (
                        <div className="w-full space-y-2 py-0.5">
                          <Input
                            value={editName}
                            onChange={(e) => {
                              setEditName(e.target.value)
                              setEditError("")
                            }}
                            disabled={saving}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Escape") cancelEdit()
                              if (e.key === "Enter")
                                void handleSaveRenameLocal(dept)
                            }}
                            className="h-8 w-full"
                          />
                          {editError && (
                            <p className="flex items-center gap-1.5 text-[10px] text-destructive">
                              <AlertCircle className="size-3 shrink-0" />
                              {editError}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 pt-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => void handleSaveRenameLocal(dept)}
                              disabled={saving || !editName.trim()}
                            >
                              <Check className="mr-1 size-3.5" /> Save
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-muted-foreground"
                              onClick={cancelEdit}
                              disabled={saving}
                            >
                              <X className="mr-1 size-3.5" /> Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <ItemTitle className="text-base font-semibold text-foreground">
                          {dept.name}
                        </ItemTitle>
                      )}
                    </ItemContent>

                    <ItemActions>
                      {editingId !== dept.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="h-8 w-8 rounded-lg"
                              disabled={!!editingId}
                            >
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => startEdit(dept)}>
                              <Pencil className="mr-2 size-3.5" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                              onClick={() => setDeleteTarget(dept)}
                            >
                              <Trash2 className="mr-2 size-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
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
        </Card>
      </div>

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

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setDeleteTarget(null)
            setDeleteError("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This will permanently delete "{deleteTarget?.name}". This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {deleteError}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteTarget(null)
                setDeleteError("")
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDeleteLocal()}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete department"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DepartmentMetricCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: typeof Users
  label: string
  value: string | null
  hint: string
  tone?: "default" | "warning" | "success"
}) {
  const toneClass =
    tone === "warning"
      ? "bg-[color:var(--warning)]/15 text-[color:var(--warning)]"
      : tone === "success"
        ? "bg-[color:var(--success)]/15 text-[color:var(--success)]"
        : "bg-muted text-muted-foreground"

  return (
    <Card className="rounded-3xl border-border/70 bg-card/80 p-5">
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex size-10 items-center justify-center rounded-full ${toneClass}`}
        >
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          {value === null ? (
            <Skeleton className="mt-1 h-6 w-14" />
          ) : (
            <p className="text-xl font-semibold text-foreground">{value}</p>
          )}
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
    </Card>
  )
}
