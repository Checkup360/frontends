import { useState, useEffect, type FormEvent } from "react"
import {
  assignEmployeeDepartment,
  listDepartments,
  type OrganizationEmployee,
  type DepartmentResponse,
} from "@workspace/api"
import { Button } from "@workspace/ui/components/button"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { AlertCircle, Check } from "lucide-react"

interface AssignDepartmentFormProps {
  organizationId: string
  employee: OrganizationEmployee
  onSuccess?: () => void
  compact?: boolean
}

export function AssignDepartmentForm({
  organizationId,
  employee,
  onSuccess,
  compact = false,
}: AssignDepartmentFormProps) {
  const [departments, setDepartments] = useState<DepartmentResponse[]>([])
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(
    employee.department?.id || ""
  )
  const [loading, setLoading] = useState(false)
  const [departmentsLoading, setDepartmentsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const fetchDepartments = async () => {
      setDepartmentsLoading(true)
      try {
        const depts = await listDepartments(organizationId)
        setDepartments(depts)
      } catch (err) {
        console.error("Error loading departments:", err)
        setError("Failed to load departments")
      } finally {
        setDepartmentsLoading(false)
      }
    }

    void fetchDepartments()
  }, [organizationId])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!selectedDepartmentId) {
      setError("Please select a department")
      return
    }

    setLoading(true)
    try {
      const result = await assignEmployeeDepartment(
        organizationId,
        employee.id,
        selectedDepartmentId
      )

      if (!result) {
        setError("Failed to assign department")
        return
      }

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onSuccess?.()
      }, 2000)
    } catch (err) {
      console.error("Error assigning department:", err)
      setError("An error occurred while assigning the department")
    } finally {
      setLoading(false)
    }
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="flex gap-3 rounded-lg border border-green-600/30 bg-green-600/10 p-3 text-sm text-green-600">
            <Check className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium">Department assigned successfully</p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Select
            value={selectedDepartmentId}
            onValueChange={setSelectedDepartmentId}
            disabled={loading || departmentsLoading || departments.length === 0}
          >
            <SelectTrigger id="department">
              <SelectValue
                placeholder={
                  departmentsLoading
                    ? "Loading departments..."
                    : "Select a department"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {departments.map((department) => (
                <SelectItem key={department.id} value={department.id}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!departmentsLoading && departments.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No departments available in this organization.
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={
            loading ||
            !selectedDepartmentId ||
            selectedDepartmentId === employee.department?.id
          }
          className="w-full"
        >
          {loading ? "Assigning..." : "Assign Department"}
        </Button>
      </form>
    )
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="flex gap-3 rounded-lg border border-green-600/30 bg-green-600/10 p-3 text-sm text-green-600">
            <Check className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium">Department assigned successfully</p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Select
            value={selectedDepartmentId}
            onValueChange={setSelectedDepartmentId}
            disabled={loading || departmentsLoading || departments.length === 0}
          >
            <SelectTrigger id="department">
              <SelectValue
                placeholder={
                  departmentsLoading
                    ? "Loading departments..."
                    : "Select a department"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {departments.map((department) => (
                <SelectItem key={department.id} value={department.id}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!departmentsLoading && departments.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No departments available in this organization.
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={
            loading ||
            !selectedDepartmentId ||
            selectedDepartmentId === employee.department?.id
          }
          className="w-full"
        >
          {loading ? "Assigning..." : "Assign Department"}
        </Button>
      </form>
    </div>
  )
}
