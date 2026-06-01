import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { listOrganizationEmployees, type OrganizationEmployee } from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { MemberOverview, MemberOverviewSkeleton } from "@workspace/components/components/member-overview"
import { Card, CardContent } from "@workspace/ui/components/card"

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useCurrentUser()
  const organizationId = user?.membership?.organization_id

  const [employee, setEmployee] = useState<OrganizationEmployee | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    async function load() {
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
      <Card className="mx-auto max-w-md mt-12 border-destructive/20 bg-destructive/5 animate-in fade-in duration-300">
        <CardContent className="pt-6 text-center space-y-4">
          <p className="text-destructive font-medium">{error || "Employee not found."}</p>
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

  return (
    <MemberOverview
      email={employee.email}
      showBack
      onBack={() => navigate("/employees")}
    />
  )
}
