import { Link } from "react-router-dom"
import { ScanLine, Users, ChevronRight, Award } from "lucide-react"
import { cn } from "../lib/utils"
import { getStoredUser } from "../lib/auth"
import { getEffectiveProgram } from "../lib/programs"

const baseShortcuts = [
  {
    path: "/scanner",
    label: "Attendance Scanner",
    description: "Scan student QR codes to record attendance",
    icon: ScanLine,
    iconBg: "bg-sky-50",
    iconColor: "text-royal",
    accent: "hover:border-royal/40",
  },
  {
    path: "/students",
    label: "Student Directory",
    description: "Browse and search enrolled students",
    icon: Users,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
    accent: "hover:border-teal-400/40",
  },
]

const rotcShortcut = {
  path: "/merits",
  label: "Merits & Demerits",
  description: "Assign ROTC merit points and discipline notes",
  icon: Award,
  iconBg: "bg-amber-50",
  iconColor: "text-amber-600",
  accent: "hover:border-amber-400/40",
}

export function ImplementorShortcuts() {
  const user = getStoredUser()
  const shortcuts = getEffectiveProgram(user) === "ROTC" ? [...baseShortcuts, rotcShortcut] : baseShortcuts
  const gridCols = shortcuts.length > 2 ? "sm:grid-cols-3" : "sm:grid-cols-2"
  return (
    <div className={cn("grid gap-4", gridCols)}>
      {shortcuts.map(({ path, label, description, icon: Icon, iconBg, iconColor, accent }) => (
        <Link
          key={path}
          to={path}
          className={cn(
            "group flex items-center gap-4 rounded-2xl border border-silver/20 bg-white p-5 shadow-card transition-all duration-200",
            "hover:shadow-card-hover hover:-translate-y-0.5",
            accent
          )}
        >
          <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105", iconBg)}>
            <Icon className={cn("h-6 w-6", iconColor)} strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-black">{label}</p>
            <p className="mt-0.5 text-xs text-darksilver">{description}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-silver transition-transform group-hover:translate-x-1" />
        </Link>
      ))}
    </div>
  )
}