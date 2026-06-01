import {
  listOrganizationEmployees,
  type OrganizationEmployeeRole,
} from "@workspace/api"
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
import { useEffect, useMemo, useState } from "react"

type Worker = {
  id: string
  email: string
  area: string
  score: string
  risk: "Pending"
  lastCheck: string
}

const riskClass: Record<Worker["risk"], string> = {
  Pending: "bg-muted text-muted-foreground border-transparent",
}

const MEMBER_ROLES: OrganizationEmployeeRole[] = ["member"]

interface EmployeesTableProps {
  organizationId: string | null | undefined
  roles?: OrganizationEmployeeRole[]
}

export function EmployeesTable({
  organizationId,
  roles = MEMBER_ROLES,
}: EmployeesTableProps) {
  const [q, setQ] = useState("")
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadEmployees() {
      if (!organizationId) {
        setWorkers([])
        setLoading(false)
        return
      }
      setLoading(true)
      const employees = await listOrganizationEmployees(organizationId, roles)
      if (!active) return
      setWorkers(
        employees.map((employee) => ({
          id: employee.id,
          email: employee.email,
          area: employee.department?.name ?? "Unassigned",
          score: "N/A",
          risk: "Pending",
          lastCheck: "Not assessed",
        }))
      )
      setLoading(false)
    }

    void loadEmployees()

    return () => {
      active = false
    }
  }, [organizationId, roles])

  const filtered = useMemo(
    () =>
      workers.filter((w) =>
        `${w.email} ${w.area}`.toLowerCase().includes(q.toLowerCase())
      ),
    [q, workers]
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
          placeholder="Search by email or area..."
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
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-28 text-center text-muted-foreground"
                >
                  Loading employees...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-28 text-center text-muted-foreground"
                >
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium text-foreground">
                    {w.email}
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
