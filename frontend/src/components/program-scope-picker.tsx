import { cn } from "../lib/utils"

export const PROGRAM_SCOPE_OPTIONS = [
  { value: "", label: "All programs", hint: "Everyone sees it" },
  { value: "CWTS", label: "CWTS", hint: "CWTS members" },
  { value: "ROTC", label: "ROTC", hint: "ROTC members" },
] as const

/* Segmented program-scope picker (All / CWTS / ROTC).
   Same saved values as a plain dropdown ("" | "CWTS" | "ROTC"), so stored
   data and backend validation are unchanged — only the UI is clearer. */
export function ProgramScopePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div role="radiogroup" aria-label="Program scope" className="grid grid-cols-3 gap-2">
      {PROGRAM_SCOPE_OPTIONS.map((opt) => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value || "all"}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-xl border px-3 py-2.5 text-left transition-all",
              selected
                ? "border-navy bg-navy/[0.06] ring-1 ring-navy/30 dark:border-sky-400 dark:bg-sky-400/10 dark:ring-sky-400/30"
                : "border-silver/30 bg-white hover:border-silver/50 hover:bg-silver/10"
            )}
          >
            <span className={cn("block text-xs font-bold", selected ? "text-navy dark:text-sky-200" : "text-black")}>
              {opt.label}
            </span>
            <span className="mt-0.5 block text-[10px] text-darksilver">{opt.hint}</span>
          </button>
        )
      })}
    </div>
  )
}
