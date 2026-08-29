import { useCallback, useEffect, useMemo, useState } from "react"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { CreateInvitationButton } from "@workspace/components/components/create-invitation-button"
import { DeleteInvitationsDialog } from "@workspace/components/components/delete-invitations-dialog"
import { OrgInvitationForm } from "@workspace/components/components/org-invitation-form"
import { Card, CardContent } from "@workspace/ui/components/card"
import {
  OverviewStatCard,
  OverviewStatCardSkeleton,
} from "@workspace/components/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { toast } from "@workspace/ui/components/sonner"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  deleteOrgInvitations,
  listOrgInvitations,
  type OrganizationInvite,
} from "@workspace/api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  X,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Clipboard,
  Check,
  Mail,
  Trash2,
  Search,
  Clock,
} from "lucide-react"

// Formatting helper for remaining time
function formatRemainingTime(
  expiresAtStr: string,
  uses: number,
  maxUses: number
): { text: string; status: "expired" | "active" | "used" } {
  if (uses >= maxUses) {
    return { text: "Used", status: "used" }
  }
  const expiresAt = new Date(expiresAtStr)
  const now = new Date()
  const diffMs = expiresAt.getTime() - now.getTime()
  if (diffMs <= 0) {
    return { text: "Expired", status: "expired" }
  }
  const diffHours = diffMs / (1000 * 60 * 60)
  if (diffHours < 24) {
    const hours = Math.round(diffHours)
    return {
      text: hours <= 1 ? "1 hour remaining" : `${hours} hours remaining`,
      status: "active",
    }
  }
  const diffDays = Math.round(diffHours / 24)
  return {
    text: diffDays === 1 ? "1 day remaining" : `${diffDays} days remaining`,
    status: "active",
  }
}

export function InvitePeoplePage() {
  const { user, isLoading: userLoading } = useCurrentUser()
  const [invites, setInvites] = useState<OrganizationInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedInviteIds, setSelectedInviteIds] = useState<string[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Filters State
  const [selectedRole, setSelectedRole] = useState("all")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "used" | "expired">("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const organization = useMemo(() => {
    const membership = user?.membership?.roles?.includes("admin")
      ? user.membership
      : undefined
    if (!membership) return null

    return {
      id: membership.organization_id,
      name: membership.organization_name,
      slug: "",
      collaborators_count: 0,
    }
  }, [user])

  // Count metrics computed on the whole dataset
  const metrics = useMemo(() => {
    const total = invites.length
    let active = 0
    let used = 0
    let expired = 0

    invites.forEach((invite) => {
      const rem = formatRemainingTime(invite.expires_at, invite.uses, invite.max_uses)
      if (rem.status === "active") active++
      else if (rem.status === "used") used++
      else if (rem.status === "expired") expired++
    })

    return { total, active, used, expired }
  }, [invites])

  // Load all invitations for client-side filtering/analytics
  const loadInvites = useCallback(async () => {
    if (!organization) return
    setLoading(true)
    try {
      const data = await listOrgInvitations({
        organizationId: organization.id,
        role: selectedRole || undefined,
        status: filterStatus || undefined,
      })
      setInvites(data)
      setSelectedInviteIds([])
    } catch (err) {
      console.error("Failed to load invitations:", err)
    } finally {
      setLoading(false)
    }
  }, [organization, selectedRole, filterStatus])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadInvites()
  }, [showCreateForm, loadInvites])

  // Copy handler
  const handleCopy = (id: string, url: string) => {
    void navigator.clipboard.writeText(url)
    setCopiedId(id)
    toast.success("Invitation link copied to clipboard!")
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Client-side filtering by email (other filters handled by backend)
  const filteredInvites = useMemo(() => {
    return invites.filter((invite) => {
      // Email search
      if (searchQuery) {
        if (!invite.email) return false
        if (!invite.email.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false
        }
      }
      return true
    })
  }, [invites, searchQuery])

  // Pagination values
  const totalPages = Math.max(1, Math.ceil(filteredInvites.length / pageSize))
  const paginatedInvites = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredInvites.slice(start, start + pageSize)
  }, [filteredInvites, currentPage, pageSize])

  const paginatedInviteIds = useMemo(
    () => paginatedInvites.map((invite) => invite.id),
    [paginatedInvites]
  )
  const selectedCount = selectedInviteIds.length
  const allPageSelected =
    paginatedInviteIds.length > 0 &&
    paginatedInviteIds.every((id) => selectedInviteIds.includes(id))
  const somePageSelected =
    paginatedInviteIds.some((id) => selectedInviteIds.includes(id)) &&
    !allPageSelected

  const hasActiveFilters = selectedRole !== "all" || filterStatus !== "all" || searchQuery !== ""

  const handleResetFilters = () => {
    setSelectedRole("all")
    setFilterStatus("all")
    setSearchQuery("")
    setCurrentPage(1)
  }

  const toggleInviteSelection = (id: string, checked: boolean) => {
    setSelectedInviteIds((prev) =>
      checked
        ? Array.from(new Set([...prev, id]))
        : prev.filter((x) => x !== id)
    )
  }

  const togglePageSelection = (checked: boolean) => {
    setSelectedInviteIds((prev) => {
      if (!checked) {
        return prev.filter((id) => !paginatedInviteIds.includes(id))
      }
      return Array.from(new Set([...prev, ...paginatedInviteIds]))
    })
  }

  const handleDeleteSelected = async () => {
    if (selectedInviteIds.length === 0) return

    setDeleteLoading(true)
    try {
      const deleted = await deleteOrgInvitations(selectedInviteIds)
      toast.success(
        deleted === 1 ? "Invitation deleted" : `${deleted} invitations deleted`
      )
      setDeleteDialogOpen(false)
      await loadInvites()
    } catch (error) {
      console.error("Failed to delete invitations:", error)
      toast.error("Failed to delete invitations")
    } finally {
      setDeleteLoading(false)
    }
  }

  if (userLoading) {
    return (
      <Card className="mx-auto w-full max-w-7xl">
        <CardContent className="space-y-6 py-6 md:px-8">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!organization) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No admin organization found for this account.
        </CardContent>
      </Card>
    )
  }

  if (showCreateForm) {
    return (
      <div className="mx-auto w-full max-w-7xl animate-in space-y-6 duration-300 fade-in">
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => setShowCreateForm(false)}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to Invites
          </Button>
        </div>
        <Card className="border-border/60 shadow-[var(--shadow-card)]">
          <CardContent className="py-6 md:px-8">
            <OrgInvitationForm
              fixedOrganization={organization}
              title="Create invite"
              description="Create an invitation link for this organization."
              onBack={() => setShowCreateForm(false)}
              onSuccessChange={(success) => {
                if (success) {
                  // After successful creation, refresh the list in the background
                  void loadInvites()
                }
              }}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl animate-in space-y-6 duration-300 fade-in">
      {/* KPI Cards on Top */}
      <section className="grid gap-4 md:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <OverviewStatCardSkeleton key={index} />
          ))
        ) : (
          <>
            <OverviewStatCard
              label="Total Invitations"
              value={metrics.total}
              hint="total organization invitations"
              icon={Mail}
              iconVariant="icon"
              tone="primary"
            />
            <OverviewStatCard
              label="Active Pending"
              value={metrics.active}
              hint="active pending invites"
              icon={Clock}
              iconVariant="icon"
              tone="success"
            />
            <OverviewStatCard
              label="Used Accepted"
              value={metrics.used}
              hint="accepted invitation links"
              icon={Check}
              iconVariant="icon"
              tone="primary"
            />
            <OverviewStatCard
              label="Expired Outdated"
              value={metrics.expired}
              hint="expired/outdated invites"
              icon={X}
              iconVariant="icon"
              tone="destructive"
            />
          </>
        )}
      </section>

      {/* Main Table Card */}
      <Card className="border-border/60 p-6 shadow-[var(--shadow-card)]">
        {/* Header section with Create Invitation button */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Invites
            </h3>
            <p className="text-sm text-muted-foreground">
              Manage invitation links, view usage status and time remaining.
            </p>
          </div>
          <div>
            <CreateInvitationButton onClick={() => setShowCreateForm(true)} />
          </div>
        </div>
        {selectedCount > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {selectedCount}
              </span>{" "}
              selected
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="size-4" />
              Delete selected
            </Button>
          </div>
        )}

        {/* Filters Toolbar */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Role Select Dropdown */}
            <div className="w-[180px]">
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
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="content_manager">Content Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-[150px]">
              <Select
                value={filterStatus}
                onValueChange={(val: "all" | "active" | "used" | "expired") => {
                  setFilterStatus(val)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
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

        {/* Table representation */}
        <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    aria-label="Select page invitations"
                    checked={
                      allPageSelected ||
                      (somePageSelected && "indeterminate")
                    }
                    onCheckedChange={(checked) =>
                      togglePageSelection(checked === true)
                    }
                  />
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  Email
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  Role / Dept
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  Uses
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  Status / Time Left
                </TableHead>
                <TableHead className="w-24 text-right font-semibold text-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell>
                      <div className="size-4 rounded bg-muted" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-2/3 rounded bg-muted" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-1/3 rounded bg-muted" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-8 rounded bg-muted" />
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-24 rounded-full bg-muted" />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <div className="h-8 w-8 rounded-md bg-muted" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredInvites.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center py-4">
                      <Mail className="size-8 text-muted-foreground/60 mb-2" />
                      <p className="font-medium text-foreground">No invitations found</p>
                      <p className="text-xs mt-1">No active or expired invitation links match your filters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInvites.map((inv) => {
                  const rem = formatRemainingTime(
                    inv.expires_at,
                    inv.uses,
                    inv.max_uses
                  )
                  const statusClass =
                    rem.status === "active"
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                      : rem.status === "expired"
                        ? "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold"
                        : "border-muted-foreground/20 bg-muted text-muted-foreground font-semibold"

                  return (
                    <TableRow
                      key={inv.id}
                      className="group transition-colors hover:bg-muted/40"
                    >
                      <TableCell>
                        <Checkbox
                          aria-label={`Select invitation ${inv.email ?? inv.id}`}
                          checked={selectedInviteIds.includes(inv.id)}
                          onCheckedChange={(checked) =>
                            toggleInviteSelection(inv.id, checked === true)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {inv.email ?? (
                          <span className="text-muted-foreground/60 italic">
                            Any email
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-muted-foreground">
                        <div className="flex flex-col gap-0.5">
                          <span className="capitalize text-foreground font-semibold">
                            {inv.role ? inv.role.replace(/_/g, " ") : "Member"}
                          </span>
                          {inv.department_name && (
                            <span className="text-xs text-muted-foreground">
                              {inv.department_name}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-muted-foreground tabular-nums">
                        {inv.uses} / {inv.max_uses}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusClass}>
                          {rem.text}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1 opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Copy invitation link"
                            onClick={() => handleCopy(inv.id, inv.invite_url)}
                          >
                            {copiedId === inv.id ? (
                              <Check className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <Clipboard className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title="Delete invitation"
                            onClick={() => {
                              setSelectedInviteIds([inv.id])
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {!loading && filteredInvites.length > 0 && (
          <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
            {/* Count Indicator */}
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {(currentPage - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-foreground">
                {Math.min(currentPage * pageSize, filteredInvites.length)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {filteredInvites.length}
              </span>{" "}
              invites
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
                <span className="font-medium text-foreground">
                  {currentPage}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {totalPages}
                </span>
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
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages || loading}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
      <DeleteInvitationsDialog
        count={selectedCount}
        loading={deleteLoading}
        open={deleteDialogOpen}
        onConfirm={handleDeleteSelected}
        onOpenChange={setDeleteDialogOpen}
      />
    </div>
  )
}
