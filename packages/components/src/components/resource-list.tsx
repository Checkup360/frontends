import { useState, type FormEvent, type ReactNode } from "react"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { AlertCircle, Check, Folders, Pencil, Plus, Trash2, X } from "lucide-react"

export interface ResourceItem {
  id: string
  name: string
  hint?: string
}

export interface ResourceListProps {
  /** Title shown in the list card header */
  title: string
  /** Description shown in the list card header (below title) */
  description?: string
  /** Label used in the create form and delete dialog (e.g. "department") */
  resourceLabel: string
  /** Placeholder text for the create input */
  createPlaceholder?: string
  /** Hide the rename button (for resources that don't support renaming) */
  disableRename?: boolean
  /** Render extra action buttons at the end of each row */
  renderActions?: (item: ResourceItem) => ReactNode

  items: ResourceItem[]
  loading: boolean
  /** General error shown at the top of the list */
  error?: string

  onCreate: (name: string) => Promise<{ error?: string }>
  onRename: (item: ResourceItem, newName: string) => Promise<{ error?: string }>
  onDelete: (item: ResourceItem) => Promise<{ error?: string }>
}

export function ResourceList({
  title,
  description,
  resourceLabel,
  createPlaceholder,
  disableRename = false,
  renderActions,
  items,
  loading,
  error,
  onCreate,
  onRename,
  onDelete,
}: ResourceListProps) {
  // Create
  const [newName, setNewName] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")

  // Rename
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState("")

  // Delete confirm dialog
  const [deleteTarget, setDeleteTarget] = useState<ResourceItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setCreateError("")
    const result = await onCreate(newName.trim())
    setCreating(false)
    if (result.error) {
      setCreateError(result.error)
      return
    }
    setNewName("")
  }

  const startEdit = (item: ResourceItem) => {
    setEditingId(item.id)
    setEditName(item.name)
    setEditError("")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName("")
    setEditError("")
  }

  const handleSaveEdit = async (item: ResourceItem) => {
    if (!editName.trim()) return
    setSaving(true)
    setEditError("")
    const result = await onRename(item, editName.trim())
    setSaving(false)
    if (result.error) {
      setEditError(result.error)
      return
    }
    setEditingId(null)
  }

  const openDeleteDialog = (item: ResourceItem) => {
    setDeleteTarget(item)
    setDeleteError("")
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError("")
    const result = await onDelete(deleteTarget)
    setDeleting(false)
    if (result.error) {
      setDeleteError(result.error)
      return
    }
    setDeleteTarget(null)
  }

  const capitalizedLabel =
    resourceLabel.charAt(0).toUpperCase() + resourceLabel.slice(1)

  return (
    <>
      {/* Create card */}
      <Card>
        <CardHeader>
          <CardTitle>Create {resourceLabel}</CardTitle>
          <CardDescription>
            Add a new {resourceLabel} to your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex gap-3">
            <div className="flex-1 space-y-1">
              <Label htmlFor="resource-list-new-name" className="sr-only">
                {capitalizedLabel} name
              </Label>
              <Input
                id="resource-list-new-name"
                placeholder={
                  createPlaceholder ?? `Enter ${resourceLabel} name…`
                }
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value)
                  setCreateError("")
                }}
                disabled={creating}
              />
              {createError && (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="size-3 shrink-0" />
                  {createError}
                </p>
              )}
            </div>
            <Button type="submit" disabled={creating || !newName.trim()}>
              {creating ? (
                <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
              ) : (
                <Plus className="size-4" />
              )}
              Create
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* List card */}
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description !== undefined ? (
            <CardDescription>{description}</CardDescription>
          ) : (
            <CardDescription>
              {loading
                ? "Loading…"
                : `${items.length} ${resourceLabel}${items.length === 1 ? "" : "s"}`}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <div className="flex items-center gap-2 px-6 py-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-2 px-6 pb-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : items.length === 0 && !error ? (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center text-muted-foreground">
              <Folders className="size-8 opacity-40" />
              <p className="text-sm">
                No {resourceLabel}s yet. Create one above.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-6 py-3">
                  {editingId === item.id ? (
                    <>
                      <div className="flex-1 space-y-1">
                        <Input
                          id={`resource-list-edit-${item.id}`}
                          value={editName}
                          onChange={(e) => {
                            setEditName(e.target.value)
                            setEditError("")
                          }}
                          disabled={saving}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Escape") cancelEdit()
                          }}
                        />
                        {editError && (
                          <p className="flex items-center gap-1.5 text-xs text-destructive">
                            <AlertCircle className="size-3 shrink-0" />
                            {editError}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={saving || !editName.trim()}
                        onClick={() => handleSaveEdit(item)}
                        aria-label="Save"
                      >
                        {saving ? (
                          <span className="size-4 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground" />
                        ) : (
                          <Check className="size-4" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={saving}
                        onClick={cancelEdit}
                        aria-label="Cancel"
                      >
                        <X className="size-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-1 items-center gap-2 overflow-hidden">
                        <Folders className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm font-medium">
                          {item.name}
                        </span>
                        {item.hint && (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {item.hint}
                          </span>
                        )}
                      </div>
                      {!disableRename && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => startEdit(item)}
                          aria-label={`Rename ${item.name}`}
                          disabled={!!editingId || !!deleteTarget}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      )}
                      {renderActions?.(item)}
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => openDeleteDialog(item)}
                        aria-label={`Delete ${item.name}`}
                        disabled={!!editingId || !!deleteTarget}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Delete confirm dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setDeleteTarget(null)
            setDeleteError("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This will permanently delete{" "}
              <strong>{deleteTarget?.name}</strong>. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {deleteError}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteTarget(null)
                setDeleteError("")
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? (
                <span className="size-4 animate-spin rounded-full border-2 border-destructive-foreground/30 border-t-destructive-foreground" />
              ) : null}
              Delete {resourceLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
