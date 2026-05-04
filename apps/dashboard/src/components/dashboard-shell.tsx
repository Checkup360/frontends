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
import { Button } from "@workspace/ui/components/button"
import {
  Building2,
  LayoutDashboard,
  MailPlus,
  Settings,
  Users,
} from "lucide-react"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import { OrganizationSelector } from "./organization-selector"

const navigation: WorkspaceShellNavItem[] = [
  { label: "Overview", to: "/", icon: LayoutDashboard, end: true },
  { label: "Employees", to: "/employees", icon: Users },
  { label: "Invite people", to: "/people/invite", icon: MailPlus },
]

const secondaryNavigation: WorkspaceShellNavItem[] = [
  { label: "Organization", to: "/organization", icon: Building2 },
  { label: "Settings", to: "/settings", icon: Settings },
]

const pageMeta: Record<string, WorkspaceShellPageMeta> = {
  "/": {
    eyebrow: "Occupational health",
    title: "Dashboard",
    description: "Aggregated health signals and workforce risk monitoring.",
  },
  "/employees": {
    eyebrow: "People operations",
    title: "Employees",
    description:
      "Review individual checkups, areas, and health risk categories.",
  },
  "/people/invite": {
    eyebrow: "Access management",
    title: "Invite people",
    description:
      "Prepare invitation links for organization admins and employees.",
  },
}

export function DashboardShell() {
  const { pathname } = useLocation()
  const apiBaseUrl = resolveVitePublicApiBaseUrl(import.meta.env)
  const webBaseUrl = resolveWebBaseUrl()

  return (
    <WorkspaceShell
      appLabel="Company dashboard"
      searchPlaceholder="Search employees..."
      navigation={navigation}
      secondaryNavigation={secondaryNavigation}
      activePath={pathname}
      pageMeta={pageMeta}
      fallbackMeta={{
        eyebrow: "CheckUp360",
        title: "Workspace",
        description: "Manage your organization health workspace.",
      }}
      sidebarHeader={<OrganizationSelector apiBaseUrl={apiBaseUrl} />}
      sidebarFooter={
        <SidebarAccount
          apiBaseUrl={apiBaseUrl}
          webBaseUrl={webBaseUrl}
          inviteAction={
            <Button variant="outline" size="sm" asChild>
              <NavLink to="/people/invite">
                <MailPlus className="size-4" />
                Invite
              </NavLink>
            </Button>
          }
        />
      }
      renderLink={({ item, className, children }) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={className}
        >
          {children}
        </NavLink>
      )}
    >
      <Outlet />
    </WorkspaceShell>
  )
}
