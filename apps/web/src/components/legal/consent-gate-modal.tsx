import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Label } from "@workspace/ui/components/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { ShieldCheck, Lock, FileText, CheckCircle2, ArrowRight, Sparkles } from "lucide-react"
import { getLegalDocForForm } from "./legal-content"
import { acceptConsent } from "@workspace/api"
import { toast } from "@workspace/ui/components/sonner"

interface ConsentGateModalProps {
  open: boolean
  formType: string
  onOpenChange: (open: boolean) => void
  onConsentAccepted: () => void
  hasHealthConsent?: boolean
}

export function ConsentGateModal({
  open,
  formType,
  onOpenChange,
  onConsentAccepted,
  hasHealthConsent = false,
}: ConsentGateModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)

  const doc = getLegalDocForForm(formType)

  const handleAccept = async () => {
    setIsSubmitting(true)
    try {
      // 1. If general health consent is missing, accept it first
      if (!hasHealthConsent) {
        const healthRes = await acceptConsent({
          consent_type: "HEALTH_DATA_PROCESSING_CONSENT",
          document_version: "1.0",
        })
        if (healthRes.error) {
          toast.error("Failed to accept general health data processing consent.")
          setIsSubmitting(false)
          return
        }
      }

      // 2. Accept specific form consent
      const formRes = await acceptConsent({
        consent_type: "FORM_CONSENT",
        form_type: formType,
        document_version: "1.0",
      })

      if (formRes.error) {
        toast.error(formRes.error.message || "Failed to record consent for this questionnaire.")
        setIsSubmitting(false)
        return
      }

      toast.success(`Informed consent for ${doc.title} recorded successfully.`)
      onOpenChange(false)
      onConsentAccepted()
    } catch {
      toast.error("An unexpected error occurred while recording your consent.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = acknowledged

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto sm:rounded-2xl border border-primary/20 bg-card shadow-2xl p-6">
        <DialogHeader className="space-y-2.5 text-left">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 border-primary/40 bg-primary/10 text-primary py-0.5 px-2.5 text-xs font-medium">
              <ShieldCheck className="size-3.5" />
              Informed Consent
            </Badge>
            <span className="text-[11px] text-muted-foreground font-mono">v{doc.version}</span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {doc.title}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
            {doc.subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Purpose Card */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="size-3.5 text-primary" />
              Purpose of Evaluation
            </p>
            <p className="text-xs sm:text-sm leading-relaxed text-foreground/90">
              {doc.purpose}
            </p>
          </div>

          {/* Indicators Collected */}
          <div className="rounded-xl border border-border/60 bg-background/50 p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Lock className="size-3.5 text-primary" />
              Collected Indicators
            </p>
            <div className="flex flex-wrap gap-1.5">
              {doc.dataCollected.map((item, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="bg-muted text-muted-foreground font-normal text-xs px-2.5 py-1"
                >
                  {item}
                </Badge>
              ))}
            </div>
          </div>

          {/* Privacy & Safeguards */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              Privacy & Confidentiality Guarantees
            </p>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {doc.rights.map((right, idx) => (
                <li key={idx} className="flex items-start gap-2 text-foreground/80">
                  <span className="mt-1 size-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>{right}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Checkbox */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent-form-ack-modal"
                checked={acknowledged}
                onCheckedChange={(val) => setAcknowledged(Boolean(val))}
                className="mt-0.5"
              />
              <Label
                htmlFor="consent-form-ack-modal"
                className="text-xs font-normal leading-relaxed text-foreground cursor-pointer"
              >
                I have read and voluntarily agree to the informed consent terms for this questionnaire. I understand my responses are confidential and used exclusively for preventative health insights.
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleAccept()}
            disabled={!canSubmit || isSubmitting}
            className="gap-2 rounded-xl px-6 py-2 text-xs sm:text-sm font-medium shadow-md shadow-primary/20"
          >
            {isSubmitting ? "Recording..." : "Acknowledge & Start"}
            <ArrowRight className="size-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function FormConsentHeroCard({
  formType,
  onOpenConsentModal,
}: {
  formType: string
  onOpenConsentModal: () => void
}) {
  const doc = getLegalDocForForm(formType)

  return (
    <Card className="rounded-2xl border border-primary/25 bg-gradient-to-b from-primary/5 via-background/60 to-background/90 shadow-xl backdrop-blur-xl overflow-hidden">
      <CardHeader className="space-y-3 pb-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 border-primary/40 bg-primary/10 text-primary py-1 px-3 text-xs font-medium">
            <ShieldCheck className="size-3.5" />
            Informed Consent Required
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">v{doc.version}</span>
        </div>
        <div>
          <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {doc.title}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm mt-1 text-muted-foreground">
            {doc.subtitle}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              Purpose
            </p>
            <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
              {doc.purpose}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              Confidentiality Safeguard
            </p>
            <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
              Your answers are protected under occupational health privacy standards and used to evaluate preventive health and wellness indicators.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-border/40">
          <p className="text-xs text-muted-foreground">
            Review the terms and provide your informed consent to enable questionnaire answers.
          </p>
          <Button
            type="button"
            onClick={onOpenConsentModal}
            className="w-full sm:w-auto gap-2 rounded-xl px-6 py-5 text-sm font-medium shadow-md shadow-primary/20 shrink-0"
          >
            <ShieldCheck className="size-4" />
            Review & Give Consent
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
