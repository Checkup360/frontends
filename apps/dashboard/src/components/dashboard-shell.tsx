import { buildLoginUrl, logout, resolveWebBaseUrl, resolveVitePublicApiBaseUrl } from "@workspace/auth/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"
import {
  Activity,
  Building2,
  HeartPulse,
  LayoutDashboard,
  MailPlus,
  Search,
  Settings,
  UserRound,
  Users,
} from "lucide-react"
import { NavLink, Outlet, useLocation } from "react-router-dom"

const navigation = [
  { label: "Overview", to: "/", icon: LayoutDashboard, end: true },
  { label: "Employees", to: "/employees", icon: Users },
  { label: "Invite people", to: "/people/invite", icon: MailPlus },
]

const secondaryNavigation = [
  { label: "Organization", to: "/organization", icon: Building2 },
  { label: "Settings", to: "/settings", icon: Settings },
]

const pageMeta: Record<string, { eyebrow: string; title: string; description: string }> = {
  "/": {
    eyebrow: "Occupational health",
    title: "Dashboard",
    description: "Aggregated health signals and workforce risk monitoring.",
  },
  "/employees": {
    eyebrow: "People operations",
    title: "Employees",
    description: "Review individual checkups, areas, and health risk categories.",
  },
  "/people/invite": {
    eyebrow: "Access management",
    title: "Invite people",
    description: "Prepare invitation links for organization admins and employees.",
  },
}

export function DashboardShell() {
  const location = useLocation()
  const apiBaseUrl = resolveVitePublicApiBaseUrl(import.meta.env)
  const webBaseUrl = resolveWebBaseUrl()
  const meta = pageMeta[location.pathname] ?? {
    eyebrow: "CheckUp360",
    title: "Workspace",
    description: "Manage your organization health workspace.",
  }

  return (
    <div className="min-h-svh bg-muted/25 text-foreground">
      <aside className="hidden border-r border-border/60 bg-background/95 lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-[280px] lg:flex-col">
        <div className="flex h-16 items-center gap-3 px-5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[var(--shadow-card)]">
            <HeartPulse className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-none">CheckUp360</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">Company dashboard</p>
          </div>
        </div>

        <div className="px-3 pb-3">
          <div className="flex h-9 items-center gap-2 rounded-md border border-border/70 bg-muted/40 px-3 text-sm text-muted-foreground">
            <Search className="size-4" />
            <span>Search employees...</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}

          <Separator className="my-3" />

          {secondaryNavigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border/60 p-4">
          <SidebarUser apiBaseUrl={apiBaseUrl} webBaseUrl={webBaseUrl} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col lg:ml-[280px]">
        <header className="border-b border-border/60 bg-background/85 backdrop-blur-md">
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

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

type SidebarUserProps = {
  apiBaseUrl: string
  webBaseUrl: string
}

function SidebarUser({ apiBaseUrl, webBaseUrl }: SidebarUserProps) {
  const { email, isLoading, clear } = useCurrentUser(apiBaseUrl)
  const loginUrl = buildLoginUrl({ webBaseUrl, nextUrl: window.location.href })

  const handleLogout = async () => {
    await logout(apiBaseUrl)
    clear()
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
        <div className="h-9 animate-pulse rounded-md bg-muted" />
      </div>
    )
  }

  if (!email) {
    return (
      <Button asChild variant="outline" className="w-full justify-start">
        <a href={loginUrl}>
          <UserRound className="size-4" />
          Sign in
        </a>
      </Button>
    )
  }

  const initials = email
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")

  return (
    <div className="rounded-lg border border-border/60 bg-card p-3">
      <div className="flex items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-primary/10 text-xs font-medium text-primary">
          {initials || "U"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{email}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Organization member</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" asChild>
          <NavLink to="/people/invite">
            <MailPlus className="size-4" />
            Invite
          </NavLink>
        </Button>
        <Button variant="ghost" size="sm" type="button" onClick={handleLogout}>
          Sign out
        </Button>
      </div>
    </div>
  )
}
