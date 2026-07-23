import { Button } from "@workspace/ui/components/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/drawer"
import { Download, HeartPulse, Share2, SquarePlus } from "lucide-react"
import { useState } from "react"

import { usePwaInstall } from "./pwa-install-context"

type PwaInstallDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onContinue?: () => Promise<void> | void
}

export function PwaInstallDrawer({
  open,
  onOpenChange,
  onContinue,
}: PwaInstallDrawerProps) {
  const { install, isIos } = usePwaInstall()
  const [isInstalling, setIsInstalling] = useState(false)

  const continueInBrowser = async () => {
    onOpenChange(false)
    await onContinue?.()
  }

  const handleInstall = async () => {
    setIsInstalling(true)
    onOpenChange(false)
    try {
      const result = await install()
      if (result === "accepted" || result === "dismissed") {
        await onContinue?.()
      }
    } finally {
      setIsInstalling(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} dismissible={!onContinue}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader className="items-center text-center">
            <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <HeartPulse className="size-7" />
            </div>
            <DrawerTitle className="text-xl">
              {isIos
                ? "Add CheckUp360 to your Home Screen"
                : "Install CheckUp360"}
            </DrawerTitle>
            <DrawerDescription className="max-w-sm leading-6">
              Quickly access your assessments, results, and recommendations from
              your Home Screen.
            </DrawerDescription>
          </DrawerHeader>

          {isIos ? (
            <div className="mx-4 grid gap-3 rounded-xl border bg-muted/40 p-4 text-sm">
              <p className="flex items-center gap-3">
                <Share2 className="size-4 shrink-0 text-primary" />
                Tap the Share button in Safari.
              </p>
              <p className="flex items-center gap-3">
                <SquarePlus className="size-4 shrink-0 text-primary" />
                Select “Add to Home Screen”.
              </p>
            </div>
          ) : null}

          <DrawerFooter>
            {isIos ? (
              <Button onClick={() => void continueInBrowser()}>
                Continue in browser
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => void handleInstall()}
                  disabled={isInstalling}
                >
                  <Download />
                  {isInstalling ? "Installing..." : "Install app"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void continueInBrowser()}
                  disabled={isInstalling}
                >
                  Continue in browser
                </Button>
              </>
            )}
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
