import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
  type DepartmentResponse,
} from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Pencil, Plus, Trash2, X } from "lucide-react"
import { useEffect, useState, type FormEvent } from "react"

export function OrganizationPage() {
  const { user } = useCurrentUser()
  const organizationId = user?.membership?.organization_id
  const [departments, setDepartments] = useState<DepartmentResponse[]>([])
  const [name, setName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true

    async function loadDepartments() {
      if (!organizationId) {
        setDepartments([])
        setLoading(false)
        return
      }
      setLoading(true)
      const nextDepartments = await listDepartments(organizationId)
      if (!active) return
      setDepartments(nextDepartments)
      setLoading(false)
    }

    void loadDepartments()

    return () => {
      active = false
    }
  }, [organizationId])

  async function refreshDepartments() {
    if (!organizationId) return
    setDepartments(await listDepartments(organizationId))
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    if (!organizationId || !name.trim()) return
    setSaving(true)
    setError("")
    const result = await createDepartment(organizationId, { name: name.trim() })
    if ("error" in result) {
      setError(result.error?.message ?? "Unknown error")
    } else {
      setName("")
      await refreshDepartments()
    }
    setSaving(false)
  }

  async function handleRename(departmentId: string) {
    if (!organizationId || !editingName.trim()) return
    setSaving(true)
    setError("")
    const result = await updateDepartment(organizationId, departmentId, {
      name: editingName.trim(),
    })
    if ("error" in result) {
      setError(result.error?.message ?? "Unknown error")
    } else {
      setEditingId(null)
      setEditingName("")
      await refreshDepartments()
    }
    setSaving(false)
  }

  async function handleDelete(departmentId: string) {
    if (!organizationId) return
    setSaving(true)
    setError("")
    const result = await deleteDepartment(organizationId, departmentId)
    if ("error" in result) {
      setError(result.error.message)
    } else {
      await refreshDepartments()
    }
    setSaving(false)
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Departments</CardTitle>
          <CardDescription>
            Manage departments used for member invitations and employee lists.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form
            onSubmit={handleCreate}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <div className="flex-1 space-y-2">
              <Label htmlFor="department-name">Department name</Label>
              <Input
                id="department-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="People Operations"
                disabled={saving}
              />
            </div>
            <Button type="submit" className="sm:self-end" disabled={saving}>
              <Plus className="size-4" />
              Add department
            </Button>
          </form>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="space-y-2">
            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Loading departments...
              </p>
            ) : departments.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No departments yet.
              </p>
            ) : (
              departments.map((department) => (
                <div
                  key={department.id}
                  className="flex flex-col gap-3 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  {editingId === department.id ? (
                    <Input
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                      disabled={saving}
                    />
                  ) : (
                    <div>
                      <p className="font-medium text-foreground">
                        {department.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {department.slug}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {editingId === department.id ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleRename(department.id)}
                          disabled={saving}
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            setEditingId(null)
                            setEditingName("")
                          }}
                          disabled={saving}
                        >
                          <X className="size-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            setEditingId(department.id)
                            setEditingName(department.name)
                          }}
                          disabled={saving}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => handleDelete(department.id)}
                          disabled={saving}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
