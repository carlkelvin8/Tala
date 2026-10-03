import { useState } from "react"
import { Search, X } from "lucide-react"
import { Input } from "./input"
import { cn } from "../../lib/utils"

type SearchInputProps = {
  placeholder?: string
  /* Called only when the user presses Enter or clicks the search icon —
     typing alone never triggers a search. */
  onSearch: (term: string) => void
  className?: string
  ariaLabel?: string
}

/* List search field with explicit submit: the list filters only after the
   user presses Enter (or clicks the icon), never while typing. Includes a
   clear button that resets both the field and the applied search. */
export function SearchInput({ placeholder, onSearch, className, ariaLabel }: SearchInputProps) {
  const [draft, setDraft] = useState("")

  function apply() {
    onSearch(draft)
  }

  function clear() {
    setDraft("")
    onSearch("")
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={apply}
        aria-label="Search"
        title="Search (Enter)"
        className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-darksilver transition-colors hover:bg-silver/20 hover:text-black"
      >
        <Search className="h-4 w-4" />
      </button>
      <Input
        placeholder={placeholder}
        value={draft}
        aria-label={ariaLabel ?? placeholder ?? "Search"}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            apply()
          }
        }}
        className={cn("h-10 pl-10", draft ? "pr-10" : "pr-4", className)}
      />
      {draft && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          title="Clear search"
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-darksilver transition-colors hover:bg-silver/20 hover:text-black"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
