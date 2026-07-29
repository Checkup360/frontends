"use client"

import type { LucideIcon } from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar"

export interface NavMainItem {
  title: string
  url: string
  icon?: LucideIcon
}

interface NavMainProps {
  items: NavMainItem[]
  linkComponent?: React.ComponentType<any>
}

export function NavMain({
  items,
  linkComponent: Link = "a" as any,
}: NavMainProps) {
  const { isMobile, setOpenMobile } = useSidebar()

  const closeMobileNavigation = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <SidebarGroup>
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
