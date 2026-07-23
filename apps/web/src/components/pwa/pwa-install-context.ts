import { createContext, useContext } from "react"

export type PwaInstallContextValue = {
  canInstall: boolean
  isIos: boolean
  install: () => Promise<"accepted" | "dismissed" | "manual" | "unavailable">
}

export const PwaInstallContext = createContext<
  PwaInstallContextValue | undefined
>(undefined)

export function usePwaInstall(): PwaInstallContextValue {
  const context = useContext(PwaInstallContext)
  if (!context) {
    throw new Error("usePwaInstall must be used within PwaInstallProvider")
  }
  return context
}
