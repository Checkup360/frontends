import { type ReactNode, useEffect, useMemo, useState } from "react"

import {
  PwaInstallContext,
  type PwaInstallContextValue,
} from "./pwa-install-context"

type InstallChoice = {
  outcome: "accepted" | "dismissed"
  platform: string
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<InstallChoice>
}

function isRunningAsInstalledApp(): boolean {
  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean
  }
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  )
}

function isIosDevice(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  )
}

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(isRunningAsInstalledApp)
  const isIos = useMemo(() => isIosDevice(), [])

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }
    const handleAppInstalled = () => {
      setInstallPrompt(null)
      setIsInstalled(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      )
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const value = useMemo<PwaInstallContextValue>(
    () => ({
      canInstall: !isInstalled && (Boolean(installPrompt) || isIos),
      isIos: isIos && !installPrompt,
      install: async () => {
        if (installPrompt) {
          await installPrompt.prompt()
          const choice = await installPrompt.userChoice
          setInstallPrompt(null)
          return choice.outcome
        }
        if (isIos) return "manual"
        return "unavailable"
      },
    }),
    [installPrompt, isInstalled, isIos]
  )

  return (
    <PwaInstallContext.Provider value={value}>
      {children}
    </PwaInstallContext.Provider>
  )
}
