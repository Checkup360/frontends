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
import { Building2, MailPlus } from "lucide-react"
import { NavLink, Outlet, useLocation } from "react-router-dom"

const navigation: WorkspaceShellNavItem[] = [
  { label: "Organizations", to: "/", icon: Building2, end: true },
  { label: "Invitations", to: "/invitations", icon: MailPlus },
]

const pageMeta: Record<string, WorkspaceShellPageMeta> = {
  "/": {
    eyebrow: "Administration",
    title: "Organizations",
    description:
      "Manage organizations, create invitations, and monitor workspace access.",
  },
  "/invitations": {
    eyebrow: "Administration",
    title: "Invitations",
    description:
      "Review invitation links prepared for organization onboarding.",
  },
}

export function BackofficeShell() {
  const { pathname } = useLocation()
  const apiBaseUrl = resolveVitePublicApiBaseUrl(import.meta.env)
  const webBaseUrl = resolveWebBaseUrl()

  return (
    <WorkspaceShell
      appLabel="Backoffice"
      searchPlaceholder="Search workspace..."
      navigation={navigation}
      activePath={pathname}
      pageMeta={pageMeta}
      fallbackMeta={{
        eyebrow: "Administration",
        title: "Backoffice",
        description: "Manage platform operations.",
      }}
      sidebarFooter={
        <SidebarAccount
          apiBaseUrl={apiBaseUrl}
          webBaseUrl={webBaseUrl}
          roleLabel="Platform admin"
          inviteAction={
            <Button variant="outline" size="sm" asChild>
              <NavLink to="/invitations">
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
