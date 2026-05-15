"use client"

import type { ReactNode } from "react"
import { HeartPulse } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"

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
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <HeartPulse className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{appName}</span>
                  <span className="text-xs text-muted-foreground">{appLabel}</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
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
