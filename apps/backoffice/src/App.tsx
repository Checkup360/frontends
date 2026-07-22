import { buildLoginUrl } from "@workspace/api"
import { AuthProvider } from "@workspace/auth/provider"
import { RequireSysadmin } from "@workspace/auth/components/require-sysadmin"
import { Button } from "@workspace/ui/components/button"
import { Toaster } from "@workspace/ui/components/sonner"
import { Link, Outlet, Route, Routes } from "react-router-dom"

import { BackofficeLoadingSkeleton } from "@/components/backoffice-loading-skeleton"
import { BackofficeShell } from "@/components/backoffice-shell"
import { InvitationsPage } from "@/pages/invitations"
import { OrganizationDetailPage } from "@/pages/organization-detail"
import { OrganizationsPage } from "@/pages/organizations"
import { SettingsPage } from "@/pages/settings"
import { ThemeProvider } from "./components/theme-provider"

function ProtectedLayout() {
  return (
    <RequireSysadmin fallback={<BackofficeLoadingSkeleton />}>
      <Outlet />
    </RequireSysadmin>
  )
}

function AccessDenied() {
  const loginUrl = buildLoginUrl({ nextUrl: `${window.location.origin}/` })

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-semibold tracking-tight text-muted-foreground/40">
        403
      </p>
      <h1 className="mt-4 text-xl font-semibold text-foreground">
        Access Denied
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        You don't have permission to access this area. Only system admins can
        access the backoffice.
      </p>
      <div className="mt-8 flex gap-3">
        <Button asChild variant="outline">
          <a href={loginUrl}>Sign in with different account</a>
        </Button>
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-semibold tracking-tight text-muted-foreground/40">
        404
      </p>
      <h1 className="mt-4 text-xl font-semibold text-foreground">
        Page not found
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The page you are looking for does not exist or has been moved.
      </p>
      <Button asChild className="mt-8">
        <Link to="/">Go to home</Link>
      </Button>
    </div>
  )
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster />
        <Routes>
          <Route path="/access-denied" element={<AccessDenied />} />
          <Route element={<ProtectedLayout />}>
            <Route element={<BackofficeShell />}>
              <Route path="/" element={<OrganizationsPage />} />
              <Route
                path="organizations/:id"
                element={<OrganizationDetailPage />}
              />
              <Route path="/invitations" element={<InvitationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}
