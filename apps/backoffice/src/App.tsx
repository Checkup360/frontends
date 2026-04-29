import { CurrentUserEmail } from "@workspace/auth/components/current-user-email"
import { Button } from "@workspace/ui/components/button"

export function App() {
  return (
    <div className="flex min-h-svh p-6">
      <CurrentUserEmail apiBaseUrl={import.meta.env.VITE_API_URL as string | undefined} />
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
