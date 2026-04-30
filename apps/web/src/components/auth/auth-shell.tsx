import type { ReactNode } from "react"

type AuthShellProps = {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10 lg:px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-balance text-center text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-pretty text-center text-sm text-muted-foreground">{description}</p>
        ) : null}
        <div className="mt-6 rounded-xl border border-border/80 bg-card/60 p-6 shadow-sm backdrop-blur-sm">
          {children}
        </div>
        {footer ? <div className="mt-5 text-center">{footer}</div> : null}
      </div>
    </div>
  )
}
