import { cn } from "@workspace/ui/lib/utils"

export type StepperStep = {
  label: string
}

type StepperProps = {
  steps: StepperStep[]
  currentStep: number
  className?: string
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="hidden items-center sm:flex">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isActive = stepNumber === currentStep
          const isCompleted = stepNumber < currentStep

          return (
            <div
              key={step.label}
              className="relative flex flex-1 flex-col items-center"
            >
              {index > 0 && (
                <div
                  className={cn(
                    "absolute top-6 right-1/2 h-0.5 w-full -translate-y-1/2",
                    isCompleted || isActive ? "bg-primary" : "bg-border"
                  )}
                />
              )}
              <div
                className={cn(
                  "relative z-10 flex size-12 items-center justify-center rounded-full text-sm font-semibold transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : isCompleted
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {stepNumber}
              </div>
              <span
                className={cn(
                  "mt-2.5 text-center text-xs font-medium",
                  isActive || isCompleted
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      <div className="sm:hidden">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold">
            {steps[currentStep - 1]?.label}
          </span>
          <span className="text-xs text-muted-foreground">
            Step {currentStep} of {steps.length}
          </span>
        </div>
        <div className="flex gap-1">
          {steps.map((step, index) => (
            <div
              key={step.label}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-300",
                index < currentStep ? "bg-primary/70" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
