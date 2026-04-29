import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"

export function useCurrentUserEmail(apiBaseUrl?: string) {
  return useCurrentUser(apiBaseUrl).email
}
