import { buildLoginUrl } from "@workspace/api"
import { AuthProvider } from "@workspace/auth/provider"
import { RequireOrgRole } from "@workspace/auth/components/require-org-role"

import { Button } from "@workspace/ui/components/button"
import { Toaster } from "@workspace/ui/components/sonner"
import { Link, Outlet, Route, Routes } from "react-router-dom"
import { DashboardLoadingSkeleton } from "@/components/dashboard-loading-skeleton"
import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardPage } from "@/pages/dashboard"
import { DepartmentDetailPage } from "@/pages/department-detail"
import { DepartmentEditPage } from "@/pages/department-edit"
import { DepartmentsPage } from "@/pages/departments"
import { EmployeesPage } from "@/pages/employees"
import { EmployeeDetailPage } from "@/pages/employee-detail"
import { InvitePeoplePage } from "@/pages/invite-people"
import { OrganizationPage } from "@/pages/organization"
import { ScoreWeightsPage } from "@/pages/score-weights"
import { SettingsPage } from "@/pages/settings"
import { ThemeProvider } from "./components/theme-provider"



function ProtectedLayout() {
  return (
    <RequireOrgRole allowedRoles={["admin"]} fallback={<DashboardLoadingSkeleton />}>
      <Outlet />
    </RequireOrgRole>
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
        You don't have permission to access this area. Only organization admins
        can access the dashboard.
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
        The route you're looking for doesn't exist or has been moved.
      </p>
      <Button asChild className="mt-8">
        <Link to="/">Go home</Link>
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
            <Route element={<DashboardShell />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/employees/:id" element={<EmployeeDetailPage />} />
              <Route path="/invitations" element={<InvitePeoplePage />} />
              <Route path="/departments" element={<DepartmentsPage />} />
              <Route
                path="/departments/:slug/edit"
                element={<DepartmentEditPage />}
              />
              <Route
                path="/departments/:slug"
                element={<DepartmentDetailPage />}
              />
              <Route path="/organization" element={<OrganizationPage />} />
              <Route path="/score-weights" element={<ScoreWeightsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}
