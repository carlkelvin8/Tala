import { RoleType } from "../types"

export type NavItem = {
  label: string
  path: string
  roles: RoleType[]
}

export const navItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"] },
  { label: "Enrollment", path: "/enrollment", roles: ["ADMIN", "IMPLEMENTOR"] },
  { label: "Students", path: "/students", roles: ["ADMIN", "IMPLEMENTOR"] },
  { label: "Sections", path: "/sections", roles: ["ADMIN", "IMPLEMENTOR"] },
  { label: "Courses", path: "/courses", roles: ["ADMIN", "IMPLEMENTOR"] },
  { label: "Flights", path: "/flights", roles: ["ADMIN", "CADET_OFFICER"] },
  { label: "Learning Materials", path: "/materials", roles: ["ADMIN", "IMPLEMENTOR", "STUDENT"] },
  { label: "Attendance", path: "/attendance", roles: ["ADMIN", "IMPLEMENTOR", "STUDENT"] },
  { label: "QR Scanner", path: "/scanner", roles: ["IMPLEMENTOR"] },
  { label: "Training Monitoring", path: "/training", roles: ["ADMIN", "IMPLEMENTOR"] },
  { label: "Terms", path: "/terms", roles: ["ADMIN", "IMPLEMENTOR"] },
  { label: "Grades", path: "/grades", roles: ["ADMIN", "IMPLEMENTOR", "STUDENT"] },
  { label: "Merits/Demerits", path: "/merits", roles: ["ADMIN", "IMPLEMENTOR", "STUDENT"] },
  { label: "Exams", path: "/exams", roles: ["ADMIN", "IMPLEMENTOR", "STUDENT"] },
  { label: "Medical Certificates", path: "/medical-certificates", roles: ["IMPLEMENTOR", "STUDENT"] },
  { label: "Reports", path: "/reports", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER"] },
  { label: "User Management", path: "/users", roles: ["ADMIN"] },
  { label: "Audit Logs", path: "/audit-logs", roles: ["ADMIN"] },
  { label: "Profile", path: "/profile", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"] }
]
