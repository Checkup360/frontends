import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { MemberOverview, MemberOverviewSkeleton } from "@workspace/components/components/member-overview"

export function MemberOverviewPage() {
  const { user, isLoading } = useCurrentUser()

  if (isLoading) {
    return <MemberOverviewSkeleton />
  }

  if (!user?.email) {
    return null
  }

  return <MemberOverview email={user.email} />
}

export default MemberOverviewPage
