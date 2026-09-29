import { useCallback, useEffect, useState, useMemo } from "react"
import {
  listSystemAuditLogs,
  type AuditLogItem,
} from "@workspace/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@workspace/ui/components/dialog"
import {
  CheckCircle2,
  AlertTriangle,
  Download,
  Search,
  RotateCw,
  Eye,
  FileText,
  Clock,
  Globe,
  Info,
  Shield,
} from "lucide-react"

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [actionFilter, setActionFilter] = useState<string>("ALL")
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null)

  const loadData = useCallback(async (targetPage = page, filter = actionFilter) => {
    setIsLoading(true)
    try {
      const logsRes = await listSystemAuditLogs({
        action: filter === "ALL" ? undefined : filter,
        page: targetPage,
        pageSize,
      })
      if (logsRes) {
        setLogs(logsRes.items)
        setTotal(logsRes.total)
        setPage(logsRes.page)
      }
    } catch (err) {
      console.error("Failed to load global audit logs:", err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [actionFilter, page, pageSize])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData(1, actionFilter)
  }, [actionFilter, loadData])

  const handleRefresh = () => {
    setIsRefreshing(true)
    void loadData(page, actionFilter)
  }

  const handleFilterChange = (newFilter: string) => {
    setActionFilter(newFilter)
    setPage(1)
  }

  const filteredLogs = useMemo(() => {
    if (!searchTerm.trim()) return logs
    const term = searchTerm.toLowerCase()
    return logs.filter(
      (l) =>
        l.user_email?.toLowerCase().includes(term) ||
        l.user_name?.toLowerCase().includes(term) ||
        l.action.toLowerCase().includes(term) ||
        (l.organization_id && l.organization_id.toLowerCase().includes(term))
    )
  }, [logs, searchTerm])

  const totalPages = Math.ceil(total / pageSize) || 1

  const formatDateTime = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(dateStr))
    } catch {
      return dateStr
    }
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CONSENT_ACCEPTED":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1 font-medium">
            <CheckCircle2 className="size-3" />
            Consent Accepted
          </Badge>
        )
      case "CONSENT_REVOKED":
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1 font-medium">
            <AlertTriangle className="size-3" />
            Consent Revoked
          </Badge>
        )
      case "DATA_EXPORTED":
        return (
          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 gap-1 font-medium">
            <Download className="size-3" />
            Data Exported
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="gap-1 font-medium">
            <FileText className="size-3" />
            {action.replace(/_/g, " ")}
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              System Audit Trail
            </h1>
            <Badge variant="outline" className="h-6 border-primary/30 text-primary text-[11px]">
              Global Compliance
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform-wide immutable trace of consent agreements, data exports, and administrative events.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading || isRefreshing}
          className="h-9 gap-1.5 self-start sm:self-auto text-xs"
        >
          <RotateCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Main Table Card */}
      <Card className="border border-border/70 shadow-xs">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                All Audit Records
              </CardTitle>
              <CardDescription className="text-xs">
                Filter and inspect legal compliance events across all tenant organizations.
              </CardDescription>
            </div>

            {/* Filter Buttons & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Filter by user or action..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 pl-9 text-xs"
                />
              </div>

              <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 p-1">
                <Button
                  variant={actionFilter === "ALL" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => handleFilterChange("ALL")}
                  className="h-7 px-2.5 text-xs"
                >
                  All
                </Button>
                <Button
                  variant={actionFilter === "CONSENT_ACCEPTED" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => handleFilterChange("CONSENT_ACCEPTED")}
                  className="h-7 px-2.5 text-xs"
                >
                  Accepted
                </Button>
                <Button
                  variant={actionFilter === "CONSENT_REVOKED" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => handleFilterChange("CONSENT_REVOKED")}
                  className="h-7 px-2.5 text-xs"
                >
                  Revoked
                </Button>
                <Button
                  variant={actionFilter === "DATA_EXPORTED" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => handleFilterChange("DATA_EXPORTED")}
                  className="h-7 px-2.5 text-xs"
                >
                  Exports
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-xs text-muted-foreground">Loading system audit records...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Info className="size-8 text-muted-foreground/60" />
              <p className="text-sm font-medium text-foreground">No audit entries found</p>
              <p className="text-xs text-muted-foreground">
                No system audit events matched your search filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[180px] text-xs font-semibold">Action</TableHead>
                    <TableHead className="text-xs font-semibold">User</TableHead>
                    <TableHead className="text-xs font-semibold">Organization ID</TableHead>
                    <TableHead className="w-[180px] text-xs font-semibold">Timestamp</TableHead>
                    <TableHead className="w-[100px] text-right text-xs font-semibold">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/20">
                      <TableCell className="py-3">
                        {getActionBadge(log.action)}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium text-foreground">
                            {log.user_name || log.user_email || "System/Anonymous"}
                          </p>
                          {log.user_name && log.user_email && (
                            <p className="text-[11px] text-muted-foreground">{log.user_email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground font-mono">
                        {log.organization_id || "Platform Global"}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="size-3 shrink-0 text-muted-foreground/60" />
                          <span>{formatDateTime(log.created_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                          className="h-7 w-7 p-0"
                          title="View payload"
                        >
                          <Eye className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Footer */}
          <div className="flex items-center justify-between border-t border-border/50 px-4 py-3 text-xs text-muted-foreground">
            <div>
              Total: <span className="font-medium text-foreground">{total}</span> record(s)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isLoading}
                onClick={() => void loadData(page - 1)}
                className="h-7 px-2 text-xs"
              >
                Previous
              </Button>
              <span>
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isLoading}
                onClick={() => void loadData(page + 1)}
                className="h-7 px-2 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inspect Log Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Shield className="size-5 text-primary" />
              Audit Record Payload
            </DialogTitle>
            <DialogDescription className="text-xs">
              Full cryptographic metadata and audit trail parameters.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/70 bg-muted/20 p-3">
                <div>
                  <span className="font-semibold text-foreground">Event ID:</span>
                  <p className="font-mono text-[11px] text-muted-foreground truncate">{selectedLog.id}</p>
                </div>
                <div>
                  <span className="font-semibold text-foreground">Action:</span>
                  <p className="text-muted-foreground">{selectedLog.action}</p>
                </div>
                <div>
                  <span className="font-semibold text-foreground">User ID:</span>
                  <p className="font-mono text-[11px] text-muted-foreground truncate">{selectedLog.user_id || "N/A"}</p>
                </div>
                <div>
                  <span className="font-semibold text-foreground">Timestamp:</span>
                  <p className="text-muted-foreground">{formatDateTime(selectedLog.created_at)}</p>
                </div>
              </div>

              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-semibold text-foreground">Raw Details:</span>
                  <pre className="max-h-60 overflow-y-auto rounded-lg border border-border/70 bg-muted/40 p-3 font-mono text-[11px] leading-relaxed text-foreground">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}

              {Boolean(selectedLog.details?.ip_address) && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="size-3.5" />
                  <span>IP Address: {String(selectedLog.details.ip_address)}</span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
