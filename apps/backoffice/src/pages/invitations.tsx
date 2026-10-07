import { useCallback, useEffect, useMemo, useState } from "react"
import { InvitationTypeCard } from "@/components/invitation-type-card"
import { SysadminInvitationForm } from "@workspace/auth/components/sysadmin-invitation-form"
import { CreateInvitationButton } from "@workspace/components/components/create-invitation-button"
import { DeleteInvitationsDialog } from "@workspace/components/components/delete-invitations-dialog"
import { OrgInvitationForm } from "@workspace/components/components/org-invitation-form"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import { Stepper } from "@workspace/ui/components/stepper"
import { OrganizationCombobox } from "@workspace/components/components/organization-combobox"
import {
  OverviewStatCard,
  OverviewStatCardSkeleton,
} from "@workspace/components/components/card"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import {
  deleteOrgInvitations,
  deleteSysadminInvitations,
  listOrgInvitations,
  listSysadminInvitations,
  listOrganizations,
  type OrganizationInvite,
  type SysadminInvite,
  type OrganizationResponse,
} from "@workspace/api"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { toast } from "@workspace/ui/components/sonner"
import { Input } from "@workspace/ui/components/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  X,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Check,
  Building2,
  Shield,
  ArrowLeft,
  Mail,
  Trash2,
  Search,
} from "lucide-react"

type SelectedType = null | "sysadmin" | "organization"

const steps = [{ label: "Type" }, { label: "Details" }, { label: "Complete" }]

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

// Badge classes for time remaining
const remainingBadgeClass: Record<"expired" | "active" | "used", string> = {
  expired:
    "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 capitalize font-medium",
  used: "border-border bg-muted/80 text-muted-foreground capitalize font-medium",
  active:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 capitalize font-medium",
}

interface CombinedInvite {
  isSysadmin: boolean
  id: string
  token: string
  email: string | null
  max_uses: number
  uses: number
  expires_at: string
  invite_url: string
  organization_id?: string | null
  organization_name?: string | null
  role?: string | null
  department_name?: string | null
}

export function InvitationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialType = useMemo<"sysadmin" | "organization">(() => {
    return searchParams.get("type") === "organization"
      ? "organization"
      : "sysadmin"
  }, [searchParams])
  const shouldStartCreating = searchParams.get("create") === "1"

  // --- Views Switcher ---
  const [isCreating, setIsCreating] = useState(
    initialType === "organization" && shouldStartCreating
  )

  // --- Creation Stepper Flow State ---
  const [selectedType, setSelectedType] = useState<SelectedType>(
    initialType === "organization" ? "organization" : null
  )
  const [completed, setCompleted] = useState(false)
  const initialOrganizationId = searchParams.get("organizationId") ?? undefined
  const currentStep = completed ? 3 : selectedType ? 2 : 1

  const initialFilterType = useMemo<"all" | "sysadmin" | "organization">(() => {
    const t = searchParams.get("type")
    if (t === "organization" || t === "sysadmin") return t
    if (searchParams.get("organizationId")) return "organization"
    return "all"
  }, [searchParams])

  // --- Listing Filters and Data State ---
  const [filterType, setFilterType] = useState<
    "all" | "sysadmin" | "organization"
  >(initialFilterType)
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "used" | "expired"
  >("all")
  const [selectedOrg, setSelectedOrg] = useState(
    searchParams.get("organizationId") ?? ""
  )
  const [selectedRole, setSelectedRole] = useState("all")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedInviteIds, setSelectedInviteIds] = useState<string[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")

  // Keep state in sync if URL search params change
  useEffect(() => {
    const pType = searchParams.get("type")
    const pOrg = searchParams.get("organizationId")
    const pCreate = searchParams.get("create") === "1"

    if (pCreate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsCreating(true)
      if (pType === "organization" || pOrg) {
        setSelectedType("organization")
      } else if (pType === "sysadmin") {
        setSelectedType("sysadmin")
      }
    }

    if (pType === "organization" || pType === "sysadmin") {
      setFilterType(pType)
    } else if (pOrg) {
      setFilterType("organization")
    }
    if (pOrg !== null) {
      setSelectedOrg(pOrg)
    }
  }, [searchParams])

  // Data arrays
  const [sysadminInvites, setSysadminInvites] = useState<SysadminInvite[]>([])
  const [orgInvites, setOrgInvites] = useState<OrganizationInvite[]>([])
  const [organizations, setOrganizations] = useState<OrganizationResponse[]>([])
  const [loading, setLoading] = useState(true)

  // Combined invitations with helper tag for sysadmin status
  const combinedInvites = useMemo<CombinedInvite[]>(() => {
    const sys: CombinedInvite[] = sysadminInvites.map((item) => ({
      ...item,
      isSysadmin: true,
    }))
    const org: CombinedInvite[] = orgInvites.map((item) => ({
      ...item,
      isSysadmin: false,
    }))
    return [...sys, ...org]
  }, [sysadminInvites, orgInvites])

  // Count metrics computed on the whole dataset
  const metrics = useMemo(() => {
    const total = combinedInvites.length
    const sysadminActive = sysadminInvites.filter((invite) => {
      const rem = formatRemainingTime(
        invite.expires_at,
        invite.uses,
        invite.max_uses
      )
      return rem.status === "active"
    }).length
    const orgActive = orgInvites.filter((invite) => {
      const rem = formatRemainingTime(
        invite.expires_at,
        invite.uses,
        invite.max_uses
      )
      return rem.status === "active"
    }).length

    return { total, sysadminActive, orgActive }
  }, [combinedInvites, sysadminInvites, orgInvites])

  // Client-side filtering by all criteria
  const filteredInvites = useMemo(() => {
    return combinedInvites.filter((invite) => {
      // 1. Filter by Type
      if (filterType === "sysadmin" && !invite.isSysadmin) return false
      if (filterType === "organization" && invite.isSysadmin) return false
      if (selectedOrg && invite.isSysadmin) return false

      // 2. Filter by Email Search (client-side only)
      if (searchQuery) {
        if (!invite.email) return false
        if (!invite.email.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false
        }
      }

      return true
    })
  }, [combinedInvites, filterType, selectedOrg, searchQuery])

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const navigate = useNavigate()

  // Handle back trigger inside creation view
  const handleBack = () => {
    if (shouldStartCreating) {
      navigate(-1)
      return
    }
    setCompleted(false)
    setSelectedType(null)
    setIsCreating(false)
    setSearchQuery("")
    if (searchParams.has("create")) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete("create")
      setSearchParams(nextParams, { replace: true })
    }
  }

  // Copy Link function
  const handleCopyLink = (id: string, url: string) => {
    void navigator.clipboard.writeText(url)
    setCopiedId(id)
    toast.success("Invitation link copied to clipboard!")
    setTimeout(() => {
      setCopiedId(null)
    }, 2000)
  }

  // --- Fetching Logic ---
  // Load organizations dropdown list once
  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const orgsList = await listOrganizations()
        setOrganizations(orgsList)
      } catch (err) {
        console.error("Failed to load organizations:", err)
      }
    }
    void fetchOrgs()
  }, [])

  // Fetch all invites from endpoints with backend filters
  const loadInvites = useCallback(async () => {
    setLoading(true)
    try {
      // Sysadmin invitations are independent and do not belong to any organization.
      // Therefore, if a specific organization is selected or filterType is "organization",
      // we do NOT request sysadmin invitations from the backend.
      const shouldFetchSysadmin =
        (filterType === "all" || filterType === "sysadmin") && !selectedOrg
      const shouldFetchOrg =
        filterType === "all" || filterType === "organization"

      const sysPromise = shouldFetchSysadmin
        ? listSysadminInvitations({ status: filterStatus })
        : Promise.resolve([])

      const orgPromise = shouldFetchOrg
        ? listOrgInvitations({
            status: filterStatus,
            organizationId: selectedOrg || undefined,
            role: selectedRole || undefined,
          })
        : Promise.resolve([])

      const [sysadminData, orgData] = await Promise.all([
        sysPromise,
        orgPromise,
      ])
      setSysadminInvites(sysadminData)
      setOrgInvites(orgData)
      setSelectedInviteIds([])
    } catch (err) {
      console.error("Failed to load invitations list:", err)
      toast.error("Failed to load invitations.")
    } finally {
      setLoading(false)
    }
  }, [filterType, selectedOrg, filterStatus, selectedRole])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadInvites()
  }, [isCreating, loadInvites])

  // Pagination computations
  const totalPages = Math.max(1, Math.ceil(filteredInvites.length / pageSize))
  const paginatedInvites = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredInvites.slice(start, start + pageSize)
  }, [filteredInvites, currentPage, pageSize])

  const paginatedInviteIds = useMemo(() => {
    return paginatedInvites.map((invite) => invite.id)
  }, [paginatedInvites])

  const selectedCount = selectedInviteIds.length
  const allPageSelected =
    paginatedInviteIds.length > 0 &&
    paginatedInviteIds.every((id) => selectedInviteIds.includes(id))
  const somePageSelected =
    paginatedInviteIds.some((id) => selectedInviteIds.includes(id)) &&
    !allPageSelected

  const hasActiveFilters =
    filterType !== "all" ||
    filterStatus !== "all" ||
    selectedOrg !== "" ||
    selectedRole !== "all" ||
    searchQuery !== ""

  const handleResetFilters = () => {
    setFilterType("all")
    setFilterStatus("all")
    setSelectedOrg("")
    setSelectedRole("all")
    setSearchQuery("")
    setCurrentPage(1)
    setSelectedInviteIds([])
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
      const sysIds = selectedInviteIds.filter((id) =>
        sysadminInvites.some((item) => item.id === id)
      )
      const orgIds = selectedInviteIds.filter((id) =>
        orgInvites.some((item) => item.id === id)
      )

      let deletedCount = 0
      if (sysIds.length > 0) {
        const d = await deleteSysadminInvitations(sysIds)
        deletedCount += d
      }
      if (orgIds.length > 0) {
        const d = await deleteOrgInvitations(orgIds)
        deletedCount += d
      }

      toast.success(
        deletedCount === 1
          ? "Invitation deleted"
          : `${deletedCount} invitations deleted`
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

  // --- RENDERING ---

  // 1. Create Mode rendering
  if (isCreating) {
    return (
      <div className="mx-auto flex w-full max-w-7xl animate-in flex-col gap-6 duration-300 fade-in">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            {shouldStartCreating ? "Back" : "Back to Invitations"}
          </Button>
        </div>

        <Card className="mx-auto w-full max-w-4xl rounded-xl border border-border/60 bg-card shadow-xs">
          <CardHeader className="px-6 pt-6 pb-3 md:px-8">
            <Stepper steps={steps} currentStep={currentStep} />
          </CardHeader>
          <CardContent className="px-6 pb-6 md:px-8">
            <div
              className={selectedType === null ? "py-5" : "min-h-[430px] py-6"}
            >
              {selectedType === null && (
                <InvitationTypeCard
                  initialType={initialType}
                  onSelect={(type) => {
                    setCompleted(false)
                    setSelectedType(type)
                  }}
                />
              )}

              {selectedType === "sysadmin" && (
                <SysadminInvitationForm
                  onBack={handleBack}
                  onSuccessChange={(val) => {
                    setCompleted(val)
                    if (val) {
                      toast.success("Sysadmin invitation created successfully!")
                    }
                  }}
                />
              )}

              {selectedType === "organization" && (
                <OrgInvitationForm
                  onBack={handleBack}
                  onSuccessChange={(val) => {
                    setCompleted(val)
                    if (val) {
                      toast.success(
                        "Organization invitation created successfully!"
                      )
                    }
                  }}
                  initialOrganizationId={initialOrganizationId}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Title section */}
      <div>
        <h2 className="text-base font-semibold text-foreground">Overview</h2>
      </div>

      {/* KPI Cards on Top */}
      <section className="grid gap-4 md:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <OverviewStatCardSkeleton key={index} />
          ))
        ) : (
          <>
            <OverviewStatCard
              label="Total Invitations"
              value={metrics.total}
              hint="total system & organization invitations"
              icon={Mail}
              iconVariant="icon"
              tone="primary"
            />
            <OverviewStatCard
              label="Active Sysadmin"
              value={metrics.sysadminActive}
              hint="active system administrator invitations"
              icon={Shield}
              iconVariant="icon"
              tone="warning"
            />
            <OverviewStatCard
              label="Active Organization"
              value={metrics.orgActive}
              hint="active organization invitations"
              icon={Building2}
              iconVariant="icon"
              tone="success"
            />
          </>
        )}
      </section>

      {/* Main Table Card */}
      <Card className="rounded-xl border border-border/60 bg-card p-6 shadow-xs">
        {/* Title / Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Invitations
            </h3>
            <p className="text-sm text-muted-foreground">
              Manage your system and organization invitations, view usage status
              and time remaining.
            </p>
          </div>
          <CreateInvitationButton onClick={() => setIsCreating(true)} />
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

        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Invitation Type Filter */}
            <div className="w-[180px]">
              <Select
                value={filterType}
                onValueChange={(val: "all" | "sysadmin" | "organization") => {
                  setFilterType(val)
                  if (val === "sysadmin") {
                    setSelectedOrg("")
                  }
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="sysadmin">Sysadmin</SelectItem>
                  <SelectItem value="organization">Organization</SelectItem>
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

            {filterType !== "sysadmin" && (
              <>
                {/* Organization selector */}
                <div className="w-[200px]">
                  <OrganizationCombobox
                    organizations={organizations}
                    value={selectedOrg || "all"}
                    onValueChange={(val) => {
                      const newOrg = val === "all" ? "" : val
                      setSelectedOrg(newOrg)
                      if (newOrg) {
                        setFilterType("organization")
                      }
                      setCurrentPage(1)
                    }}
                    includeAllOption
                  />
                </div>

                {/* Role selector */}
                <div className="w-[150px]">
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
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Email Search input */}
            <div className="relative w-[250px]">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9"
              />
            </div>

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
                      allPageSelected || (somePageSelected && "indeterminate")
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
                  Type
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  Organization
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
                      <div className="h-5 w-16 rounded-full bg-muted" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-1/2 rounded bg-muted" />
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
                  <TableCell
                    colSpan={8}
                    className="h-32 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center py-4">
                      <Mail className="mb-2 size-8 text-muted-foreground/60" />
                      <p className="font-medium text-foreground">
                        No invitations found
                      </p>
                      <p className="mt-1 text-xs">
                        No active or expired invitation links match your
                        filters.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInvites.map((invite) => {
                  const rem = formatRemainingTime(
                    invite.expires_at,
                    invite.uses,
                    invite.max_uses
                  )
                  return (
                    <TableRow
                      key={invite.id}
                      className="group transition-colors hover:bg-muted/40"
                    >
                      <TableCell>
                        <Checkbox
                          aria-label={`Select invitation ${invite.email ?? invite.id}`}
                          checked={selectedInviteIds.includes(invite.id)}
                          onCheckedChange={(checked) =>
                            toggleInviteSelection(invite.id, checked === true)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {invite.email ?? (
                          <span className="text-muted-foreground/60 italic">
                            Any email
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {invite.isSysadmin ? (
                          <Badge
                            variant="outline"
                            className="border-rose-500/20 bg-rose-500/10 font-semibold text-rose-600 dark:text-rose-400"
                          >
                            Sysadmin
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-blue-500/20 bg-blue-500/10 font-semibold text-blue-600 dark:text-blue-400"
                          >
                            Organization
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {invite.isSysadmin ? (
                          <span className="text-muted-foreground/60 italic">
                            System
                          </span>
                        ) : invite.organization_id ? (
                          <Link
                            to={`/organizations/${invite.organization_id}`}
                            className="font-medium text-foreground transition-colors hover:text-primary"
                          >
                            {invite.organization_name ?? "General Workspace"}
                          </Link>
                        ) : (
                          (invite.organization_name ?? "General Workspace")
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-muted-foreground">
                        {invite.isSysadmin ? (
                          <span className="text-muted-foreground/60">—</span>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-foreground capitalize">
                              {invite.role ?? "Member"}
                            </span>
                            {invite.department_name && (
                              <span className="text-xs text-muted-foreground">
                                {invite.department_name}
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-muted-foreground tabular-nums">
                        {invite.uses} / {invite.max_uses}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={remainingBadgeClass[rem.status]}
                        >
                          {rem.text}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1 opacity-90 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Copy Invitation Link"
                            onClick={() =>
                              handleCopyLink(invite.id, invite.invite_url)
                            }
                          >
                            {copiedId === invite.id ? (
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
                              setSelectedInviteIds([invite.id])
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

        {/* Pagination deck */}
        {!loading && filteredInvites.length > 0 && (
          <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
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
              invitations
            </p>

            <div className="flex items-center gap-6">
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

export default InvitationsPage
