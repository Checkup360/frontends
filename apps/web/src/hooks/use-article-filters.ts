import { useEffect, useState } from "react"

const SEARCH_DEBOUNCE_MS = 300

/**
 * Category and search filters for the member articles list.
 * `search` is debounced so the CMS is not queried on every keystroke,
 * while `searchInput` keeps the text field responsive.
 */
export function useArticleFilters(onFiltersChange?: () => void) {
  const [category, setCategory] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")

  useEffect(() => {
    const timeout = setTimeout(
      () => setSearch(searchInput.trim()),
      SEARCH_DEBOUNCE_MS
    )
    return () => clearTimeout(timeout)
  }, [searchInput])

  const changeCategory = (nextCategory: string | null) => {
    setCategory(nextCategory)
    onFiltersChange?.()
  }

  const changeSearch = (nextSearch: string) => {
    setSearchInput(nextSearch)
    onFiltersChange?.()
  }

  return {
    category,
    search,
    searchInput,
    changeCategory,
    changeSearch,
  }
}
