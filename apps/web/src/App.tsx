import {
  clearPostLoginRedirectUrl,
  readPostLoginRedirectUrl,
  resolveVitePublicApiBaseUrl,
} from "@workspace/auth/api"
import { AuthStatus } from "@workspace/auth/components/auth-status"
import { useEffect, useRef } from "react"
import { Link, Outlet, Route, Routes } from "react-router-dom"
import AuthError from "./components/auth-error"
import Invite from "./components/invite"
import Login from "./components/login"
import NotFound from "./components/not-found"

function RootLayout() {
  return (
    <div className="relative min-h-svh">
      <header className="sticky top-0 z-30 flex justify-end border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur-md">
        <AuthStatus
          apiBaseUrl={resolveVitePublicApiBaseUrl(import.meta.env)}
          webBaseUrl={window.location.origin}
        />
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}

function HomePage() {
  return (
    <div className="mx-auto mt-20 max-w-xl text-center">
      <h1 className="text-2xl font-semibold">Checkup360 Web</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Sesión iniciada. Si necesitás autenticarte, entrá a{" "}
        <Link to="/login" className="underline">
          /login
        </Link>
        .
      </p>
    </div>
  )
}

function LoginComplete() {
  const redirectUrl = useRef(readPostLoginRedirectUrl(`${window.location.origin}/`))

  useEffect(() => {
    clearPostLoginRedirectUrl()
    window.location.replace(redirectUrl.current)
  }, [])

  return (
    <div className="mx-auto mt-20 max-w-xl text-center text-sm text-muted-foreground">
      Completando login...
    </div>
  )
}

export function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login/complete" element={<LoginComplete />} />
        <Route path="/auth/error" element={<AuthError />} />
        <Route path="/invite/:token" element={<Invite />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
