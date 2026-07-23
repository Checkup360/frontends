import {
  buildLoginUrl,
  clearPostLoginRedirectUrl,
  fetchCurrentUser,
  getRedirectUrlByUserRole,
  logout,
} from "@workspace/api"
import { AuthLoadingSkeleton } from "@workspace/auth/components/auth-loading-skeleton"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { AuthProvider } from "@workspace/auth/provider"
import { Button } from "@workspace/ui/components/button"
import { Toaster } from "@workspace/ui/components/sonner"
import { useEffect, useState } from "react"
import { Navigate, Outlet, Route, Routes } from "react-router-dom"
import AuthError from "./components/auth/auth-error"
import Invite from "./components/auth/invite"
import Login from "./components/auth/login"
import ForgotPassword from "./components/auth/forgot-password"
import ResetPassword from "./components/auth/reset-password"
import { HeroCheckup360 } from "./components/landing/hero-checkup360"
import { MemberLoadingSkeleton } from "./components/member/loading-skeleton"
import { MemberShell } from "./components/member/shell"
import { PwaInstallProvider } from "./components/pwa/pwa-install-provider"
import NotFound from "./components/shared/not-found"
import { DashboardPage } from "./pages/dashboard"
import { MemberOverviewPage } from "./pages/member-overview"
import { MemberNewsPage } from "./pages/member-news"
import { MemberFormsPage } from "./pages/member-forms"
import { MemberSettingsPage } from "./pages/member-settings"
import { MemberOnboardingPage } from "./pages/member-onboarding"
import { ThemeProvider } from "./components/shared/theme-provider"

function isMemberOnlyUser(
  user: ReturnType<typeof useCurrentUser>["user"]
): boolean {
  return Boolean(
    user &&
    !user.is_sysadmin &&
    user.membership &&
    user.membership.roles?.includes("member")
  )
}

function RootLayout() {
  return (
    <div className="relative min-h-svh">
      <main>
        <Outlet />
      </main>
    </div>
  )
}

function NoOrganizationError() {
  const loginUrl = buildLoginUrl({ nextUrl: `${window.location.origin}/` })
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    window.location.replace("/")
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        No Organization Found
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        You don't belong to any active organization. Please ask an administrator
        for a new invitation link.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <a href={loginUrl}>Sign in with different account</a>
        </Button>
        <Button
          variant="ghost"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full sm:w-auto"
        >
          {loggingOut ? "Logging out..." : "Log out"}
        </Button>
      </div>
    </div>
  )
}

function HomePage() {
  const { isLoading, user } = useCurrentUser()

  if (isLoading) {
    return <AuthLoadingSkeleton />
  }

  const hasOnlyMemberRole = isMemberOnlyUser(user)

  if (hasOnlyMemberRole) {
    if (user?.requires_onboarding) {
      return <Navigate to="/onboarding" replace />
    }
    return <DashboardPage />
  }

  const hasNoMemberships = user && !user.is_sysadmin && !user.membership

  if (hasNoMemberships) {
    return <NoOrganizationError />
  }

  return <HeroCheckup360 user={user} />
}

function LoginComplete() {
  useEffect(() => {
    const performRedirect = async () => {
      // Siempre hacer fetch del usuario para determinar a dónde redirigir
      const user = await fetchCurrentUser()
      const finalRedirectUrl = getRedirectUrlByUserRole(user)

      clearPostLoginRedirectUrl()
      window.location.replace(finalRedirectUrl)
    }

    const timer = setTimeout(() => {
      void performRedirect()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="mx-auto mt-20 max-w-xl text-center text-sm text-muted-foreground">
      Completing login...
    </div>
  )
}

function RequireMemberRole({ children }: { children: React.ReactNode }) {
  const { isLoading, user } = useCurrentUser()

  if (isLoading) {
    return <MemberLoadingSkeleton />
  }

  const hasOnlyMemberRole = isMemberOnlyUser(user)

  if (!hasOnlyMemberRole) {
    const hasNoMemberships = user && !user.is_sysadmin && !user.membership
    if (hasNoMemberships) {
      return <NoOrganizationError />
    }
    return <HomePage />
  }

  if (user?.requires_onboarding) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PwaInstallProvider>
          <Toaster />
          <Routes>
            <Route element={<RootLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/login/complete" element={<LoginComplete />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/onboarding" element={<MemberOnboardingPage />} />
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
        </PwaInstallProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
