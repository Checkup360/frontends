import { useEffect, useMemo, useState, useRef } from "react"
import { CreateOrganizationDialog } from "@workspace/auth/components/create-organization-dialog"
import {
  listOrganizations,
  listOrganizationsPage,
  deleteOrganization,
  type OrganizationResponse,
  type OrganizationSortField,
} from "@workspace/api"

import {
  OverviewStatCard,
  OverviewStatCardSkeleton,
} from "@workspace/components/components/card"
import { ActionButton } from "@workspace/components/components/action-button"

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
  SortableTableHead,
  TableHeader,
  TableRowsSkeleton,
  TableRow,
} from "@workspace/ui/components/table"
import { useTableSort } from "@workspace/ui/hooks/use-table-sort"
import { Link, useNavigate } from "react-router-dom"
import { Link2, Plus, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react"

type OrganizationStatus = "Active" | "Pending"

interface Organization extends OrganizationResponse {
  status: OrganizationStatus
  collaborators: number
}

const statusVariant: Record<OrganizationStatus, "success-light" | "warning-light"> = {
  Active: "success-light",
  Pending: "warning-light",
}

const organizationTableSkeletonColumns = [
  { lines: ["h-4 w-40", "h-3 w-24"] },
  { skeletonClassName: "h-4 w-6" },
  { skeletonClassName: "h-4 w-10" },
  { skeletonClassName: "h-5 w-20 rounded-full" },
  {
    cellClassName: "text-right",
    skeletonClassName: "ml-auto h-8 w-16",
  },
]

export function OrganizationsPage() {
  const navigate = useNavigate()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [overviewOrganizations, setOverviewOrganizations] = useState<
    Organization[]
  >([])
  const [totalItems, setTotalItems] = useState(0)
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
  const { sort, toggleSort, directionOf } = useTableSort<OrganizationSortField>(
    () => setCurrentPage(1)
  )

  // Load organizations ref
  const loadOrganizationsRef = useRef<() => Promise<void>>(() =>
    Promise.resolve()
  )

  // Advanced backend-filtered fetch
  const loadOrganizations = async () => {
    setLoading(true)
    try {
      const [pageResult, overviewOrgs] = await Promise.all([
        listOrganizationsPage({
          status: selectedStatus,
          search,
          sortBy: sort?.field,
          sortDirection: sort?.direction,
          page: currentPage,
          pageSize,
        }),
        listOrganizations(),
      ])
      setOrganizations(
        pageResult.items.map((org) => ({
          ...org,
          status: (org.collaborators_count > 0
            ? "Active"
            : "Pending") as OrganizationStatus,
          collaborators: org.collaborators_count,
        }))
      )
      setOverviewOrganizations(
        overviewOrgs.map((org) => ({
          ...org,
          status: (org.collaborators_count > 0
            ? "Active"
            : "Pending") as OrganizationStatus,
          collaborators: org.collaborators_count,
        }))
      )
      setTotalItems(pageResult.total)
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
  }, [selectedStatus, search, sort, currentPage, pageSize])

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

  // Computed Pagination values
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

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
        value: overviewOrganizations.length.toString(),
        hint: "organizations registered",
      },
      {
        label: "Active",
        value: overviewOrganizations
          .filter((org) => org.status === "Active")
          .length.toString(),
        hint: "with users registered",
      },
      {
        label: "Pending",
        value: overviewOrganizations
          .filter((org) => org.status === "Pending")
          .length.toString(),
        hint: "awaiting user registration",
      },
    ]
  }, [overviewOrganizations])

  return (
    <div className="mx-auto w-full max-w-7xl animate-in space-y-6 duration-300 fade-in">
      {/* Title section */}
      <div>
        <h2 className="text-base font-semibold text-foreground">Overview</h2>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
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
      <Card className="rounded-xl border border-border/60 bg-card p-6 shadow-xs">
        {/* Title */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Organizations
            </h3>
            <p className="text-sm text-muted-foreground">
              Manage organization environments, slugs and collaborators.
            </p>
          </div>
          <ActionButton
            size="sm"
            icon={Plus}
            onClick={() => setDialogOpen(true)}
            className="rounded-lg"
          >
            New organization
          </ActionButton>
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
                <SortableTableHead
                  direction={directionOf("name")}
                  onSort={() => toggleSort("name")}
                  className="text-foreground"
                >
                  Organization
                </SortableTableHead>
                <TableHead className="font-semibold text-foreground">
                  Plan
                </TableHead>
                <SortableTableHead
                  direction={directionOf("collaborators")}
                  onSort={() => toggleSort("collaborators")}
                  className="text-foreground"
                >
                  Collaborators
                </SortableTableHead>
                <SortableTableHead
                  direction={directionOf("status")}
                  onSort={() => toggleSort("status")}
                  className="text-foreground"
                >
                  Status
                </SortableTableHead>
                <TableHead className="w-24 text-right font-semibold text-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRowsSkeleton columns={organizationTableSkeletonColumns} />
              ) : organizations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No organizations found matching the active criteria.
                  </TableCell>
                </TableRow>
              ) : (
                organizations.map((org) => (
                  <TableRow
                    key={org.id}
                    className="group cursor-pointer transition-colors hover:bg-muted/40"
                    onClick={() => navigate(`/organizations/${org.id}`)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground transition-colors group-hover:text-primary">
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
                      <Badge
                        variant={statusVariant[org.status]}
                        className="capitalize"
                      >
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
                            )}&create=1`}
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
            of <span className="font-medium text-foreground">{totalItems}</span>{" "}
            organizations
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
              of{" "}
              <span className="font-medium text-foreground">{totalPages}</span>
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
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <strong>{deleteConfirmOrg?.name}</strong> and remove all
              associated memberships from our servers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOrg(null)}>
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
