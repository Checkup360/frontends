import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { ChevronLeft, ChevronRight } from "lucide-react"

export interface TablePaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
  itemLabel?: string
  loading?: boolean
  className?: string
}

export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  itemLabel = "members",
  loading = false,
  className = "",
}: TablePaginationProps) {
  const from = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0
  const to = Math.min(currentPage * pageSize, totalItems)

  return (
    <div
      className={`mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row ${className}`}
    >
      {/* Count Indicator */}
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{from}</span> to{" "}
        <span className="font-medium text-foreground">{to}</span> of{" "}
        <span className="font-medium text-foreground">{totalItems}</span>{" "}
        {itemLabel}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-6">
        {/* Rows per page selector */}
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(val) => {
                onPageSizeChange(Number(val))
              }}
              disabled={loading}
            >
              <SelectTrigger className="h-8 w-[70px] bg-background">
                <SelectValue placeholder={pageSize.toString()} />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={opt.toString()}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Page numbers */}
        <span className="text-sm text-muted-foreground">
          Page <span className="font-medium text-foreground">{currentPage}</span>{" "}
          of{" "}
          <span className="font-medium text-foreground">
            {Math.max(1, totalPages)}
          </span>
        </span>

        {/* Navigation Buttons */}
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="size-8 bg-background cursor-pointer"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1 || loading}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8 bg-background cursor-pointer"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages || loading}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
