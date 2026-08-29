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
  end?: boolean
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
        <SidebarMenu className="gap-1 px-1.5">
          {items.map((item) => {
            const linkProps: Record<string, any> = {
              href: item.url,
              to: item.url,
              onClick: closeMobileNavigation,
            }
            if (item.end !== undefined && (Link as any) !== "a") {
              linkProps.end = item.end
            }

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  className="h-9.5 rounded-xl px-3 text-sm font-medium transition-all duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&.active]:bg-primary/10 [&.active]:text-primary [&.active]:font-semibold [&.active_svg]:text-primary [&_svg]:size-4.5"
                >
                  <Link {...linkProps}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
