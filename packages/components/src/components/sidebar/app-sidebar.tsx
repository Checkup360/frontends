"use client"

import type { ReactNode } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@workspace/ui/components/sidebar"

import { AppSwitcher } from "./app-switcher"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  appLabel: string
  appName?: string
  navMain?: ReactNode
  navDocuments?: ReactNode
  navSecondary?: ReactNode
  navUser?: ReactNode
}

export function AppSidebar({
  appLabel,
  appName = "CheckUp360",
  navMain,
  navDocuments,
  navSecondary,
  navUser,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <AppSwitcher currentAppLabel={appLabel} currentAppName={appName} />
      </SidebarHeader>

      <SidebarContent>
        {navMain}
        {navDocuments}
        {navSecondary}
      </SidebarContent>

      <SidebarFooter>
        {navUser}
      </SidebarFooter>
    </Sidebar>
  )
}
