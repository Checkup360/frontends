import { logout } from "@workspace/auth/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import {
  WorkspaceShell,
  type WorkspaceShellNavItem,
} from "@workspace/components/components/workspace-shell"
import { Building2, MailPlus, Settings } from "lucide-react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"

const navigation: WorkspaceShellNavItem[] = [
  { title: "Organizations", url: "/", icon: Building2, to: "/", end: true },
  {
    title: "Invitations",
    url: "/invitations",
    icon: MailPlus,
    to: "/invitations",
  },
]

const secondaryNavigation: WorkspaceShellNavItem[] = [
  { title: "Settings", url: "/settings", icon: Settings, to: "/settings" },
]

export function BackofficeShell() {
  const { user, clear } = useCurrentUser()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      clear()
      navigate("/access-denied")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const userData = user
    ? {
        name: user.email.split("@")[0],
        email: user.email,
        avatar: "",
      }
    : undefined

  return (
    <WorkspaceShell
      appLabel="Backoffice"
      title="Organizations"
      navigation={navigation}
      secondaryNavigation={secondaryNavigation}
      user={userData}
      onLogout={handleLogout}
      linkComponent={NavLink}
    >
      <Outlet />
    </WorkspaceShell>
  )
}
