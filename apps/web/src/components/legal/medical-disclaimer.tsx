import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert"
import { HeartHandshake, ShieldAlert } from "lucide-react"

export function MedicalNonDiagnosticDisclaimer({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-xl border border-border/50 bg-muted/30 p-4 text-xs text-muted-foreground backdrop-blur-sm ${className ?? ""}`}
    >
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground/90">
            Occupational Screening Notice & Medical Disclaimer
          </p>
          <p className="leading-relaxed">
            Checkup360 is an occupational health screening and risk estimation platform designed for preventative wellness. It does <strong>not</strong> provide medical diagnoses, treatment plans, or substitute for personalized consultations with a licensed physician or healthcare specialist. If you feel unwell or have clinical concerns, please consult a medical professional.
          </p>
        </div>
      </div>
    </div>
  )
}

export function Phq9CrisisSupportAlert({ className }: { className?: string }) {
  return (
    <Alert
      variant="destructive"
      className={`border-destructive/40 bg-destructive/10 text-destructive dark:bg-destructive/15 ${className ?? ""}`}
    >
      <HeartHandshake className="size-5 shrink-0" />
      <div className="ml-2 space-y-1.5">
        <AlertTitle className="font-bold text-base tracking-tight">
          Confidential Crisis Support & Immediate Assistance
        </AlertTitle>
        <AlertDescription className="text-sm leading-relaxed text-foreground/90">
          <p>
            If you are going through a difficult time, experiencing acute emotional distress, or having thoughts of self-harm, please know that you are not alone and help is available right now.
          </p>
          <div className="mt-2.5 rounded-lg border border-destructive/20 bg-background/80 p-3 text-xs text-foreground backdrop-blur">
            <p className="font-semibold text-destructive">Available Free & Confidential Helplines:</p>
            <ul className="mt-1 list-inside list-disc space-y-1">
              <li><strong>Argentina:</strong> Suicide Assistance Center — Tel: <strong>135</strong> (Buenos Aires Metropolitan Area) or <strong>(011) 5275-1135</strong> (Nationwide)</li>
              <li><strong>Mental Health Support Line:</strong> <strong>0800-999-0091</strong> (24/7 Toll-Free)</li>
              <li><strong>Medical Emergencies:</strong> Dial <strong>107</strong> / <strong>911</strong></li>
            </ul>
          </div>
        </AlertDescription>
      </div>
    </Alert>
  )
}
