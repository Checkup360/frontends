import type { ReactNode } from "react"

import { Skeleton } from "@workspace/ui/components/skeleton"

type WorkspaceShellSkeletonProps = {
  titleClassName?: string
  navItemClassNames?: string[]
  secondaryNavItemClassNames?: string[]
  appNameClassName?: string
  appLabelClassName?: string
  userNameClassName?: string
  userEmailClassName?: string
  children: ReactNode
}

function SidebarItemSkeleton({ className }: { className: string }) {
  return (
    <div className="flex h-8 items-center gap-2 rounded-md px-2">
      <Skeleton className="size-4 rounded-sm" />
      <Skeleton className={className} />
    </div>
  )
}

export function WorkspaceShellSkeleton({
  titleClassName = "h-5 w-24",
  navItemClassNames = ["h-3.5 w-20", "h-3.5 w-16", "h-3.5 w-24"],
  secondaryNavItemClassNames = ["h-3.5 w-20", "h-3.5 w-16"],
  appNameClassName = "h-3.5 w-20",
  appLabelClassName = "h-3 w-28",
  userNameClassName = "h-3.5 w-20",
  userEmailClassName = "h-3 w-32",
  children,
}: WorkspaceShellSkeletonProps) {
  return (
    <div className="flex min-h-svh bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar p-2 md:flex md:flex-col">
        <div className="px-2 py-2">
          <div className="flex h-12 items-center gap-2 rounded-md px-2">
            <Skeleton className="size-8 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className={appNameClassName} />
              <Skeleton className={appLabelClassName} />
            </div>
          </div>
        </div>

        <div className="mt-2 space-y-1 px-2">
          {navItemClassNames.map((className, index) => (
            <SidebarItemSkeleton key={index} className={className} />
          ))}
        </div>

        <div className="mt-auto space-y-1 px-2 pb-2">
          {secondaryNavItemClassNames.map((className, index) => (
            <SidebarItemSkeleton key={index} className={className} />
          ))}
          <div className="mt-4 flex h-12 items-center gap-2 rounded-md px-2">
            <Skeleton className="size-8 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className={userNameClassName} />
              <Skeleton className={userEmailClassName} />
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b px-4 lg:px-6">
          <Skeleton className="size-8 md:hidden" />
          <Skeleton className="h-4 w-px" />
          <Skeleton className={titleClassName} />
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
