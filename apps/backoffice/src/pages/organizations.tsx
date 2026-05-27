import { useEffect, useMemo, useState, useRef } from "react"
import { CreateOrganizationDialog } from "@workspace/auth/components/create-organization-dialog"
import {
  listOrganizations,
  type OrganizationResponse,
} from "@workspace/api"

import {
  OverviewStatCard,
  OverviewStatCardSkeleton,
} from "@workspace/components/components/card"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { toast } from "@workspace/ui/components/sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRowsSkeleton,
  TableRow,
} from "@workspace/ui/components/table"
import { Link2, Plus, Trash2 } from "lucide-react"

type OrganizationStatus = "Active" | "Pending"

interface Organization extends OrganizationResponse {
  status: OrganizationStatus
  collaborators: number
}

const statusClass: Record<OrganizationStatus, string> = {
  Active:
    "border-transparent bg-[color:var(--success)]/15 text-[color:var(--success)]",
  Pending:
    "border-transparent bg-[color:var(--warning)]/15 text-[color:var(--warning)]",
}

const organizationsTableSkeletonColumns = [
  { lines: ["h-4 w-36", "h-3 w-24"] },
  { skeletonClassName: "h-4 w-8" },
  { skeletonClassName: "h-4 w-10" },
  { skeletonClassName: "h-6 w-20 rounded-full" },
  {
    cellClassName: "text-right",
    skeletonClassName: "ml-auto h-8 w-16",
  },
]

export function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const loadOrganizationsRef = useRef<() => Promise<void>>(() =>
    Promise.resolve()
  )

  const filtered = useMemo(
    () =>
      organizations.filter((organization) =>
        `${organization.name} ${organization.slug}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [organizations, query]
  )

  useEffect(() => {
    const loadOrganizations = async () => {
      setLoading(true)
      try {
        const orgs = await listOrganizations()
        setOrganizations(
          orgs.map((org) => ({
            ...org,
            status: (org.collaborators_count > 0 ? "Active" : "Pending") as OrganizationStatus,
            collaborators: org.collaborators_count,
          }))
        )
      } finally {
        setLoading(false)
      }
    }

    loadOrganizationsRef.current = loadOrganizations
    void loadOrganizations()
  }, [])

  const overview = [
    {
      label: "Total",
      value: organizations.length.toString(),
      hint: "organizations registered",
    },
    {
      label: "Active",
      value: organizations
        .filter((organization) => organization.status === "Active")
        .length.toString(),
      hint: "with users registered",
    },
    {
      label: "Pending",
      value: organizations
        .filter((organization) => organization.status === "Pending")
        .length.toString(),
      hint: "awaiting user registration",
    },
  ]

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-foreground">Overview</h2>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          Create new organization
        </Button>
      </div>

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

      <Card>
        <CardHeader className="gap-4 sm:grid-cols-[1fr_280px]">
          <div>
            <CardTitle>List</CardTitle>
            <CardDescription>Search by name or domain.</CardDescription>
          </div>
          <Input
            type="search"
            placeholder="Search organization..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-border/60">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Collaborators</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRowsSkeleton
                    rows={5}
                    columns={organizationsTableSkeletonColumns}
                  />
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-4 text-center text-muted-foreground"
                    >
                      {organizations.length === 0
                        ? "No organizations yet"
                        : "No organizations match your search"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((organization) => (
                    <TableRow key={organization.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">
                            {organization.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {organization.slug}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">-</TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {organization.collaborators}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusClass[organization.status]}
                        >
                          {organization.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {organization.status === "Pending" ? (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Copy invitation link"
                            >
                              <Link2 className="size-4" />
                            </Button>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Delete organization"
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
        </CardContent>
      </Card>

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
    </div>
  )
}

export default OrganizationsPage
