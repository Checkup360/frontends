import { WorkspaceShellSkeleton } from "@workspace/components/components/workspace-shell-skeleton"
import { MemberOverviewSkeleton } from "./member-overview-skeleton"

export function MemberLoadingSkeleton() {
  return (
    <WorkspaceShellSkeleton
      titleClassName="h-5 w-24"
      appLabelClassName="h-3 w-32"
      navItemClassNames={["h-3.5 w-20", "h-3.5 w-12", "h-3.5 w-14"]}
      secondaryNavItemClassNames={["h-3.5 w-16"]}
    >
      <MemberOverviewSkeleton />
    </WorkspaceShellSkeleton>
  )
}
