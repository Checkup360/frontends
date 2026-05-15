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
  title: string
  navigation: WorkspaceShellNavItem[]
  secondaryNavigation?: WorkspaceShellNavItem[]
  documents?: NavDocumentsItem[]
  user?: NavUserProps["user"]
  onLogout?: () => void
  children: ReactNode
  linkComponent?: React.ComponentType<any>
}

export function WorkspaceShell({
  appLabel,
  appName = "CheckUp360",
  title,
  navigation,
  secondaryNavigation,
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
        navMain={<NavMain items={navigation} linkComponent={linkComponent} />}
        navDocuments={documents && <NavDocuments items={documents} linkComponent={linkComponent} />}
        navSecondary={
          secondaryNavigation && (
            <NavSecondary 
              items={secondaryNavigation} 
              linkComponent={linkComponent}
              className="mt-auto"
            />
          )
        }
        navUser={user && <NavUser user={user} onLogout={onLogout} />}
      />

      <div className="flex w-full flex-col">
        <SiteHeader title={title} />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
