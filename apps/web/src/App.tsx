import {
  clearPostLoginRedirectUrl,
  readPostLoginRedirectUrl,
  resolveVitePublicApiBaseUrl,
} from "@workspace/auth/api"
import { AuthStatus } from "@workspace/auth/components/auth-status"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { Toaster } from "@workspace/ui/components/sonner"
import { useEffect, useRef } from "react"
import { Outlet, Route, Routes } from "react-router-dom"
import AuthError from "./components/auth-error"
import { HeroCheckup360 } from "./components/hero-checkup360"
import { MemberShell } from "./components/member-shell"
import Invite from "./components/invite"
import Login from "./components/login"
import NotFound from "./components/not-found"
import { DashboardPage } from "./pages/dashboard"
import { MemberOverviewPage } from "./pages/member-overview"
import { MemberNewsPage } from "./pages/member-news"
import { MemberFormsPage } from "./pages/member-forms"
import { MemberSettingsPage } from "./pages/member-settings"
import { ThemeProvider } from "./components/theme-provider"

function RootLayout() {
  return (
    <div className="relative min-h-svh">
      <header className="sticky top-0 z-30 flex justify-end border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur-md">
        <AuthStatus
          apiBaseUrl={resolveVitePublicApiBaseUrl(import.meta.env)}
        />
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}

function HomePage() {
  const apiBaseUrl = resolveVitePublicApiBaseUrl(import.meta.env)
  const { isLoading, user } = useCurrentUser(apiBaseUrl)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  // Solo mostrar DashboardPage si el usuario es member (no admin, no sysadmin)
  const hasOnlyMemberRole =
    user &&
    !user.is_sysadmin &&
    Array.isArray(user.memberships) &&
    user.memberships.length > 0 &&
    user.memberships.some((m) => m.role === "member") &&
    !user.memberships.some((m) => m.role === "admin")

  if (hasOnlyMemberRole) {
    return <DashboardPage />
  }

  return <HeroCheckup360 />
}

function LoginComplete() {
  const redirectUrl = useRef(readPostLoginRedirectUrl(`${window.location.origin}/`))

  useEffect(() => {
    clearPostLoginRedirectUrl()
    window.location.replace(redirectUrl.current)
  }, [])

  return (
    <div className="mx-auto mt-20 max-w-xl text-center text-sm text-muted-foreground">
      Completing login...
    </div>
  )
}

function RequireMemberRole({ children }: { children: React.ReactNode }) {
  const apiBaseUrl = resolveVitePublicApiBaseUrl(import.meta.env)
  const { isLoading, user } = useCurrentUser(apiBaseUrl)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  // Solo mostrar si el usuario es member (no admin, no sysadmin)
  const hasOnlyMemberRole =
    user &&
    !user.is_sysadmin &&
    Array.isArray(user.memberships) &&
    user.memberships.length > 0 &&
    user.memberships.some((m) => m.role === "member") &&
    !user.memberships.some((m) => m.role === "admin")

  if (!hasOnlyMemberRole) {
    return <HomePage />
  }

  return <>{children}</>
}

export function App() {
  return (
    <ThemeProvider>
      <Toaster />
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/login/complete" element={<LoginComplete />} />
          <Route path="/auth/error" element={<AuthError />} />
          <Route path="/invite/:token" element={<Invite />} />
          <Route
            element={
              <RequireMemberRole>
                <MemberShell />
              </RequireMemberRole>
            }
          >
            <Route path="/" element={<MemberOverviewPage />} />
            <Route path="/news" element={<MemberNewsPage />} />
            <Route path="/forms" element={<MemberFormsPage />} />
            <Route path="/settings" element={<MemberSettingsPage />} />
          </Route>
          <Route path="/" element={<HomePage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ThemeProvider>
  )
}
