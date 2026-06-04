import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  listOrganizationEmployees,
  type OrganizationEmployee,
} from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { AssignDepartmentForm } from "@workspace/components/components/assign-department-form"
import {
  HealthScoreCard,
  type HealthScoreRow,
} from "@workspace/components/components/health-score-card"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
} from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import {
  ArrowLeft,
  Dumbbell,
  Moon,
  Stethoscope,
  Apple,
  Clock,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"

const healthIndicators: HealthScoreRow[] = [
  { label: "Physical Activity", value: 85, icon: Dumbbell, tone: "green" },
  { label: "Sleep Quality", value: 72, icon: Moon, tone: "amber" },
  { label: "Preventive Care", value: 90, icon: Stethoscope, tone: "blue" },
  { label: "Nutrition Profile", value: 80, icon: Apple, tone: "green" },
]

function EmployeeDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
        <div className="md:col-span-1">
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

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
    return <EmployeeDetailSkeleton />
  }

  if (error || !employee) {
    return (
      <Card className="mx-auto mt-12 max-w-md border-destructive/20 bg-destructive/5">
        <CardContent className="space-y-4 pt-6 text-center">
          <p className="font-medium text-destructive">
            {error || "Employee not found."}
          </p>
          <Button
            onClick={() => navigate("/employees")}
            variant="link"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Go back to employees
          </Button>
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
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/employees")}
          className="size-9 rounded-lg border border-border/40 hover:bg-muted/50"
          aria-label="Back to employees"
        >
          <ArrowLeft className="size-4 text-muted-foreground" />
        </Button>
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Employees
          </span>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            {employee.email}
          </h2>
        </div>
      </div>

      <div className="grid animate-in gap-6 duration-300 fade-in md:grid-cols-3">
        {/* Left Side: Profile & Department Assignment Cards */}
        <div className="space-y-6 md:col-span-2">
          {/* Card 1: Profile Details */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Profile</CardTitle>
              <CardDescription>
                Basic account credentials and active status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 border-t border-border/40 pt-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <span className="block text-xs font-semibold text-muted-foreground">
                    Email Address
                  </span>
                  <p className="text-sm font-medium text-foreground">
                    {employee.email}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="block text-xs font-semibold text-muted-foreground">
                    Status
                  </span>
                  <div>
                    <Badge
                      variant="outline"
                      className={
                        employee.status === "active"
                          ? "border-emerald-500/20 bg-emerald-500/10 font-medium text-emerald-600 capitalize dark:text-emerald-400"
                          : "border-amber-500/20 bg-amber-500/10 font-medium text-amber-600 capitalize dark:text-amber-400"
                      }
                    >
                      {employee.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 border-t border-border/40 pt-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <span className="block text-xs font-semibold text-muted-foreground">
                    System Roles
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {employee.roles.map((role) => (
                      <Badge
                        key={role}
                        variant="secondary"
                        className="text-xs font-medium capitalize"
                      >
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="block text-xs font-semibold text-muted-foreground">
                    Access Level
                  </span>
                  <p className="text-sm font-medium text-foreground">
                    {employee.roles.includes("admin")
                      ? "Administrator"
                      : "Standard Member"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Department Assignment */}
          {organizationId && (
            <Card>
              <CardHeader>
                <CardTitle>Department Assignment</CardTitle>
                <CardDescription>
                  Define the organizational group for this employee.
                </CardDescription>
                <CardAction>
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    variant="outline"
                    size="sm"
                  >
                    {employee.department ? "Change" : "Assign"}
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 border-t border-border/40 pt-4">
                  <span className="block text-xs font-semibold text-muted-foreground">
                    Current Department
                  </span>
                  <div>
                    {employee.department ? (
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="rounded-full border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400"
                        >
                          {employee.department.name}
                        </Badge>
                        <span className="font-mono text-xs text-muted-foreground/60">
                          /{employee.department.slug}
                        </span>
                      </div>
                    ) : (
                      <Badge
                        variant="outline"
                        className="rounded-full border-border/80 bg-muted/20 px-3 py-1 text-xs font-medium text-muted-foreground"
                      >
                        Unassigned
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Side: Health Score Card or Pending Onboarding */}
        <div className="md:col-span-1">
          {employee.status === "onboarding" ? (
            <Empty className="h-full min-h-[380px] border border-dashed border-border/60 bg-card/60 rounded-2xl flex flex-col items-center justify-center p-6 text-center shadow-xs">
              <EmptyHeader className="flex flex-col items-center justify-center text-center">
                <EmptyMedia className="mb-4 rounded-full bg-foreground/10 p-4 text-foreground animate-none">
                  <Clock className="size-8 animate-pulse" />
                </EmptyMedia>
                <EmptyTitle className="text-base font-semibold text-foreground">
                  Pending Onboarding
                </EmptyTitle>
                <EmptyDescription className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
                  Health score information is not available yet. This member is still in the onboarding process.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <HealthScoreCard
              title="Health score"
              score={87}
              scoreLabel="Stable"
              rows={healthIndicators}
              loading={loading}
            />
          )}
        </div>
      </div>

      {/* Dialog for assigning department */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-2xl">
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
    </div>
  )
}
