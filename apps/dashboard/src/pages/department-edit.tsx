import {
  listDepartments,
  updateDepartment,
  type DepartmentResponse,
  MAX_DEPARTMENT_NAME_LENGTH,
} from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { useEffect, useState, type FormEvent } from "react"
import { useNavigate, useParams } from "react-router-dom"

function makeSlugPreview(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function DepartmentEditSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-80 rounded-xl" />
    </div>
  )
}

export function DepartmentEditPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user } = useCurrentUser()
  const organizationId = user?.membership?.organization_id
  const [department, setDepartment] = useState<DepartmentResponse | null>(null)
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    async function loadDepartment() {
      if (!organizationId || !slug) {
        setError("Department not found.")
        setLoading(false)
        return
      }
      const departments = await listDepartments(organizationId)
      if (!active) return
      const match = departments.find((item) => item.slug === slug) ?? null
      setDepartment(match)
      setName(match?.name ?? "")
      setError(match ? "" : "Department not found.")
      setLoading(false)
    }
    void loadDepartment()
    return () => {
      active = false
    }
  }, [organizationId, slug])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!organizationId || !department || !name.trim()) return
    setSaving(true)
    setError("")
    const result = await updateDepartment(organizationId, department.id, {
      name: name.trim(),
    })
    setSaving(false)
    if (result.error) {
      setError(result.error.message)
      return
    }
    navigate(`/departments/${result.success.slug}`, { replace: true })
  }

  if (loading) return <DepartmentEditSkeleton />

  if (!department) {
    return (
      <Card className="mx-auto mt-12 max-w-md">
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={() => navigate("/departments")}>
            Back to departments
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <Button variant="ghost" onClick={() => navigate(`/departments/${slug}`)}>
        <ArrowLeft />
        Back to department
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Edit department</CardTitle>
          <CardDescription>
            Update the department name and its URL identifier.
          </CardDescription>
        </CardHeader>
        <form onSubmit={(event) => void handleSubmit(event)}>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="department-edit-name">Department name</Label>
              <Input
                id="department-edit-name"
                maxLength={MAX_DEPARTMENT_NAME_LENGTH}
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setError("")
                }}
                disabled={saving}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                URL identifier: /{makeSlugPreview(name)}
              </p>
            </div>
            {error && (
              <p className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="size-4" />
                {error}
              </p>
            )}
          </CardContent>
          <CardFooter className="mt-6 justify-end gap-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/departments/${slug}`)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                saving || !name.trim() || name.trim() === department.name
              }
            >
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
