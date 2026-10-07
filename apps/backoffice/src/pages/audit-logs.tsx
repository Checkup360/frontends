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
import { PageHeader } from "@workspace/components/components/page-header"
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
  Copy,
  Check,
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
  const [copied, setCopied] = useState(false)

  const handleCopyPayload = (details: Record<string, unknown> | undefined) => {
    if (!details) return
    void navigator.clipboard.writeText(JSON.stringify(details, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
          <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1 font-medium">
            <CheckCircle2 className="size-3" />
            Consent Accepted
          </Badge>
        )
      case "CONSENT_REVOKED":
        return (
          <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 font-medium">
            <AlertTriangle className="size-3" />
            Consent Revoked
          </Badge>
        )
      case "DATA_EXPORTED":
        return (
          <Badge variant="outline" className="border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400 gap-1 font-medium">
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
      <PageHeader
        title="System Audit Trail"
        badge={
          <Badge variant="outline" className="h-6 border-primary/30 text-primary text-[11px]">
            Global Compliance
          </Badge>
        }
        description="Platform-wide immutable trace of consent agreements, data exports, and administrative events."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            className="h-9 gap-1.5 rounded-lg text-xs"
          >
            <RotateCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      {/* Main Table Card */}
      <Card className="rounded-xl border border-border/60 bg-card shadow-xs">
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
      <Dialog
        open={Boolean(selectedLog)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLog(null)
            setCopied(false)
          }
        }}
      >
        <DialogContent className="rounded-xl max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-2xl md:max-w-3xl">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                <Shield className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold tracking-tight">
                  Audit Record Payload
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Full cryptographic metadata, consent trace, and audit trail parameters.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 py-2 text-xs">
              {/* Event & Actor Metadata */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Event Details */}
                <div className="space-y-2.5 rounded-lg border border-border/60 bg-muted/20 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                      Action
                    </span>
                    <div>{getActionBadge(selectedLog.action)}</div>
                  </div>

                  <div>
                    <span className="mb-0.5 block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                      Event ID
                    </span>
                    <p className="font-mono text-[11px] font-medium text-foreground break-all select-all">
                      {selectedLog.id}
                    </p>
                  </div>

                  <div>
                    <span className="mb-0.5 block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                      Timestamp
                    </span>
                    <div className="flex items-center gap-1.5 text-foreground">
                      <Clock className="size-3.5 shrink-0 text-muted-foreground" />
                      <span>{formatDateTime(selectedLog.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Actor & Scope */}
                <div className="space-y-2.5 rounded-lg border border-border/60 bg-muted/20 p-3.5">
                  <div>
                    <span className="mb-0.5 block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                      User / Actor
                    </span>
                    <p className="font-medium text-foreground">
                      {selectedLog.user_name || selectedLog.user_email || "System / Anonymous"}
                    </p>
                    {selectedLog.user_name && selectedLog.user_email && (
                      <p className="text-[11px] text-muted-foreground break-all">{selectedLog.user_email}</p>
                    )}
                  </div>

                  {selectedLog.user_id && (
                    <div>
                      <span className="mb-0.5 block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                        User ID (UID)
                      </span>
                      <p className="font-mono text-[11px] text-muted-foreground break-all select-all">
                        {selectedLog.user_id}
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="mb-0.5 block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                      Organization
                    </span>
                    <p className="font-mono text-[11px] text-muted-foreground break-all select-all">
                      {selectedLog.organization_id || "Platform Global"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Client & Network Origin */}
              {(Boolean(selectedLog.details?.ip_address) ||
                Boolean(selectedLog.details?.user_agent)) && (
                <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Globe className="size-3.5 text-primary" />
                    <span>Client & Network Origin</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {Boolean(selectedLog.details?.ip_address) && (
                      <div>
                        <span className="block text-[11px] text-muted-foreground">
                          IP Address
                        </span>
                        <span className="font-mono font-medium text-foreground">
                          {String(selectedLog.details.ip_address)}
                        </span>
                      </div>
                    )}
                    {Boolean(selectedLog.details?.user_agent) && (
                      <div className="sm:col-span-2">
                        <span className="block text-[11px] text-muted-foreground">
                          User Agent
                        </span>
                        <span className="break-all font-mono text-[11px] text-muted-foreground">
                          {String(selectedLog.details.user_agent)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Raw JSON Payload */}
              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      Cryptographic & Legal Payload
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyPayload(selectedLog.details)}
                      className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {copied ? (
                        <>
                          <Check className="size-3 text-emerald-500" />
                          <span className="text-emerald-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" />
                          <span>Copy JSON</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="relative rounded-lg border border-border/70 bg-zinc-950 p-3 text-zinc-100 dark:bg-zinc-900/90">
                    <pre className="max-h-60 overflow-auto font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Close Button Footer */}
              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedLog(null)}
                  className="h-8 px-4 text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
