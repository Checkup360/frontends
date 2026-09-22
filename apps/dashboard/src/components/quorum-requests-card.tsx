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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { toast } from "@workspace/ui/components/sonner"
import { formatEmployeeName } from "@workspace/components/components/employee-profile-card"
import { ShieldAlert, Check, X, Clock, RefreshCw } from "lucide-react"
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

  const isSuperadmin = user?.membership?.roles?.includes("superadmin") ?? false
  const currentEmployee = employees.find((e) => e.email === user?.email)
  const currentUserId = currentEmployee?.id

  useEffect(() => {
    let active = true

    async function fetchRequests() {
      if (!organizationId) {
        setRequests([])
        setLoading(false)
        return
      }

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
  }, [organizationId, refreshKey])

  if (!isSuperadmin && requests.length === 0) {
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
              Multi-party authorization requests for Superadmin role revocation.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setRefreshKey((k) => k + 1)}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-semibold text-foreground">Target Superadmin</TableHead>
              <TableHead className="font-semibold text-foreground">Requester</TableHead>
              <TableHead className="font-semibold text-foreground">Reason</TableHead>
              <TableHead className="font-semibold text-foreground">Quorum Progress</TableHead>
              <TableHead className="font-semibold text-foreground">Status</TableHead>
              <TableHead className="text-right font-semibold text-foreground">Vote</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  <Clock className="mx-auto mb-1 size-5 animate-spin text-muted-foreground" />
                  Loading quorum requests...
                </TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No active or past superadmin removal requests found.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req) => {
                const approveVotes = req.votes.filter((v) => v.decision === "approve").length
                const rejectVotes = req.votes.filter((v) => v.decision === "reject").length
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
                  <TableRow key={req.id}>
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
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {req.reason || <span className="italic text-muted-foreground/60">None provided</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className="font-medium text-foreground">
                          {approveVotes} / {req.required_votes} Approvals
                        </span>
                        <span className="text-muted-foreground">
                          ({rejectVotes} rejects)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell className="text-right">
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
    </Card>
  )
}
