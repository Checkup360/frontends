import {
  resolveWebBaseUrl,
  resolveVitePublicApiBaseUrl,
} from "@workspace/auth/api"
import { AuthStatus } from "@workspace/auth/components/auth-status"
import { RequireAuthRedirect } from "@workspace/auth/components/require-auth-redirect"
import { Button } from "@workspace/ui/components/button"
import { Link, Outlet, Route, Routes } from "react-router-dom"

function ProtectedLayout() {
  const apiBaseUrl = resolveVitePublicApiBaseUrl(import.meta.env)
  const webBaseUrl = resolveWebBaseUrl()

  return (
    <RequireAuthRedirect apiBaseUrl={apiBaseUrl} webBaseUrl={webBaseUrl}>
      <div className="flex min-h-svh flex-col p-6">
        <header className="mb-4 flex justify-end">
          <AuthStatus apiBaseUrl={apiBaseUrl} webBaseUrl={webBaseUrl} />
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </RequireAuthRedirect>
  )
}

function HomePage() {
  return (
    <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
      <div>
        <h1 className="font-medium">Project ready!</h1>
        <p>You may now add components and start building.</p>
        <p>We&apos;ve already added the button component for you.</p>
        <Button className="mt-2">Button</Button>
      </div>
      <div className="text-muted-foreground font-mono text-xs">
        (Press <kbd>d</kbd> to toggle dark mode)
      </div>
    </div>
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
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
