import { useMemo } from "react"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { OrgInvitationForm } from "@workspace/components/components/org-invitation-form"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

export function InvitePeoplePage() {
  const { user, isLoading } = useCurrentUser()

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
      <Card className="mx-auto w-full max-w-3xl">
        <CardContent className="space-y-6 py-6 md:px-8">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
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
            fixedOrganization={organization}
            title="Invite people"
            description="Create an invitation link for this organization."
          />
        </CardContent>
      </Card>
    </div>
  )
}
