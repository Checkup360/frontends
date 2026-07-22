import { logout, resolveWebUrl } from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import {
  WorkspaceShell,
  type WorkspaceShellNavItem,
} from "@workspace/components/components/workspace-shell"
import { FileText, LayoutDashboard, Newspaper, Settings } from "lucide-react"
import { NavLink, Outlet, useLocation } from "react-router-dom"

const navigation: WorkspaceShellNavItem[] = [
  { title: "Overview", url: "/", icon: LayoutDashboard, to: "/", end: true },
  { title: "News", url: "/news", icon: Newspaper, to: "/news" },
  { title: "Forms", url: "/forms", icon: FileText, to: "/forms" },
]

const secondaryNavigation: WorkspaceShellNavItem[] = [
  { title: "Settings", url: "/settings", icon: Settings, to: "/settings" },
]

export function MemberShell() {
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
    switch (pathname) {
      case "/":
        return "Overview"
      case "/news":
        return "News"
      case "/forms":
        return "Forms"
      case "/settings":
        return "Settings"
      default:
        return "Member dashboard"
    }
  }

  return (
    <WorkspaceShell
      appLabel="Member dashboard"
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
