import { WorkspaceShellSkeleton } from "@workspace/components/components/workspace-shell-skeleton"
import { DashboardPageSkeleton } from "./dashboard-page-skeleton"

export function DashboardLoadingSkeleton() {
  return (
    <WorkspaceShellSkeleton
      titleClassName="h-5 w-24"
      appLabelClassName="h-3 w-32"
      navItemClassNames={["h-3.5 w-20", "h-3.5 w-16", "h-3.5 w-24"]}
      secondaryNavItemClassNames={["h-3.5 w-20", "h-3.5 w-16"]}
    >
      <DashboardPageSkeleton />
    </WorkspaceShellSkeleton>
  )
}
