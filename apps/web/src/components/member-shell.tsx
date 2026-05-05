import {
  resolveVitePublicApiBaseUrl,
  resolveWebBaseUrl,
} from "@workspace/auth/api"
import { SidebarAccount } from "@workspace/auth/components/sidebar-account"
import {
  WorkspaceShell,
  type WorkspaceShellNavItem,
  type WorkspaceShellPageMeta,
} from "@workspace/components/components/workspace-shell"
import {
  LayoutDashboard,
  Newspaper,
  FileText,
  Settings,
} from "lucide-react"
import { NavLink, Outlet, useLocation } from "react-router-dom"

const navigation: WorkspaceShellNavItem[] = [
  { label: "Overview", to: "/", icon: LayoutDashboard, end: true },
  { label: "News", to: "/news", icon: Newspaper },
  { label: "Forms", to: "/forms", icon: FileText },
]

const secondaryNavigation: WorkspaceShellNavItem[] = [
  { label: "Settings", to: "/settings", icon: Settings },
]

const pageMeta: Record<string, WorkspaceShellPageMeta> = {
  "/": {
    eyebrow: "Occupational health",
    title: "Dashboard",
    description: "Your organization overview and health metrics.",
  },
  "/news": {
    eyebrow: "Communications",
    title: "News",
    description: "Stay updated with the latest organization news.",
  },
  "/forms": {
    eyebrow: "Tasks",
    title: "Pending forms",
    description: "Complete your health checkups and surveys.",
  },
  "/settings": {
    eyebrow: "Account",
    title: "Settings",
    description: "Manage your profile and preferences.",
  },
}

export function MemberShell() {
  const { pathname } = useLocation()
  const apiBaseUrl = resolveVitePublicApiBaseUrl(import.meta.env)
  const webBaseUrl = resolveWebBaseUrl()

  return (
    <WorkspaceShell
      appLabel="Member dashboard"
      searchPlaceholder="Search..."
      navigation={navigation}
      secondaryNavigation={secondaryNavigation}
      activePath={pathname}
      pageMeta={pageMeta}
      fallbackMeta={{
        eyebrow: "CheckUp360",
        title: "Workspace",
        description: "Your member workspace.",
      }}
      sidebarFooter={
        <SidebarAccount
          apiBaseUrl={apiBaseUrl}
          webBaseUrl={webBaseUrl}
        />
      }
      renderLink={(props: any) => (
        <NavLink
          key={props.item.to}
          to={props.item.to}
          end={props.item.end}
          className={props.className}
        >
          {props.children}
        </NavLink>
      )}
    >
      <Outlet />
    </WorkspaceShell>
  )
}
