import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { SettingsPage as SharedSettingsPage } from "@workspace/components/components/settings/settings-page"

export function SettingsPage() {
  const { user } = useCurrentUser()

  return <SharedSettingsPage email={user?.email ?? ""} />
}
