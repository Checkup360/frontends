import { resolveVitePublicApiBaseUrl } from "@workspace/auth/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@workspace/ui/components/card"

export function DashboardPage() {
  const apiBaseUrl = resolveVitePublicApiBaseUrl(import.meta.env)
  const { user, isLoading } = useCurrentUser(apiBaseUrl)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Filtrar solo memberships donde el usuario es miembro (no admin)
  const memberMemberships = user.memberships?.filter(
    (membership) => membership.role === "member"
  ) || []

  const hasMemberMemberships = memberMemberships.length > 0

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
        <p className="mt-2 text-base text-muted-foreground">
          Here are the organizations where you are a member.
        </p>
      </div>

      {hasMemberMemberships ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {memberMemberships.map((membership) => (
              <Card key={membership.organization_id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {membership.organization_name}
                  </CardTitle>
                  <CardDescription>Member</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    You are a member of this organization.
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              You are not a member of any organizations yet.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Ask an organization admin to send you an invitation link.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
