import { useState } from "react"
import { getStoredUser, getUserDisplayName } from "../../lib/auth"
import { logoutSession } from "../../lib/api"
import { ConfirmDialog } from "../ui/confirm-dialog"
import { GlobalSearchButton } from "../global-search"
import { NotificationsButton } from "../notifications-button"
import { useNavigate, useLocation } from "react-router-dom"
import { LogOut, Menu } from "lucide-react"
import { cn } from "../../lib/utils"
import { AvatarWithRing } from "../ui/avatar-with-ring"
import { ThemeToggle } from "../ThemeToggle"

// Map of URL paths to human-readable page labels for the topbar title
const routeLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/cwts": "CWTS Dashboard",
  "/dashboard/rotc": "ROTC Dashboard",
  "/enrollment": "Enrollment",
  "/students": "Students",
  "/materials": "Materials",
  "/attendance": "Attendance",
  "/scanner": "Attendance Scanner",
  "/audit-logs": "Audit Logs",
  "/training": "Training Monitoring",
  "/terms": "Terms",
  "/sections": "Sections",
  "/courses/cwts": "CWTS Courses",
  "/courses/rotc": "ROTC Courses",
  "/flights": "Flights",
  "/grades": "Grades",
  "/merits": "Merits",
  "/exams": "Exams",
  "/reports": "Reports",
  "/users": "Users",
  "/profile": "Profile",
  "/certificates": "Certificates",
  "/leaderboard": "Leaderboard",
  "/calendar": "Calendar",
  "/live-monitor": "Live Monitor",
}

const roleLabels: Record<string, string> = {
  ADMIN: "Administrator",
  IMPLEMENTOR: "Implementer",
  CADET_OFFICER: "Cadet Officer",
  STUDENT: "Student",
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-violet-50 text-violet-600",
  IMPLEMENTOR: "bg-sky-50 text-royal",
  CADET_OFFICER: "bg-amber-50 text-amber-600",
  STUDENT: "bg-emerald-50 text-emerald-600",
}

type TopbarProps = {
  onOpenSidebar?: () => void
}

export function Topbar({ onOpenSidebar }: TopbarProps) {
  const user = getStoredUser()
  const navigate = useNavigate()
  const location = useLocation()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const displayName = user ? getUserDisplayName(user) : "Guest"
  const pageLabel = routeLabels[location.pathname] ?? "Overview"
  const roleLabel = user?.role ? roleLabels[user.role] ?? user.role : "Guest"
  const roleBadge = user?.role ? roleColors[user.role] ?? "bg-silver/20 text-darksilver" : "bg-silver/20 text-darksilver"

  const handleLogout = async () => {
    try {
      await logoutSession()
    } catch {
      // proceed to login even if API call fails
    }
    navigate("/login")
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-silver/20 bg-white px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg text-darksilver transition-colors hover:bg-silver/20 hover:text-black/80 lg:hidden"
            onClick={onOpenSidebar}
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <h1 className="text-sm font-semibold text-black">{pageLabel}</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1.5 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs text-darksilver">Active</span>
          </div>

          <div className="h-4 w-px bg-silver/20 hidden sm:block" />

          <ThemeToggle />

          <GlobalSearchButton className="h-8 w-8" />

          <NotificationsButton className="h-8 w-8" />

          <div className="flex items-center gap-2.5">
            <AvatarWithRing user={user} size="sm" showStatusDot={false} />
            <div className="hidden leading-tight sm:block">
              <p className="text-xs font-semibold text-black leading-none">{displayName}</p>
              <span className={cn("mt-1 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold", roleBadge)}>
                {roleLabel}
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-silver/20" />

          <button
            onClick={() => setConfirmOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-darksilver transition-colors hover:bg-red-50 hover:text-red-500"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Log out of your session?"
        description="You will be returned to the login screen."
        confirmLabel="Logout"
        onConfirm={handleLogout}
        destructive
      />
    </>
  )
}
