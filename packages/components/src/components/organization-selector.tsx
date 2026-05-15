import { useState, useRef, useEffect } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import { ChevronDown, X } from "lucide-react"
import type { OrganizationResponse } from "@workspace/api"

interface OrganizationSelectorProps {
  selected: OrganizationResponse | null
  onSelect: (org: OrganizationResponse | null) => void
  organizations: OrganizationResponse[]
  loading: boolean
  error?: string
}

export function OrganizationSelector({
  selected,
  onSelect,
  organizations,
  loading,
  error,
}: OrganizationSelectorProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered =
    query.length >= 3
      ? organizations.filter((org) =>
          `${org.name} ${org.slug}`.toLowerCase().includes(query.toLowerCase())
        )
      : organizations.slice(0, 8)

  const handleInputChange = (value: string) => {
    setQuery(value)
    setHighlightedIndex(0)

    if (debounceTimer) clearTimeout(debounceTimer)
    const timer = setTimeout(() => {
      // Debounce completes, input is already updated
    }, 300)
    setDebounceTimer(timer)
  }

  const handleSelect = (org: OrganizationResponse) => {
    onSelect(org)
    setOpen(false)
    setQuery("")
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(null)
    setQuery("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1))
        break
      case "ArrowUp":
        e.preventDefault()
        setHighlightedIndex((i) => Math.max(i - 1, 0))
        break
      case "Enter":
        e.preventDefault()
        if (filtered[highlightedIndex]) {
          handleSelect(filtered[highlightedIndex])
        }
        break
      case "Escape":
        e.preventDefault()
        setOpen(false)
        break
    }
  }

  useEffect(() => {
    if (open && listRef.current) {
      const highlighted = listRef.current.children[
        highlightedIndex
      ] as HTMLElement
      if (highlighted) {
        highlighted.scrollIntoView({ block: "nearest" })
      }
    }
  }, [highlightedIndex, open])

  return (
    <div className="relative w-full">
      <div className="relative">
        <Input
          ref={inputRef}
          placeholder={
            selected
              ? `${selected.name} (${selected.slug})`
              : "Search organization..."
          }
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          className="pr-10"
        />
        <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1">
          {selected && !query && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={handleClear}
              aria-label="Clear selection"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
          <ChevronDown className="pointer-events-none h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {open && !loading && (
        <div
          ref={listRef}
          className="absolute top-full right-0 left-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-md border border-input bg-white shadow-md"
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {query.length > 0
                ? "No organizations found"
                : "Type 3+ characters to search"}
            </div>
          ) : (
            filtered.map((org, index) => (
              <Button
                type="button"
                key={org.id}
                variant="ghost"
                onClick={() => handleSelect(org)}
                className={`h-auto w-full flex-col items-start justify-start gap-0 rounded-sm px-3 py-2 text-left whitespace-normal ${
                  index === highlightedIndex
                    ? "bg-accent text-accent-foreground"
                    : ""
                }`}
              >
                <div className="font-medium">{org.name}</div>
                <div className="text-xs text-muted-foreground">{org.slug}</div>
              </Button>
            ))
          )}
        </div>
      )}

      {loading && (
        <div className="absolute top-full right-0 left-0 z-50 mt-1 rounded-md border border-input bg-white px-3 py-2 text-sm text-muted-foreground shadow-md">
          Loading organizations...
        </div>
      )}

      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}

      {selected && !query && (
        <div className="mt-2 flex flex-wrap gap-1">
          <Badge variant="secondary">
            {selected.name} ({selected.slug})
          </Badge>
        </div>
      )}
    </div>
  )
}
