import { useState } from "react"
import { resolveVitePublicApiBaseUrl } from "@workspace/auth/api"
import { InvitationTypeSelector } from "@workspace/auth/components/invitation-type-selector"
import { SysadminInvitationForm } from "@workspace/auth/components/sysadmin-invitation-form"
import { OrgInvitationForm } from "@workspace/components/components/org-invitation-form"
import { Card } from "@workspace/ui/components/card"
import { ChevronLeft } from "lucide-react"

type SelectedType = null | "sysadmin" | "organization"

export function InvitationsPage() {
  const [selectedType, setSelectedType] = useState<SelectedType>(null)
  const apiBaseUrl = resolveVitePublicApiBaseUrl(import.meta.env)

  const handleBack = () => {
    setSelectedType(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-3">
            Invitations
          </h1>
          <p className="text-lg text-slate-600">
            Generate secure invitation links to onboard new users to your workspace
          </p>
        </div>

        {/* Breadcrumb */}
        {selectedType && (
          <div className="mb-8 flex items-center gap-2">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <span className="text-sm text-slate-400">
              {selectedType === "sysadmin" ? "Sysadmin Registration" : "Organization Registration"}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="rounded-2xl">
          {selectedType === null && (
            <div className="space-y-8">
              <InvitationTypeSelector
                onSelect={(type) => setSelectedType(type)}
              />

              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-50/50 p-6">
                  <div className="mb-3 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600/10">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Single-Use Links</h3>
                  <p className="text-sm text-slate-600">
                    Links automatically become single-use when restricted to an email or when granting admin roles
                  </p>
                </Card>

                <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-50/50 p-6">
                  <div className="mb-3 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-600/10">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Secure & Flexible</h3>
                  <p className="text-sm text-slate-600">
                    Set expiration times (1-7 days) and configure reusable links for member invitations
                  </p>
                </Card>
              </div>
            </div>
          )}

          {selectedType === "sysadmin" && (
            <Card className="border-0 shadow-lg bg-white p-8 md:p-12">
              <SysadminInvitationForm
                onBack={handleBack}
                apiBaseUrl={apiBaseUrl}
              />
            </Card>
          )}

          {selectedType === "organization" && (
            <Card className="border-0 shadow-lg bg-white p-8 md:p-12">
              <OrgInvitationForm
                onBack={handleBack}
                apiBaseUrl={apiBaseUrl}
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}


