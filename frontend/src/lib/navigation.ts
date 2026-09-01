import { RoleType } from "../types"

export type NavItem = {
  label: string
  path: string
  roles: RoleType[]
}

export const navItems: NavItem[] = [
  { label: "CWTS Dashboard", path: "/dashboard/cwts", roles: ["ADMIN"] },
  { label: "ROTC Dashboard", path: "/dashboard/rotc", roles: ["ADMIN", "IMPLEMENTOR"] },
  { label: "Dashboard", path: "/dashboard", roles: ["CADET_OFFICER", "STUDENT"] },
  { label: "Enrollment", path: "/enrollment", roles: ["ADMIN", "IMPLEMENTOR"] },
  { label: "Students", path: "/students", roles: ["ADMIN", "IMPLEMENTOR"] },
  { label: "Sections", path: "/sections", roles: ["ADMIN", "IMPLEMENTOR"] },
  { label: "Mandatory CWTS Courses", path: "/courses/cwts", roles: ["ADMIN"] },
  { label: "Mandatory ROTC Courses", path: "/courses/rotc", roles: ["ADMIN", "IMPLEMENTOR"] },
  { label: "Flights", path: "/flights", roles: ["ADMIN", "CADET_OFFICER"] },
  { label: "Learning Materials", path: "/materials", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"] },
  { label: "Attendance", path: "/attendance", roles: ["ADMIN", "IMPLEMENTOR", "STUDENT"] },
  { label: "QR Scanner", path: "/scanner", roles: ["IMPLEMENTOR"] },
  { label: "Live Monitor", path: "/live-monitor", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER"] },
  { label: "Training Monitoring", path: "/training", roles: ["ADMIN", "IMPLEMENTOR"] },
  { label: "Terms", path: "/terms", roles: ["ADMIN", "IMPLEMENTOR"] },
  { label: "Grades", path: "/grades", roles: ["ADMIN", "IMPLEMENTOR", "STUDENT"] },
  { label: "Merits/Demerits", path: "/merits", roles: ["ADMIN", "STUDENT"] },
  { label: "Exams", path: "/exams", roles: ["ADMIN", "IMPLEMENTOR", "STUDENT"] },
  { label: "Medical Certificates", path: "/medical-certificates", roles: ["IMPLEMENTOR"] },
  { label: "Submission Box", path: "/submissions", roles: ["ADMIN", "IMPLEMENTOR", "STUDENT"] },
  { label: "Reports", path: "/reports", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER"] },
  { label: "Certificates", path: "/certificates", roles: ["ADMIN", "IMPLEMENTOR"] },
  { label: "Leaderboard", path: "/leaderboard", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"] },
  { label: "Calendar", path: "/calendar", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"] },
  { label: "User Management", path: "/users", roles: ["ADMIN"] },
  { label: "Audit Logs", path: "/audit-logs", roles: ["ADMIN"] },
  { label: "Profile", path: "/profile", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"] }
]
