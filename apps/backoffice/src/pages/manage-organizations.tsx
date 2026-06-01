import { useEffect, useState } from "react"
import {
  listOrganizations,
  createOrganization,
  deleteOrganization,
  type OrganizationResponse,
} from "@workspace/api"
import {
  ResourceList,
  type ResourceItem,
} from "@workspace/components/components/resource-list"
import { toast } from "@workspace/ui/components/sonner"

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function toResourceItem(org: OrganizationResponse): ResourceItem {
  return { id: org.id, name: org.name, hint: org.slug }
}

export function ManageOrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError("")
      try {
        const data = await listOrganizations()
        if (active) setOrganizations(data)
      } catch {
        if (active) setError("Failed to load organizations.")
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  const handleCreate = async (name: string) => {
    const slug = nameToSlug(name)
    if (!slug)
      return { error: "Invalid name — could not generate a URL identifier." }

    const result = await createOrganization({ name, slug })
    if (result.error) {
      return {
        error:
          result.error.code === "organization_slug_already_exists"
            ? "An organization with a similar name already exists."
            : result.error.message,
      }
    }
    setOrganizations((prev) => [...prev, result.success])
    toast.success("Organization created!")
    return {}
  }

  const handleDelete = async (item: ResourceItem) => {
    try {
      await deleteOrganization(item.id)
      setOrganizations((prev) => prev.filter((o) => o.id !== item.id))
      toast.success("Organization deleted")
      return {}
    } catch {
      return { error: "Failed to delete organization." }
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <ResourceList
        title="Organizations"
        resourceLabel="organization"
        createPlaceholder="e.g. Acme Corp, Social Trip…"
        disableRename
        items={organizations.map(toResourceItem)}
        loading={loading}
        error={error}
        onCreate={handleCreate}
        onRename={async () => ({})}
        onDelete={handleDelete}
      />
    </div>
  )
}
