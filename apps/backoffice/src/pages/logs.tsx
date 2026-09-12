import { useRef, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { ExternalLink, Maximize2, Minimize2, RotateCw } from "lucide-react"

export function LogsPage() {
  const [reloadKey, setReloadKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleReload = () => {
    setIsLoading(true)
    setReloadKey((prev) => prev + 1)
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className={`flex flex-col gap-3 ${isFullscreen ? "fixed inset-0 z-50 bg-background p-4" : "h-[calc(100vh-8.5rem)] w-full"
        }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            System Logs
          </h2>
          <p className="text-xs text-muted-foreground">
            Real-time container logs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReload}
            title="Reload logs"
            className="h-8 px-2.5 text-xs"
          >
            <RotateCw className="mr-1.5 h-3.5 w-3.5" />
            Reload
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            className="h-8 px-2.5 text-xs"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="mr-1.5 h-3.5 w-3.5" />
                Exit Fullscreen
              </>
            ) : (
              <>
                <Maximize2 className="mr-1.5 h-3.5 w-3.5" />
                Fullscreen
              </>
            )}
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs"
          >
            <a href="/dozzle" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Open in new tab
            </a>
          </Button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-lg border border-border bg-card shadow-xs">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-xs">
            <Skeleton className="h-8 w-48" />
            <p className="text-xs text-muted-foreground">Connecting to log stream...</p>
          </div>
        )}

        <iframe
          key={reloadKey}
          src="/dozzle"
          title="System Logs"
          className="h-full w-full border-0"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  )
}
