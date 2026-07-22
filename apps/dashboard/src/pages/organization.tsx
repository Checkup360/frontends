import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  type DepartmentResponse,
} from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { Button } from "@workspace/ui/components/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { useEffect, useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"

export function OrganizationPage() {
  const { user } = useCurrentUser()
  const navigate = useNavigate()
  const organizationId = user?.membership?.organization_id
  const [departments, setDepartments] = useState<DepartmentResponse[]>([])
  const [name, setName] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<DepartmentResponse | null>(
    null
  )
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

  async function handleDelete() {
    if (!organizationId || !deleteTarget) return
    setSaving(true)
    setError("")
    const result = await deleteDepartment(organizationId, deleteTarget.id)
    if ("error" in result) {
      setError(result.error.message)
    } else {
      setDepartments((current) =>
        current.filter((department) => department.id !== deleteTarget.id)
      )
      setDeleteTarget(null)
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
                  <div>
                    <p className="font-medium text-foreground">
                      {department.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {department.slug}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() =>
                        navigate(`/departments/${department.slug}/edit`)
                      }
                      disabled={saving}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        setError("")
                        setDeleteTarget(department)
                      }}
                      disabled={saving}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !saving) {
            setDeleteTarget(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete department?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.name}". This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={saving}
              onClick={(event) => {
                event.preventDefault()
                void handleDelete()
              }}
            >
              {saving ? "Deleting..." : "Delete department"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
