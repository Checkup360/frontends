import * as React from "react"
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"

import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"

type SortDirection = "asc" | "desc"

type TableSkeletonColumn = {
  cellClassName?: string
  skeletonClassName?: string
  lines?: string[]
}

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-4 text-left align-middle font-medium whitespace-nowrap text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

type SortableTableHeadProps = Omit<
  React.ComponentProps<"th">,
  "onClick" | "children"
> & {
  children: React.ReactNode
  /** Direction currently applied to this column, or null when it is not the sorted one. */
  direction: SortDirection | null
  onSort: () => void
}

function SortableTableHead({
  children,
  direction,
  onSort,
  className,
  ...props
}: SortableTableHeadProps) {
  const SortIcon =
    direction === "asc" ? ArrowUp : direction === "desc" ? ArrowDown : ChevronsUpDown
  const ariaSort =
    direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none"

  return (
    <TableHead aria-sort={ariaSort} className={className} {...props}>
      <button
        type="button"
        onClick={onSort}
        className="-mx-2 inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 font-semibold transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {children}
        <SortIcon
          className={cn("size-3.5", direction ? "text-foreground" : "opacity-50")}
          aria-hidden="true"
        />
      </button>
    </TableHead>
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-4 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function TableRowsSkeleton({
  rows = 5,
  columns,
}: {
  rows?: number
  columns: TableSkeletonColumn[]
}) {
  return Array.from({ length: rows }).map((_, rowIndex) => (
    <TableRow key={rowIndex}>
      {columns.map((column, columnIndex) => (
        <TableCell key={columnIndex} className={column.cellClassName}>
          {column.lines ? (
            <div className="space-y-2">
              {column.lines.map((lineClassName, lineIndex) => (
                <Skeleton key={lineIndex} className={lineClassName} />
              ))}
            </div>
          ) : (
            <Skeleton className={column.skeletonClassName ?? "h-4 w-24"} />
          )}
        </TableCell>
      ))}
    </TableRow>
  ))
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  SortableTableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableRowsSkeleton,
}
export type { SortDirection }
