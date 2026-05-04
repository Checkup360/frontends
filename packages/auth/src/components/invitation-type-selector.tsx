import { ShieldCheck, Building2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

interface InvitationTypeSelectorProps {
  onSelect: (type: "sysadmin" | "organization") => void
  loading?: boolean
}

export function InvitationTypeSelector({ onSelect, loading }: InvitationTypeSelectorProps) {
  return (
    <div className="w-full">
      <div className="mb-12 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Choose invitation type</h2>
        <p className="text-slate-600">Select what kind of invitation link you want to generate</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sysadmin Card */}
        <Button
          onClick={() => onSelect("sysadmin")}
          disabled={loading}
          variant="outline"
          className="h-auto bg-gradient-to-br from-blue-50 to-blue-50/50 border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg hover:bg-blue-50 transition-all p-8 flex flex-col items-start justify-start text-left rounded-xl"
        >
          <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-600/10">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
          </div>
          <div className="font-bold text-slate-900 mb-2 text-lg">Sysadmin Registration</div>
          <div className="text-sm text-slate-600 mb-4">
            Create a superuser account for workspace administration
          </div>
          <div className="mt-auto pt-4 border-t border-blue-200 w-full">
            <div className="text-xs text-slate-500">
              Perfect for: Workspace owners and administrators
            </div>
          </div>
        </Button>

        {/* Organization Card */}
        <Button
          onClick={() => onSelect("organization")}
          disabled={loading}
          variant="outline"
          className="h-auto bg-gradient-to-br from-emerald-50 to-emerald-50/50 border-2 border-emerald-200 hover:border-emerald-400 hover:shadow-lg hover:bg-emerald-50 transition-all p-8 flex flex-col items-start justify-start text-left rounded-xl"
        >
          <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-600/10">
            <Building2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="font-bold text-slate-900 mb-2 text-lg">Organization Registration</div>
          <div className="text-sm text-slate-600 mb-4">
            Add new members to an existing organization
          </div>
          <div className="mt-auto pt-4 border-t border-emerald-200 w-full">
            <div className="text-xs text-slate-500">
              Perfect for: Team onboarding and collaboration
            </div>
          </div>
        </Button>
      </div>
    </div>
  )
}

