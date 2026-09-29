import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { FileText, ShieldCheck, Lock, CheckCircle2 } from "lucide-react"
import { LEGAL_DOCUMENTS, type LegalDocInfo } from "./legal-content"

interface LegalDocumentModalProps {
  open: boolean
  documentKey: string | null
  onOpenChange: (open: boolean) => void
}

export function LegalDocumentModal({
  open,
  documentKey,
  onOpenChange,
}: LegalDocumentModalProps) {
  if (!documentKey) return null

  const doc: LegalDocInfo | undefined =
    LEGAL_DOCUMENTS[documentKey] ||
    (documentKey.startsWith("FORM:") ? LEGAL_DOCUMENTS[documentKey] : undefined)

  if (!doc) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto sm:rounded-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
              <FileText className="size-3.5" />
              Legal Document
            </Badge>
            <span className="text-xs text-muted-foreground">Version {doc.version}</span>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight">
            {doc.title}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {doc.subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3 text-sm">
          <div className="rounded-xl border border-border/50 bg-background/50 p-4 space-y-2">
            <h4 className="font-semibold text-foreground flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <ShieldCheck className="size-4 text-primary" />
              Overview & Legal Basis
            </h4>
            <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
              {doc.summary}
            </p>
          </div>

          <div className="rounded-xl border border-border/50 bg-background/50 p-4 space-y-2">
            <h4 className="font-semibold text-foreground flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Lock className="size-4 text-primary" />
              Purpose of Processing
            </h4>
            <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
              {doc.purpose}
            </p>
          </div>

          <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-2">
            <h4 className="font-semibold text-foreground flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              Data Indicators Collected
            </h4>
            <ul className="grid gap-1.5 text-xs sm:grid-cols-2">
              {doc.dataCollected.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-foreground/90">
                  <span className="mt-1 size-1.5 rounded-full bg-primary shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-2">
            <h4 className="font-semibold text-foreground flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              Your Rights & Withdrawal
            </h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {doc.rights.map((right, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-3.5 text-emerald-500 shrink-0" />
                  <span>{right}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full px-6"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
