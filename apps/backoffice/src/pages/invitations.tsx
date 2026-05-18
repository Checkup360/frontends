import { useState } from "react"
import { InvitationTypeCard } from "@/components/invitation-type-card"
import { SysadminInvitationForm } from "@workspace/auth/components/sysadmin-invitation-form"
import { OrgInvitationForm } from "@workspace/components/components/org-invitation-form"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import { Stepper } from "@workspace/ui/components/stepper"

type SelectedType = null | "sysadmin" | "organization"

const steps = [{ label: "Type" }, { label: "Details" }, { label: "Complete" }]

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
        <CardHeader className="px-6 pt-6 pb-3 md:px-8">
          <Stepper steps={steps} currentStep={currentStep} />
        </CardHeader>
        <CardContent className="px-6 pb-6 md:px-8">
          <div
            className={selectedType === null ? "py-5" : "min-h-[430px] py-6"}
          >
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
