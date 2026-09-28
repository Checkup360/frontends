import { logout, resolveWebUrl } from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { formatFullName } from "@workspace/components/components/employee-profile-card"
import {
  WorkspaceShell,
  type WorkspaceShellNavItem,
} from "@workspace/components/components/workspace-shell"
import {
  Building2,
  MailPlus,
  Settings,
  ShieldCheck,
  Terminal,
} from "lucide-react"
import { NavLink, Outlet, useLocation } from "react-router-dom"

const navigation: WorkspaceShellNavItem[] = [
  { title: "Organizations", url: "/", icon: Building2, to: "/", end: true },
  {
    title: "Sysadmins",
    url: "/sysadmins",
    icon: ShieldCheck,
    to: "/sysadmins",
  },
  {
    title: "Invitations",
    url: "/invitations",
    icon: MailPlus,
    to: "/invitations",
  },
  {
    title: "System Logs",
    url: "/logs",
    icon: Terminal,
    to: "/logs",
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
        name: formatFullName(user),
        email: user.email,
        avatar: user.avatar_url || "",
      }
    : undefined

  const getTitleForPath = () => {
    if (/^\/organizations\/[^/]+$/.test(pathname)) {
      return "Organization"
    }

    switch (pathname) {
      case "/":
        return "Organizations"
      case "/sysadmins":
        return "Sysadmins"
      case "/invitations":
        return "Invitations"
      case "/logs":
        return "System Logs"
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
