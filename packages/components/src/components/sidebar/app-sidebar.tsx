"use client"

import type { ReactNode } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@workspace/ui/components/sidebar"
import { HeartPulse } from "lucide-react"

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
            <SidebarMenuButton
              size="lg"
              className="cursor-default hover:bg-transparent hover:text-sidebar-foreground active:bg-transparent"
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs shrink-0">
                <HeartPulse className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{appName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {appLabel}
                </span>
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
