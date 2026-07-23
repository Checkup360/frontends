import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar"
import { Download } from "lucide-react"

import { usePwaInstall } from "./pwa-install-context"

type PwaInstallMenuItemProps = {
  onSelect: () => void
}

export function PwaInstallMenuItem({ onSelect }: PwaInstallMenuItemProps) {
  const { canInstall } = usePwaInstall()
  const { isMobile, setOpenMobile } = useSidebar()

  if (!canInstall) return null

  const openDrawer = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    if (isMobile) {
      setOpenMobile(false)
      window.setTimeout(onSelect, 200)
      return
    }
    onSelect()
  }

  return (
    <SidebarGroup className="py-0">
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={openDrawer}>
              <Download />
              <span>Install app</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
