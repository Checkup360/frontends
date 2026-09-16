"use client"

import { useMemo } from "react"
import {
  resolveBackofficeUrl,
  resolveCmsUrl,
  resolveDashboardUrl,
  resolveWebUrl,
  type AuthMeResponse,
} from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import {
  Building2,
  Check,
  ChevronDown,
  FileText,
  HeartPulse,
  LayoutGrid,
  ShieldCheck,
  User,
  type LucideIcon,
} from "lucide-react"

export type AppId = "web" | "dashboard" | "backoffice" | "cms"

export interface AppOption {
  id: AppId
  name: string
  label: string
  description: string
  url: string
  icon: LucideIcon
}

export interface AppDefinition {
  name: string
  label: string
  description: string
  getUrl: () => string
  icon: LucideIcon
  isActive?: (origin: string, pathname: string) => boolean
}

export const APP_DEFINITIONS: Record<AppId, AppDefinition> = {
  web: {
    name: "CheckUp360",
    label: "Employee PWA",
    description: "Health & wellness portal",
    getUrl: resolveWebUrl,
    icon: User,
    isActive: (origin) => origin.includes("5173") || origin === resolveWebUrl(),
  },
  dashboard: {
    name: "CheckUp360",
    label: "Employer Dashboard",
    description: "Organization & analytics management",
    getUrl: resolveDashboardUrl,
    icon: Building2,
    isActive: (origin) =>
      origin.includes("5174") || origin === resolveDashboardUrl(),
  },
  backoffice: {
    name: "CheckUp360",
    label: "Backoffice",
    description: "Global system administration",
    getUrl: resolveBackofficeUrl,
    icon: ShieldCheck,
    isActive: (origin) =>
      origin.includes("5175") || origin === resolveBackofficeUrl(),
  },
  cms: {
    name: "CheckUp360",
    label: "CMS",
    description: "Content & article management",
    getUrl: () => `${resolveCmsUrl()}/admin`,
    icon: FileText,
    isActive: (origin, pathname) =>
      origin.includes("3000") || pathname.startsWith("/admin"),
  },
}

export const ROLE_APPS_MAP: Record<string, readonly AppId[]> = {
  member: ["web"],
  admin: ["dashboard", "cms"],
  sysadmin: ["backoffice"],
  content_manager: ["cms"],
}

export function getUserRoles(user: AuthMeResponse | null | undefined): string[] {
  if (!user) return []
  const roles: string[] = []

  if (user.is_sysadmin) {
    roles.push("sysadmin")
  }

  if (user.membership?.roles) {
    roles.push(...user.membership.roles)
  }

  return roles
}

export function getAvailableApps(
  user: AuthMeResponse | null | undefined,
  roleMap: Record<string, readonly AppId[]> = ROLE_APPS_MAP,
  appDefs: Record<AppId, AppDefinition> = APP_DEFINITIONS
): AppOption[] {
  const roles = getUserRoles(user)
  const appIds = new Set<AppId>()

  for (const role of roles) {
    const mappedApps = roleMap[role]
    if (mappedApps) {
      for (const appId of mappedApps) {
        appIds.add(appId)
      }
    }
  }

  return Array.from(appIds).map((appId) => {
    const app = appDefs[appId]
    return {
      id: appId,
      name: app.name,
      label: app.label,
      description: app.description,
      url: app.getUrl(),
      icon: app.icon,
    }
  })
}

export function getActiveAppId(
  origin: string,
  pathname: string,
  appDefs: Record<AppId, AppDefinition> = APP_DEFINITIONS
): AppId {
  const matchingAppEntry = Object.entries(appDefs).find(([, def]) =>
    def.isActive ? def.isActive(origin, pathname) : false
  )
  return (matchingAppEntry ? matchingAppEntry[0] : "web") as AppId
}

export interface AppSwitcherProps {
  currentAppLabel?: string
  currentAppName?: string
  variant?: "header-button" | "sidebar-header"
}

export function AppSwitcher({
  currentAppLabel = "",
  currentAppName = "CheckUp360",
  variant = "header-button",
}: AppSwitcherProps = {}) {
  const { user } = useCurrentUser()

  const availableApps = useMemo<AppOption[]>(
    () => getAvailableApps(user),
    [user]
  )

  const activeAppId = useMemo(() => {
    if (typeof window === "undefined") return "web"
    return getActiveAppId(window.location.origin, window.location.pathname)
  }, [])

  const handleAppSwitch = (url: string) => {
    if (typeof window !== "undefined") {
      window.location.href = url
    }
  }

  const hasMultipleApps = availableApps.length > 1

  if (variant === "header-button") {
    if (!hasMultipleApps) return null

    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="group flex items-center gap-1.5 rounded-lg border border-border/50 bg-background/70 px-2.5 py-1.5 text-xs font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-hidden cursor-pointer">
          <LayoutGrid className="size-3.5 text-primary" />
          <span className="hidden sm:inline">Apps</span>
          <ChevronDown className="size-3 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-64 rounded-xl p-1.5 shadow-lg"
        >
          <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Switch Application
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="-mx-1.5 my-1" />
          <DropdownMenuGroup className="space-y-0.5">
            {availableApps.map((app) => {
              const Icon = app.icon
              const isCurrent = app.id === activeAppId

              return (
                <DropdownMenuItem
                  key={app.id}
                  onClick={() => handleAppSwitch(app.url)}
                  className="flex items-center justify-between rounded-lg px-2.5 py-2 cursor-pointer transition-colors focus:bg-accent"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/50 text-foreground">
                      <Icon className="size-3.5 text-primary" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-medium leading-none">
                        {app.label}
                      </span>
                      <span className="mt-1 text-[10px] text-muted-foreground leading-none">
                        {app.description}
                      </span>
                    </div>
                  </div>
                  {isCurrent && (
                    <Check className="size-4 text-primary shrink-0 ml-2" />
                  )}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="cursor-default hover:bg-transparent hover:text-sidebar-foreground active:bg-transparent"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs shrink-0">
            <HeartPulse className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{currentAppName}</span>
            <span className="truncate text-xs text-muted-foreground">
              {currentAppLabel}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
