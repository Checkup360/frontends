"use client"

import { Separator } from "@workspace/ui/components/separator"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"

export interface SiteHeaderProps {
  title: string
}

export function SiteHeader({ title }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-[width,height,background-color] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 bg-background/70 shadow-xs hover:bg-background/90" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <h1 className="text-base font-semibold">{title}</h1>
      </div>
    </header>
  )
}
