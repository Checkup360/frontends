import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"

export function CurrentUserEmail() {
  const { email } = useCurrentUser()

  if (!email) return null

  return (
    <div className="fixed top-4 right-4 rounded-md border bg-background px-3 py-1 text-xs shadow-sm">
      {email}
    </div>
  )
}
