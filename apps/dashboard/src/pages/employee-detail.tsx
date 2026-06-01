import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  listOrganizationEmployees,
  type OrganizationEmployee,
} from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import {
  MemberOverview,
  MemberOverviewSkeleton,
} from "@workspace/components/components/member-overview"
import { AssignDepartmentForm } from "@workspace/components/components/assign-department-form"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { ArrowLeft, Building2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useCurrentUser()
  const organizationId = user?.membership?.organization_id

  const [employee, setEmployee] = useState<OrganizationEmployee | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const loadEmployee = async () => {
    if (!organizationId || !id) return
    setLoading(true)
    setError("")
    try {
      const employees = await listOrganizationEmployees(organizationId)
      const found = employees.find((e) => e.id === id)
      if (found) {
        setEmployee(found)
      } else {
        setError("Employee not found.")
      }
    } catch {
      setError("Failed to load employee details.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!organizationId || !id) return
      setLoading(true)
      setError("")
      try {
        const employees = await listOrganizationEmployees(organizationId)
        const found = employees.find((e) => e.id === id)
        if (active) {
          if (found) {
            setEmployee(found)
          } else {
            setError("Employee not found.")
          }
        }
      } catch {
        if (active) setError("Failed to load employee details.")
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [organizationId, id])

  if (loading) {
    return <MemberOverviewSkeleton showBack />
  }

  if (error || !employee) {
    return (
      <Card className="mx-auto mt-12 max-w-md animate-in border-destructive/20 bg-destructive/5 duration-300 fade-in">
        <CardContent className="space-y-4 pt-6 text-center">
          <p className="font-medium text-destructive">
            {error || "Employee not found."}
          </p>
          <button
            onClick={() => navigate("/employees")}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Go back to employees
          </button>
        </CardContent>
      </Card>
    )
  }

  const handleRefresh = () => {
    void loadEmployee()
  }

  const handleAssignSuccess = () => {
    setIsDialogOpen(false)
    handleRefresh()
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/employees")}
          aria-label="Back"
          className="shrink-0"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{employee.email}</h1>
          <div className="mt-2 flex gap-2">
            {employee.roles.map((role) => (
              <Badge key={role} variant="outline" className="capitalize">
                {role}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {organizationId && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="size-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Department</p>
                <p className="text-xs text-muted-foreground">
                  {employee.department
                    ? "Currently assigned"
                    : "Not assigned yet"}
                </p>
              </div>
            </div>
            <div>
              {employee.department ? (
                <Badge className="border-blue-200 bg-blue-50 text-blue-700">
                  {employee.department.name}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  Unassigned
                </Badge>
              )}
            </div>
            <Button
              onClick={() => setIsDialogOpen(true)}
              variant="outline"
              className="w-full"
            >
              {employee.department ? "Change Department" : "Assign Department"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {employee.department ? "Change" : "Assign"} Department
            </DialogTitle>
            <DialogDescription>
              Select a department for {employee.email}
            </DialogDescription>
          </DialogHeader>
          {organizationId && (
            <AssignDepartmentForm
              organizationId={organizationId}
              employee={employee}
              onSuccess={handleAssignSuccess}
              compact
            />
          )}
        </DialogContent>
      </Dialog>

      <MemberOverview email={employee.email} showBack={false} />
    </div>
  )
}
