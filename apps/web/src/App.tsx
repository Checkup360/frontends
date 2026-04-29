import {
  clearPostLoginRedirectUrl,
  readPostLoginRedirectUrl,
} from "@workspace/auth/api"
import { AuthStatus } from "@workspace/auth/components/auth-status"
import { useEffect, useRef } from "react"
import Login from "./components/login"
import Invite from "./components/invite"
import AuthError from "./components/auth-error"
import Register from "./components/register"

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
  const pathname = window.location.pathname
  const isLoginPage = pathname === "/login"
  const isLoginCompletePage = pathname === "/login/complete"
  const isAuthErrorPage = pathname === "/auth/error"
  const isRegisterPage = pathname === "/register"
  const isInvitePage = pathname.startsWith("/invite/")

  return (
    <div className="min-h-svh p-6">
      <AuthStatus
        apiBaseUrl={import.meta.env.VITE_API_URL as string | undefined}
        webBaseUrl={window.location.origin}
      />
      {isLoginCompletePage ? (
        <LoginComplete />
      ) : isLoginPage ? (
        <Login />
      ) : isAuthErrorPage ? (
        <AuthError />
      ) : isRegisterPage ? (
        <Register />
      ) : isInvitePage ? (
        <Invite />
      ) : (
        <div className="mx-auto mt-20 max-w-xl text-center">
          <h1 className="text-2xl font-semibold">Checkup360 Web</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Sesion iniciada. Si necesitas autenticarte, entra a <a className="underline" href="/login">/login</a>.
          </p>
        </div>
      )}
    </div>
  )
}
