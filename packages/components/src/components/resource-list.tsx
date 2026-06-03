import { useState, type FormEvent, type ReactNode } from "react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
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
import {
  AlertCircle,
  Check,
  Folders,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react"

export interface ResourceItem {
  id: string
  name: string
  hint?: string
  badgeLabel?: string
  badgeClassName?: string
  valueLabel?: string
  valueCaption?: string
  progress?: number
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
  /** Hide the leading initials box in list rows */
  hideLeadingVisual?: boolean
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
  hideLeadingVisual = false,
  renderActions,
  items,
  loading,
  error,
  onCreate,
  onRename,
  onDelete,
}: ResourceListProps) {
  const [newName, setNewName] = useState("")
  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState("")

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
    setCreateOpen(false)
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
  const pluralLabel = `${resourceLabel}s`
  const filteredItems = items.filter((item) => {
    const term = search.trim().toLowerCase()
    if (!term) return true
    return (
      item.name.toLowerCase().includes(term) ||
      item.hint?.toLowerCase().includes(term)
    )
  })
  const makeSlugPreview = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  const getInitials = (name: string) =>
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? "")
      .join("")
      .toUpperCase() || capitalizedLabel[0]

  return (
    <>
      <Card className="rounded-3xl border-border/70 bg-card/80 p-3 shadow-sm">
        <div className="flex flex-col gap-3 px-1 pb-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="px-1">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {description ?? `Manage ${pluralLabel} in this workspace.`}
            </p>
          </div>
          <Button
            size="sm"
            className="rounded-full bg-white text-black hover:bg-white/90 dark:bg-white dark:text-black"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-4" />
            New {resourceLabel}
          </Button>
        </div>

        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:max-w-xs sm:flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${pluralLabel}...`}
              className="h-9 rounded-full border-transparent bg-muted/60 pl-9 shadow-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="h-8 rounded-full border-border/70 px-3"
            >
              All
            </Badge>
            <Badge
              variant="outline"
              className="h-8 rounded-full border-border/70 px-3 text-muted-foreground"
            >
              {loading ? "..." : items.length} total
            </Badge>
          </div>
        </div>

        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-[72px] rounded-2xl" />
            ))}
          </div>
        ) : items.length === 0 && !error ? (
          <div className="flex min-h-32 w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/80 bg-muted/20 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-foreground">
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-muted">
              <Folders className="size-5" />
            </span>
            <span className="text-sm font-medium">
              No {pluralLabel} yet. Use the button above to create one.
            </span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex min-h-28 flex-col items-center justify-center rounded-2xl bg-muted/20 text-center">
            <Folders className="mb-2 size-6 text-muted-foreground/60" />
            <p className="text-sm font-medium text-foreground">
              No {pluralLabel} match your search.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item) =>
              editingId === item.id ? (
                <div
                  key={item.id}
                  className="rounded-2xl bg-muted/35 px-4 py-3"
                >
                  <div className="space-y-2">
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
                  <div className="mt-3 flex justify-end gap-1">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      disabled={saving || !editName.trim()}
                      onClick={() => handleSaveEdit(item)}
                      aria-label="Save"
                    >
                      <Check className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      disabled={saving}
                      onClick={cancelEdit}
                      aria-label="Cancel"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  key={item.id}
                  className="group flex items-center gap-3 rounded-2xl bg-muted/25 px-3 py-3 transition-colors hover:bg-muted/45"
                >
                  {!hideLeadingVisual && (
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background text-sm font-semibold text-foreground shadow-sm">
                      {getInitials(item.name)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {item.name}
                      </p>
                      <Badge
                        variant="outline"
                        className={
                          item.badgeClassName ??
                          "border-border/70 bg-background/60 text-[10px]"
                        }
                      >
                        {item.badgeLabel ?? capitalizedLabel}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-xs tracking-wide text-muted-foreground uppercase">
                      {item.hint ?? "No slug"}
                    </p>
                    {item.progress !== undefined && (
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background/80">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${Math.min(Math.max(item.progress, 0), 100)}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {(item.valueLabel || item.valueCaption) && (
                      <div className="hidden text-right sm:block">
                        {item.valueCaption && (
                          <p className="text-[10px] tracking-wide text-muted-foreground uppercase">
                            {item.valueCaption}
                          </p>
                        )}
                        {item.valueLabel && (
                          <p className="text-sm font-semibold text-foreground tabular-nums">
                            {item.valueLabel}
                          </p>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                      {!disableRename && (
                        <Button
                          type="button"
                          size="icon-xs"
                          variant="ghost"
                          onClick={() => startEdit(item)}
                          aria-label={`Rename ${item.name}`}
                          disabled={!!editingId || !!deleteTarget}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      )}
                      {renderActions?.(item)}
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => openDeleteDialog(item)}
                        aria-label={`Delete ${item.name}`}
                        disabled={!!editingId || !!deleteTarget}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </Card>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open && !creating) {
            setNewName("")
            setCreateError("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create {resourceLabel}</DialogTitle>
            <DialogDescription>
              Add a new {resourceLabel} to your workspace.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resource-list-new-name">
                {capitalizedLabel} name
              </Label>
              <Input
                id="resource-list-new-name"
                placeholder={
                  createPlaceholder ?? `Enter ${resourceLabel} name...`
                }
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value)
                  setCreateError("")
                }}
                disabled={creating}
              />
              {newName.trim() && (
                <p className="text-xs text-muted-foreground">
                  URL identifier:{" "}
                  <span className="rounded border border-border/40 bg-muted/60 px-1 py-0.5 font-mono font-medium text-foreground">
                    {makeSlugPreview(newName)}
                  </span>
                </p>
              )}
              {createError && (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="size-3 shrink-0" />
                  {createError}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating || !newName.trim()}>
                <Plus className="size-4" />
                {creating ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
              This will permanently delete "{deleteTarget?.name}". This action
              cannot be undone.
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
              {deleting ? "Deleting..." : `Delete ${resourceLabel}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
