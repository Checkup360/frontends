import { useCallback, useEffect, useMemo, useState } from "react"
import {
  getSysadminStats,
  listSysadminsPage,
  type SysadminStats,
  type SysadminUser,
} from "@workspace/api"
import { SysadminInvitationForm } from "@workspace/auth/components/sysadmin-invitation-form"
import {
  OverviewStatCard,
  OverviewStatCardSkeleton,
} from "@workspace/components/components/card"
import { TablePagination } from "@workspace/components/components/table-pagination"
import {
  formatFullName,
  getInitials,
} from "@workspace/components/components/employee-profile-card"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  TableRowsSkeleton,
} from "@workspace/ui/components/table"
import { toast } from "@workspace/ui/components/sonner"
import {
  Mail,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from "lucide-react"

const sysadminTableSkeletonColumns = [
  { lines: ["h-4 w-44", "h-3 w-32"] },
  { skeletonClassName: "h-5 w-16 rounded-full" },
]

export function SysadminsPage() {
  const [sysadmins, setSysadmins] = useState<SysadminUser[]>([])
  const [stats, setStats] = useState<SysadminStats | null>(null)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingStats, setLoadingStats] = useState(true)

  // Filters State
  const [search, setSearch] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<"all" | "active" | "inactive">("all")

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Invite modal state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)

  const loadStats = useCallback(async () => {
    setLoadingStats(true)
    try {
      const data = await getSysadminStats()
      setStats(data)
    } catch {
      console.error("Failed to load sysadmin stats")
    } finally {
      setLoadingStats(false)
    }
  }, [])

  const loadSysadmins = useCallback(async () => {
    setLoading(true)
    try {
      const isActiveFilter =
        selectedStatus === "all" ? undefined : selectedStatus === "active"

      const pageResult = await listSysadminsPage({
        search: search.trim() || undefined,
        isActive: isActiveFilter,
        page: currentPage,
        pageSize,
      })

      setSysadmins(pageResult.items)
      setTotalItems(pageResult.total)
    } catch {
      toast.error("Failed to load system administrators.")
    } finally {
      setLoading(false)
    }
  }, [search, selectedStatus, currentPage, pageSize])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  useEffect(() => {
    void loadSysadmins()
  }, [loadSysadmins])

  const handleResetFilters = () => {
    setSearch("")
    setSelectedStatus("all")
    setCurrentPage(1)
  }

  const hasFilters = search !== "" || selectedStatus !== "all"
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  const statCards = useMemo(() => {
    if (!stats) return []
    return [
      {
        label: "Total Sysadmins",
        value: stats.total_sysadmins,
        hint: "configured platform administrators",
        icon: Users,
        tone: "primary" as const,
      },
      {
        label: "Active Sysadmins",
        value: stats.active_sysadmins,
        hint: "administrators with active credentials",
        icon: ShieldCheck,
        tone: "success" as const,
      },
      {
        label: "Pending Invites",
        value: stats.pending_invites,
        hint: "invitation links awaiting registration",
        icon: Mail,
        tone: stats.pending_invites > 0 ? ("warning" as const) : ("primary" as const),
      },
    ]
  }, [stats])

  return (
    <div className="mx-auto w-full max-w-7xl animate-in space-y-6 duration-300 fade-in">
      {/* Overview Stat Cards */}
      <section className="grid gap-4 md:grid-cols-3">
        {loadingStats
          ? Array.from({ length: 3 }).map((_, index) => (
              <OverviewStatCardSkeleton key={index} />
            ))
          : statCards.map((item) => (
              <OverviewStatCard
                key={item.label}
                label={item.label}
                value={item.value}
                hint={item.hint}
                icon={item.icon}
                iconVariant="icon"
                tone={item.tone}
              />
            ))}
      </section>

      {/* Main Table Card */}
      <Card className="border-border/60 p-6 shadow-[var(--shadow-card)]">
        {/* Title / Action Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              System Administrators
            </h3>
            <p className="text-sm text-muted-foreground">
              Manage platform superusers with full access to backoffice settings and organization controls.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setInviteDialogOpen(true)}
            className="gap-2 cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <Plus className="size-4" />
            Invite Sysadmin
          </Button>
        </div>

        {/* Filters Toolbar */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search input */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-8 bg-background"
              />
            </div>

            {/* Status Select */}
            <div className="w-[150px]">
              <Select
                value={selectedStatus}
                onValueChange={(val: "all" | "active" | "inactive") => {
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
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset Filter Button */}
            {hasFilters && (
              <Button
                variant="ghost"
                onClick={handleResetFilters}
                className="h-9 gap-2 px-3 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
              >
                Reset
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Table Representation */}
        <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="font-semibold text-foreground">
                  Administrator
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRowsSkeleton
                  rows={pageSize}
                  columns={sysadminTableSkeletonColumns}
                />
              ) : sysadmins.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No system administrators found matching the criteria.
                  </TableCell>
                </TableRow>
              ) : (
                sysadmins.map((admin) => {
                  const fullName = formatFullName(admin)
                  const initials = getInitials(fullName, admin.email)

                  return (
                    <TableRow
                      key={admin.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      {/* Avatar & User info */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 ring-1 ring-primary/20">
                            <AvatarImage
                              src={admin.avatar_url || ""}
                              alt={fullName}
                            />
                            <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-foreground truncate">
                              {fullName}
                            </span>
                            <span className="text-xs text-muted-foreground truncate font-mono">
                              {admin.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell>
                        {admin.is_active ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1"
                          >
                            <UserCheck className="size-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-destructive/10 text-destructive border-destructive/20 gap-1"
                          >
                            <ShieldAlert className="size-3" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
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
          pageSizeOptions={[5, 10, 20, 50]}
          itemLabel="administrators"
          loading={loading}
        />
      </Card>

      {/* Invite Sysadmin Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Invite System Administrator</DialogTitle>
            <DialogDescription>
              Generate an invitation link to grant superuser platform access.
            </DialogDescription>
          </DialogHeader>

          <div className="pt-2">
            <SysadminInvitationForm
              onBack={() => setInviteDialogOpen(false)}
              onSuccessChange={(success) => {
                if (success) {
                  void loadStats()
                }
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
