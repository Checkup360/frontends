import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { SettingsPage as SharedSettingsPage } from "@workspace/components/components/settings/settings-page"
import { Button } from "@workspace/ui/components/button"
import { ExternalLink } from "lucide-react"
import { Link } from "react-router-dom"

export function SettingsPage() {
  const { user } = useCurrentUser()

  return (
    <SharedSettingsPage
      email={user?.email ?? ""}
      organizationName={user?.membership?.organization_name}
      accountAction={
        <Button asChild variant="outline">
          <Link to="/organization">
            Administrar organización
            <ExternalLink />
          </Link>
        </Button>
      }
    />
  )
}
