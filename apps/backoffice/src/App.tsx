import {
  resolveWebBaseUrl,
  resolveVitePublicApiBaseUrl,
} from "@workspace/auth/api"
import { RequireSysadmin } from "@workspace/auth/components/require-sysadmin"
import { Button } from "@workspace/ui/components/button"
import { Toaster } from "@workspace/ui/components/sonner"
import { Link, Outlet, Route, Routes } from "react-router-dom"

import { BackofficeShell } from "@/components/backoffice-shell"
import { InvitationsPage } from "@/pages/invitations"
import { OrganizationsPage } from "@/pages/organizations"
import { ThemeProvider } from "./components/theme-provider"

function ProtectedLayout() {
  const apiBaseUrl = resolveVitePublicApiBaseUrl(import.meta.env)
  const webBaseUrl = resolveWebBaseUrl()

  return (
    <RequireSysadmin apiBaseUrl={apiBaseUrl} webBaseUrl={webBaseUrl}>
      <Outlet />
    </RequireSysadmin>
  )
}

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-semibold tracking-tight text-muted-foreground/40">404</p>
      <h1 className="mt-4 text-xl font-semibold text-foreground">Page not found</h1>
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
      <Toaster />
      <Routes>
        <Route element={<ProtectedLayout />}>
          <Route element={<BackofficeShell />}>
            <Route path="/" element={<OrganizationsPage />} />
            <Route path="/invitations" element={<InvitationsPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </ThemeProvider>
  )
}

