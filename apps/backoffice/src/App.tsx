import {
  resolveWebBaseUrl,
  resolveVitePublicApiBaseUrl,
} from "@workspace/auth/api"
import { RequireAuthRedirect } from "@workspace/auth/components/require-auth-redirect"
import { Button } from "@workspace/ui/components/button"
import { Link, Outlet, Route, Routes } from "react-router-dom"

import { BackofficeShell } from "@/components/backoffice-shell"
import { InvitationsPage } from "@/pages/invitations"
import { OrganizationsPage } from "@/pages/organizations"

function ProtectedLayout() {
  const apiBaseUrl = resolveVitePublicApiBaseUrl(import.meta.env)
  const webBaseUrl = resolveWebBaseUrl()

  return (
    <RequireAuthRedirect apiBaseUrl={apiBaseUrl} webBaseUrl={webBaseUrl}>
      <Outlet />
    </RequireAuthRedirect>
  )
}

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-semibold tracking-tight text-muted-foreground/40">404</p>
      <h1 className="mt-4 text-xl font-semibold text-foreground">Página no encontrada</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        La ruta que buscás no existe o fue movida.
      </p>
      <Button asChild className="mt-8">
        <Link to="/">Ir al inicio</Link>
      </Button>
    </div>
  )
}

export function App() {
  return (
    <Routes>
      <Route element={<ProtectedLayout />}>
        <Route element={<BackofficeShell />}>
          <Route path="/" element={<OrganizationsPage />} />
          <Route path="/invitations" element={<InvitationsPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  )
}
