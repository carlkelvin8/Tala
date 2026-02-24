import { RoleType } from "../types"

export type NavItem = {
  label: string
  path: string
  roles: RoleType[]
}

export const navItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"] },
  { label: "Enrollment", path: "/enrollment", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER"] },
  { label: "Students", path: "/students", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER"] },
  { label: "Sections", path: "/sections", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER"] },
  { label: "Flights", path: "/flights", roles: ["ADMIN", "CADET_OFFICER"] },
  { label: "Learning Materials", path: "/materials", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"] },
  { label: "Attendance", path: "/attendance", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"] },
  { label: "Grades", path: "/grades", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"] },
  { label: "Merits/Demerits", path: "/merits", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"] },
  { label: "Exams", path: "/exams", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"] },
  { label: "Reports", path: "/reports", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER"] },
  { label: "User Management", path: "/users", roles: ["ADMIN"] },
  { label: "Profile", path: "/profile", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"] }
]
