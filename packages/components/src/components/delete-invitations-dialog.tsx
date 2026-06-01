import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"

interface DeleteInvitationsDialogProps {
  count: number
  loading?: boolean
  open: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}

export function DeleteInvitationsDialog({
  count,
  loading = false,
  open,
  onConfirm,
  onOpenChange,
}: DeleteInvitationsDialogProps) {
  const plural = count === 1 ? "invitation" : "invitations"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {plural}?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <strong>
              {count} {plural}
            </strong>
            .
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? "Deleting..." : `Delete ${plural}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
