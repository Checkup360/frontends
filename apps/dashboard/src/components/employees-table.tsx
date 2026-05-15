import { Card } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { useMemo, useState } from "react"

type Worker = {
  name: string
  area: string
  score: number
  risk: "Low" | "Medium" | "High"
  lastCheck: string
}

const workers: Worker[] = [
  {
    name: "Lucy Mendez",
    area: "Operations",
    score: 88,
    risk: "Low",
    lastCheck: "3 days ago",
  },
  {
    name: "Carlos Perez",
    area: "Production",
    score: 62,
    risk: "High",
    lastCheck: "1 week ago",
  },
  {
    name: "Mariana Soto",
    area: "Administration",
    score: 91,
    risk: "Low",
    lastCheck: "2 days ago",
  },
  {
    name: "Diego Ramirez",
    area: "Logistics",
    score: 71,
    risk: "Medium",
    lastCheck: "5 days ago",
  },
  {
    name: "Sofia Alvarez",
    area: "IT",
    score: 84,
    risk: "Low",
    lastCheck: "yesterday",
  },
  {
    name: "Javier Torres",
    area: "Production",
    score: 58,
    risk: "High",
    lastCheck: "2 weeks ago",
  },
  {
    name: "Paula Gomez",
    area: "Sales",
    score: 76,
    risk: "Medium",
    lastCheck: "4 days ago",
  },
]

const riskClass: Record<Worker["risk"], string> = {
  Low: "bg-[color:var(--success)]/15 text-[color:var(--success)] border-transparent",
  Medium:
    "bg-[color:var(--warning)]/15 text-[color:var(--warning)] border-transparent",
  High: "bg-destructive/15 text-destructive border-transparent",
}

export function EmployeesTable() {
  const [q, setQ] = useState("")
  const filtered = useMemo(
    () =>
      workers.filter((w) =>
        `${w.name} ${w.area}`.toLowerCase().includes(q.toLowerCase())
      ),
    [q]
  )
  return (
    <Card className="border-border/60 p-6 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Employees</h3>
          <p className="text-sm text-muted-foreground">
            Individual data and risk level
          </p>
        </div>
        <Input
          type="text"
          placeholder="Search by name or area…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full sm:max-w-xs"
        />
      </div>
      <div className="overflow-hidden rounded-lg border border-border/60">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Last assessment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((w) => (
              <TableRow key={w.name}>
                <TableCell className="font-medium text-foreground">
                  {w.name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {w.area}
                </TableCell>
                <TableCell className="font-semibold text-foreground tabular-nums">
                  {w.score}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={riskClass[w.risk]}>
                    {w.risk}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {w.lastCheck}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
