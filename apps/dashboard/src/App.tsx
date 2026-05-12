import {
  resolveVitePublicApiBaseUrl,
} from "@workspace/auth/api"
import { RequireOrgAdmin } from "@workspace/auth/components/require-org-admin"
import { Button } from "@workspace/ui/components/button"
import { Toaster } from "@workspace/ui/components/sonner"
import { Link, Outlet, Route, Routes } from "react-router-dom"
import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardPage } from "@/pages/dashboard"
import { EmployeesPage } from "@/pages/employees"
import { InvitePeoplePage } from "@/pages/invite-people"
import { ThemeProvider } from "./components/theme-provider"

function ProtectedLayout() {
  const apiBaseUrl = resolveVitePublicApiBaseUrl(import.meta.env)

  return (
    <RequireOrgAdmin apiBaseUrl={apiBaseUrl}>
      <Outlet />
    </RequireOrgAdmin>
  )
}

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-semibold tracking-tight text-muted-foreground/40">404</p>
      <h1 className="mt-4 text-xl font-semibold text-foreground">Page not found</h1>
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
      <Toaster />
      <Routes>
        <Route element={<ProtectedLayout />}>
          <Route element={<DashboardShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/people/invite" element={<InvitePeoplePage />} />
            <Route path="/organization" element={<NotFound />} />
            <Route path="/settings" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </ThemeProvider>
  )
}

