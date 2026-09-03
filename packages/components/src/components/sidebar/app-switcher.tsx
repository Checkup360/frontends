"use client"

import { useMemo } from "react"
import {
  resolveBackofficeUrl,
  resolveCmsUrl,
  resolveDashboardUrl,
  resolveWebUrl,
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
  useSidebar,
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
} from "lucide-react"

export interface AppOption {
  id: "web" | "dashboard" | "backoffice" | "cms"
  name: string
  label: string
  description: string
  url: string
  icon: typeof User
}

export interface AppSwitcherProps {
  currentAppLabel: string
  currentAppName?: string
  variant?: "sidebar-header" | "header-button"
}

export function AppSwitcher({
  currentAppLabel,
  currentAppName = "CheckUp360",
  variant = "sidebar-header",
}: AppSwitcherProps) {
  const { user } = useCurrentUser()
  const { isMobile } = useSidebar()

  const availableApps = useMemo<AppOption[]>(() => {
    const webUrl = resolveWebUrl()
    const dashboardUrl = resolveDashboardUrl()
    const backofficeUrl = resolveBackofficeUrl()
    const cmsUrl = `${resolveCmsUrl()}/admin`

    const isSysadmin = Boolean(user?.is_sysadmin)
    const userRoles = user?.membership?.roles || []
    const isOrgAdmin = userRoles.includes("admin")
    const isContentManager = userRoles.includes("content_manager")

    const apps: AppOption[] = []

    if (!isSysadmin) {
      apps.push({
        id: "web",
        name: "CheckUp360",
        label: "Employee PWA",
        description: "Health & wellness portal",
        url: webUrl,
        icon: User,
      })
    }

    if (isOrgAdmin) {
      apps.push({
        id: "dashboard",
        name: "CheckUp360",
        label: "Employer Dashboard",
        description: "Organization & analytics management",
        url: dashboardUrl,
        icon: Building2,
      })
    }

    if (isSysadmin) {
      apps.push({
        id: "backoffice",
        name: "CheckUp360",
        label: "Backoffice",
        description: "Global system administration",
        url: backofficeUrl,
        icon: ShieldCheck,
      })
    }

    if (isOrgAdmin || isContentManager) {
      apps.push({
        id: "cms",
        name: "CheckUp360",
        label: "CMS",
        description: "Content & article management",
        url: cmsUrl,
        icon: FileText,
      })
    }

    return apps
  }, [user])

  const activeAppId = useMemo(() => {
    if (typeof window === "undefined") return "web"
    const currentOrigin = window.location.origin
    const currentPath = window.location.pathname

    if (currentOrigin.includes("3000") || currentPath.startsWith("/admin")) {
      return "cms"
    }
    if (currentOrigin.includes("5175") || currentOrigin === resolveBackofficeUrl()) {
      return "backoffice"
    }
    if (currentOrigin.includes("5174") || currentOrigin === resolveDashboardUrl()) {
      return "dashboard"
    }
    return "web"
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
                  {isCurrent && <Check className="size-4 text-primary shrink-0 ml-2" />}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Sidebar header variant
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="group data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent/60 cursor-pointer"
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
              {hasMultipleApps && (
                <ChevronDown className="ml-auto size-3.5 shrink-0 text-muted-foreground/70 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64 rounded-xl p-1.5 shadow-lg"
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={4}
          >
            <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              {hasMultipleApps ? "Switch Application" : "Active Application"}
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
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
