"use client"

import { Separator } from "@workspace/ui/components/separator"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"
import { useTheme } from "@workspace/ui/components/theme-provider"
import { Sun, Moon } from "lucide-react"

import { AppSwitcher } from "./app-switcher"

export interface SiteHeaderProps {
  title: string
}

export function SiteHeader({ title }: SiteHeaderProps) {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    // Resolve system theme if needed or toggle active class
    const resolvedTheme =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme

    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/75 backdrop-blur-xl transition-[width,height,background-color] ease-linear supports-[backdrop-filter]:bg-background/60">
      <div className="flex w-full items-center justify-between gap-1 px-4 lg:gap-2 lg:px-6">
        <div className="flex items-center gap-1 lg:gap-2">
          <SidebarTrigger className="-ml-1 bg-background/70 shadow-xs hover:bg-background/90" />
          <Separator orientation="vertical" className="mx-2 h-4" />
          <h1 className="text-base font-semibold">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <AppSwitcher variant="header-button" currentAppLabel="" />
          <button
            onClick={toggleTheme}
            className="flex size-9 items-center justify-center rounded-lg border border-border/40 bg-background/70 text-muted-foreground shadow-xs transition-all hover:bg-muted hover:text-foreground"
            aria-label="Toggle color theme"
          >
            {theme === "dark" ? (
              <Sun className="size-4 animate-in duration-300 spin-in-45" />
            ) : (
              <Moon className="size-4 animate-in duration-300 spin-in-45" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
