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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { ShieldCheck, Lock, FileText, CheckCircle2, ArrowRight, Sparkles, X } from "lucide-react"
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
  const [prevFormType, setPrevFormType] = useState(formType)

  if (formType !== prevFormType) {
    setPrevFormType(formType)
    setAcknowledged(false)
  }

  const doc = getLegalDocForForm(formType)

  const handleClose = () => {
    setAcknowledged(false)
    onOpenChange(false)
  }

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
        document_version: doc.version,
      })

      if (formRes.error) {
        toast.error(formRes.error.message || "Failed to record consent for this questionnaire.")
        setIsSubmitting(false)
        return
      }

      toast.success(`Informed consent for ${doc.title} recorded successfully.`)
      setAcknowledged(false)
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
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) setAcknowledged(false)
        onOpenChange(val)
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[92dvh] w-full min-w-0 flex-col gap-0 overflow-hidden rounded-3xl border-0 bg-card p-0 shadow-2xl ring-1 ring-border/60 sm:max-w-2xl"
      >
        <DialogHeader className="relative gap-3 border-b border-border/50 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-5 pb-4 pt-5 text-left sm:px-8">
          <div className="flex items-start gap-4">
            <div className="hidden size-12 shrink-0 sm:flex items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <ShieldCheck className="size-6" />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Informed Consent
                </span>
                <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                  v{doc.version}
                </span>
              </div>
              <DialogTitle className="break-words text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl">
                {doc.title}
              </DialogTitle>
              <DialogDescription className="break-words text-sm leading-relaxed text-muted-foreground">
                {doc.subtitle}
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleClose}
              disabled={isSubmitting}
              className="-mr-2 -mt-1 shrink-0 rounded-full text-muted-foreground"
            >
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-5 py-5 [scrollbar-width:thin] sm:px-8">
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <FileText className="size-4 shrink-0 text-primary" />
              Purpose of Evaluation
            </h3>
            <p className="break-words text-sm leading-relaxed text-foreground/90">
              {doc.purpose}
            </p>
          </section>

          <section className="space-y-2.5">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Lock className="size-4 shrink-0 text-primary" />
              Collected Indicators
            </h3>
            <ul className="grid gap-2">
              {doc.dataCollected.map((item, idx) => (
                <li
                  key={idx}
                  className="flex min-w-0 items-start gap-3 rounded-xl bg-muted/40 px-4 py-3 text-sm text-foreground/90"
                >
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="min-w-0 flex-1 break-words leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3 rounded-2xl bg-success/10 p-5 ring-1 ring-success/20">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-success">
              <CheckCircle2 className="size-4 shrink-0" />
              Privacy & Confidentiality Guarantees
            </h3>
            <ul className="space-y-2">
              {doc.rights.map((right, idx) => (
                <li key={idx} className="flex min-w-0 items-start gap-2.5 text-sm text-foreground/85">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  <span className="min-w-0 flex-1 break-words leading-relaxed">{right}</span>
                </li>
              ))}
            </ul>
          </section>

          <label
            htmlFor="consent-form-ack-modal"
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors ${
              acknowledged ? "border-primary/50 bg-primary/5" : "border-border bg-background hover:border-primary/30"
            }`}
          >
            <Checkbox
              id="consent-form-ack-modal"
              checked={acknowledged}
              onCheckedChange={(val) => setAcknowledged(Boolean(val))}
              className="mt-0.5 shrink-0"
            />
            <span className="min-w-0 flex-1 break-words text-xs leading-relaxed text-foreground/90 sm:text-[13px]">
              I have read and voluntarily agree to the informed consent terms for this questionnaire. I understand my responses and health indicators will be processed and reviewed by authorized organization administrators and occupational health medical staff for preventative care and workplace health tracking.
            </span>
          </label>
        </div>

        <div className="border-t border-border/50 bg-muted/30 px-6 py-4 sm:px-8">
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleAccept()}
              disabled={!canSubmit || isSubmitting}
              className="shrink-0 gap-2 rounded-xl px-6 shadow-md shadow-primary/20"
            >
              {isSubmitting ? "Recording..." : "Acknowledge & Start"}
              <ArrowRight className="size-4" />
            </Button>
          </DialogFooter>
        </div>
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
    <Card className="rounded-2xl border border-primary/25 bg-gradient-to-b from-primary/5 via-background/60 to-background/90 shadow-xl backdrop-blur-xl overflow-hidden w-full max-w-full min-w-0">
      <CardHeader className="space-y-3 pb-4 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1.5 border-primary/40 bg-primary/10 text-primary py-1 px-3 text-xs font-medium">
            <ShieldCheck className="size-3.5" />
            Informed Consent Required
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">v{doc.version}</span>
        </div>
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground break-words">
            {doc.title}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground break-words">
            {doc.subtitle}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 min-w-0">
        <div className="grid gap-4 sm:grid-cols-2 min-w-0">
          <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-2 min-w-0 max-w-full overflow-hidden break-words">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary shrink-0" />
              Purpose
            </p>
            <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground break-words">
              {doc.purpose}
            </p>
          </div>

          <div className="rounded-xl border border-success/20 bg-success/5 p-4 space-y-2 min-w-0 max-w-full overflow-hidden break-words">
            <p className="text-xs font-semibold uppercase tracking-wider text-success flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-success shrink-0" />
              Occupational Health Access
            </p>
            <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground break-words">
              Your answers and health indicators are processed under occupational health standards and accessible to authorized organization administrators and medical personnel for preventative wellness management.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-border/40 min-w-0">
          <p className="text-xs text-muted-foreground min-w-0 flex-1 break-words leading-relaxed">
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
