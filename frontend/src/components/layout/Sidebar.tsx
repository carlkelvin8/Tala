import { NavLink } from "react-router-dom"
import { LayoutDashboard, Users, FileText, BookOpen, CalendarCheck, ClipboardList, GraduationCap, Medal, User, UserCog } from "lucide-react"
import { navItems } from "../../lib/navigation"
import { getStoredUser } from "../../lib/auth"
import { cn } from "../../lib/utils"

type SidebarProps = {
  className?: string
  onNavigate?: () => void
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const user = getStoredUser()
  const items = navItems.filter((item) => (user ? item.roles.includes(user.role) : false))

  const overviewItems = items.filter((item) => item.path === "/dashboard")
  const operationsItems = items.filter((item) =>
    ["/enrollment", "/students", "/materials", "/attendance", "/grades", "/merits", "/exams", "/reports"].includes(item.path)
  )
  const accountItems = items.filter((item) => ["/users", "/profile"].includes(item.path))

  const iconMap = {
    "/dashboard": LayoutDashboard,
    "/enrollment": ClipboardList,
    "/students": Users,
    "/materials": BookOpen,
    "/attendance": CalendarCheck,
    "/grades": GraduationCap,
    "/merits": Medal,
    "/exams": FileText,
    "/reports": FileText,
    "/users": UserCog,
    "/profile": User
  } as const

  return (
    <aside
      className={cn("flex h-full w-72 flex-col overflow-y-auto border-r border-slate-200 bg-white px-6 py-6", className)}
    >
      <div className="mb-8 flex items-center gap-3 px-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-xs font-semibold uppercase tracking-wide text-white">
          KT
        </div>
        <div className="space-y-0.5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Kalasag-Tala</div>
          <div className="text-sm font-semibold text-slate-900">NSTP Command Center</div>
        </div>
      </div>
      <nav className="space-y-6">
        {overviewItems.length > 0 && (
          <div>
            <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Overview</div>
            <div className="space-y-1.5">
              {overviewItems.map((item) => {
                const Icon = iconMap[item.path as keyof typeof iconMap]
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition",
                        "hover:bg-slate-100 hover:text-slate-900",
                        isActive && "bg-slate-100 text-slate-900 border border-slate-200"
                      )
                    }
                    onClick={onNavigate}
                  >
                    {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          </div>
        )}
        {operationsItems.length > 0 && (
          <div>
            <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Operations</div>
            <div className="space-y-1.5">
              {operationsItems.map((item) => {
                const Icon = iconMap[item.path as keyof typeof iconMap]
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition",
                        "hover:bg-slate-100 hover:text-slate-900",
                        isActive && "bg-slate-100 text-slate-900 border border-slate-200"
                      )
                    }
                    onClick={onNavigate}
                  >
                    {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          </div>
        )}
        {accountItems.length > 0 && (
          <div>
            <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Account</div>
            <div className="space-y-1.5">
              {accountItems.map((item) => {
                const Icon = iconMap[item.path as keyof typeof iconMap]
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition",
                        "hover:bg-slate-100 hover:text-slate-900",
                        isActive && "bg-slate-100 text-slate-900 border border-slate-200"
                      )
                    }
                    onClick={onNavigate}
                  >
                    {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          </div>
        )}
      </nav>
    </aside>
  )
}
