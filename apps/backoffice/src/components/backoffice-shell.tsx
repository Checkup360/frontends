import { logout, resolveWebUrl } from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import {
  WorkspaceShell,
  type WorkspaceShellNavItem,
} from "@workspace/components/components/workspace-shell"
import { Building2, Folders, MailPlus, Settings } from "lucide-react"
import { NavLink, Outlet, useLocation } from "react-router-dom"

const navigation: WorkspaceShellNavItem[] = [
  { title: "Organizations", url: "/", icon: Building2, to: "/", end: true },
  {
    title: "Manage",
    url: "/manage",
    icon: Folders,
    to: "/manage",
  },
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
  const { pathname } = useLocation()
  const { user, clear } = useCurrentUser()

  const handleLogout = async () => {
    try {
      await logout()
      clear()
      window.location.replace(resolveWebUrl())
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

  const getTitleForPath = () => {
    if (/^\/organizations\/[^/]+$/.test(pathname)) {
      return "Organization"
    }

    switch (pathname) {
      case "/":
        return "Organizations"
      case "/manage":
        return "Manage"
      case "/invitations":
        return "Invitations"
      case "/settings":
        return "Settings"
      default:
        return "Backoffice"
    }
  }

  return (
    <WorkspaceShell
      appLabel="Backoffice"
      title={getTitleForPath()}
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
