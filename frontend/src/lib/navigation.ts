import { RoleType, ProgramType } from "../types"
import { AuthUser } from "./auth"
import { getEffectiveProgram } from "./programs"

export type NavItem = {
  label: string
  path: string
  roles: RoleType[]
  programs?: ProgramType[]
}

export const navItems: NavItem[] = [
  { label: "CWTS Dashboard", path: "/dashboard/cwts", roles: ["ADMIN", "IMPLEMENTOR"], programs: ["CWTS"] },
  { label: "ROTC Dashboard", path: "/dashboard/rotc", roles: ["ADMIN", "IMPLEMENTOR"], programs: ["ROTC"] },
  { label: "Dashboard", path: "/dashboard", roles: ["CADET_OFFICER", "STUDENT"] },
  { label: "Enrollment", path: "/enrollment", roles: ["ADMIN", "IMPLEMENTOR"] },
  { label: "Students", path: "/students", roles: ["ADMIN", "IMPLEMENTOR"] },
  { label: "Sections", path: "/sections", roles: ["ADMIN", "IMPLEMENTOR"] },
  { label: "CWTS Courses", path: "/courses/cwts", roles: ["ADMIN", "IMPLEMENTOR"], programs: ["CWTS"] },
  { label: "ROTC Courses", path: "/courses/rotc", roles: ["ADMIN", "IMPLEMENTOR"], programs: ["ROTC"] },
  { label: "Flights", path: "/flights", roles: ["ADMIN", "CADET_OFFICER"] },
  { label: "Learning Materials", path: "/materials", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"] },
  { label: "Announcements", path: "/announcements", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"] },
  { label: "Attendance", path: "/attendance", roles: ["ADMIN", "IMPLEMENTOR", "STUDENT"] },
  { label: "Live Monitor", path: "/live-monitor", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER"] },
  { label: "Terms", path: "/terms", roles: ["ADMIN", "IMPLEMENTOR"] },
  { label: "Grades", path: "/grades", roles: ["ADMIN", "IMPLEMENTOR", "STUDENT"] },
  { label: "Merits/Demerits", path: "/merits", roles: ["ADMIN", "IMPLEMENTOR", "STUDENT"], programs: ["ROTC"] },
  { label: "Courseworks", path: "/exams", roles: ["ADMIN", "IMPLEMENTOR", "STUDENT"] },
  { label: "Submission Box", path: "/submissions", roles: ["ADMIN", "IMPLEMENTOR", "STUDENT"] },
  { label: "Reports", path: "/reports", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER"] },
  { label: "Certificates", path: "/certificates", roles: ["ADMIN", "IMPLEMENTOR"] },
  { label: "Leaderboard", path: "/leaderboard", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"] },
  { label: "Calendar", path: "/calendar", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"] },
  { label: "User Management", path: "/users", roles: ["ADMIN"] },
  { label: "Audit Logs", path: "/audit-logs", roles: ["ADMIN"] },
  { label: "Profile", path: "/profile", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"] }
]

/* Filter navigation items for a user: role must match, and items constrained to a
   program (e.g. program dashboards / course lists) only show for that program.
   Program-agnostic users (admins) see every item their role allows.
   Merits are ROTC-only: admins retain global access, while scoped users must
   belong to ROTC. */
export function filterNavItems(user: AuthUser | null): NavItem[] {
  if (!user) return []
  return navItems.filter((item) => {
    if (!item.roles.includes(user.role)) return false
    if (item.path === "/merits" && user.role !== "ADMIN") {
      return getEffectiveProgram(user) === "ROTC"
    }
    if (!item.programs) return true
    const program = getEffectiveProgram(user)
    if (!program) return true
    return item.programs.includes(program)
  })
}
