import { logout, resolveWebUrl } from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { formatFullName } from "@workspace/components/components/employee-profile-card"
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
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from "lucide-react"
import { NavLink, Outlet, useLocation } from "react-router-dom"

const navigation: WorkspaceShellNavItem[] = [
  { title: "Overview", url: "/", icon: LayoutDashboard, to: "/", end: true },
  {
    title: "Organization",
    url: "/organization",
    icon: Building2,
    to: "/organization",
  },
  { title: "Members", url: "/employees", icon: Users, to: "/employees" },
  {
    title: "Invitations",
    url: "/invitations",
    icon: MailPlus,
    to: "/invitations",
  },
  {
    title: "Departments",
    url: "/departments",
    icon: Folders,
    to: "/departments",
  },
  {
    title: "Score weights",
    url: "/score-weights",
    icon: SlidersHorizontal,
    to: "/score-weights",
  },
  {
    title: "Compliance & Audit",
    url: "/compliance",
    icon: ShieldCheck,
    to: "/compliance",
  },
]

const secondaryNavigation: WorkspaceShellNavItem[] = [
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
        name: formatFullName(user),
        email: user.email,
        avatar: user.avatar_url || "",
      }
    : undefined

  // Determine title based on current path
  const getTitleForPath = () => {
    switch (pathname) {
      case "/":
        return "Dashboard"
      case "/organization":
        return "Organization"
      case "/employees":
        return "Members"
      case "/invitations":
        return "Invitations"
      case "/departments":
        return "Departments"
      case "/score-weights":
        return "Score weights"
      case "/compliance":
        return "Compliance & Legal Audit"
      case "/settings":
        return "Settings"
      default:
        return "Dashboard"
    }
  }

  const organizationName = user?.membership?.organization_name
  const organizationLogoUrl = user?.membership?.organization_logo_url

  return (
    <WorkspaceShell
      appName={organizationName ?? "CheckUp360"}
      appLogoUrl={organizationLogoUrl}
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
