import {
  logout,
  resolveVitePublicWebBaseUrl,
} from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import {
  WorkspaceShell,
  type WorkspaceShellNavItem,
} from "@workspace/components/components/workspace-shell"
import { LayoutDashboard, Newspaper, FileText, Settings } from "lucide-react"
import { NavLink, Outlet } from "react-router-dom"

const navigation: WorkspaceShellNavItem[] = [
  { title: "Overview", url: "/", icon: LayoutDashboard, to: "/", end: true },
  { title: "News", url: "/news", icon: Newspaper, to: "/news" },
  { title: "Forms", url: "/forms", icon: FileText, to: "/forms" },
]

const secondaryNavigation: WorkspaceShellNavItem[] = [
  { title: "Settings", url: "/settings", icon: Settings, to: "/settings" },
]

export function MemberShell() {
  const { user, clear } = useCurrentUser()

  const handleLogout = async () => {
    try {
      await logout()
      clear()
      window.location.replace(resolveVitePublicWebBaseUrl())
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
      appLabel="Member dashboard"
      title="Dashboard"
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
