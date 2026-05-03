import {
  resolveWebBaseUrl,
  resolveVitePublicApiBaseUrl,
} from "@workspace/auth/api"
import { AuthStatus } from "@workspace/auth/components/auth-status"
import { RequireAuthRedirect } from "@workspace/auth/components/require-auth-redirect"
import { Button } from "@workspace/ui/components/button"
import { Link, Outlet, Route, Routes } from "react-router-dom"
import { DashboardPage } from "@/pages/dashboard"

function ProtectedLayout() {
  const apiBaseUrl = resolveVitePublicApiBaseUrl(import.meta.env as any)
  const webBaseUrl = resolveWebBaseUrl()

  return (
    <RequireAuthRedirect apiBaseUrl={apiBaseUrl} webBaseUrl={webBaseUrl}>
      <div className="flex min-h-svh flex-col p-6">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          </div>
          <AuthStatus apiBaseUrl={apiBaseUrl} webBaseUrl={webBaseUrl} />
        </header>
        <main className="flex-1 w-full overflow-auto">
          <Outlet />
        </main>
      </div>
    </RequireAuthRedirect>
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
    <Routes>
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
