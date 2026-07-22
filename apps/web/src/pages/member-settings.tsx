import { AuthLoadingSkeleton } from "@workspace/auth/components/auth-loading-skeleton"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { SettingsPage } from "@workspace/components/components/settings/settings-page"

export function MemberSettingsPage() {
  const { user, isLoading } = useCurrentUser()

  if (isLoading) {
    return <AuthLoadingSkeleton />
  }

  return (
    <SettingsPage
      email={user?.email ?? ""}
      organizationName={user?.membership?.organization_name}
    />
  )
}
