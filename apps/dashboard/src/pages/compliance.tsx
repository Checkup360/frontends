import { formatEnumLabel } from "@workspace/ui/lib/format-enum-label"
import { useCallback, useEffect, useState, useMemo } from "react"
import {
  listOrganizationAuditLogs,
  getOrganizationComplianceSummary,
  type AuditLogItem,
  type ConsentComplianceSummary,
} from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { Card } from "@workspace/ui/components/card"
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
  OverviewStatCard,
  OverviewStatCardSkeleton,
} from "@workspace/components/components/card"
import { TablePagination } from "@workspace/components/components/table-pagination"
import {
  ShieldCheck,
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
  Copy,
  Check,
} from "lucide-react"

export function CompliancePage() {
  const { user } = useCurrentUser()
  const orgId = user?.membership?.organization_id

  const [summary, setSummary] = useState<ConsentComplianceSummary | null>(null)
  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [actionFilter, setActionFilter] = useState<string>("ALL")
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null)
  const [copied, setCopied] = useState(false)

  const loadData = useCallback(
    async (
      targetPage = page,
      filter = actionFilter,
      targetPageSize = pageSize
    ) => {
      if (!orgId) return
      setIsLoading(true)
      try {
        const [summaryRes, logsRes] = await Promise.all([
          getOrganizationComplianceSummary(orgId),
          listOrganizationAuditLogs({
            organizationId: orgId,
            action: filter === "ALL" ? undefined : filter,
            page: targetPage,
            pageSize: targetPageSize,
          }),
        ])
        setSummary(summaryRes)
        if (logsRes) {
          setLogs(logsRes.items)
          setTotal(logsRes.total)
          setPage(logsRes.page)
        }
      } catch (err) {
        console.error("Failed to load compliance data:", err)
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [orgId, page, actionFilter, pageSize]
  )

  useEffect(() => {
    if (!orgId) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData(1, actionFilter, pageSize)
  }, [orgId, actionFilter, pageSize, loadData])

  const handleRefresh = () => {
    setIsRefreshing(true)
    void loadData(page, actionFilter, pageSize)
  }

  const handleFilterChange = (newFilter: string) => {
    setActionFilter(newFilter)
    setPage(1)
  }

  const handleCopyPayload = (payload: unknown) => {
    if (!payload) return
    const text = JSON.stringify(payload, null, 2)
    void navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filteredLogs = useMemo(() => {
    if (!searchTerm.trim()) return logs
    const term = searchTerm.toLowerCase()
    return logs.filter(
      (l) =>
        l.user_email?.toLowerCase().includes(term) ||
        l.user_name?.toLowerCase().includes(term) ||
        l.action.toLowerCase().includes(term) ||
        (l.details?.form_type &&
          String(l.details.form_type).toLowerCase().includes(term))
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
          <Badge variant="success-light" className="gap-1 font-medium">
            <CheckCircle2 className="size-3" />
            Consent Accepted
          </Badge>
        )
      case "CONSENT_REVOKED":
        return (
          <Badge variant="warning-light" className="gap-1 font-medium">
            <AlertTriangle className="size-3" />
            Consent Revoked
          </Badge>
        )
      case "DATA_EXPORTED":
        return (
          <Badge variant="info-light" className="gap-1 font-medium">
            <Download className="size-3" />
            Data Exported
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="gap-1 font-medium">
            <FileText className="size-3" />
            {formatEnumLabel(action)}
          </Badge>
        )
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        title="Compliance & Legal Audit"
        description="Immutable log of user consents, data processing authorizations, and access events."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            className="h-9 shrink-0 gap-1.5 rounded-lg text-xs"
          >
            <RotateCw
              className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh Audit Trail
          </Button>
        }
      />

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading && !summary ? (
          Array.from({ length: 4 }).map((_, index) => (
            <OverviewStatCardSkeleton key={index} />
          ))
        ) : (
          <>
            <OverviewStatCard
              icon={ShieldCheck}
              iconVariant="icon"
              tone="primary"
              label="Total audit events"
              value={summary ? summary.total_audit_events.toString() : "0"}
              hint="Registered compliance actions"
            />
            <OverviewStatCard
              icon={CheckCircle2}
              iconVariant="icon"
              tone="success"
              label="Consents accepted"
              value={summary ? summary.consent_accepted_count.toString() : "0"}
              hint="Active terms & form consents"
            />
            <OverviewStatCard
              icon={AlertTriangle}
              iconVariant="icon"
              tone={
                summary && summary.consent_revoked_count > 0
                  ? "warning"
                  : "primary"
              }
              label="Consents revoked"
              value={summary ? summary.consent_revoked_count.toString() : "0"}
              hint="Revoked authorizations"
            />
            <OverviewStatCard
              icon={Download}
              iconVariant="icon"
              tone="primary"
              label="Data exports"
              value={summary ? summary.data_exported_count.toString() : "0"}
              hint="Member data downloads"
            />
          </>
        )}
      </section>

      {/* Audit Log Table Card */}
      <Card className="rounded-xl border border-border/60 bg-card p-6 shadow-xs">
        {/* Card Header */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
              <FileText className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                Audit Trail
              </h3>
              <p className="text-sm text-muted-foreground">
                Immutable records stored chronologically with cryptographic event traces.
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Filter by member, action, or form..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full bg-background pl-9 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 self-start rounded-lg border border-border/60 bg-muted/30 p-1 sm:self-auto">
            <Button
              variant={actionFilter === "ALL" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleFilterChange("ALL")}
              className="h-7 px-3 text-xs"
            >
              All
            </Button>
            <Button
              variant={actionFilter === "CONSENT_ACCEPTED" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleFilterChange("CONSENT_ACCEPTED")}
              className="h-7 px-3 text-xs"
            >
              Accepted
            </Button>
            <Button
              variant={actionFilter === "CONSENT_REVOKED" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleFilterChange("CONSENT_REVOKED")}
              className="h-7 px-3 text-xs"
            >
              Revoked
            </Button>
            <Button
              variant={actionFilter === "DATA_EXPORTED" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleFilterChange("DATA_EXPORTED")}
              className="h-7 px-3 text-xs"
            >
              Exports
            </Button>
          </div>
        </div>

        {/* Table Area */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="size-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-xs text-muted-foreground">
              Loading audit log trail...
            </p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Info className="size-8 text-muted-foreground/60" />
            <p className="text-sm font-medium text-foreground">
              No audit entries found
            </p>
            <p className="text-xs text-muted-foreground">
              No events matched your current filter criteria.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-border/60">
              <Table className="min-w-[720px]">
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-[190px] text-xs font-semibold">
                      Action
                    </TableHead>
                    <TableHead className="min-w-[190px] text-xs font-semibold">
                      Member
                    </TableHead>
                    <TableHead className="min-w-[200px] text-xs font-semibold">
                      Details / Context
                    </TableHead>
                    <TableHead className="w-[190px] whitespace-nowrap text-xs font-semibold">
                      Date & Time
                    </TableHead>
                    <TableHead className="w-[80px] text-right text-xs font-semibold">
                      Inspect
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const formType = log.details?.form_type
                      ? String(log.details.form_type)
                      : null
                    const consentType = log.details?.consent_type
                      ? String(log.details.consent_type)
                      : null
                    const version = log.details?.document_version
                      ? String(log.details.document_version)
                      : null

                    return (
                      <TableRow key={log.id} className="hover:bg-muted/20">
                        <TableCell className="py-3">
                          {getActionBadge(log.action)}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="space-y-0.5">
                            <p className="text-xs font-medium text-foreground">
                              {log.user_name ||
                                log.user_email ||
                                "System / Automated"}
                            </p>
                            {log.user_name && log.user_email && (
                              <p className="text-[11px] text-muted-foreground">
                                {log.user_email}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground">
                          {formType && (
                            <span className="font-medium text-foreground">
                              Form: {formatEnumLabel(formType)}
                            </span>
                          )}
                          {!formType && consentType && (
                            <span className="font-medium text-foreground">
                              {formatEnumLabel(consentType)}
                            </span>
                          )}
                          {version && (
                            <span className="ml-1 text-muted-foreground/80">
                              v{version}
                            </span>
                          )}
                          {!formType &&
                            !consentType &&
                            log.action === "DATA_EXPORTED" && (
                              <span>Personal data portfolio exported</span>
                            )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap py-3 text-xs text-muted-foreground">
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
                            className="size-8 p-0 hover:bg-muted"
                            title="Inspect event details"
                            aria-label="Inspect event details"
                          >
                            <Eye className="size-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {total > 0 && (
              <TablePagination
                currentPage={page}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={total}
                onPageChange={(newPage) =>
                  void loadData(newPage, actionFilter, pageSize)
                }
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize)
                  setPage(1)
                  void loadData(1, actionFilter, newSize)
                }}
                pageSizeOptions={[10, 25, 50, 100]}
                itemLabel="events"
                loading={isLoading}
              />
            )}
          </>
        )}
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
        <DialogContent className="rounded-xl max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-xl md:max-w-2xl">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold tracking-tight">
                  Audit Event Details
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Cryptographic trace, user identity, and payload recorded for
                  compliance.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 py-2 text-xs">
              {/* Event Metadata Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="overflow-hidden rounded-lg border border-border/60 bg-muted/20 p-3">
                  <span className="mb-1 block text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    Action
                  </span>
                  <div>{getActionBadge(selectedLog.action)}</div>
                </div>

                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <span className="mb-1 block text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    Resource Type
                  </span>
                  <p className="font-mono font-medium text-foreground break-all">
                    {selectedLog.resource_type}
                  </p>
                  {selectedLog.resource_id && (
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground break-all select-all">
                      ID: {selectedLog.resource_id}
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <span className="mb-1 block text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    User / Actor
                  </span>
                  <div className="space-y-0.5">
                    <p className="font-medium text-foreground">
                      {selectedLog.user_name ||
                        selectedLog.user_email ||
                        "System / Automated"}
                    </p>
                    {selectedLog.user_name && selectedLog.user_email && (
                      <p className="text-[11px] text-muted-foreground break-all">
                        {selectedLog.user_email}
                      </p>
                    )}
                    {selectedLog.user_id && (
                      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground break-all select-all">
                        UID: {selectedLog.user_id}
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <span className="mb-1 block text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    Timestamp
                  </span>
                  <div className="flex items-center gap-1.5 text-foreground">
                    <Clock className="size-3.5 shrink-0 text-muted-foreground" />
                    <span>
                      {formatDateTime(selectedLog.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Client Network Origin */}
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

              {/* Event Payload */}
              {selectedLog.details &&
                Object.keys(selectedLog.details).length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">
                        Event Payload
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
                      <pre className="max-h-56 overflow-auto font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all">
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
