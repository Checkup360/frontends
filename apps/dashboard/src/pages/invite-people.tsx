import { useEffect, useMemo, useState } from "react"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { CreateInvitationButton } from "@workspace/components/components/create-invitation-button"
import { OrgInvitationForm } from "@workspace/components/components/org-invitation-form"
import { Card, CardContent } from "@workspace/ui/components/card"
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
} from "@workspace/ui/components/table"
import {
  listOrgInvitations,
  type OrganizationInvite,
} from "@workspace/api"
import {
  X,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Copy,
  Check,
  Mail,
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

  // Filters State
  const [selectedRole, setSelectedRole] = useState("all")

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

  // Load invitations
  const loadInvites = async () => {
    setLoading(true)
    try {
      const data = await listOrgInvitations()
      setInvites(data)
    } catch (err) {
      console.error("Failed to load invitations:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (organization) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadInvites()
    }
  }, [organization])

  // Copy handler
  const handleCopy = (id: string, url: string) => {
    void navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Client-side search and filters
  const filteredInvites = useMemo(() => {
    return invites.filter((inv) => {
      const matchesRole =
        selectedRole === "all" || inv.role?.toLowerCase() === selectedRole

      return matchesRole
    })
  }, [invites, selectedRole])

  // Pagination values
  const totalItems = filteredInvites.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const paginatedInvites = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredInvites.slice(start, start + pageSize)
  }, [filteredInvites, currentPage, pageSize])

  const hasActiveFilters = selectedRole !== "all"

  const handleResetFilters = () => {
    setSelectedRole("all")
    setCurrentPage(1)
  }

  if (userLoading) {
    return (
      <Card className="mx-auto w-full max-w-5xl">
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
      <div className="mx-auto w-full max-w-3xl space-y-4 animate-in fade-in duration-300">
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
        <Card>
          <CardContent className="py-6 md:px-8">
            <OrgInvitationForm
              fixedOrganization={organization}
              title="Create invite"
              description="Create an invitation link for this organization."
              onBack={() => setShowCreateForm(false)}
              onSuccessChange={(success) => {
                if (success) {
                  // After successful creation, refresh the list and return to table view
                  void loadInvites()
                  setShowCreateForm(false)
                }
              }}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 animate-in fade-in duration-300">
      {/* Table Header Card */}
      <Card className="border-border/60 p-6 shadow-[var(--shadow-card)]">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
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
                </SelectContent>
              </Select>
            </div>

            {/* Reset Filters button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={handleResetFilters}
                className="h-9 gap-2 px-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                Reset
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {!loading && filteredInvites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in duration-300">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Mail className="size-8 text-primary animate-pulse" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No invitations found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              Create your first organization invitation link by clicking the "Create Invite" button above.
            </p>
          </div>
        ) : (
          <>
            {/* Main Table */}
            <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-semibold text-foreground">Email</TableHead>
                    <TableHead className="font-semibold text-foreground">Role</TableHead>
                    <TableHead className="font-semibold text-foreground">Department</TableHead>
                    <TableHead className="font-semibold text-foreground">Uses</TableHead>
                    <TableHead className="font-semibold text-foreground">Status / Time</TableHead>
                    <TableHead className="w-16 font-semibold text-foreground text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="animate-pulse">
                        <TableCell>
                          <div className="h-4 bg-muted rounded w-2/3" />
                        </TableCell>
                        <TableCell>
                          <div className="h-5 bg-muted rounded-full w-16" />
                        </TableCell>
                        <TableCell>
                          <div className="h-4 bg-muted rounded w-1/3" />
                        </TableCell>
                        <TableCell>
                          <div className="h-4 bg-muted rounded w-8" />
                        </TableCell>
                        <TableCell>
                          <div className="h-5 bg-muted rounded-full w-24" />
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <div className="h-8 bg-muted rounded-md w-8" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    paginatedInvites.map((inv) => {
                      const rem = formatRemainingTime(
                        inv.expires_at,
                        inv.uses,
                        inv.max_uses
                      )
                      return (
                        <TableRow
                          key={inv.id}
                          className="group hover:bg-muted/40 transition-colors"
                        >
                          <TableCell className="font-medium text-foreground">
                            {inv.email || <span className="text-muted-foreground/60">—</span>}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={inv.role === "admin" ? "default" : "secondary"}
                              className="capitalize"
                            >
                              {inv.role || "member"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {inv.department_name || (
                              <span className="text-muted-foreground/60">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-foreground tabular-nums">
                            {inv.uses} <span className="text-muted-foreground">/</span> {inv.max_uses}
                          </TableCell>
                          <TableCell>
                            {rem.status === "active" ? (
                              <Badge
                                variant="outline"
                                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              >
                                {rem.text}
                              </Badge>
                            ) : rem.status === "expired" ? (
                              <Badge
                                variant="outline"
                                className="bg-destructive/10 text-destructive border-destructive/20"
                              >
                                Expired
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                              >
                                Used
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => handleCopy(inv.id, inv.invite_url)}
                              disabled={rem.status === "expired" || rem.status === "used"}
                              title="Copy invitation link"
                            >
                              {copiedId === inv.id ? (
                                <Check className="size-4 text-emerald-500" />
                              ) : (
                                <Copy className="size-4 text-muted-foreground hover:text-foreground" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
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
                of{" "}
                <span className="font-medium text-foreground">{totalItems}</span>{" "}
                invites
              </p>

              {/* Controls */}
              <div className="flex items-center gap-6">
                {/* Rows per page selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rows per page:</span>
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
                  Page <span className="font-medium text-foreground">{currentPage}</span>{" "}
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
          </>
        )}
      </Card>
    </div>
  )
}
