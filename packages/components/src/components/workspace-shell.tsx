"use client"

import type { ReactNode } from "react"

import { SidebarProvider } from "@workspace/ui/components/sidebar"
import {
  AppSidebar,
  SiteHeader,
  NavMain,
  NavSecondary,
  NavDocuments,
  NavUser,
  type NavMainItem,
  type NavDocumentsItem,
  type NavUserProps,
} from "./sidebar"

export type WorkspaceShellNavItem = NavMainItem & {
  to: string
  end?: boolean
}

export type WorkspaceShellPageMeta = {
  eyebrow: string
  title: string
  description: string
}

type WorkspaceShellProps = {
  appLabel: string
  appName?: string
  appLogoUrl?: string | null
  title: string
  navigation: WorkspaceShellNavItem[]
  secondaryNavigation?: WorkspaceShellNavItem[]
  secondaryAction?: ReactNode
  documents?: NavDocumentsItem[]
  user?: NavUserProps["user"]
  onLogout?: () => void
  children: ReactNode
  linkComponent?: React.ComponentType<any>
}

export function WorkspaceShell({
  appLabel,
  appName = "CheckUp360",
  appLogoUrl,
  title,
  navigation,
  secondaryNavigation,
  secondaryAction,
  documents,
  user,
  onLogout,
  children,
  linkComponent,
}: WorkspaceShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar
        appLabel={appLabel}
        appName={appName}
        appLogoUrl={appLogoUrl}
        navMain={<NavMain items={navigation} linkComponent={linkComponent} />}
        navDocuments={
          documents && (
            <NavDocuments items={documents} linkComponent={linkComponent} />
          )
        }
        navSecondary={
          (secondaryNavigation || secondaryAction) && (
            <div className="mt-auto">
              {secondaryAction}
              {secondaryNavigation && (
                <NavSecondary
                  items={secondaryNavigation}
                  linkComponent={linkComponent}
                />
              )}
            </div>
          )
        }
        navUser={user && <NavUser user={user} onLogout={onLogout} />}
      />

      <div className="flex w-full min-w-0 flex-1 flex-col">
        <SiteHeader title={title} />

        <main className="flex-1 min-w-0 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </SidebarProvider>
  )
}
