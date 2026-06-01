import { useEffect, useMemo, useState, useRef } from "react"
import { CreateOrganizationDialog } from "@workspace/auth/components/create-organization-dialog"
import {
  listOrganizations,
  deleteOrganization,
  type OrganizationResponse,
} from "@workspace/api"

import {
  OverviewStatCard,
  OverviewStatCardSkeleton,
} from "@workspace/components/components/card"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { toast } from "@workspace/ui/components/sonner"
import { Card } from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
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
import { Link, useNavigate } from "react-router-dom"
import { Link2, Plus, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react"

type OrganizationStatus = "Active" | "Pending"

interface Organization extends OrganizationResponse {
  status: OrganizationStatus
  collaborators: number
}

const statusClass: Record<OrganizationStatus, string> = {
  Active:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 capitalize",
  Pending:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 capitalize",
}

export function OrganizationsPage() {
  const navigate = useNavigate()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteConfirmOrg, setDeleteConfirmOrg] = useState<{
    id: string
    name: string
  } | null>(null)

  // Filters State
  const [search, setSearch] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Load organizations ref
  const loadOrganizationsRef = useRef<() => Promise<void>>(() =>
    Promise.resolve()
  )

  // Advanced backend-filtered fetch
  const loadOrganizations = async () => {
    setLoading(true)
    try {
      // Fetch organizations from backend with status filtering!
      const orgs = await listOrganizations({ status: selectedStatus })
      setOrganizations(
        orgs.map((org) => ({
          ...org,
          status: (org.collaborators_count > 0 ? "Active" : "Pending") as OrganizationStatus,
          collaborators: org.collaborators_count,
        }))
      )
    } catch (err) {
      console.error("Failed to load organizations:", err)
      toast.error("Failed to load organizations.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrganizationsRef.current = loadOrganizations
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadOrganizations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus]) // re-fetch when backend status filter changes!

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmOrg) return

    try {
      await deleteOrganization(deleteConfirmOrg.id)
      toast.success("Organization deleted")
      void loadOrganizationsRef.current?.()
    } catch {
      toast.error("Failed to delete organization")
    } finally {
      setDeleteConfirmOrg(null)
    }
  }

  // Client-side text search filter (matches name or slug)
  const filteredOrganizations = useMemo(() => {
    return organizations.filter((org) => {
      const nameMatch = org.name.toLowerCase().includes(search.toLowerCase())
      const slugMatch = org.slug.toLowerCase().includes(search.toLowerCase())
      return nameMatch || slugMatch
    })
  }, [organizations, search])

  // Computed Pagination values
  const totalItems = filteredOrganizations.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const paginatedOrganizations = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredOrganizations.slice(start, start + pageSize)
  }, [filteredOrganizations, currentPage, pageSize])

  const hasActiveFilters = search !== "" || selectedStatus !== "all"

  const handleResetFilters = () => {
    setSearch("")
    setSelectedStatus("all")
    setCurrentPage(1)
  }

  // Stats Card computed values
  const overview = useMemo(() => {
    return [
      {
        label: "Total",
        value: organizations.length.toString(),
        hint: "organizations registered",
      },
      {
        label: "Active",
        value: organizations
          .filter((org) => org.status === "Active")
          .length.toString(),
        hint: "with users registered",
      },
      {
        label: "Pending",
        value: organizations
          .filter((org) => org.status === "Pending")
          .length.toString(),
        hint: "awaiting user registration",
      },
    ]
  }, [organizations])

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in duration-300">
      {/* Title section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-foreground">Overview</h2>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          Create new organization
        </Button>
      </div>

      {/* Stats Cards */}
      <section className="grid gap-4 md:grid-cols-3 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:bg-card">
        {loading
          ? Array.from({ length: 3 }).map((_, index) => (
              <OverviewStatCardSkeleton key={index} />
            ))
          : overview.map((item) => (
              <OverviewStatCard
                key={item.label}
                label={item.label}
                value={item.value}
                hint={item.hint}
                iconVariant="none"
              />
            ))}
      </section>

      {/* Main organizations Radix-style table card */}
      <Card className="border-border/60 p-6 shadow-[var(--shadow-card)]">
        {/* Title */}
        <div className="mb-6 flex flex-col gap-1">
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            Organizations
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage organization environments, slugs and collaborators.
          </p>
        </div>

        {/* Filters Toolbar */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search bar */}
            <div className="w-full sm:max-w-xs">
              <Input
                type="text"
                placeholder="Filter by name or slug..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="h-9 w-full bg-background"
              />
            </div>

            {/* Status Select Dropdown (Filtering in backend!) */}
            <div className="w-[180px]">
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
                  <SelectItem value="pending">Pending</SelectItem>
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

        {/* Main Table */}
        <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="font-semibold text-foreground">
                  Organization
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  Plan
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  Collaborators
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  Status
                </TableHead>
                <TableHead className="w-24 font-semibold text-foreground text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="size-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                      <span>Loading organizations...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedOrganizations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No organizations found matching the active criteria.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrganizations.map((org) => (
                  <TableRow
                    key={org.id}
                    className="group cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => navigate(`/organizations/${org.id}`)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {org.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {org.slug}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-muted-foreground">
                      —
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {org.collaborators}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusClass[org.status]}>
                        {org.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon-sm"
                          title={`Create invitation for ${org.name}`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Link
                            to={`/invitations?type=organization&organizationId=${encodeURIComponent(
                              org.id
                            )}`}
                          >
                            <Link2 className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Delete organization"
                          onClick={(event) => {
                            event.stopPropagation()
                            setDeleteConfirmOrg({ id: org.id, name: org.name })
                          }}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
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
            organizations
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
      </Card>

      {/* Create Organization Dialog */}
      <CreateOrganizationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          toast.success("Organization created!", {
            description: "The organization has been successfully created.",
          })
          void loadOrganizationsRef.current?.()
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirmOrg}
        onOpenChange={(open) => !open && setDeleteConfirmOrg(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <strong>{deleteConfirmOrg?.name}</strong> and remove all
              associated memberships from our servers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOrg(null)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete organization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default OrganizationsPage
