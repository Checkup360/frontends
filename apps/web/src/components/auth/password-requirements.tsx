import { CheckIcon, XIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

type Requirement = {
  label: string
  met: boolean
}

function getRequirements(password: string): Requirement[] {
  return [
    {
      label: "At least 8 characters",
      met: password.length >= 8,
    },
    {
      label: "One uppercase letter",
      met: /[A-Z]/.test(password),
    },
    {
      label: "One lowercase letter",
      met: /[a-z]/.test(password),
    },
    {
      label: "One number",
      met: /[0-9]/.test(password),
    },
  ]
}

type PasswordRequirementsProps = {
  password: string
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const requirements = getRequirements(password)
  const hasStarted = password.length > 0

  return (
    <ul className="mt-2 space-y-1">
      {requirements.map((req) => {
        const isSuccess = hasStarted && req.met
        const isError = hasStarted && !req.met

        return (
          <li
            key={req.label}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors duration-200",
              isSuccess
                ? "text-emerald-700 dark:text-emerald-500"
                : isError
                  ? "text-destructive"
                  : "text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
                isSuccess && "bg-current",
                isError && "border-destructive"
              )}
            >
              {isSuccess ? (
                <CheckIcon className="size-2.5 text-white dark:text-black" />
              ) : isError ? (
                <XIcon className="size-2.5" />
              ) : null}
            </span>
            {req.label}
          </li>
        )
      })}
    </ul>
  )
}
