import { logout, resolveWebUrl } from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { formatFullName } from "@workspace/components/components/employee-profile-card"
import {
  WorkspaceShell,
  type WorkspaceShellNavItem,
} from "@workspace/components/components/workspace-shell"
import {
  Activity,
  ClipboardList,
  LayoutDashboard,
  Newspaper,
  Settings,
} from "lucide-react"
import { useState } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import { PwaInstallDrawer } from "../pwa/pwa-install-drawer"
import { PwaInstallMenuItem } from "../pwa/pwa-install-menu-item"

const navigation: WorkspaceShellNavItem[] = [
  { title: "Overview", url: "/", icon: LayoutDashboard, to: "/", end: true },
  { title: "Status", url: "/status", icon: Activity, to: "/status" },
  { title: "News", url: "/news", icon: Newspaper, to: "/news" },
  { title: "Forms", url: "/forms", icon: ClipboardList, to: "/forms" },
]

const secondaryNavigation: WorkspaceShellNavItem[] = [
  { title: "Settings", url: "/settings", icon: Settings, to: "/settings" },
]

export function MemberShell() {
  const { pathname } = useLocation()
  const { user, clear } = useCurrentUser()
  const [installDrawerOpen, setInstallDrawerOpen] = useState(false)

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
    switch (pathname) {
      case "/":
        return "Overview"
      case "/news":
        return "News"
      case "/status":
        return "Status"
      case "/forms":
        return "Forms"
      case "/settings":
        return "Settings"
      default:
        return "Member dashboard"
    }
  }

  const organizationName = user?.membership?.organization_name
  const organizationLogoUrl = user?.membership?.organization_logo_url

  return (
    <>
      <WorkspaceShell
        appName={organizationName ?? "CheckUp360"}
        appLogoUrl={organizationLogoUrl}
        appLabel={organizationName ? "CheckUp360" : "Member dashboard"}
        title={getTitleForPath()}
        navigation={navigation}
        secondaryNavigation={secondaryNavigation}
        secondaryAction={
          <PwaInstallMenuItem onSelect={() => setInstallDrawerOpen(true)} />
        }
        user={userData}
        onLogout={handleLogout}
        linkComponent={NavLink}
      >
        <Outlet />
      </WorkspaceShell>
      <PwaInstallDrawer
        open={installDrawerOpen}
        onOpenChange={setInstallDrawerOpen}
      />
    </>
  )
}
