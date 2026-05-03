import { useMemo, useState } from "react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
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
  TableRow,
} from "@workspace/ui/components/table"
import { Link2, Plus, Trash2 } from "lucide-react"

type OrganizationStatus = "Active" | "Pending"

type Organization = {
  name: string
  domain: string
  plan: "Enterprise" | "Growth" | "Starter"
  collaborators: number
  status: OrganizationStatus
  created: string
}

const organizations: Organization[] = [
  {
    name: "Acme Industrial",
    domain: "acme.com",
    plan: "Enterprise",
    collaborators: 612,
    status: "Active",
    created: "2025-09-12",
  },
  {
    name: "Lumen Logistics",
    domain: "lumenlog.io",
    plan: "Growth",
    collaborators: 184,
    status: "Active",
    created: "2025-11-04",
  },
  {
    name: "Northwind Health",
    domain: "northwind.health",
    plan: "Starter",
    collaborators: 0,
    status: "Pending",
    created: "2026-04-18",
  },
  {
    name: "Vega Manufacturing",
    domain: "vega-mfg.com",
    plan: "Growth",
    collaborators: 298,
    status: "Active",
    created: "2024-12-01",
  },
]

const statusClass: Record<OrganizationStatus, string> = {
  Active: "border-transparent bg-[color:var(--success)]/15 text-[color:var(--success)]",
  Pending: "border-transparent bg-[color:var(--warning)]/15 text-[color:var(--warning)]",
}

const overview = [
  {
    label: "Total",
    value: organizations.length.toString(),
    hint: "organizations registered",
  },
  {
    label: "Active",
    value: organizations.filter((organization) => organization.status === "Active").length.toString(),
    hint: "with users registered",
  },
  {
    label: "Pending",
    value: organizations.filter((organization) => organization.status === "Pending").length.toString(),
    hint: "awaiting user registration",
  },
]

export function OrganizationsPage() {
  const [query, setQuery] = useState("")
  const filtered = useMemo(
    () =>
      organizations.filter((organization) =>
        `${organization.name} ${organization.domain}`.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  )

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-foreground">Overview</h2>
        <Button size="sm">
          <Plus className="size-4" />
          Create new organization
        </Button>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {overview.map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-0">
              <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
              <p className="mt-8 text-3xl font-semibold tracking-tight text-foreground">
                {item.value}
              </p>
              <p className="mt-6 text-xs text-muted-foreground">{item.hint}</p>
            </CardContent>
          </Card>
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
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((organization) => (
                  <TableRow key={organization.domain}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{organization.name}</p>
                        <p className="text-xs text-muted-foreground">{organization.domain}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{organization.plan}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {organization.collaborators}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusClass[organization.status]}>
                        {organization.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{organization.created}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {organization.status === "Pending" ? (
                          <Button variant="ghost" size="icon-sm" aria-label="Copy invitation link">
                            <Link2 className="size-4" />
                          </Button>
                        ) : null}
                        <Button variant="ghost" size="icon-sm" aria-label="Delete organization">
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
