import {
  listSuperadminRemovalRequests,
  voteSuperadminRemovalRequest,
  type OrganizationEmployee,
  type SuperadminRemovalRequest,
} from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { toast } from "@workspace/ui/components/sonner"
import { formatEmployeeName } from "@workspace/components/components/employee-profile-card"
import { ShieldAlert, Check, X, Clock } from "lucide-react"
import { useEffect, useState } from "react"

interface QuorumRequestsCardProps {
  organizationId: string
  employees: OrganizationEmployee[]
  onRequestUpdated?: () => void
}

export function QuorumRequestsCard({
  organizationId,
  employees,
  onRequestUpdated,
}: QuorumRequestsCardProps) {
  const { user } = useCurrentUser()
  const [requests, setRequests] = useState<SuperadminRemovalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [votingId, setVotingId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedRequest, setSelectedRequest] =
    useState<SuperadminRemovalRequest | null>(null)

  const currentEmployee = employees.find((e) => e.email === user?.email)
  const isSuperadmin =
    currentEmployee?.roles?.includes("superadmin") ||
    user?.membership?.roles?.includes("superadmin") ||
    user?.is_sysadmin ||
    false
  const currentUserId = currentEmployee?.id

  useEffect(() => {
    let active = true

    if (!isSuperadmin || !organizationId) {
      return
    }

    async function fetchRequests() {
      setLoading(true)
      try {
        const data = await listSuperadminRemovalRequests(organizationId)
        if (!active) return
        setRequests(data)
      } catch (err) {
        console.error("Failed to load quorum requests:", err)
      } finally {
        if (active) setLoading(false)
      }
    }

    void fetchRequests()

    return () => {
      active = false
    }
  }, [organizationId, isSuperadmin, refreshKey])

  if (!isSuperadmin) {
    return null
  }

  const handleVote = async (requestId: string, decision: "approve" | "reject") => {
    setVotingId(requestId)
    try {
      const result = await voteSuperadminRemovalRequest(organizationId, requestId, decision)
      if (result.error) {
        toast.error(result.error.message)
      } else {
        toast.success(
          decision === "approve"
            ? "Vote to approve registered."
            : "Vote to reject registered."
        )
        setRefreshKey((k) => k + 1)
        onRequestUpdated?.()
      }
    } catch {
      toast.error("Failed to submit vote")
    } finally {
      setVotingId(null)
    }
  }

  const getEmployeeDisplay = (userId: string) => {
    const emp = employees.find((e) => e.id === userId)
    if (!emp) return userId
    const name = formatEmployeeName(emp)
    return name ? `${name} (${emp.email})` : emp.email
  }

  const getStatusBadge = (status: SuperadminRemovalRequest["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="warning-light">Pending Quorum</Badge>
      case "approved":
        return <Badge variant="success-light">Approved</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Active request for modal if any
  const modalRequest = selectedRequest
    ? requests.find((r) => r.id === selectedRequest.id) ?? selectedRequest
    : null

  const modalIsTarget = Boolean(currentUserId && modalRequest?.target_user_id === currentUserId)
  const modalUserVote = currentUserId && modalRequest
    ? modalRequest.votes.find((v) => v.voter_user_id === currentUserId)
    : undefined
  const canVoteModal = Boolean(
    modalRequest &&
    modalRequest.status === "pending" &&
    isSuperadmin &&
    !modalIsTarget &&
    !modalUserVote
  )

  return (
    <Card className="animate-in border-border/60 p-6 shadow-[var(--shadow-card)] duration-300 fade-in">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Superadmin Removal Quorum
            </h3>
            <p className="text-sm text-muted-foreground">
              Multi-party authorization requests for Superadmin role revocation. Click a request to view complete vote details.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-semibold text-foreground">Target Superadmin</TableHead>
              <TableHead className="font-semibold text-foreground">Requester</TableHead>
              <TableHead className="font-semibold text-foreground">Quorum Progress</TableHead>
              <TableHead className="font-semibold text-foreground">Status</TableHead>
              <TableHead className="text-right font-semibold text-foreground">Vote</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  <Clock className="mx-auto mb-1 size-5 animate-spin text-muted-foreground" />
                  Loading quorum requests...
                </TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No active or past superadmin removal requests found.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req) => {
                const approveVotes = req.votes.filter((v) => v.decision === "approve").length
                const isTarget = Boolean(currentUserId && req.target_user_id === currentUserId)
                const userVote = currentUserId
                  ? req.votes.find((v) => v.voter_user_id === currentUserId)
                  : undefined
                const canVote =
                  req.status === "pending" &&
                  isSuperadmin &&
                  !isTarget &&
                  !userVote

                return (
                  <TableRow
                    key={req.id}
                    className="cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => setSelectedRequest(req)}
                  >
                    <TableCell className="font-medium text-foreground">
                      {getEmployeeDisplay(req.target_user_id)}
                      {isTarget && (
                        <span className="ml-2 text-xs font-normal text-amber-600 dark:text-amber-400">
                          (You)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getEmployeeDisplay(req.requester_user_id)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className="font-semibold text-foreground">
                          {approveVotes} / {req.required_votes} Approvals
                        </span>
                        <span className="text-muted-foreground">
                          {req.votes.length} total vote{req.votes.length === 1 ? "" : "s"} cast
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {canVote ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => handleVote(req.id, "approve")}
                            disabled={votingId === req.id}
                          >
                            <Check className="size-3.5" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 gap-1"
                            onClick={() => handleVote(req.id, "reject")}
                            disabled={votingId === req.id}
                          >
                            <X className="size-3.5" />
                            Reject
                          </Button>
                        </div>
                      ) : userVote ? (
                        <Badge
                          variant={userVote.decision === "approve" ? "success-light" : "destructive"}
                          size="xs"
                        >
                          You voted: {userVote.decision}
                        </Badge>
                      ) : isTarget ? (
                        <span className="text-xs text-muted-foreground italic">Target (No vote)</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Quorum Request Details Modal ── */}
      {modalRequest && (
        <Dialog
          open={Boolean(modalRequest)}
          onOpenChange={(open) => {
            if (!open) setSelectedRequest(null)
          }}
        >
          <DialogContent className="sm:max-w-xl max-w-[calc(100vw-2rem)] overflow-hidden">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-5 text-amber-500" />
                <DialogTitle className="text-lg font-bold">
                  Superadmin Removal Request
                </DialogTitle>
              </div>
              <DialogDescription>
                Detailed multi-party authorization vote breakdown and governance records.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 overflow-hidden">
              {/* Target & Requester */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3 overflow-hidden">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    Target Superadmin
                  </span>
                  <p className="font-semibold text-foreground truncate">
                    {getEmployeeDisplay(modalRequest.target_user_id)}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3 overflow-hidden">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    Requested By
                  </span>
                  <p className="font-medium text-foreground truncate">
                    {getEmployeeDisplay(modalRequest.requester_user_id)}
                  </p>
                </div>
              </div>

              {/* Description / Reason */}
              <div className="rounded-lg border border-border/60 bg-muted/15 p-4 space-y-1.5 overflow-hidden">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Description / Reason
                </span>
                <p className="text-sm text-foreground whitespace-pre-wrap break-all [overflow-wrap:anywhere] leading-relaxed max-h-48 overflow-y-auto">
                  {modalRequest.reason || (
                    <span className="italic text-muted-foreground">
                      No specific reason provided by requester.
                    </span>
                  )}
                </p>
              </div>

              {/* Big Centered Vote Statistics */}
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block text-center mb-2.5">
                  Quorum Voting Summary
                </span>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4 flex flex-col items-center justify-center">
                    <span className="text-xs text-muted-foreground font-medium mb-1">
                      Total Votes
                    </span>
                    <span className="text-3xl font-extrabold text-foreground">
                      {modalRequest.votes.length}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      cast so far
                    </span>
                  </div>
                  <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 flex flex-col items-center justify-center">
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">
                      Accepted
                    </span>
                    <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      {modalRequest.votes.filter((v) => v.decision === "approve").length}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      of {modalRequest.required_votes} needed
                    </span>
                  </div>
                  <div className="rounded-xl border border-destructive/25 bg-destructive/10 p-4 flex flex-col items-center justify-center">
                    <span className="text-xs text-destructive font-medium mb-1">
                      Rejected
                    </span>
                    <span className="text-3xl font-extrabold text-destructive">
                      {modalRequest.votes.filter((v) => v.decision === "reject").length}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      rejections
                    </span>
                  </div>
                </div>
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3.5 py-2.5 text-xs text-muted-foreground">
                <span>Current Status</span>
                <div>{getStatusBadge(modalRequest.status)}</div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
              {canVoteModal && (
                <div className="flex gap-2 w-full sm:w-auto mr-auto">
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 flex-1 sm:flex-none"
                    onClick={async () => {
                      await handleVote(modalRequest.id, "approve")
                      setSelectedRequest(null)
                    }}
                    disabled={votingId === modalRequest.id}
                  >
                    <Check className="size-4" />
                    Approve Removal
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-1 flex-1 sm:flex-none"
                    onClick={async () => {
                      await handleVote(modalRequest.id, "reject")
                      setSelectedRequest(null)
                    }}
                    disabled={votingId === modalRequest.id}
                  >
                    <X className="size-4" />
                    Reject Removal
                  </Button>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRequest(null)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
}
