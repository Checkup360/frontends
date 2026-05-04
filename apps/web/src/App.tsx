import {
  clearPostLoginRedirectUrl,
  readPostLoginRedirectUrl,
  resolveVitePublicApiBaseUrl,
} from "@workspace/auth/api"
import { AuthStatus } from "@workspace/auth/components/auth-status"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { useEffect, useRef } from "react"
import { Outlet, Route, Routes, Navigate } from "react-router-dom"
import AuthError from "./components/auth-error"
import { HeroCheckup360 } from "./components/hero-checkup360"
import Invite from "./components/invite"
import Login from "./components/login"
import NotFound from "./components/not-found"
import { DashboardPage } from "./pages/dashboard"

function RootLayout() {
  return (
    <div className="relative min-h-svh">
      <header className="sticky top-0 z-30 flex justify-end border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur-md">
        <AuthStatus
          apiBaseUrl={resolveVitePublicApiBaseUrl(import.meta.env)}
          webBaseUrl={window.location.origin}
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

  if (user) {
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
