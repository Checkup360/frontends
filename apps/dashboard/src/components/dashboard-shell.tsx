import { logout, resolveWebUrl } from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import {
  WorkspaceShell,
  type WorkspaceShellNavItem,
} from "@workspace/components/components/workspace-shell"
import {
  Building2,
  Folders,
  LayoutDashboard,
  MailPlus,
  Settings,
  Users,
} from "lucide-react"
import { NavLink, Outlet, useLocation } from "react-router-dom"

const navigation: WorkspaceShellNavItem[] = [
  { title: "Overview", url: "/", icon: LayoutDashboard, to: "/", end: true },
  { title: "Employees", url: "/employees", icon: Users, to: "/employees" },
  {
    title: "Invite people",
    url: "/people/invite",
    icon: MailPlus,
    to: "/people/invite",
  },
  {
    title: "Departments",
    url: "/departments",
    icon: Folders,
    to: "/departments",
  },
]

const secondaryNavigation: WorkspaceShellNavItem[] = [
  {
    title: "Organization",
    url: "/organization",
    icon: Building2,
    to: "/organization",
  },
  { title: "Settings", url: "/settings", icon: Settings, to: "/settings" },
]

export function DashboardShell() {
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

  // Determine title based on current path
  const getTitleForPath = () => {
    switch (pathname) {
      case "/":
        return "Dashboard"
      case "/employees":
        return "Employees"
      case "/people/invite":
        return "Invite people"
      case "/departments":
        return "Departments"
      case "/organization":
        return "Organization"
      case "/settings":
        return "Settings"
      default:
        return "Dashboard"
    }
  }

  const organizationName = user?.membership?.organization_name

  return (
    <WorkspaceShell
      appName={organizationName ?? "CheckUp360"}
      appLabel={organizationName ? "CheckUp360" : "Company dashboard"}
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
