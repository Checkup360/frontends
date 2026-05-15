import { useState } from "react"
import { InvitationTypeCard } from "@/components/invitation-type-card"
import { SysadminInvitationForm } from "@workspace/auth/components/sysadmin-invitation-form"
import { OrgInvitationForm } from "@workspace/components/components/org-invitation-form"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"

type SelectedType = null | "sysadmin" | "organization"

const steps = ["Type", "Details", "Complete"]

function InvitationStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="w-full">
      <div className="hidden items-center sm:flex">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isActive = stepNumber === currentStep
          const isCompleted = stepNumber < currentStep

          return (
            <div
              key={step}
              className="relative flex flex-1 flex-col items-center"
            >
              {index > 0 && (
                <div
                  className={`absolute top-6 right-1/2 h-0.5 w-full -translate-y-1/2 ${
                    isCompleted || isActive ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
              <div
                className={`relative z-10 flex size-12 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : isCompleted
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {stepNumber}
              </div>
              <span
                className={`mt-2.5 text-center text-xs font-medium ${
                  isActive || isCompleted
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {step}
              </span>
            </div>
          )
        })}
      </div>

      <div className="sm:hidden">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold">
            {steps[currentStep - 1]}
          </span>
          <span className="text-xs text-muted-foreground">
            Step {currentStep} of {steps.length}
          </span>
        </div>
        <div className="flex gap-1">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                index < currentStep ? "bg-primary/70" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function InvitationsPage() {
  const [selectedType, setSelectedType] = useState<SelectedType>(null)
  const [completed, setCompleted] = useState(false)
  const currentStep = completed ? 3 : selectedType ? 2 : 1

  const handleBack = () => {
    setCompleted(false)
    setSelectedType(null)
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl justify-center">
      <Card className="w-full max-w-4xl shadow-sm">
        <CardHeader className="px-8 pt-7 pb-4 md:px-10">
          <InvitationStepper currentStep={currentStep} />
        </CardHeader>
        <CardContent className="px-8 pb-7 md:px-10 md:pb-8">
          <div className="min-h-[430px] py-6">
            {selectedType === null && (
              <InvitationTypeCard
                onSelect={(type) => {
                  setCompleted(false)
                  setSelectedType(type)
                }}
              />
            )}

            {selectedType === "sysadmin" && (
              <SysadminInvitationForm
                onBack={handleBack}
                onSuccessChange={setCompleted}
              />
            )}

            {selectedType === "organization" && (
              <OrgInvitationForm
                onBack={handleBack}
                onSuccessChange={setCompleted}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
