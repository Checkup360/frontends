import { useEffect, useMemo, useState } from "react"
import { InvitationTypeCard } from "@/components/invitation-type-card"
import { SysadminInvitationForm } from "@workspace/auth/components/sysadmin-invitation-form"
import { CreateInvitationButton } from "@workspace/components/components/create-invitation-button"
import { DeleteInvitationsDialog } from "@workspace/components/components/delete-invitations-dialog"
import { OrgInvitationForm } from "@workspace/components/components/org-invitation-form"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import { Stepper } from "@workspace/ui/components/stepper"
import { Link, useSearchParams } from "react-router-dom"
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
  expired: "bg-destructive/10 text-destructive border-destructive/20 capitalize",
  used: "bg-muted/80 text-muted-foreground border-border capitalize",
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 capitalize",
}

export function InvitationsPage() {
  const [searchParams] = useSearchParams()
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

  // --- Listing Filters and Data State ---
  const [activeTab, setActiveTab] = useState<"sysadmin" | "organization">(
    initialType
  )
  const [selectedOrg, setSelectedOrg] = useState(
    searchParams.get("organizationId") ?? ""
  )
  const [selectedRole, setSelectedRole] = useState("all")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedInviteIds, setSelectedInviteIds] = useState<string[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Data arrays
  const [sysadminInvites, setSysadminInvites] = useState<SysadminInvite[]>([])
  const [orgInvites, setOrgInvites] = useState<OrganizationInvite[]>([])
  const [organizations, setOrganizations] = useState<OrganizationResponse[]>([])
  const [loading, setLoading] = useState(true)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Handle back trigger inside creation view
  const handleBack = () => {
    setCompleted(false)
    setSelectedType(null)
    setIsCreating(false)
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

  // Refetch invites when activeTab or filter states change (Hitting backend filtering!)
  const loadInvites = async () => {
    if (activeTab === "organization" && (!selectedOrg || selectedOrg === "none")) {
      setOrgInvites([])
      setSelectedInviteIds([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      if (activeTab === "sysadmin") {
        const data = await listSysadminInvitations()
        setSysadminInvites(data)
        setSelectedInviteIds([])
      } else {
        const data = await listOrgInvitations({
          organizationId: selectedOrg,
          role: selectedRole,
        })
        setOrgInvites(data)
        setSelectedInviteIds([])
      }
    } catch (err) {
      console.error("Failed to load invitations list:", err)
      toast.error("Failed to load invitations.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadInvites()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedOrg, selectedRole, isCreating])

  // --- Filter Computations ---
  const filteredSysadminInvites = useMemo(() => {
    return sysadminInvites
  }, [sysadminInvites])

  const filteredOrgInvites = useMemo(() => {
    return orgInvites
  }, [orgInvites])

  // Pagination computations
  const totalItems = activeTab === "sysadmin" ? filteredSysadminInvites.length : filteredOrgInvites.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  
  const paginatedSysadminInvites = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredSysadminInvites.slice(start, start + pageSize)
  }, [filteredSysadminInvites, currentPage, pageSize])

  const paginatedOrgInvites = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredOrgInvites.slice(start, start + pageSize)
  }, [filteredOrgInvites, currentPage, pageSize])
  const paginatedInviteIds = useMemo(() => {
    return activeTab === "sysadmin"
      ? paginatedSysadminInvites.map((invite) => invite.id)
      : paginatedOrgInvites.map((invite) => invite.id)
  }, [activeTab, paginatedOrgInvites, paginatedSysadminInvites])
  const selectedCount = selectedInviteIds.length
  const allPageSelected =
    paginatedInviteIds.length > 0 &&
    paginatedInviteIds.every((id) => selectedInviteIds.includes(id))
  const somePageSelected =
    paginatedInviteIds.some((id) => selectedInviteIds.includes(id)) &&
    !allPageSelected

  const hasActiveFilters = selectedOrg !== "" || selectedRole !== "all"

  const handleResetFilters = () => {
    setSelectedOrg("")
    setSelectedRole("all")
    setCurrentPage(1)
    setSelectedInviteIds([])
  }

  const toggleInviteSelection = (id: string, checked: boolean) => {
    setSelectedInviteIds((prev) =>
      checked ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id)
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
      const deleted =
        activeTab === "sysadmin"
          ? await deleteSysadminInvitations(selectedInviteIds)
          : await deleteOrgInvitations(selectedInviteIds)
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

  // --- RENDERING ---

  // 1. Create Mode rendering
  if (isCreating) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 animate-in fade-in duration-300">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
            <ArrowLeft className="size-4" />
            Back to Invitations
          </Button>
        </div>

        <Card className="w-full max-w-4xl mx-auto shadow-[var(--shadow-card)] border-border/60">
          <CardHeader className="px-6 pt-6 pb-3 md:px-8">
            <Stepper steps={steps} currentStep={currentStep} />
          </CardHeader>
          <CardContent className="px-6 pb-6 md:px-8">
            <div className={selectedType === null ? "py-5" : "min-h-[430px] py-6"}>
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
                      setTimeout(() => {
                        setIsCreating(false)
                        setCompleted(false)
                        setSelectedType(null)
                      }, 1500)
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
                      toast.success("Organization invitation created successfully!")
                      setTimeout(() => {
                        setIsCreating(false)
                        setCompleted(false)
                        setSelectedType(null)
                      }, 1500)
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

  // 2. Listing Mode rendering
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-1">
        <div className="flex gap-6">
          <button
            onClick={() => {
              setActiveTab("sysadmin")
              setCurrentPage(1)
              setSelectedInviteIds([])
              handleResetFilters()
            }}
            className={`pb-3 text-sm font-semibold transition-all relative ${
              activeTab === "sysadmin"
                ? "text-primary border-b-2 border-primary -mb-[5px]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2 px-1">
              <Shield className="size-4" />
              Sysadmin
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab("organization")
              setCurrentPage(1)
              setSelectedInviteIds([])
              handleResetFilters()
            }}
            className={`pb-3 text-sm font-semibold transition-all relative ${
              activeTab === "organization"
                ? "text-primary border-b-2 border-primary -mb-[5px]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2 px-1">
              <Building2 className="size-4" />
              Organizations
            </div>
          </button>
        </div>

        <CreateInvitationButton
          size="sm"
          onClick={() => setIsCreating(true)}
          className="self-end sm:self-auto mb-2 sm:mb-0"
        />
      </div>

      {/* Main Table Card */}
      <Card className="border-border/60 p-6 shadow-[var(--shadow-card)]">
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
            {activeTab === "organization" && (
              <>
                <div className="w-[200px]">
                  <Select
                    value={selectedOrg}
                    onValueChange={(val) => {
                      setSelectedOrg(val)
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="h-9 bg-background">
                      <SelectValue placeholder="Select organization..." />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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

        {activeTab === "organization" && !selectedOrg ? (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in duration-300">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <Building2 className="size-8 text-primary animate-pulse" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Select an Organization</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                Please choose an organization from the dropdown list above to view and manage its invitations.
              </p>
            </div>
          ) : !loading && (activeTab === "sysadmin" ? filteredSysadminInvites.length : filteredOrgInvites.length) === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in duration-300">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <Mail className="size-8 text-primary animate-pulse" />
              </div>
              <h3 className="text-base font-semibold text-foreground">No invitations found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                {activeTab === "sysadmin"
                  ? "Create your first system administrator invitation by clicking the button above."
                  : "No active or expired invitation links exist for this organization. Click the button above to create one."}
              </p>
            </div>
          ) : (
            <>
            {/* Table representation */}
            <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        aria-label="Select page invitations"
                        checked={allPageSelected || (somePageSelected && "indeterminate")}
                        onCheckedChange={(checked) =>
                          togglePageSelection(checked === true)
                        }
                      />
                    </TableHead>
                    <TableHead className="font-semibold text-foreground">Email</TableHead>
                    {activeTab === "organization" && (
                      <TableHead className="font-semibold text-foreground">Organization</TableHead>
                    )}
                    <TableHead className="font-semibold text-foreground">Role</TableHead>
                    {activeTab === "organization" && (
                      <TableHead className="font-semibold text-foreground">Department</TableHead>
                    )}
                    <TableHead className="font-semibold text-foreground">Uses</TableHead>
                    <TableHead className="font-semibold text-foreground">Status / Time Left</TableHead>
                    <TableHead className="w-24 font-semibold text-foreground text-right">Actions</TableHead>
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
                          <div className="h-4 bg-muted rounded w-2/3" />
                        </TableCell>
                        {activeTab === "organization" && (
                          <TableCell>
                            <div className="h-4 bg-muted rounded w-1/2" />
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="h-5 bg-muted rounded-full w-16" />
                        </TableCell>
                        {activeTab === "organization" && (
                          <TableCell>
                            <div className="h-4 bg-muted rounded w-1/3" />
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="h-4 bg-muted rounded w-8" />
                        </TableCell>
                        <TableCell>
                          <div className="h-5 bg-muted rounded-full w-24" />
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <div className="h-8 bg-muted rounded-md w-8" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : activeTab === "sysadmin" ? (
                    paginatedSysadminInvites.map((invite) => {
                      const rem = formatRemainingTime(invite.expires_at, invite.uses, invite.max_uses)
                      return (
                        <TableRow key={invite.id} className="group hover:bg-muted/40 transition-colors">
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
                            {invite.email ?? <span className="text-muted-foreground/60">—</span>}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 capitalize font-medium">
                              Sysadmin
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground tabular-nums font-medium">
                            {invite.uses} / {invite.max_uses}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={remainingBadgeClass[rem.status]}>
                              {rem.text}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Copy Invitation Link"
                                onClick={() => handleCopyLink(invite.id, invite.invite_url)}
                              >
                                {copiedId === invite.id ? (
                                  <Check className="size-4 text-emerald-500" />
                                ) : (
                                  <Clipboard className="size-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Delete invitation"
                                onClick={() => {
                                  setSelectedInviteIds([invite.id])
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    paginatedOrgInvites.map((invite) => {
                      const rem = formatRemainingTime(invite.expires_at, invite.uses, invite.max_uses)
                      return (
                        <TableRow key={invite.id} className="group hover:bg-muted/40 transition-colors">
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
                            {invite.email ?? <span className="text-muted-foreground/60">—</span>}
                          </TableCell>
                          <TableCell className="text-muted-foreground font-medium">
                            {invite.organization_id ? (
                              <Link
                                to={`/organizations/${invite.organization_id}`}
                                className="text-foreground transition-colors hover:text-primary"
                              >
                                {invite.organization_name ?? "General Workspace"}
                              </Link>
                            ) : (
                              (invite.organization_name ?? "General Workspace")
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                invite.role === "admin"
                                  ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 capitalize"
                                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 capitalize"
                              }
                            >
                              {invite.role ?? "Collaborator"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground font-medium">
                            {invite.department_name ?? <span className="text-muted-foreground/40">—</span>}
                          </TableCell>
                          <TableCell className="text-muted-foreground tabular-nums font-medium">
                            {invite.uses} / {invite.max_uses}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={remainingBadgeClass[rem.status]}>
                              {rem.text}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Copy Invitation Link"
                                onClick={() => handleCopyLink(invite.id, invite.invite_url)}
                              >
                                {copiedId === invite.id ? (
                                  <Check className="size-4 text-emerald-500" />
                                ) : (
                                  <Clipboard className="size-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Delete invitation"
                                onClick={() => {
                                  setSelectedInviteIds([invite.id])
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="size-4 text-destructive" />
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
            <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0}
                </span>{" "}
                to{" "}
                <span className="font-medium text-foreground">
                  {Math.min(currentPage * pageSize, totalItems)}
                </span>{" "}
                of <span className="font-medium text-foreground">{totalItems}</span> invitations
              </p>

              <div className="flex items-center gap-6">
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

                <span className="text-sm text-muted-foreground">
                  Page <span className="font-medium text-foreground">{currentPage}</span> of{" "}
                  <span className="font-medium text-foreground">{totalPages}</span>
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
