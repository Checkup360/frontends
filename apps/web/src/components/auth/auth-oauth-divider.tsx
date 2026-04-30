import { Separator } from "@workspace/ui/components/separator"

type AuthOAuthDividerProps = {
  label?: string
}

export function AuthOAuthDivider({ label = "o continuá con" }: AuthOAuthDividerProps) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <Separator className="w-full" />
      </div>
      <div className="relative flex justify-center text-xs uppercase tracking-wide">
        <span className="bg-card/60 px-2 text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}
