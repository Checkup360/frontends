import { resolveVitePublicApiBaseUrl } from "@workspace/auth/api"
import { AuthStatus } from "@workspace/auth/components/auth-status"
import { Button } from "@workspace/ui/components/button"

export function App() {
  return (
    <div className="flex min-h-svh flex-col p-6">
      <header className="mb-4 flex justify-end">
        <AuthStatus
          apiBaseUrl={resolveVitePublicApiBaseUrl(import.meta.env)}
          webBaseUrl={window.location.origin}
        />
      </header>
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
    </div>
  )
}
