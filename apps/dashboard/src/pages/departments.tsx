import { useEffect, useState } from "react"
import {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  type DepartmentResponse,
} from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import {
  ResourceList,
  type ResourceItem,
} from "@workspace/components/components/resource-list"

function toResourceItem(dept: DepartmentResponse): ResourceItem {
  return { id: dept.id, name: dept.name }
}

export function DepartmentsPage() {
  const { user } = useCurrentUser()
  const organizationId = user?.membership?.organization_id ?? null

  const [departments, setDepartments] = useState<DepartmentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    async function load() {
      if (!organizationId) {
        setLoading(false)
        return
      }
      setLoading(true)
      setError("")
      try {
        const data = await listDepartments(organizationId)
        if (active) setDepartments(data)
      } catch {
        if (active) setError("Failed to load departments.")
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [organizationId])

  const handleCreate = async (name: string) => {
    if (!organizationId) return { error: "No organization found." }
    const result = await createDepartment(organizationId, { name })
    if (result.error) {
      return {
        error:
          result.error.code === "department_slug_already_exists"
            ? "A department with that name already exists."
            : result.error.message,
      }
    }
    setDepartments((prev) => [...prev, result.success])
    return {}
  }

  const handleRename = async (item: ResourceItem, newName: string) => {
    if (!organizationId) return { error: "No organization found." }
    const result = await updateDepartment(organizationId, item.id, {
      name: newName,
    })
    if (result.error) {
      return {
        error:
          result.error.code === "department_slug_already_exists"
            ? "A department with that name already exists."
            : result.error.message,
      }
    }
    setDepartments((prev) =>
      prev.map((d) => (d.id === item.id ? result.success : d))
    )
    return {}
  }

  const handleDelete = async (item: ResourceItem) => {
    if (!organizationId) return { error: "No organization found." }
    const result = await deleteDepartment(organizationId, item.id)
    if ("error" in result) {
      return {
        error:
          result.error.code === "department_in_use"
            ? `Cannot delete "${item.name}" — it still has assigned employees.`
            : result.error.message,
      }
    }
    setDepartments((prev) => prev.filter((d) => d.id !== item.id))
    return {}
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <ResourceList
        title="Departments"
        resourceLabel="department"
        createPlaceholder="e.g. Engineering, People Ops…"
        items={departments.map(toResourceItem)}
        loading={loading}
        error={error}
        onCreate={handleCreate}
        onRename={handleRename}
        onDelete={handleDelete}
      />
    </div>
  )
}
