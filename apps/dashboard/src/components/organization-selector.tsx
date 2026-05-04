import { useEffect, useMemo, useState } from "react"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Building2 } from "lucide-react"

interface OrganizationSelectorProps {
  apiBaseUrl?: string
  onOrganizationChange?: (organizationId: string, organizationName: string) => void
}

const SELECTED_ORG_STORAGE_KEY = "dashboard.selectedOrganization"

export function OrganizationSelector({
  apiBaseUrl,
  onOrganizationChange,
}: OrganizationSelectorProps) {
  const { user } = useCurrentUser(apiBaseUrl)
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)

  const adminOrganizations = useMemo(
    () => user?.memberships?.filter((m) => m.role === "admin") || [],
    [user],
  )

  const selectedOrg = useMemo(
    () => adminOrganizations.find((org) => org.organization_id === selectedOrgId),
    [adminOrganizations, selectedOrgId],
  )

  useEffect(() => {
    if (adminOrganizations.length === 0) return

    const savedOrgId = localStorage.getItem(SELECTED_ORG_STORAGE_KEY)
    if (
      savedOrgId &&
      adminOrganizations.some((org) => org.organization_id === savedOrgId)
    ) {
      setSelectedOrgId(savedOrgId)
    } else {
      const firstOrgId = adminOrganizations[0].organization_id
      setSelectedOrgId(firstOrgId)
      localStorage.setItem(SELECTED_ORG_STORAGE_KEY, firstOrgId)
    }
  }, [adminOrganizations])

  const handleSelectOrg = (orgId: string, orgName: string) => {
    setSelectedOrgId(orgId)
    localStorage.setItem(SELECTED_ORG_STORAGE_KEY, orgId)
    onOrganizationChange?.(orgId, orgName)
  }

  if (adminOrganizations.length === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-sm"
        >
          <Building2 className="size-4" />
          <span className="truncate">
            {selectedOrg?.organization_name || "Select organization"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {adminOrganizations.map((org) => (
          <DropdownMenuItem
            key={org.organization_id}
            onClick={() =>
              handleSelectOrg(org.organization_id, org.organization_name)
            }
            className={selectedOrgId === org.organization_id ? "bg-accent" : ""}
          >
            <Building2 className="mr-2 size-4" />
            <span className="truncate">{org.organization_name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
