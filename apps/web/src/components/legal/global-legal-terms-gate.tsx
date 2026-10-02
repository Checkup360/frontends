import { useEffect, useState } from "react"
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
import { ShieldCheck, FileText, HeartHandshake, Lock, ArrowRight } from "lucide-react"
import { fetchCurrentConsents, acceptConsent } from "@workspace/api"
import { useCurrentUser } from "@workspace/auth/hooks/use-current-user"
import { toast } from "@workspace/ui/components/sonner"
import { LegalDocumentModal } from "./legal-document-modal"

export function GlobalLegalTermsGate() {
  const { user, isLoading: authLoading } = useCurrentUser()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [missingTerms, setMissingTerms] = useState(false)
  const [missingPrivacy, setMissingPrivacy] = useState(false)
  const [missingHealth, setMissingHealth] = useState(false)

  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)
  const [acceptHealth, setAcceptHealth] = useState(false)

  const [viewingDocKey, setViewingDocKey] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function checkConsents() {
      if (!user || authLoading) return

      try {
        const res = await fetchCurrentConsents()
        if (cancelled || !res) return

        const needsTerms = !res.terms_and_conditions || Boolean(res.terms_and_conditions.revoked_at)
        const needsPrivacy = !res.privacy_policy || Boolean(res.privacy_policy.revoked_at)
        const needsHealth = !res.health_data_processing || Boolean(res.health_data_processing.revoked_at)

        setMissingTerms(needsTerms)
        setMissingPrivacy(needsPrivacy)
        setMissingHealth(needsHealth)

        if (needsTerms || needsPrivacy || needsHealth) {
          setOpen(true)
        } else {
          setOpen(false)
        }
      } catch {
        // Silently catch in background
      }
    }

    void checkConsents()
    return () => {
      cancelled = true
    }
  }, [user, authLoading])

  const handleAcceptAll = async () => {
    setIsSubmitting(true)
    try {
      if (missingTerms && acceptTerms) {
        await acceptConsent({
          consent_type: "TERMS_AND_CONDITIONS",
          document_version: "1.0",
        })
      }
      if (missingPrivacy && acceptPrivacy) {
        await acceptConsent({
          consent_type: "PRIVACY_POLICY",
          document_version: "1.0",
        })
      }
      if (missingHealth && acceptHealth) {
        await acceptConsent({
          consent_type: "HEALTH_DATA_PROCESSING_CONSENT",
          document_version: "1.0",
        })
      }

      toast.success("Legal terms and privacy preferences updated successfully.")
      setMissingTerms(false)
      setMissingPrivacy(false)
      setMissingHealth(false)
      setOpen(false)
    } catch {
      toast.error("Failed to record your consent. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  const canProceed =
    (!missingTerms || acceptTerms) &&
    (!missingPrivacy || acceptPrivacy) &&
    (!missingHealth || acceptHealth)

  return (
    <>
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent
          className="max-h-[90vh] max-w-xl overflow-y-auto sm:rounded-2xl border border-primary/20 shadow-2xl bg-card"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1.5 border-primary/40 bg-primary/10 text-primary py-1 px-3">
                <ShieldCheck className="size-3.5" />
                Updated Privacy & Legal Terms
              </Badge>
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight">
              Review & Accept Platform Terms
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              To ensure compliance with privacy regulations and occupational health standards, please review and accept the latest platform agreements.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-3">
            {/* Terms & Conditions */}
            {missingTerms && (
              <div className="rounded-xl border border-border/60 bg-background/50 p-4 transition-colors hover:border-primary/40">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="global-accept-terms"
                    checked={acceptTerms}
                    onCheckedChange={(v) => setAcceptTerms(Boolean(v))}
                    className="mt-0.5"
                  />
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="global-accept-terms"
                        className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-1.5"
                      >
                        <FileText className="size-4 text-primary" />
                        Terms of Service
                      </Label>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => setViewingDocKey("TERMS_AND_CONDITIONS")}
                        className="h-auto p-0 text-xs text-primary font-medium"
                      >
                        View Document
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Governs platform usage, security obligations, and account access.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Policy */}
            {missingPrivacy && (
              <div className="rounded-xl border border-border/60 bg-background/50 p-4 transition-colors hover:border-primary/40">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="global-accept-privacy"
                    checked={acceptPrivacy}
                    onCheckedChange={(v) => setAcceptPrivacy(Boolean(v))}
                    className="mt-0.5"
                  />
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="global-accept-privacy"
                        className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-1.5"
                      >
                        <Lock className="size-4 text-primary" />
                        Privacy Policy
                      </Label>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => setViewingDocKey("PRIVACY_POLICY")}
                        className="h-auto p-0 text-xs text-primary font-medium"
                      >
                        View Document
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Explains data encryption, storage policies, and your data access rights.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Health Data Processing Consent */}
            {missingHealth && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 transition-colors hover:border-primary/50">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="global-accept-health"
                    checked={acceptHealth}
                    onCheckedChange={(v) => setAcceptHealth(Boolean(v))}
                    className="mt-0.5"
                  />
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="global-accept-health"
                        className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-1.5"
                      >
                        <HeartHandshake className="size-4 text-primary" />
                        Health Data Processing Consent
                      </Label>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => setViewingDocKey("HEALTH_DATA_PROCESSING_CONSENT")}
                        className="h-auto p-0 text-xs text-primary font-medium"
                      >
                        View Document
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Authorizes processing and review of health indicators by authorized organization administrators and medical staff for preventative occupational health management.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              onClick={() => void handleAcceptAll()}
              disabled={!canProceed || isSubmitting}
              className="w-full gap-2 rounded-xl py-5 text-sm font-medium shadow-md shadow-primary/20"
            >
              {isSubmitting ? "Updating..." : "Accept All & Continue"}
              <ArrowRight className="size-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LegalDocumentModal
        open={Boolean(viewingDocKey)}
        documentKey={viewingDocKey}
        onOpenChange={(isOpen) => !isOpen && setViewingDocKey(null)}
      />
    </>
  )
}
