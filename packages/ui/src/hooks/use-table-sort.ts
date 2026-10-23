import { useCallback, useState } from "react"

import type { SortDirection } from "@workspace/ui/components/table"

type TableSort<Field extends string> = {
  field: Field
  direction: SortDirection
}

/**
 * Sort state for a table header. Clicking a column cycles
 * ascending → descending → unsorted; clicking another column starts ascending.
 */
function useTableSort<Field extends string>(onChange?: () => void) {
  const [sort, setSort] = useState<TableSort<Field> | null>(null)

  const toggleSort = useCallback(
    (field: Field) => {
      setSort((current) => {
        if (current?.field !== field) return { field, direction: "asc" }
        if (current.direction === "asc") return { field, direction: "desc" }
        return null
      })
      onChange?.()
    },
    [onChange]
  )

  const directionOf = useCallback(
    (field: Field): SortDirection | null =>
      sort?.field === field ? sort.direction : null,
    [sort]
  )

  return { sort, toggleSort, directionOf }
}

type SortValue = string | number | null | undefined

/**
 * Sorts rows already held in memory (tables that load everything and
 * paginate in the browser). Empty values always go last. Tables paginated by
 * the API must sort in the query instead.
 */
function sortRows<Row, Field extends string>(
  rows: Row[],
  sort: TableSort<Field> | null,
  accessors: Record<Field, (row: Row) => SortValue>
): Row[] {
  if (!sort) return rows
  const accessor = accessors[sort.field]
  const factor = sort.direction === "asc" ? 1 : -1
  return [...rows].sort((left, right) => {
    const leftValue = accessor(left)
    const rightValue = accessor(right)
    if (leftValue == null && rightValue == null) return 0
    if (leftValue == null) return 1
    if (rightValue == null) return -1
    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return (leftValue - rightValue) * factor
    }
    return (
      String(leftValue).localeCompare(String(rightValue), undefined, {
        sensitivity: "base",
        numeric: true,
      }) * factor
    )
  })
}

export { useTableSort, sortRows }
export type { TableSort }
