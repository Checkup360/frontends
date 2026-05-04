import { useMemo } from "react"
import { resolveVitePublicApiBaseUrl } from "@workspace/auth/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { OrgInvitationForm } from "@workspace/components/components/org-invitation-form"
import { Card, CardContent } from "@workspace/ui/components/card"

export function InvitePeoplePage() {
  const apiBaseUrl = resolveVitePublicApiBaseUrl(import.meta.env)
  const { user, isLoading } = useCurrentUser(apiBaseUrl)

  const organization = useMemo(() => {
    const membership = user?.memberships.find((item) => item.role === "admin")
    if (!membership) return null

    return {
      id: membership.organization_id,
      name: membership.organization_name,
      slug: "",
    }
  }, [user])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Loading invitation form...
        </CardContent>
      </Card>
    )
  }

  if (!organization) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No admin organization found for this account.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Card>
        <CardContent className="py-6 md:px-8">
          <OrgInvitationForm
            apiBaseUrl={apiBaseUrl}
            fixedOrganization={organization}
            title="Invite people"
            description="Create an invitation link for this organization."
          />
        </CardContent>
      </Card>
    </div>
  )
}
