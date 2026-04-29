import { CurrentUserEmail } from "@workspace/auth/components/current-user-email"
import Login from "./components/login"

export function App() {
  const pathname = window.location.pathname
  const isLoginPage = pathname === "/login"

  return (
    <div className="min-h-svh p-6">
      <CurrentUserEmail apiBaseUrl={import.meta.env.VITE_API_URL as string | undefined} />
      {isLoginPage ? (
        <Login />
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
