import { useState, type ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { Activity, HeartPulse, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"

export type WorkspaceShellNavItem = {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

export type WorkspaceShellPageMeta = {
  eyebrow: string
  title: string
  description: string
}

type WorkspaceShellLinkRenderProps = {
  item: WorkspaceShellNavItem
  isActive: boolean
  className: string
  children: ReactNode
}

type WorkspaceShellProps = {
  appLabel: string
  searchPlaceholder: string
  navigation: WorkspaceShellNavItem[]
  secondaryNavigation?: WorkspaceShellNavItem[]
  activePath: string
  pageMeta: Record<string, WorkspaceShellPageMeta>
  fallbackMeta: WorkspaceShellPageMeta
  sidebarFooter: ReactNode
  children: ReactNode
  renderLink: (props: WorkspaceShellLinkRenderProps) => ReactNode
}

const primaryNavClassName =
  "flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors"

function isNavItemActive(item: WorkspaceShellNavItem, activePath: string) {
  if (item.end) {
    return activePath === item.to
  }

  return activePath === item.to || activePath.startsWith(`${item.to}/`)
}

export function WorkspaceShell({
  appLabel,
  searchPlaceholder,
  navigation,
  secondaryNavigation,
  activePath,
  pageMeta,
  fallbackMeta,
  sidebarFooter,
  children,
  renderLink,
}: WorkspaceShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const meta = pageMeta[activePath] ?? fallbackMeta
  const sidebarWidthClassName = sidebarCollapsed ? "lg:w-[76px]" : "lg:w-[280px]"

  return (
    <div
      className={cn(
        "min-h-svh bg-muted/25 text-foreground",
        sidebarCollapsed ? "lg:[--workspace-sidebar:76px]" : "lg:[--workspace-sidebar:280px]"
      )}
    >
      <aside
        className={cn(
          "hidden border-r border-border/60 bg-background/95 transition-[width] duration-200 ease-out lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:flex-col",
          sidebarWidthClassName
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center gap-3 px-4",
            sidebarCollapsed && "justify-between px-3"
          )}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[var(--shadow-card)]">
            <HeartPulse className="size-5" />
          </div>
          {!sidebarCollapsed ? (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-none">CheckUp360</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{appLabel}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Collapse sidebar"
                onClick={() => setSidebarCollapsed(true)}
              >
                <PanelLeftClose className="size-4" />
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Expand sidebar"
              onClick={() => setSidebarCollapsed(false)}
            >
              <PanelLeftOpen className="size-4" />
            </Button>
          )}
        </div>

        {!sidebarCollapsed ? (
          <div className="px-3 pb-3">
            <div className="flex h-9 items-center gap-2 rounded-md border border-border/70 bg-muted/40 px-3 text-sm text-muted-foreground">
              <Search className="size-4" />
              <span>{searchPlaceholder}</span>
            </div>
          </div>
        ) : null}

        <nav className="flex-1 space-y-1 px-3 py-2">
          {navigation.map((item) => {
            const isActive = isNavItemActive(item, activePath)

            return renderLink({
              item,
              isActive,
              className: cn(
                primaryNavClassName,
                sidebarCollapsed && "justify-center px-0",
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              ),
              children: (
                <>
                  <item.icon className="size-4" />
                  <span className={cn(sidebarCollapsed && "sr-only")}>{item.label}</span>
                </>
              ),
            })
          })}

          {secondaryNavigation?.length ? <Separator className="my-3" /> : null}

          {secondaryNavigation?.map((item) => {
            const isActive = isNavItemActive(item, activePath)

            return renderLink({
              item,
              isActive,
              className: cn(
                primaryNavClassName,
                sidebarCollapsed && "justify-center px-0",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              ),
              children: (
                <>
                  <item.icon className="size-4" />
                  <span className={cn(sidebarCollapsed && "sr-only")}>{item.label}</span>
                </>
              ),
            })
          })}
        </nav>

        {!sidebarCollapsed ? (
          <div className="border-t border-border/60 p-4">{sidebarFooter}</div>
        ) : null}
      </aside>

      <div className="flex min-w-0 flex-col transition-[margin] duration-200 ease-out lg:ml-[var(--workspace-sidebar)]">
        <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
          <div className="flex min-h-16 flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                <Activity className="size-3.5" />
                {meta.eyebrow}
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                {meta.title}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{meta.description}</p>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
