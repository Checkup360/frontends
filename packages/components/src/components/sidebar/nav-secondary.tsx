"use client"

import type { LucideIcon } from "lucide-react"
import * as React from "react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar"

export interface NavSecondaryItem {
  title: string
  url: string
  icon?: LucideIcon
}

interface NavSecondaryProps {
  items: NavSecondaryItem[]
  linkComponent?: React.ComponentType<any>
  className?: string
}

export function NavSecondary({
  items,
  linkComponent: Link = "a" as any,
  className,
}: NavSecondaryProps) {
  const { isMobile, setOpenMobile } = useSidebar()

  const closeMobileNavigation = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <SidebarGroup className={className}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <Link
                  href={item.url}
                  to={item.url}
                  onClick={closeMobileNavigation}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
